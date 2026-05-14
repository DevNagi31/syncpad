/**
 * CRDT convergence tests.
 *
 * The entire promise of Yjs is that two replicas can apply the same set of
 * updates in any order and converge to the same final state. These tests
 * verify that promise on realistic edit patterns — concurrent typing,
 * offline-then-replay, simultaneous inserts at the same position.
 */
import { describe, it, expect } from 'vitest';
import * as Y from 'yjs';

/** Apply every update from `source` to `target`. */
function sync(source: Y.Doc, target: Y.Doc) {
  const stateVector = Y.encodeStateVector(target);
  const diff = Y.encodeStateAsUpdate(source, stateVector);
  Y.applyUpdate(target, diff);
}

describe('Yjs CRDT', () => {
  it('two replicas converge when edits are applied in opposite order', () => {
    const a = new Y.Doc();
    const b = new Y.Doc();

    // Independent edits at different positions
    a.getText('content').insert(0, 'Hello');
    b.getText('content').insert(0, 'World');

    // Cross-sync: a → b, then b → a
    sync(a, b);
    sync(b, a);

    expect(a.getText('content').toString()).toBe(b.getText('content').toString());
  });

  it('three replicas converge under partitioned editing', () => {
    const a = new Y.Doc();
    const b = new Y.Doc();
    const c = new Y.Doc();

    // Establish common baseline
    a.getText('content').insert(0, 'shared base');
    sync(a, b);
    sync(a, c);

    // Each replica makes independent edits while "partitioned"
    a.getText('content').insert(0, '[A] ');
    b.getText('content').insert(b.getText('content').length, ' [B]');
    c.getText('content').insert(5, ' [C]');

    // Heal the partition: full mesh sync
    sync(a, b); sync(b, a);
    sync(a, c); sync(c, a);
    sync(b, c); sync(c, b);

    const textA = a.getText('content').toString();
    expect(b.getText('content').toString()).toBe(textA);
    expect(c.getText('content').toString()).toBe(textA);
    // All three insertions must be present
    expect(textA).toContain('[A]');
    expect(textA).toContain('[B]');
    expect(textA).toContain('[C]');
  });

  it('simultaneous insert at the same position does not lose either edit', () => {
    const a = new Y.Doc();
    const b = new Y.Doc();
    a.getText('content').insert(0, 'XY');
    sync(a, b);

    // Both replicas insert at position 1 — between X and Y — simultaneously.
    a.getText('content').insert(1, 'A');
    b.getText('content').insert(1, 'B');

    sync(a, b);
    sync(b, a);

    const text = a.getText('content').toString();
    expect(b.getText('content').toString()).toBe(text);
    // Both characters must appear; order is deterministic per Yjs but we don't pin it.
    expect(text).toContain('A');
    expect(text).toContain('B');
    expect(text.length).toBe(4); // X, A, B, Y in some order
  });

  it('offline replay: queued updates apply correctly on reconnect', () => {
    const local = new Y.Doc();
    const server = new Y.Doc();

    server.getText('content').insert(0, 'server-side baseline');
    sync(server, local);

    // Go offline: local makes many edits.
    const queued: Uint8Array[] = [];
    local.on('update', (u: Uint8Array) => queued.push(u));
    local.getText('content').insert(local.getText('content').length, ' + local edit 1');
    local.getText('content').insert(local.getText('content').length, ' + local edit 2');
    local.getText('content').insert(0, 'PREFIX ');

    // Meanwhile the server also evolved.
    server.getText('content').insert(server.getText('content').length, ' + server edit');

    // Reconnect: replay queued updates to server, then sync back.
    for (const u of queued) Y.applyUpdate(server, u);
    sync(server, local);

    const text = local.getText('content').toString();
    expect(server.getText('content').toString()).toBe(text);
    expect(text).toContain('PREFIX');
    expect(text).toContain('+ local edit 1');
    expect(text).toContain('+ local edit 2');
    expect(text).toContain('+ server edit');
  });

  it('state vector exchange only transmits the missing delta', () => {
    const a = new Y.Doc();
    const b = new Y.Doc();
    a.getText('content').insert(0, 'X'.repeat(1000));
    sync(a, b);

    // a does one tiny edit. The diff for b should be much smaller than the full state.
    a.getText('content').insert(0, '!');
    const fullState = Y.encodeStateAsUpdate(a);
    const diffForB = Y.encodeStateAsUpdate(a, Y.encodeStateVector(b));
    expect(diffForB.byteLength).toBeLessThan(fullState.byteLength);
  });
});
