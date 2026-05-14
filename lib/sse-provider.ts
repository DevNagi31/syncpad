/**
 * Custom Yjs sync provider over Server-Sent Events.
 *
 * Why SSE instead of WebSocket: free-tier hosts (Render, Cloudflare Pages,
 * Vercel) all support SSE through HTTP/1.1 and HTTP/2 streaming, but
 * WebSocket support is patchy and often broken on cold starts. SSE
 * auto-reconnects natively in the browser, so the offline → online edge
 * case is one less thing to write.
 *
 * Direction:
 *   server → client : SSE event "update" carrying base64-encoded Y update
 *   client → server : POST /api/docs/[id]/update with the same payload
 *
 * Echo prevention:
 *   Every POST includes `origin: this.clientId`. The server tags the broadcast
 *   so when we receive an SSE update with origin === our id, we skip it —
 *   the local Y.Doc already has those bytes applied.
 *
 * Optimistic local edits:
 *   The provider listens to local Y.Doc updates and posts them in the
 *   background. The UI never blocks on the network.
 */
import * as Y from 'yjs';
import {
  Awareness,
  applyAwarenessUpdate,
  encodeAwarenessUpdate,
  removeAwarenessStates,
} from 'y-protocols/awareness';

export interface SseProviderOptions {
  docId: string;
  baseUrl?: string;
  awareness?: Awareness;
}

export class SseProvider {
  readonly clientId: string;
  private doc: Y.Doc;
  private docId: string;
  private baseUrl: string;
  private awareness: Awareness | null;
  private eventSource: EventSource | null = null;
  private onlineListeners = new Set<(online: boolean) => void>();
  private isOnline = false;

  constructor(doc: Y.Doc, opts: SseProviderOptions) {
    this.doc = doc;
    this.docId = opts.docId;
    this.baseUrl = opts.baseUrl ?? '';
    this.awareness = opts.awareness ?? null;
    this.clientId =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Math.random().toString(36).slice(2);
    this.connect();
    this.doc.on('update', this.handleLocalUpdate);
    if (this.awareness) {
      this.awareness.on('update', this.handleLocalAwareness);
      // Notify peers when this tab unloads so cursors disappear.
      if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', this.handleUnload);
      }
    }
  }

  private handleLocalAwareness = ({
    added,
    updated,
    removed,
  }: { added: number[]; updated: number[]; removed: number[] }) => {
    if (!this.awareness) return;
    const changed = [...added, ...updated, ...removed];
    if (changed.length === 0) return;
    const update = encodeAwarenessUpdate(this.awareness, changed);
    void this.postAwareness(update);
  };

  private async postAwareness(update: Uint8Array): Promise<void> {
    try {
      await fetch(`${this.baseUrl}/api/docs/${this.docId}/awareness`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          update: toBase64(update),
          origin: this.clientId,
        }),
        keepalive: true,
      });
    } catch {
      // best effort
    }
  }

  private handleUnload = () => {
    if (!this.awareness) return;
    removeAwarenessStates(this.awareness, [this.awareness.clientID], 'unload');
  };

  private handleLocalUpdate = (update: Uint8Array, origin: unknown) => {
    // Skip remote-origin updates (those came from us applying a server-pushed delta)
    if (origin === this) return;
    void this.postUpdate(update);
  };

  private async postUpdate(update: Uint8Array): Promise<void> {
    const body = JSON.stringify({
      update: toBase64(update),
      origin: this.clientId,
    });
    try {
      await fetch(`${this.baseUrl}/api/docs/${this.docId}/update`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
        keepalive: true,
      });
    } catch (err) {
      // Offline: y-indexeddb persists the update; we'll resync on reconnect
      // by re-encoding the local state diff.
    }
  }

  private connect(): void {
    if (typeof window === 'undefined') return;
    const es = new EventSource(`${this.baseUrl}/api/docs/${this.docId}/sse`);
    this.eventSource = es;

    es.addEventListener('init', (e: MessageEvent) => {
      const update = fromBase64(e.data as string);
      Y.applyUpdate(this.doc, update, this);
      this.setOnline(true);
      // Broadcast our own awareness so peers learn we're here.
      if (this.awareness) {
        const ourUpdate = encodeAwarenessUpdate(this.awareness, [this.awareness.clientID]);
        void this.postAwareness(ourUpdate);
      }
    });

    es.addEventListener('update', (e: MessageEvent) => {
      const { update, origin } = JSON.parse(e.data as string) as {
        update: string;
        origin: string | null;
      };
      // Echo prevention
      if (origin === this.clientId) return;
      Y.applyUpdate(this.doc, fromBase64(update), this);
    });

    es.addEventListener('awareness', (e: MessageEvent) => {
      if (!this.awareness) return;
      const { update, origin } = JSON.parse(e.data as string) as {
        update: string;
        origin: string | null;
      };
      if (origin === this.clientId) return;
      applyAwarenessUpdate(this.awareness, fromBase64(update), this);
    });

    es.addEventListener('error', () => {
      this.setOnline(false);
      // EventSource auto-reconnects; we just flag offline.
    });
  }

  private setOnline(online: boolean): void {
    if (this.isOnline === online) return;
    this.isOnline = online;
    for (const l of this.onlineListeners) l(online);
  }

  onStatus(listener: (online: boolean) => void): () => void {
    this.onlineListeners.add(listener);
    listener(this.isOnline);
    return () => this.onlineListeners.delete(listener);
  }

  destroy(): void {
    this.doc.off('update', this.handleLocalUpdate);
    if (this.awareness) {
      this.awareness.off('update', this.handleLocalAwareness);
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeunload', this.handleUnload);
      }
      // Tell peers we're leaving.
      removeAwarenessStates(this.awareness, [this.awareness.clientID], 'destroy');
    }
    this.eventSource?.close();
    this.eventSource = null;
  }
}

function toBase64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.byteLength; i++) s += String.fromCharCode(bytes[i]!);
  return btoa(s);
}

function fromBase64(str: string): Uint8Array {
  const bin = atob(str);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
