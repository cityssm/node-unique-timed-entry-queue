// eslint-disable-next-line @eslint-community/eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/no-magic-numbers */
import assert from 'node:assert';
import { describe, it } from 'node:test';
import Debug from 'debug';
import { DEBUG_ENABLE_NAMESPACES, DEBUG_NAMESPACE } from '../debug.config.js';
import UniqueTimedEntryQueue from '../index.js';
Debug.enable(DEBUG_ENABLE_NAMESPACES);
const debug = Debug(`${DEBUG_NAMESPACE}:test`);
async function wait(ms) {
    // eslint-disable-next-line promise/avoid-new
    await new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}
await describe('Unique Timed Entry Queue', async () => {
    await it('should delay enqueue of unique entries', async () => {
        const queue = new UniqueTimedEntryQueue(10_000); // 10 seconds delay
        /*
         * Add two entries
         */
        debug('Enqueuing "entry1" and "entry2"');
        queue.enqueue('entry1');
        queue.enqueue('entry2');
        assert.strictEqual(queue.size(), 0, 'Queue should be empty immediately after enqueueing');
        assert.strictEqual(queue.isEmpty(), true, 'Queue should be empty immediately after enqueueing');
        assert.strictEqual(queue.dequeue(), undefined, 'Dequeue should return undefined immediately after enqueueing');
        assert.strictEqual(queue.pendingSize(), 2, 'There should be 2 pending entries after enqueueing');
        /*
         * Wait for 5 seconds and re-add entry1 to reset its delay
         */
        debug('Waiting 5 seconds before re-enqueueing "entry1"');
        await wait(5000); // Wait 5 seconds
        queue.enqueue('entry1'); // Duplicate, should reset delay
        assert.strictEqual(queue.size(), 0, 'Queue should still be empty after enqueueing');
        assert.strictEqual(queue.isEmpty(), true, 'Queue should still be empty after enqueueing');
        assert.strictEqual(queue.dequeue(), undefined, 'Dequeue should still return undefined after enqueueing');
        assert.strictEqual(queue.pendingSize(), 2, 'There should be 2 pending entries after enqueueing');
        /*
         * Wait for 6 seconds to allow "entry2" to be enqueued
         */
        debug('Waiting another 6 seconds to allow "entry2" to be enqueued');
        await wait(6000);
        assert.strictEqual(queue.size(), 1, 'Queue should have 1 entry after delay');
        assert.strictEqual(queue.isEmpty(), false, 'Queue should not be empty after delay');
        assert.strictEqual(queue.pendingSize(), 1, 'There should be 1 pending entry after delay');
        const dequeuedEntry2 = queue.dequeue();
        assert.strictEqual(queue.size(), 0, 'Queue should be empty after dequeueing the entry');
        assert.strictEqual(dequeuedEntry2, 'entry2', 'Dequeued entry should be "entry2"');
        /*
         * Wait for another 5 seconds to allow "entry1" to be enqueued
         */
        debug('Waiting another 5 seconds to allow "entry1" to be enqueued');
        await wait(5000);
        assert.strictEqual(queue.size(), 1, 'Queue should have 1 entry after waiting for "entry1"');
        assert.strictEqual(queue.isEmpty(), false, 'Queue should not be empty after waiting for "entry1"');
        assert.strictEqual(queue.pendingSize(), 0, 'There should be no pending entries after all delays have passed');
        const dequeuedEntry1 = queue.dequeue();
        assert.strictEqual(queue.size(), 0, 'Queue should be empty after dequeueing the entry');
        assert.strictEqual(dequeuedEntry1, 'entry1', 'Dequeued entry should be "entry1"');
    });
});
