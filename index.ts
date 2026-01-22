import Debug from 'debug'
import exitHook from 'exit-hook'

import { DEBUG_NAMESPACE } from './debug.config.js'
import { generateUniqueListenerId, valueToString } from './utilities.js'

const debug = Debug(`${DEBUG_NAMESPACE}:index`)

export const eventTypes = ['enqueue'] as const

export type EventType = (typeof eventTypes)[number]

/**
 * A queue that enqueues unique entries after a specified delay.
 */
export default class UniqueTimedEntryQueue<T = number | string> {
  private readonly enqueueDelayMilliseconds: number

  private readonly eventListeners: Record<
    EventType,
    Record<string, (entry: T) => void>
  >

  private readonly pendingEntries: Map<
    string,
    {
      timeout: NodeJS.Timeout
      value: T
    }
  >

  private readonly queue: T[]

  /**
   * Creates a new UniqueTimedEntryQueue.
   * @param enqueueDelayMilliseconds - The delay in milliseconds before an entry is added to the queue. Default is 60000 (1 minute).
   */
  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  constructor(enqueueDelayMilliseconds = 60_000) {
    this.enqueueDelayMilliseconds = Math.max(0, enqueueDelayMilliseconds)

    if (enqueueDelayMilliseconds === 0) {
      debug(
        'Warning: enqueueDelayMilliseconds is set to 0, entries will be added immediately and uniqueness will not be enforced.'
      )
    }

    this.eventListeners = {
      enqueue: {}
    }

    this.pendingEntries = new Map()

    this.queue = []

    exitHook(() => {
      debug(
        `Process exiting, clearing ${this.pendingEntries.size} pending entry timeouts.`
      )
      this.clearPending()
    })
  }

  /**
   * Adds an event listener for the specified event type.
   * @param eventType - The event type to listen for.
   * @param listener - The listener function to call when the event occurs.
   * @returns A unique ID for the listener.
   */
  public addEventListener(
    eventType: EventType,
    listener: (entry: T) => void
  ): string {
    const listenerId = generateUniqueListenerId()

    // eslint-disable-next-line security/detect-object-injection
    this.eventListeners[eventType][listenerId] = listener

    return listenerId
  }

  /**
   * Clears all entries from the queue.
   * @returns The number of entries that were cleared.
   */
  public clear(): number {
    const clearedCount = this.queue.length
    this.queue.length = 0
    return clearedCount
  }

  /**
   * Clears all entries from the queue and all pending entries.
   * This is the same as calling both `clearPending` and `clear`.
   * @returns The total number of entries that were cleared.
   */
  public clearAll(): number {
    const clearedPending = this.clearPending()
    const clearedQueue = this.clear()

    return clearedPending + clearedQueue
  }

  /**
   * Clears all pending entries.
   * This does not affect entries already in the queue.
   * This is useful for stopping all pending enqueues, and should be called before destroying the queue.
   * @returns The number of pending entries that were cleared.
   */
  public clearPending(): number {
    for (const timeout of this.pendingEntries.values()) {
      clearTimeout(timeout.timeout)
    }

    const pendingCount = this.pendingEntries.size

    this.pendingEntries.clear()

    return pendingCount
  }

  /**
   * Clears a specific pending entry.
   * @param entry - The entry to clear from pending.
   * @returns True if the entry was found and cleared, false otherwise.
   */
  public clearPendingEntry(entry: T): boolean {
    const stringEntry = valueToString(entry)

    if (this.pendingEntries.has(stringEntry)) {
      debug(`Clearing pending entry timeout: ${stringEntry}`)
      clearTimeout(this.pendingEntries.get(stringEntry)?.timeout)
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
   * Enqueues an entry **after the specified delay**.
   * If the entry is already pending, the delay is reset.
   * If the entry is already in the queue, it will not be added again.
   * @param entry - The entry to enqueue.
   * @param entryDelayMilliseconds - Optional delay in milliseconds for this specific entry. If not provided, the default delay is used.
   */
  public enqueue(entry: T, entryDelayMilliseconds?: number): void {
    this.clearPendingEntry(entry)

    const delay = entryDelayMilliseconds ?? this.enqueueDelayMilliseconds

    if (delay <= 0) {
      if (this.queue.includes(entry)) {
        debug(`Entry already in queue, not enqueuing: ${valueToString(entry)}`)
        return
      }

      this.queue.push(entry)
      this.triggerEvents('enqueue', entry)

      debug(`Enqueued entry immediately (zero delay): ${valueToString(entry)}`)
      return
    }

    const stringEntry = valueToString(entry)

    const timeout = setTimeout(() => {
      this.pendingEntries.delete(stringEntry)

      if (this.queue.includes(entry)) {
        debug(`Entry already in queue, not enqueuing: ${stringEntry}`)
        return
      }

      this.queue.push(entry)
      this.triggerEvents('enqueue', entry)

      debug(`Enqueued entry: ${stringEntry}`)
    }, delay)

    this.pendingEntries.set(stringEntry, { timeout, value: entry })
  }

  /**
   * Enqueues a list of entries after the specified delay.
   * If an entry is already pending, the delay is reset.
   * If an entry is already in the queue, it will not be added again.
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
   * Enqueues all pending entries, bypassing the delay.
   */
  public enqueuePending(): void {
    for (const stringValue of this.pendingEntries.keys()) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
      const pendingEntry = this.pendingEntries.get(stringValue) as {
        timeout: NodeJS.Timeout
        value: T
      }

      this.pendingEntries.delete(stringValue)

      clearTimeout(pendingEntry.timeout)

      if (this.queue.includes(pendingEntry.value)) {
        debug(
          `Entry already in queue, not enqueuing pending entry: ${stringValue}`
        )
        continue
      }

      this.queue.push(pendingEntry.value)
      this.triggerEvents('enqueue', pendingEntry.value)

      debug(`Enqueued pending entry immediately: ${stringValue}`)
    }
  }

  /**
   * Checks if there are pending entries.
   * @returns `true` if there are pending entries, `false` otherwise.
   */
  public hasPending(): boolean {
    return this.pendingEntries.size > 0
  }

  /**
   * Checks if an entry is pending.
   * @param entry - The entry to check.
   * @returns `true` if the entry is pending, `false` otherwise.
   */
  public hasPendingEntry(entry: T): boolean {
    const stringEntry = valueToString(entry)
    return this.pendingEntries.has(stringEntry)
  }

  /**
   * Checks if the queue is empty.
   * @returns `true` if the queue is empty, `false` otherwise.
   */
  public isEmpty(): boolean {
    return this.queue.length === 0
  }

  /**
   * Gets the number of pending entries.
   * @returns The number of entries that are pending to be added to the queue.
   */
  public pendingSize(): number {
    return this.pendingEntries.size
  }

  /**
   * Converts the pending entries to an array.
   * @returns An array containing the pending entries.
   */
  public pendingToArray(): T[] {
    const pendingValues: T[] = []

    for (const pendingEntry of this.pendingEntries.values()) {
      pendingValues.push(pendingEntry.value)
    }

    return pendingValues
  }

  /**
   * Removes an event listener.
   * @param eventType - The event type.
   * @param listenerId - The unique ID of the listener to remove.
   */
  public removeEventListener(eventType: EventType, listenerId: string): void {
    // eslint-disable-next-line security/detect-object-injection
    const listeners = this.eventListeners[eventType]

    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    if (listeners !== undefined && Object.hasOwn(listeners, listenerId)) {
      // eslint-disable-next-line security/detect-object-injection, @typescript-eslint/no-dynamic-delete
      delete listeners[listenerId]
    }
  }

  /**
   * Gets the size of the queue.
   * @returns The number of entries in the queue.
   */
  public size(): number {
    return this.queue.length
  }

  /**
   * Converts the queue to an array.
   * @returns An array containing the entries in the queue.
   */
  public toArray(): T[] {
    return [...this.queue]
  }

  private triggerEvents(eventType: EventType, entry: T): void {
    // eslint-disable-next-line security/detect-object-injection
    for (const listener of Object.values(this.eventListeners[eventType])) {
      listener(entry)
    }
  }
}
