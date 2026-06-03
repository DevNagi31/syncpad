'use client';
import { marked } from 'marked';
import { useMemo } from 'react';

marked.setOptions({ gfm: true, breaks: false });

export function MarkdownPreview({ source }: { source: string }) {
  const html = useMemo(() => marked.parse(source) as string, [source]);
  return (
    <div
      className="prose prose-sm max-w-none px-6 py-4 prose-headings:font-sketch prose-headings:text-ink-900 prose-headings:font-bold prose-p:text-ink-600 prose-li:text-ink-600 prose-strong:text-ink-800 prose-code:font-mono prose-code:bg-ink-100 prose-code:border prose-code:border-ink-200 prose-code:px-1 prose-code:rounded prose-a:text-ink-900 prose-a:underline prose-blockquote:border-ink-800 prose-blockquote:text-ink-400 prose-hr:border-ink-200"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
