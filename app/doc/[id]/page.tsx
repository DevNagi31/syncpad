'use client';
import { useState, useEffect, use } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Copy, Check } from 'lucide-react';
import { CollaborativeEditor } from '@/components/editor';
import { MarkdownPreview } from '@/components/preview';

const easing = [0.16, 1, 0.3, 1] as const;

export default function DocPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [content, setContent] = useState('');
  const [copied, setCopied] = useState(false);
  const [pageUrl, setPageUrl] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') setPageUrl(window.location.href);
  }, []);

  const copyLink = async () => {
    if (!pageUrl) return;
    await navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: easing }}
        className="mb-4 flex items-center justify-between"
      >
        <div>
          <div className="text-[11px] uppercase tracking-[0.08em] text-ink-400">Document</div>
          <h1 className="font-mono text-[18px] text-ink-800">{id}</h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyLink}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white/70 px-3 py-1.5 text-[12px] text-ink-600 transition hover:bg-white"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-success" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Copy share link
              </>
            )}
          </button>
          <Link href="/" className="btn-ghost text-[12px]">
            ← Home
          </Link>
        </div>
      </motion.header>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easing, delay: 0.05 }}
        className="grid gap-4 lg:grid-cols-2"
      >
        <div className="card overflow-hidden h-[calc(100vh-180px)]">
          <CollaborativeEditor docId={id} onContentChange={setContent} />
        </div>
        <div className="card overflow-auto h-[calc(100vh-180px)]">
          <div className="flex items-center justify-between border-b border-ink-100 px-4 py-2 text-[12px] text-ink-400">
            <span>Live preview</span>
            <span className="font-mono">{content.length} chars</span>
          </div>
          <MarkdownPreview source={content} />
        </div>
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-4 text-center text-[11px] text-ink-400"
      >
        Open this URL in a second tab to test conflict-free co-editing. Disconnect your network to
        test offline-first sync — your edits queue in IndexedDB and replay on reconnect.
      </motion.p>
    </div>
  );
}
