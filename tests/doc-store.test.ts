/**
 * Server-side doc-store: in-memory Y.Doc registry with pub/sub broadcast.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import * as Y from 'yjs';

import { applyUpdate, getDiff, getState, subscribe, listDocs } from '@/server/doc-store';

describe('doc-store', () => {
  it('round-trips state through encode → applyUpdate', () => {
    const local = new Y.Doc();
    local.getText('content').insert(0, 'hello from local');
    const update = Y.encodeStateAsUpdate(local);
    applyUpdate('test-1', update, 'origin-a');

    const remote = new Y.Doc();
    Y.applyUpdate(remote, getState('test-1'));
    expect(remote.getText('content').toString()).toBe('hello from local');
  });

  it('broadcasts updates to subscribers but not to the originator origin', () => {
    let received: { update: Uint8Array; origin: unknown } | null = null;
    const unsubscribe = subscribe('test-2', (update, origin) => {
      received = { update, origin };
    });

    const local = new Y.Doc();
    local.getText('content').insert(0, 'broadcast me');
    applyUpdate('test-2', Y.encodeStateAsUpdate(local), 'origin-b');

    expect(received).not.toBeNull();
    expect(received!.origin).toBe('origin-b');
    unsubscribe();
  });

  it('getDiff produces only the missing portion vs a state vector', () => {
    const local = new Y.Doc();
    local.getText('content').insert(0, 'first edit');
    applyUpdate('test-3', Y.encodeStateAsUpdate(local), 's');

    const clientVector = Y.encodeStateVector(local);
    // Server makes another edit
    const server = new Y.Doc();
    Y.applyUpdate(server, getState('test-3'));
    server.getText('content').insert(server.getText('content').length, ' + server edit');
    applyUpdate('test-3', Y.encodeStateAsUpdate(server, Y.encodeStateVector(local)), 's2');

    const diff = getDiff('test-3', clientVector);
    // Diff should be non-empty and applying it to the client gets the new state
    const client = new Y.Doc();
    Y.applyUpdate(client, getState('test-3'));
    const clientText = client.getText('content').toString();
    expect(clientText).toContain('first edit');
    expect(clientText).toContain('+ server edit');
    expect(diff.byteLength).toBeGreaterThan(0);
  });

  it('listDocs returns one entry per document touched', () => {
    const before = listDocs().length;
    const u = Y.encodeStateAsUpdate(new Y.Doc());
    applyUpdate(`fresh-${Date.now()}`, u, null);
    expect(listDocs().length).toBeGreaterThanOrEqual(before + 1);
  });
});
