import assert from 'node:assert'
import { afterEach, describe, it } from 'node:test'

import Debug from 'debug'

import { DEBUG_ENABLE_NAMESPACES } from '../debug.config.js'
import UniqueTimedEntryQueue from '../index.js'

Debug.enable(DEBUG_ENABLE_NAMESPACES)

await describe('Unique Timed Entry Queue - Export Operations', async () => {
  let queue: UniqueTimedEntryQueue<string> | undefined

  afterEach(() => {
    queue?.clearAll()
  })

  await it('does toArray()', () => {
    queue = new UniqueTimedEntryQueue<string>()

    queue.enqueueAll(['entry1', 'entry2', 'entry3'], 0)

    assert.deepStrictEqual(
      queue.toArray(),
      ['entry1', 'entry2', 'entry3'],
      'toArray should return correct entries'
    )
  })

  await it('doesPendingToArray()', () => {
    queue = new UniqueTimedEntryQueue<string>()

    queue.enqueueAll(['entry1', 'entry2', 'entry3'])

    assert.deepStrictEqual(
      // eslint-disable-next-line sonarjs/no-alphabetical-sort
      queue.pendingToArray().toSorted(),
      ['entry1', 'entry2', 'entry3'],
      'pendingToArray should return correct pending entries'
    )
  })
})
