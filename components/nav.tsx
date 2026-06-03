import Link from 'next/link';
import { PencilLine } from 'lucide-react';

export function Nav() {
  return (
    <header className="sticky top-0 z-40 nav-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6 text-[14px]">
        <Link href="/" className="flex items-center gap-2 text-ink-800">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-sketch border-2 border-ink-800 bg-ink-50">
            <PencilLine className="h-4 w-4 text-ink-800" />
          </span>
          <span className="font-sketch text-[24px] font-bold leading-none">SyncPad</span>
        </Link>
        <span className="hidden text-[14px] text-ink-400 md:inline">
          a hand-drawn CRDT markdown editor · offline-first · SSE sync
        </span>
        <a
          href="https://github.com/DevNagi31/syncpad"
          target="_blank"
          rel="noopener noreferrer"
          className="font-sketch text-[20px] text-ink-600 underline decoration-2 underline-offset-4 transition hover:text-ink-900"
        >
          GitHub
        </a>
      </div>
    </header>
  );
}
