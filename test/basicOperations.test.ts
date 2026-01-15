import assert from 'node:assert'
import { afterEach, describe, it } from 'node:test'

import UniqueTimedEntryQueue from '../index.js'

async function wait(ms: number): Promise<void> {
  // eslint-disable-next-line promise/avoid-new
  await new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

await describe('Unique Timed Entry Queue - Basic Operations', async () => {
  let queue: UniqueTimedEntryQueue<string> | undefined

  afterEach(() => {
    queue?.clearAll()
  })

  await it('initializes correctly', () => {
    queue = new UniqueTimedEntryQueue<string>(5000)

    assert.strictEqual(
      queue.enqueueDelay(),
      5000,
      'enqueueDelay should be set correctly'
    )

    assert.strictEqual(
      queue.isEmpty(),
      true,
      'Queue should be empty upon initialization'
    )

    assert.strictEqual(
      queue.size(),
      0,
      'Queue size should be 0 upon initialization'
    )

    assert.strictEqual(
      queue.hasPending(),
      false,
      'There should be no pending entries upon initialization'
    )

    assert.strictEqual(
      queue.pendingSize(),
      0,
      'There should be no pending entries upon initialization'
    )
  })

  await it('does enqueue()', async () => {
    queue = new UniqueTimedEntryQueue<string>(1000)

    queue.enqueue('testEntry')

    assert.strictEqual(queue.isEmpty(), true, 'Queue should be empty')

    assert.strictEqual(queue.size(), 0, 'Queue size should be 0 after enqueue')

    assert.strictEqual(
      queue.pendingSize(),
      1,
      'There should be 1 pending entry after enqueue'
    )

    assert.strictEqual(
      queue.hasPendingEntry('testEntry'),
      true,
      'Pending entry should exist'
    )

    await wait(1100)

    assert.strictEqual(queue.isEmpty(), false, 'Queue should not be empty')

    assert.strictEqual(queue.size(), 1, 'Queue size should be 1 after delay')

    assert.strictEqual(
      queue.pendingSize(),
      0,
      'There should be no pending entries after delay'
    )
  })

  await it('does enqueue() - duplicate', () => {
    queue = new UniqueTimedEntryQueue<string>()

    queue.enqueue('testEntry')
    queue.enqueue('testEntry')

    assert.strictEqual(queue.size(), 0)
    assert.strictEqual(queue.pendingSize(), 1)

    assert.strictEqual(queue.hasPendingEntry('testEntry'), true)
  })

  await it('does enqueue() - immediate', () => {
    queue = new UniqueTimedEntryQueue<string>()

    queue.enqueue('immediateEntry', 0)

    assert.strictEqual(queue.isEmpty(), false, 'Queue should not be empty')

    assert.strictEqual(queue.size(), 1, 'Queue size should be 1 after enqueue')

    assert.strictEqual(
      queue.pendingSize(),
      0,
      'There should be no pending entries after immediate enqueue'
    )
  })

  await it('does enqueue() - custom delay', async () => {
    queue = new UniqueTimedEntryQueue<string>(1000)

    queue.enqueue('customDelayEntry', 2000)

    assert.strictEqual(queue.isEmpty(), true, 'Queue should be empty')

    assert.strictEqual(queue.size(), 0, 'Queue size should be 0 after enqueue')

    assert.strictEqual(
      queue.pendingSize(),
      1,
      'There should be 1 pending entry after enqueue'
    )

    assert.strictEqual(
      queue.hasPendingEntry('customDelayEntry'),
      true,
      'Pending entry should exist'
    )

    await wait(1100)

    assert.strictEqual(queue.isEmpty(), true, 'Queue should still be empty')

    assert.strictEqual(queue.size(), 0, 'Queue size should still be 0')

    assert.strictEqual(
      queue.pendingSize(),
      1,
      'There should still be 1 pending entry'
    )

    await wait(1000)

    assert.strictEqual(queue.isEmpty(), false, 'Queue should not be empty')

    assert.strictEqual(queue.size(), 1, 'Queue size should be 1 after delay')

    assert.strictEqual(
      queue.pendingSize(),
      0,
      'There should be no pending entries after delay'
    )
  })

  await it('does enqueueAll()', () => {
    queue = new UniqueTimedEntryQueue<string>()

    queue.enqueueAll(['entry1', 'entry2', 'entry3'])

    assert.strictEqual(queue.size(), 0)
    assert.strictEqual(queue.pendingSize(), 3)

    assert.strictEqual(queue.hasPendingEntry('entry1'), true)
    assert.strictEqual(queue.hasPendingEntry('entry2'), true)
    assert.strictEqual(queue.hasPendingEntry('entry3'), true)
  })

  await it('does enqueueAll() - with duplicates', () => {
    queue = new UniqueTimedEntryQueue<string>()

    queue.enqueueAll(['entry1', 'entry2', 'entry1', 'entry3', 'entry2'])

    assert.strictEqual(queue.size(), 0)
    assert.strictEqual(queue.pendingSize(), 3)

    assert.strictEqual(queue.hasPendingEntry('entry1'), true)
    assert.strictEqual(queue.hasPendingEntry('entry2'), true)
    assert.strictEqual(queue.hasPendingEntry('entry3'), true)
  })

  await it('does enqueuePending()', () => {
    queue = new UniqueTimedEntryQueue<string>(1000) // 1 second delay

    queue.enqueueAll(['entry1', 'entry2', 'entry3'])

    assert.strictEqual(queue.size(), 0)
    assert.strictEqual(queue.pendingSize(), 3)

    queue.enqueuePending()

    assert.strictEqual(queue.size(), 3)
    assert.strictEqual(queue.pendingSize(), 0)

    assert.strictEqual(queue.hasPending(), false)
  })

  await it('does dequeue()', async () => {
    queue = new UniqueTimedEntryQueue<string>(1000) // 1 second delay

    queue.enqueue('testEntry')

    await wait(1100)

    const dequeuedEntry = queue.dequeue()

    assert.strictEqual(dequeuedEntry, 'testEntry')
  })

  await it('does dequeue() - empty', () => {
    queue = new UniqueTimedEntryQueue<string>()

    const dequeuedEntry = queue.dequeue()

    assert.strictEqual(dequeuedEntry, undefined)
  })
})
