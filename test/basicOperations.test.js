// eslint-disable-next-line @eslint-community/eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/no-magic-numbers */
import assert from 'node:assert';
import { afterEach, describe, it } from 'node:test';
import Debug from 'debug';
import { DEBUG_ENABLE_NAMESPACES } from '../debug.config.js';
import UniqueTimedEntryQueue from '../index.js';
import { wait } from './utilities.js';
Debug.enable(DEBUG_ENABLE_NAMESPACES);
await describe('Unique Timed Entry Queue - Basic Operations', async () => {
    let queue;
    afterEach(() => {
        queue?.clearAll();
    });
    await it('initializes', () => {
        queue = new UniqueTimedEntryQueue(5000);
        assert.strictEqual(queue.enqueueDelay(), 5000, 'enqueueDelay should be set correctly');
        assert.strictEqual(queue.isEmpty(), true, 'Queue should be empty upon initialization');
        assert.strictEqual(queue.size(), 0, 'Queue size should be 0 upon initialization');
        assert.strictEqual(queue.hasPending(), false, 'There should be no pending entries upon initialization');
        assert.strictEqual(queue.pendingSize(), 0, 'There should be no pending entries upon initialization');
    });
    await it('initializes - zero delay', () => {
        queue = new UniqueTimedEntryQueue(0);
        assert.strictEqual(queue.enqueueDelay(), 0, 'enqueueDelay should be set correctly to zero');
        // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
        queue.enqueue(undefined);
        assert.strictEqual(queue.isEmpty(), false, 'Queue should not be empty after immediate enqueue');
        assert.strictEqual(queue.size(), 1, 'Queue size should be 1 after immediate enqueue');
    });
    await it('does enqueue()', async () => {
        queue = new UniqueTimedEntryQueue(1000);
        queue.enqueue('testEntry');
        assert.strictEqual(queue.isEmpty(), true, 'Queue should be empty');
        assert.strictEqual(queue.size(), 0, 'Queue size should be 0 after enqueue');
        assert.strictEqual(queue.pendingSize(), 1, 'There should be 1 pending entry after enqueue');
        assert.strictEqual(queue.hasPendingEntry('testEntry'), true, 'Pending entry should exist');
        await wait(1100);
        assert.strictEqual(queue.isEmpty(), false, 'Queue should not be empty');
        assert.strictEqual(queue.size(), 1, 'Queue size should be 1 after delay');
        assert.strictEqual(queue.pendingSize(), 0, 'There should be no pending entries after delay');
    });
    await it('does enqueue() - duplicate', () => {
        queue = new UniqueTimedEntryQueue();
        queue.enqueue('testEntry');
        queue.enqueue('testEntry');
        assert.strictEqual(queue.size(), 0);
        assert.strictEqual(queue.pendingSize(), 1);
        assert.strictEqual(queue.hasPendingEntry('testEntry'), true);
    });
    await it('does enqueue() - immediate', () => {
        queue = new UniqueTimedEntryQueue();
        queue.enqueue('immediateEntry', 0);
        assert.strictEqual(queue.isEmpty(), false, 'Queue should not be empty');
        assert.strictEqual(queue.size(), 1, 'Queue size should be 1 after enqueue');
        assert.strictEqual(queue.pendingSize(), 0, 'There should be no pending entries after immediate enqueue');
    });
    await it('does enqueue() - custom delay', async () => {
        queue = new UniqueTimedEntryQueue(1000);
        queue.enqueue('customDelayEntry', 2000);
        assert.strictEqual(queue.isEmpty(), true, 'Queue should be empty');
        assert.strictEqual(queue.size(), 0, 'Queue size should be 0 after enqueue');
        assert.strictEqual(queue.pendingSize(), 1, 'There should be 1 pending entry after enqueue');
        assert.strictEqual(queue.hasPendingEntry('customDelayEntry'), true, 'Pending entry should exist');
        await wait(1100);
        assert.strictEqual(queue.isEmpty(), true, 'Queue should still be empty');
        assert.strictEqual(queue.size(), 0, 'Queue size should still be 0');
        assert.strictEqual(queue.pendingSize(), 1, 'There should still be 1 pending entry');
        await wait(1000);
        assert.strictEqual(queue.isEmpty(), false, 'Queue should not be empty');
        assert.strictEqual(queue.size(), 1, 'Queue size should be 1 after delay');
        assert.strictEqual(queue.pendingSize(), 0, 'There should be no pending entries after delay');
    });
    await it('does enqueueAll()', () => {
        queue = new UniqueTimedEntryQueue();
        queue.enqueueAll(['entry1', 'entry2', 'entry3']);
        assert.strictEqual(queue.size(), 0);
        assert.strictEqual(queue.pendingSize(), 3);
        assert.strictEqual(queue.hasPendingEntry('entry1'), true);
        assert.strictEqual(queue.hasPendingEntry('entry2'), true);
        assert.strictEqual(queue.hasPendingEntry('entry3'), true);
    });
    await it('does enqueueAll() - with duplicates', () => {
        queue = new UniqueTimedEntryQueue();
        queue.enqueueAll(['entry1', 'entry2', 'entry1', 'entry3', 'entry2']);
        assert.strictEqual(queue.size(), 0);
        assert.strictEqual(queue.pendingSize(), 3);
        assert.strictEqual(queue.hasPendingEntry('entry1'), true);
        assert.strictEqual(queue.hasPendingEntry('entry2'), true);
        assert.strictEqual(queue.hasPendingEntry('entry3'), true);
    });
    await it('does enqueuePending()', () => {
        queue = new UniqueTimedEntryQueue(1000); // 1 second delay
        queue.enqueueAll(['entry1', 'entry2', 'entry3']);
        assert.strictEqual(queue.size(), 0);
        assert.strictEqual(queue.pendingSize(), 3);
        queue.enqueuePending();
        assert.strictEqual(queue.size(), 3);
        assert.strictEqual(queue.pendingSize(), 0);
        assert.strictEqual(queue.hasPending(), false);
    });
    await it('does dequeue()', async () => {
        queue = new UniqueTimedEntryQueue(1000); // 1 second delay
        queue.enqueue('testEntry');
        await wait(1100);
        const dequeuedEntry = queue.dequeue();
        assert.strictEqual(dequeuedEntry, 'testEntry');
    });
    await it('does dequeue() - empty', () => {
        queue = new UniqueTimedEntryQueue();
        const dequeuedEntry = queue.dequeue();
        assert.strictEqual(dequeuedEntry, undefined);
    });
    await it('does "enqueue() => dequeue()" sequence - number values', async () => {
        const numberQueue = new UniqueTimedEntryQueue(500); // 0.5 second delay
        const testValue = 42;
        numberQueue.enqueue(testValue);
        assert.strictEqual(numberQueue.size(), 0);
        assert.strictEqual(numberQueue.pendingSize(), 1);
        await wait(600);
        assert.strictEqual(numberQueue.size(), 1);
        assert.strictEqual(numberQueue.pendingSize(), 0);
        const dequeuedValue = numberQueue.dequeue();
        assert.strictEqual(dequeuedValue, testValue);
    });
    await it('does "enqueue() => dequeue()" sequence - object values', async () => {
        const objectQueue = new UniqueTimedEntryQueue(500); // 0.5 second delay
        const testValue = { id: 1, name: 'Test Object' };
        objectQueue.enqueue(testValue);
        assert.strictEqual(objectQueue.size(), 0);
        assert.strictEqual(objectQueue.pendingSize(), 1);
        await wait(600);
        assert.strictEqual(objectQueue.size(), 1);
        assert.strictEqual(objectQueue.pendingSize(), 0);
        const dequeuedValue = objectQueue.dequeue();
        assert.deepStrictEqual(dequeuedValue, testValue);
    });
});
