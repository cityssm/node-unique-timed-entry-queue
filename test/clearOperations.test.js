import assert from 'node:assert';
import { afterEach, describe, it } from 'node:test';
import Debug from 'debug';
import { DEBUG_ENABLE_NAMESPACES } from '../debug.config.js';
import UniqueTimedEntryQueue from '../index.js';
Debug.enable(DEBUG_ENABLE_NAMESPACES);
await describe('Unique Timed Entry Queue - Clear Operations', async () => {
    let queue;
    afterEach(() => {
        queue?.clearAll();
    });
    await it('does clear()', () => {
        queue = new UniqueTimedEntryQueue();
        queue.enqueueAll(['entry1', 'entry2', 'entry3'], 0);
        assert.strictEqual(queue.size(), 3);
        queue.clear();
        assert.strictEqual(queue.size(), 0);
    });
    await it('does clearPending()', () => {
        queue = new UniqueTimedEntryQueue();
        queue.enqueueAll(['entry1', 'entry2', 'entry3']);
        assert.strictEqual(queue.pendingSize(), 3);
        queue.clearPending();
        assert.strictEqual(queue.pendingSize(), 0);
    });
    await it('does clearPendingEntry()', () => {
        queue = new UniqueTimedEntryQueue();
        queue.enqueueAll(['entry1', 'entry2', 'entry3']);
        assert.strictEqual(queue.pendingSize(), 3);
        const cleared = queue.clearPendingEntry('entry2');
        assert.strictEqual(cleared, true);
        assert.strictEqual(queue.pendingSize(), 2);
        assert.strictEqual(queue.hasPendingEntry('entry2'), false);
    });
    await it('does clearPendingEntry() - not found', () => {
        queue = new UniqueTimedEntryQueue();
        queue.enqueueAll(['entry1', 'entry2', 'entry3']);
        assert.strictEqual(queue.pendingSize(), 3);
        const cleared = queue.clearPendingEntry('entry4');
        assert.strictEqual(cleared, false);
        assert.strictEqual(queue.pendingSize(), 3);
    });
    await it('does clearAll()', () => {
        queue = new UniqueTimedEntryQueue();
        queue.enqueueAll(['entry1', 'entry2', 'entry3']);
        assert.strictEqual(queue.pendingSize(), 3);
        queue.enqueueAll(['entry4', 'entry5'], 0);
        assert.strictEqual(queue.size(), 2);
        queue.clearAll();
        assert.strictEqual(queue.pendingSize(), 0);
        assert.strictEqual(queue.size(), 0);
    });
});
