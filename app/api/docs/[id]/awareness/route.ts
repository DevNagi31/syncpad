/**
 * POST awareness update from a client. The server doesn't decode it — it
 * just fans the bytes out to every other SSE subscriber on the doc.
 */
import { NextRequest, NextResponse } from 'next/server';
import { broadcastAwareness } from '@/server/doc-store';

export const runtime = 'nodejs';

interface Body {
  update: string;  // base64-encoded awareness update
  origin?: string;
}

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const body = (await req.json()) as Body;
  if (!body?.update) {
    return NextResponse.json({ error: 'missing update' }, { status: 400 });
  }
  const update = Buffer.from(body.update, 'base64');
  broadcastAwareness(id, new Uint8Array(update), body.origin ?? null);
  return NextResponse.json({ ok: true });
}
