'use client';
import { marked } from 'marked';
import { useMemo } from 'react';

marked.setOptions({ gfm: true, breaks: false });

export function MarkdownPreview({ source }: { source: string }) {
  const html = useMemo(() => marked.parse(source) as string, [source]);
  return (
    <div
      className="prose prose-sm max-w-none px-6 py-4 prose-headings:tracking-tightest prose-headings:font-semibold prose-code:font-mono prose-code:bg-ink-100 prose-code:px-1 prose-code:rounded prose-a:text-accent"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
