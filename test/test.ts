// eslint-disable-next-line @eslint-community/eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/no-magic-numbers */

import assert from 'node:assert'
import { describe, it } from 'node:test'

import Debug from 'debug'

import { DEBUG_ENABLE_NAMESPACES, DEBUG_NAMESPACE } from '../debug.config.js'
import UniqueTimedEntryQueue from '../index.js'

Debug.enable(DEBUG_ENABLE_NAMESPACES)

const debug = Debug(`${DEBUG_NAMESPACE}:test`)

async function wait(ms: number): Promise<void> {
  // eslint-disable-next-line promise/avoid-new
  await new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

await describe('Unique Timed Entry Queue', async () => {
  await it('should delay enqueue of unique entries', async () => {
    const queue = new UniqueTimedEntryQueue<string>(10_000) // 10 seconds delay

    /*
     * Add two entries
     */

    debug('Enqueuing "entry1" and "entry2"')

    queue.enqueue('entry1')
    queue.enqueue('entry2')

    assert.strictEqual(
      queue.size(),
      0,
      'Queue should be empty immediately after enqueueing'
    )

    assert.strictEqual(
      queue.isEmpty(),
      true,
      'Queue should be empty immediately after enqueueing'
    )

    assert.strictEqual(
      queue.dequeue(),
      undefined,
      'Dequeue should return undefined immediately after enqueueing'
    )

    assert.strictEqual(
      queue.pendingSize(),
      2,
      'There should be 2 pending entries after enqueueing'
    )

    /*
     * Wait for 5 seconds and re-add entry1 to reset its delay
     */

    debug('Waiting 5 seconds before re-enqueueing "entry1"')

    await wait(5000) // Wait 5 seconds

    queue.enqueue('entry1') // Duplicate, should reset delay

    assert.strictEqual(
      queue.size(),
      0,
      'Queue should still be empty after enqueueing'
    )

    assert.strictEqual(
      queue.isEmpty(),
      true,
      'Queue should still be empty after enqueueing'
    )

    assert.strictEqual(
      queue.dequeue(),
      undefined,
      'Dequeue should still return undefined after enqueueing'
    )

    assert.strictEqual(
      queue.pendingSize(),
      2,
      'There should be 2 pending entries after enqueueing'
    )

    /*
     * Wait for 6 seconds to allow "entry2" to be enqueued
     */

    debug('Waiting another 6 seconds to allow "entry2" to be enqueued')

    await wait(6000)

    assert.strictEqual(queue.size(), 1, 'Queue should have 1 entry after delay')
    assert.strictEqual(
      queue.isEmpty(),
      false,
      'Queue should not be empty after delay'
    )

    assert.strictEqual(
      queue.pendingSize(),
      1,
      'There should be 1 pending entry after delay'
    )

    const dequeuedEntry2 = queue.dequeue()

    assert.strictEqual(
      queue.size(),
      0,
      'Queue should be empty after dequeueing the entry'
    )

    assert.strictEqual(
      dequeuedEntry2,
      'entry2',
      'Dequeued entry should be "entry2"'
    )

    /*
     * Wait for another 5 seconds to allow "entry1" to be enqueued
     */

    debug('Waiting another 5 seconds to allow "entry1" to be enqueued')

    await wait(5000)

    assert.strictEqual(
      queue.size(),
      1,
      'Queue should have 1 entry after waiting for "entry1"'
    )

    assert.strictEqual(
      queue.isEmpty(),
      false,
      'Queue should not be empty after waiting for "entry1"'
    )

    assert.strictEqual(
      queue.pendingSize(),
      0,
      'There should be no pending entries after all delays have passed'
    )

    const dequeuedEntry1 = queue.dequeue()

    assert.strictEqual(
      queue.size(),
      0,
      'Queue should be empty after dequeueing the entry'
    )

    assert.strictEqual(
      dequeuedEntry1,
      'entry1',
      'Dequeued entry should be "entry1"'
    )
  })

  await it('should clear pending entries correctly', () => {
    const queue = new UniqueTimedEntryQueue<string>(5000) // 5 seconds delay

    debug('Enqueuing "entry1" and "entry2"')

    queue.enqueueAll(['entry1', 'entry2'])

    assert.strictEqual(
      queue.pendingSize(),
      2,
      'There should be 2 pending entries after enqueueing'
    )

    debug('Clearing pending entry "entry1"')

    const cleared = queue.clearPendingEntry('entry1')

    assert.strictEqual(cleared, true, '"entry1" should be cleared successfully')

    assert.strictEqual(
      queue.pendingSize(),
      1,
      'There should be 1 pending entry after clearing "entry1"'
    )

    debug('Clearing all pending entries')

    queue.clearPending()

    assert.strictEqual(
      queue.pendingSize(),
      0,
      'There should be no pending entries after clearing all'
    )
  })

  await it('should handle immediate enqueueing with zero delay', () => {
    const queue = new UniqueTimedEntryQueue<string>(0) // 0 seconds delay

    debug('Enqueuing "entry1" and "entry2" with zero delay')

    queue.enqueue('entry1')
    queue.enqueue('entry2')

    assert.strictEqual(
      queue.size(),
      2,
      'Queue should have 2 entries immediately after enqueueing with zero delay'
    )

    assert.strictEqual(
      queue.isEmpty(),
      false,
      'Queue should not be empty immediately after enqueueing with zero delay'
    )

    assert.strictEqual(
      queue.pendingSize(),
      0,
      'There should be no pending entries after enqueueing with zero delay'
    )

    const dequeuedEntry1 = queue.dequeue()
    const dequeuedEntry2 = queue.dequeue()

    assert.strictEqual(
      dequeuedEntry1,
      'entry1',
      'First dequeued entry should be "entry1"'
    )

    assert.strictEqual(
      dequeuedEntry2,
      'entry2',
      'Second dequeued entry should be "entry2"'
    )
  })

  await it('should allow custom delay per entry', async () => {
    const queue = new UniqueTimedEntryQueue<string>(10_000) // Default 10 seconds delay

    debug(
      'Enqueuing "entry1" with 2 seconds delay and "entry2" with 4 seconds delay'
    )

    queue.enqueue('entry1', 2000) // 2 seconds delay
    queue.enqueue('entry2', 4000) // 4 seconds delay

    assert.strictEqual(
      queue.size(),
      0,
      'Queue should be empty immediately after enqueueing'
    )

    assert.strictEqual(
      queue.pendingSize(),
      2,
      'There should be 2 pending entries after enqueueing'
    )

    /*
     * Wait for 3 seconds to allow "entry1" to be enqueued
     */

    debug('Waiting 3 seconds to allow "entry1" to be enqueued')

    await wait(3000)

    assert.strictEqual(
      queue.size(),
      1,
      'Queue should have 1 entry after 3 seconds'
    )

    assert.strictEqual(
      queue.pendingSize(),
      1,
      'There should be 1 pending entry after 3 seconds'
    )

    const dequeuedEntry1 = queue.dequeue()

    assert.strictEqual(
      dequeuedEntry1,
      'entry1',
      'Dequeued entry should be "entry1"'
    )

    /*
     * Wait for another 2 seconds to allow "entry2" to be enqueued
     */

    debug('Waiting another 2 seconds to allow "entry2" to be enqueued')

    await wait(2000)

    assert.strictEqual(
      queue.size(),
      1,
      'Queue should have 1 entry after total 5 seconds'
    )

    assert.strictEqual(
      queue.pendingSize(),
      0,
      'There should be no pending entries after total 5 seconds'
    )

    const dequeuedEntry2 = queue.dequeue()

    assert.strictEqual(
      dequeuedEntry2,
      'entry2',
      'Dequeued entry should be "entry2"'
    )
  })
})
