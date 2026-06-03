'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { markdown } from '@codemirror/lang-markdown';
import * as Y from 'yjs';
import { yCollab } from 'y-codemirror.next';
import { IndexeddbPersistence } from 'y-indexeddb';
import { Awareness } from 'y-protocols/awareness';

import { SseProvider } from '@/lib/sse-provider';

interface Props {
  docId: string;
  onContentChange?: (text: string) => void;
}

// Graphite shades — keep remote cursors monochrome to match the pencil theme
const USER_COLORS = ['#1c1a17', '#3f3c36', '#5c5850', '#8a8578', '#6e6a60', '#28251f'];

function pickColor(): string {
  return USER_COLORS[Math.floor(Math.random() * USER_COLORS.length)]!;
}

function pickName(): string {
  const adj = ['Curious', 'Calm', 'Brisk', 'Steady', 'Quick', 'Bright', 'Wise', 'Bold'];
  const noun = ['Heron', 'Otter', 'Falcon', 'Lynx', 'Mantis', 'Bison', 'Wren', 'Fox'];
  return `${adj[Math.floor(Math.random() * adj.length)]} ${noun[Math.floor(Math.random() * noun.length)]}`;
}

export function CollaborativeEditor({ docId, onContentChange }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [online, setOnline] = useState(false);

  const { ydoc, awareness } = useMemo(() => {
    const ydoc = new Y.Doc();
    const awareness = new Awareness(ydoc);
    awareness.setLocalStateField('user', { name: pickName(), color: pickColor() });
    return { ydoc, awareness };
  }, [docId]);

  useEffect(() => {
    if (!hostRef.current) return;

    // Offline persistence: writes happen locally first, server is best-effort.
    const idb = new IndexeddbPersistence(`syncpad-${docId}`, ydoc);

    // Network sync via SSE + POST. Awareness is wired through the same
    // provider but cross-tab presence fan-out is a known limitation (see Roadmap).
    const provider = new SseProvider(ydoc, { docId, awareness });
    const unsubStatus = provider.onStatus(setOnline);

    const ytext = ydoc.getText('content');

    // Notify parent of content (for the preview pane).
    const notify = () => onContentChange?.(ytext.toString());
    ytext.observe(notify);
    notify();

    // Build CodeMirror with Yjs binding.
    const state = EditorState.create({
      doc: ytext.toString(),
      extensions: [
        lineNumbers(),
        highlightActiveLine(),
        history(),
        markdown(),
        keymap.of([...defaultKeymap, ...historyKeymap]),
        yCollab(ytext, awareness),
        EditorView.lineWrapping,
      ],
    });
    const view = new EditorView({ state, parent: hostRef.current });

    return () => {
      view.destroy();
      ytext.unobserve(notify);
      provider.destroy();
      unsubStatus();
      void idb.destroy();
      ydoc.destroy();
    };
  }, [ydoc, awareness, docId, onContentChange]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-ink-100 px-4 py-2 text-[12px]">
        <div className="flex items-center gap-2">
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              online ? 'bg-success' : 'bg-warn'
            } animate-pulse`}
            title={online ? 'Synced' : 'Offline — changes queued in IndexedDB'}
          />
          <span className="text-ink-600">{online ? 'Synced' : 'Offline (queued locally)'}</span>
        </div>
        <div className="flex items-center gap-3 text-ink-400">
          <span className="text-[11px] uppercase tracking-[0.08em]">CRDT · Yjs · SSE</span>
        </div>
      </div>
      <div
        ref={hostRef}
        className="flex-1 overflow-auto bg-white"
        style={{ minHeight: 400 }}
      />
    </div>
  );
}
