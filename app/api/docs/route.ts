import { NextResponse } from 'next/server';
import { listDocs } from '@/server/doc-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({ docs: listDocs() });
}
