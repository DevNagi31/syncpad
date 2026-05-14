import './globals.css';
import type { Metadata } from 'next';
import { Nav } from '@/components/nav';

export const metadata: Metadata = {
  title: 'SyncPad — CRDT Collaborative Markdown',
  description:
    'Real-time collaborative Markdown editor with offline-first sync. Yjs CRDTs over Server-Sent Events.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-ink-50">
      <body className="bg-ink-50 text-ink-800 antialiased font-sans">
        <Nav />
        {children}
      </body>
    </html>
  );
}
