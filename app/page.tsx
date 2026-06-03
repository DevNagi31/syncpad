'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, WifiOff, GitMerge, Radio } from 'lucide-react';

const features = [
  {
    icon: Users,
    title: 'Real-time co-editing',
    body: 'Yjs CRDTs converge to the same state regardless of edit order. Open the doc in two tabs and watch every keystroke merge.',
  },
  {
    icon: WifiOff,
    title: 'Offline-first',
    body: 'Local edits write to IndexedDB instantly. Disconnect the network, keep typing — changes queue locally and replay on reconnect.',
  },
  {
    icon: GitMerge,
    title: 'Conflict-free merges',
    body: 'No locks, no last-writer-wins. The CRDT data model guarantees every replica eventually sees the same document, byte for byte.',
  },
  {
    icon: Radio,
    title: 'SSE instead of WebSockets',
    body: 'Server-Sent Events stream updates server→client; POST sends client→server. Runs on any free-tier host with no cold-start issues.',
  },
];

const easing = [0.16, 1, 0.3, 1] as const;

export default function Home() {
  return (
    <main>
      {/* ── Full-screen video hero ───────────────────────────── */}
      <section className="relative flex min-h-[88vh] items-center justify-center overflow-hidden">
        {/* Background video, filtered to graphite to match the pencil theme */}
        <video
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: 'grayscale(1) contrast(1.15) brightness(1.05)' }}
          src="/landing.mp4"
          autoPlay
          loop
          muted
          playsInline
        />
        {/* Paper wash so ink text stays legible over the footage */}
        <div className="absolute inset-0 bg-ink-50/55" />
        <div
          className="absolute inset-0 mix-blend-multiply"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(28,26,23,0.05) 0 1px, transparent 1px 26px), repeating-linear-gradient(90deg, rgba(28,26,23,0.04) 0 1px, transparent 1px 26px)',
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: easing }}
          className="relative z-10 mx-auto max-w-3xl px-6 text-center"
        >
          <div className="font-sketch text-[18px] text-ink-600 sm:text-[22px]">— sketched in real time —</div>
          <h1 className="mt-2 font-sketch text-[40px] font-bold leading-[0.95] text-ink-900 sm:text-[56px] md:text-[104px]">
            Write together,
            <br />
            <span className="ink-underline">on the same page.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-[17px] leading-snug text-ink-600 sm:mt-6 sm:text-[20px]">
            A collaborative Markdown editor drawn on Yjs CRDTs. Eventually-consistent state that
            converges no matter who types what, when — open two tabs and try to break it.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Link href="/doc/welcome" className="btn-primary text-base">
              Open the welcome doc →
            </Link>
            <Link href="/doc/scratchpad" className="btn-ghost text-base">
              New scratchpad
            </Link>
          </div>
        </motion.div>

        <div className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 font-sketch text-[18px] text-ink-400">
          scroll ↓
        </div>
      </section>

      {/* ── Feature sketches ─────────────────────────────────── */}
      <div className="mx-auto max-w-6xl px-6 pb-20">
        <motion.section
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.08 } },
          }}
          className="mt-16 grid gap-5 md:grid-cols-2"
        >
          {features.map((f) => (
            <motion.div
              key={f.title}
              variants={{
                hidden: { opacity: 0, y: 16 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: easing } },
              }}
              whileHover={{ x: -2, y: -2, transition: { duration: 0.15 } }}
              className="glass p-6"
            >
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-sketch border-2 border-ink-800 bg-ink-50 text-ink-800">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-3 font-sketch text-[28px] font-bold leading-none text-ink-900">
                {f.title}
              </h3>
              <p className="mt-2 text-[16px] leading-snug text-ink-600">{f.body}</p>
            </motion.div>
          ))}
        </motion.section>

        {/* ── The protocol, hand-explained ───────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: easing }}
          className="mt-16"
        >
          <div className="glass p-8">
            <div className="font-sketch text-[20px] text-ink-400">How it works</div>
            <h2 className="mt-1 font-sketch text-[40px] font-bold leading-none text-ink-900">
              The protocol in one paragraph
            </h2>
            <p className="mt-4 text-[18px] leading-relaxed text-ink-600">
              Each browser tab owns a local{' '}
              <code className="rounded border border-ink-200 bg-ink-100 px-1 font-mono text-[15px]">Y.Doc</code>{' '}
              with offline persistence in IndexedDB. Local edits emit binary updates that a custom
              SSE provider POSTs to the server. The server keeps its own canonical{' '}
              <code className="rounded border border-ink-200 bg-ink-100 px-1 font-mono text-[15px]">Y.Doc</code>,
              applies every received update, then broadcasts the resulting delta to all SSE
              subscribers. Because CRDT updates are commutative and associative, the order of
              arrival doesn&apos;t matter — every replica converges to the same final state.
            </p>
          </div>
        </motion.section>

        {/* ── Sketched architecture diagram ──────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: easing }}
          className="mt-8"
        >
          <div className="glass overflow-x-auto p-8">
            <pre className="font-mono text-[13px] leading-relaxed text-ink-800">{`  ┌──────────────┐           ┌──────────────┐           ┌──────────────┐
  │    tab A     │   POST     │    server    │    SSE     │    tab B     │
  │              │  ───────▶  │              │  ───────▶  │              │
  │  Y.Doc       │            │  Y.Doc       │            │  Y.Doc       │
  │  IndexedDB   │  ◀───────  │  (canonical) │  ───────▶  │  IndexedDB   │
  └──────────────┘    SSE     └──────────────┘    SSE     └──────────────┘

           commutative  ·  associative  ·  convergent`}</pre>
          </div>
        </motion.section>

        <footer className="mt-16 border-t-2 border-dashed border-ink-200 pt-6 text-center font-sketch text-[18px] text-ink-400">
          drawn with Next.js 15 · Yjs · CodeMirror 6 · Framer Motion · Server-Sent Events
        </footer>
      </div>
    </main>
  );
}
