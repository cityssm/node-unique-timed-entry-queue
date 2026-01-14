import Debug from 'debug'
import exitHook from 'exit-hook'

import { DEBUG_NAMESPACE } from './debug.config.js'
import { valueToString } from './utilities.js'

const debug = Debug(`${DEBUG_NAMESPACE}:index`)

/**
 * A queue that enqueues unique entries after a specified delay.
 */
export default class UniqueTimedEntryQueue<T = number | string> {
  private readonly enqueueDelayMilliseconds: number
  private readonly pendingEntries: Map<string, NodeJS.Timeout>
  private readonly queue: T[]

  /**
   * Creates a new UniqueTimedEntryQueue.
   * @param enqueueDelayMilliseconds - The delay in milliseconds before an entry is added to the queue. Default is 60000 (1 minute).
   */
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  constructor(enqueueDelayMilliseconds = 60_000) {
    if (enqueueDelayMilliseconds < 0) {
      throw new Error('enqueueDelayMilliseconds must be non-negative')
    } else if (enqueueDelayMilliseconds === 0) {
      debug(
        'Warning: enqueueDelayMilliseconds is set to 0, entries will be added immediately and uniqueness will not be enforced.'
      )
    }

    this.enqueueDelayMilliseconds = enqueueDelayMilliseconds
    this.pendingEntries = new Map()

    this.queue = []

    exitHook(() => {
      debug('Process exiting, clearing pending entries.')
      this.clearPending()
    })
  }

  /**
   * Clears all entries from the queue.
   */
  public clear(): void {
    this.queue.length = 0
  }

  /**
   * Clears all entries from the queue and all pending entries.
   */
  public clearAll(): void {
    this.clearPending()
    this.clear()
  }

  /**
   * Clears all pending entries.
   */
  public clearPending(): void {
    for (const timeout of this.pendingEntries.values()) {
      clearTimeout(timeout)
    }

    this.pendingEntries.clear()
  }

  /**
   * Clears a specific pending entry.
   * @param entry - The entry to clear from pending.
   * @returns True if the entry was found and cleared, false otherwise.
   */
  public clearPendingEntry(entry: T): boolean {
    const stringEntry = valueToString(entry)

    if (this.pendingEntries.has(stringEntry)) {
      debug(`Clearing pending entry: ${stringEntry}`)
      clearTimeout(this.pendingEntries.get(stringEntry))
      this.pendingEntries.delete(stringEntry)
      return true
    }

    return false
  }

  /**
   * Dequeues an entry from the front of the queue.
   * @returns The dequeued entry, or undefined if the queue is empty.
   */
  public dequeue(): T | undefined {
    return this.queue.shift()
  }

  /**
   * Enqueues an entry after the specified delay. If the entry is already pending, the delay is reset.
   * @param entry - The entry to enqueue.
   * @param entryDelayMilliseconds - Optional delay in milliseconds for this specific entry. If not provided, the default delay is used.
   */
  public enqueue(entry: T, entryDelayMilliseconds?: number): void {
    this.clearPendingEntry(entry)

    const delay = entryDelayMilliseconds ?? this.enqueueDelayMilliseconds

    if (delay <= 0) {
      this.queue.push(entry)
      debug(`Enqueued entry immediately (zero delay): ${valueToString(entry)}`)
      return
    }

    const stringEntry = valueToString(entry)

    const timeout = setTimeout(() => {
      this.queue.push(entry)
      debug(`Enqueued entry: ${stringEntry}`)
      this.pendingEntries.delete(stringEntry)
    }, delay)

    this.pendingEntries.set(stringEntry, timeout)
  }

  /**
   * Enqueues a list of entries after the specified delay. If an entry is already pending, the delay is reset.
   * @param entries - The entries to enqueue.
   * @param entryDelayMilliseconds - Optional delay in milliseconds for these specific entries. If not provided, the default delay is used.
   */
  public enqueueAll(entries: T[], entryDelayMilliseconds?: number): void {
    for (const entry of entries) {
      this.enqueue(entry, entryDelayMilliseconds)
    }
  }

  /**
   * Gets the enqueue delay in milliseconds.
   * @returns The enqueue delay in milliseconds.
   */
  public enqueueDelay(): number {
    return this.enqueueDelayMilliseconds
  }

  /**
   * Checks if an entry is pending.
   * @param entry - The entry to check.
   * @returns True if the entry is pending, false otherwise.
   */
  public hasPendingEntry(entry: T): boolean {
    const stringEntry = valueToString(entry)
    return this.pendingEntries.has(stringEntry)
  }

  /**
   * Checks if the queue is empty.
   * @returns True if the queue is empty, false otherwise.
   */
  public isEmpty(): boolean {
    return this.queue.length === 0
  }

  /**
   * Checks if there are no pending entries.
   * @returns True if there are no pending entries, false otherwise.
   */
  public isPendingEmpty(): boolean {
    return this.pendingEntries.size === 0
  }

  /**
   * Gets the number of pending entries.
   * @returns The number of entries that are pending to be added to the queue.
   */
  public pendingSize(): number {
    return this.pendingEntries.size
  }

  /**
   * Gets the size of the queue.
   * @returns The number of entries in the queue.
   */
  public size(): number {
    return this.queue.length
  }
}
