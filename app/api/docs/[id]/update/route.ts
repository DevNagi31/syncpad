/**
 * Receive a client-side Y.Doc update (base64-encoded) and apply it to the
 * server's copy. The doc-store fans it out to all SSE subscribers.
 */
import { NextRequest, NextResponse } from 'next/server';
import { applyUpdate } from '@/server/doc-store';

export const runtime = 'nodejs';

interface Body {
  update: string;   // base64-encoded Y update
  origin?: string;  // client-generated id, echoed back via SSE so the
                    // originating tab can ignore its own update
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
  applyUpdate(id, new Uint8Array(update), body.origin ?? null);
  return NextResponse.json({ ok: true });
}
