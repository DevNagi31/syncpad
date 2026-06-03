import './globals.css';
import type { Metadata } from 'next';
import { Caveat, Patrick_Hand, Special_Elite } from 'next/font/google';
import { Nav } from '@/components/nav';

// Hand-drawn display face — used for headlines
const sketch = Caveat({ subsets: ['latin'], weight: ['500', '600', '700'], variable: '--font-sketch' });
// Architectural handwriting — body copy
const hand = Patrick_Hand({ subsets: ['latin'], weight: '400', variable: '--font-hand' });
// Typewriter — code and the editor itself
const mono = Special_Elite({ subsets: ['latin'], weight: '400', variable: '--font-mono' });

export const metadata: Metadata = {
  title: 'SyncPad — CRDT Collaborative Markdown',
  description:
    'Real-time collaborative Markdown editor with offline-first sync. Yjs CRDTs over Server-Sent Events.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sketch.variable} ${hand.variable} ${mono.variable} bg-ink-50`}>
      <body className="bg-ink-50 text-ink-800 antialiased font-hand">
        <Nav />
        {children}
      </body>
    </html>
  );
}
