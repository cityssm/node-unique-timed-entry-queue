/**
 * A queue that enqueues unique entries after a specified delay.
 */
export default class UniqueTimedEntryQueue<T = number | string> {
    private readonly enqueueDelayMilliseconds;
    private readonly pendingEntries;
    private readonly queue;
    /**
     * Creates a new UniqueTimedEntryQueue.
     * @param enqueueDelayMilliseconds - The delay in milliseconds before an entry is added to the queue. Default is 60000 (1 minute).
     */
    constructor(enqueueDelayMilliseconds?: number);
    /**
     * Clears all entries from the queue.
     */
    clear(): void;
    /**
     * Clears all entries from the queue and all pending entries.
     * This is the same as calling both `clearPending` and `clear`.
     */
    clearAll(): void;
    /**
     * Clears all pending entries.
     * This does not affect entries already in the queue.
     * This is useful for stopping all pending enqueues, and should be called before destroying the queue.
     */
    clearPending(): void;
    /**
     * Clears a specific pending entry.
     * @param entry - The entry to clear from pending.
     * @returns True if the entry was found and cleared, false otherwise.
     */
    clearPendingEntry(entry: T): boolean;
    /**
     * Dequeues an entry from the front of the queue.
     * @returns The dequeued entry, or undefined if the queue is empty.
     */
    dequeue(): T | undefined;
    /**
     * Enqueues an entry after the specified delay. If the entry is already pending, the delay is reset.
     * @param entry - The entry to enqueue.
     * @param entryDelayMilliseconds - Optional delay in milliseconds for this specific entry. If not provided, the default delay is used.
     */
    enqueue(entry: T, entryDelayMilliseconds?: number): void;
    /**
     * Enqueues a list of entries after the specified delay. If an entry is already pending, the delay is reset.
     * @param entries - The entries to enqueue.
     * @param entryDelayMilliseconds - Optional delay in milliseconds for these specific entries. If not provided, the default delay is used.
     */
    enqueueAll(entries: T[], entryDelayMilliseconds?: number): void;
    /**
     * Gets the enqueue delay in milliseconds.
     * @returns The enqueue delay in milliseconds.
     */
    enqueueDelay(): number;
    /**
     * Enqueues all pending entries immediately, bypassing the delay.
     */
    enqueuePending(): void;
    /**
     * Checks if there are pending entries.
     * @returns True if there are pending entries, false otherwise.
     */
    hasPending(): boolean;
    /**
     * Checks if an entry is pending.
     * @param entry - The entry to check.
     * @returns True if the entry is pending, false otherwise.
     */
    hasPendingEntry(entry: T): boolean;
    /**
     * Checks if the queue is empty.
     * @returns True if the queue is empty, false otherwise.
     */
    isEmpty(): boolean;
    /**
     * Gets the number of pending entries.
     * @returns The number of entries that are pending to be added to the queue.
     */
    pendingSize(): number;
    /**
     * Converts the pending entries to an array.
     * @returns An array containing the pending entries.
     */
    pendingToArray(): T[];
    /**
     * Gets the size of the queue.
     * @returns The number of entries in the queue.
     */
    size(): number;
    /**
     * Converts the queue to an array.
     * @returns An array containing the entries in the queue.
     */
    toArray(): T[];
}
