/**
 * In-memory Yjs document store with pub/sub for fan-out via SSE.
 *
 * One Y.Doc per document id. Subscribers (SSE streams) receive every update
 * applied to a document, so a client can hydrate on connect by requesting
 * the current encoded state and then keep up via the live stream.
 *
 * In production this would be backed by Postgres or a Durable Object for
 * persistence across restarts and horizontal scale. For the demo, in-memory
 * is enough — and the API surface is identical.
 */
import * as Y from 'yjs';

type UpdateListener = (update: Uint8Array, origin: unknown) => void;
type AwarenessListener = (update: Uint8Array, origin: unknown) => void;

interface Entry {
  doc: Y.Doc;
  listeners: Set<UpdateListener>;
  awarenessListeners: Set<AwarenessListener>;
  /** Last-seen awareness update per origin clientId — replayed to new SSE
   *  subscribers so they immediately learn about everyone already connected. */
  lastAwarenessByOrigin: Map<string, Uint8Array>;
  title: string;
  updatedAt: number;
}

const documents = new Map<string, Entry>();

function getOrCreate(id: string, title = 'Untitled'): Entry {
  let entry = documents.get(id);
  if (!entry) {
    const doc = new Y.Doc();
    // Seed a small "welcome" payload on first creation.
    if (title === 'Welcome') {
      doc.getText('content').insert(
        0,
        '# Welcome to SyncPad\n\n' +
          'Open this page in two browser tabs and type — every change is merged ' +
          "without conflicts via Yjs CRDTs.\n\n" +
          '- Edits sync over Server-Sent Events\n' +
          '- Cursor presence is broadcast via the Yjs awareness protocol\n' +
          '- Offline edits are queued in IndexedDB and replayed on reconnect\n\n' +
          '```ts\n' +
          'const doc = new Y.Doc();\n' +
          'doc.getText("content").insert(0, "hello");\n' +
          '```\n',
      );
    }
    entry = {
      doc,
      listeners: new Set(),
      awarenessListeners: new Set(),
      lastAwarenessByOrigin: new Map(),
      title,
      updatedAt: Date.now(),
    };
    entry.doc.on('update', (update: Uint8Array, origin: unknown) => {
      entry!.updatedAt = Date.now();
      for (const listener of entry!.listeners) listener(update, origin);
    });
    documents.set(id, entry);
  }
  return entry;
}

export function applyUpdate(id: string, update: Uint8Array, origin: unknown): void {
  const entry = getOrCreate(id);
  Y.applyUpdate(entry.doc, update, origin);
}

export function getState(id: string): Uint8Array {
  const entry = getOrCreate(id);
  return Y.encodeStateAsUpdate(entry.doc);
}

export function getDiff(id: string, stateVector: Uint8Array): Uint8Array {
  const entry = getOrCreate(id);
  return Y.encodeStateAsUpdate(entry.doc, stateVector);
}

export function subscribe(id: string, listener: UpdateListener): () => void {
  const entry = getOrCreate(id);
  entry.listeners.add(listener);
  return () => entry.listeners.delete(listener);
}

/**
 * Awareness fan-out: the server doesn't decode awareness updates, it just
 * relays the encoded bytes to every other subscriber. Awareness state lives
 * client-side, so this is a pure pub/sub channel.
 */
export function broadcastAwareness(
  id: string,
  update: Uint8Array,
  origin: unknown,
): void {
  const entry = getOrCreate(id);
  if (typeof origin === 'string') {
    entry.lastAwarenessByOrigin.set(origin, update);
  }
  for (const listener of entry.awarenessListeners) listener(update, origin);
}

/** Last-broadcast awareness state per client. New SSE subscribers receive
 *  this immediately on connect so peers are visible before the next heartbeat. */
export function getAwarenessSnapshot(id: string): Array<{ origin: string; update: Uint8Array }> {
  const entry = getOrCreate(id);
  return Array.from(entry.lastAwarenessByOrigin.entries()).map(([origin, update]) => ({
    origin,
    update,
  }));
}

export function subscribeAwareness(
  id: string,
  listener: AwarenessListener,
): () => void {
  const entry = getOrCreate(id);
  entry.awarenessListeners.add(listener);
  return () => entry.awarenessListeners.delete(listener);
}

export interface DocMeta {
  id: string;
  title: string;
  updatedAt: number;
  size: number;
}

export function listDocs(): DocMeta[] {
  return Array.from(documents.entries()).map(([id, entry]) => ({
    id,
    title: entry.title,
    updatedAt: entry.updatedAt,
    size: entry.doc.getText('content').length,
  }));
}

export function setTitle(id: string, title: string): void {
  const entry = getOrCreate(id);
  entry.title = title;
}

// Seed a welcome doc the first time the store is touched.
if (documents.size === 0) {
  getOrCreate('welcome', 'Welcome');
}
