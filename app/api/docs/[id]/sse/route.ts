/**
 * Server-Sent Events stream for a single document.
 *
 * On connect:
 *   1. Send `init` event with the full encoded Y.Doc state (base64).
 *   2. Subscribe to update events; every applied delta is forwarded as an
 *      `update` SSE event so the client's local Y.Doc stays in sync.
 *
 * The client posts its own deltas to POST /api/docs/[id]/update.
 */
import { NextRequest } from 'next/server';
import {
  getAwarenessSnapshot,
  getState,
  subscribe,
  subscribeAwareness,
} from '@/server/doc-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function b64(buf: Uint8Array): string {
  return Buffer.from(buf).toString('base64');
}

function sseFrame(event: string, data: string): string {
  return `event: ${event}\ndata: ${data}\n\n`;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1. Initial state snapshot
      const initial = getState(id);
      controller.enqueue(encoder.encode(sseFrame('init', b64(initial))));

      // 1b. Replay current awareness of every connected peer so this new
      //     subscriber learns about everyone already in the doc.
      for (const { origin, update } of getAwarenessSnapshot(id)) {
        const payload = JSON.stringify({ update: b64(update), origin });
        try {
          controller.enqueue(encoder.encode(sseFrame('awareness', payload)));
        } catch {
          /* stream may be closing */
        }
      }

      // 2. Live document updates
      const unsubscribe = subscribe(id, (update, origin) => {
        const payload = JSON.stringify({
          update: b64(update),
          origin: typeof origin === 'string' ? origin : null,
        });
        try {
          controller.enqueue(encoder.encode(sseFrame('update', payload)));
        } catch {
          unsubscribe();
        }
      });

      // 3. Awareness (cursor presence) updates — separate channel
      const unsubAwareness = subscribeAwareness(id, (update, origin) => {
        const payload = JSON.stringify({
          update: b64(update),
          origin: typeof origin === 'string' ? origin : null,
        });
        try {
          controller.enqueue(encoder.encode(sseFrame('awareness', payload)));
        } catch {
          unsubAwareness();
        }
      });

      // 4. Keepalive comment every 25s so proxies don't kill idle connections
      const keepalive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': ping\n\n'));
        } catch {
          clearInterval(keepalive);
        }
      }, 25_000);

      req.signal.addEventListener('abort', () => {
        unsubscribe();
        unsubAwareness();
        clearInterval(keepalive);
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
