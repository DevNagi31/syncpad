'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, WifiOff, GitMerge, Zap } from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Real-time co-editing',
    body: 'Yjs CRDTs converge to the same state regardless of edit order. Open this page in two tabs and watch it work.',
  },
  {
    icon: WifiOff,
    title: 'Offline-first',
    body: 'Local edits write to IndexedDB instantly. The Service-Worker-friendly architecture syncs everything when you reconnect.',
  },
  {
    icon: GitMerge,
    title: 'Conflict-free merges',
    body: 'No locks, no last-writer-wins. The CRDT data model guarantees every replica eventually sees the same document.',
  },
  {
    icon: Zap,
    title: 'SSE instead of WebSockets',
    body: 'Server-Sent Events stream updates server→client; POST sends client→server. Works on every free-tier host without cold-start issues.',
  },
];

const easing = [0.16, 1, 0.3, 1] as const;

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: easing }}
        className="text-center"
      >
        <h1 className="text-[44px] font-semibold leading-none tracking-tightest text-ink-800 md:text-[64px]">
          Write together,{' '}
          <span className="bg-gradient-to-br from-accent to-violet-500 bg-clip-text text-transparent">
            in real time.
          </span>
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-[17px] text-ink-600">
          A collaborative Markdown editor built on Yjs CRDTs. Eventually-consistent state
          convergence regardless of edit order — open two browser tabs and try it.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/doc/welcome" className="btn-primary">
            Open the welcome doc →
          </Link>
          <Link href="/doc/scratchpad" className="btn-ghost">
            New scratchpad
          </Link>
        </div>
      </motion.section>

      <motion.section
        initial="hidden"
        animate="visible"
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
        }}
        className="mt-20 grid gap-4 md:grid-cols-2"
      >
        {features.map((f) => (
          <motion.div
            key={f.title}
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easing } },
            }}
            whileHover={{ y: -4, transition: { duration: 0.2, ease: easing } }}
            className="glass p-6"
          >
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-violet-500 text-white">
              <f.icon className="h-4 w-4" />
            </div>
            <h3 className="mt-3 text-[18px] font-semibold tracking-tightest text-ink-800">
              {f.title}
            </h3>
            <p className="mt-1 text-[14px] text-ink-600">{f.body}</p>
          </motion.div>
        ))}
      </motion.section>

      <motion.section
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.5, ease: easing }}
        className="mt-20"
      >
        <div className="glass p-8">
          <div className="text-[11px] uppercase tracking-[0.08em] text-ink-400">How it works</div>
          <h2 className="mt-1 text-[24px] font-semibold tracking-tightest text-ink-800">
            The protocol in one paragraph
          </h2>
          <p className="mt-3 text-[15px] text-ink-600">
            Each browser tab owns a local <code className="rounded bg-ink-100 px-1">Y.Doc</code> with
            offline persistence in IndexedDB. Local edits emit binary updates that the custom SSE
            provider POSTs to the server. The server has its own canonical{' '}
            <code className="rounded bg-ink-100 px-1">Y.Doc</code> and applies every received update,
            then broadcasts the resulting delta to all SSE subscribers. Because CRDT updates are
            commutative and associative, the order of arrival doesn't matter — every replica
            converges to the same final state.
          </p>
        </div>
      </motion.section>

      <footer className="mt-20 border-t border-ink-100 pt-6 text-center text-[11px] text-ink-400">
        Built with Next.js 15 · Yjs · CodeMirror 6 · Framer Motion · Server-Sent Events
      </footer>
    </main>
  );
}
