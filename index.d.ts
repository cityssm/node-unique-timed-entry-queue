/**
 * A queue that enqueues unique entries after a specified delay.
 */
export default class UniqueTimedEntryQueue<T = number | string> {
    private readonly delayMilliseconds;
    private readonly pendingEntries;
    private readonly queue;
    /**
     * Creates a new UniqueTimedEntryQueue.
     * @param delayMilliseconds - The delay in milliseconds before an entry is added to the queue. Default is 60000 (1 minute).
     */
    constructor(delayMilliseconds?: number);
    /**
     * Clears all entries from the queue.
     */
    clear(): void;
    /**
     * Clears all entries from the queue and all pending entries.
     */
    clearAll(): void;
    /**
     * Clears all pending entries.
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
     * Checks if the queue is empty.
     * @returns True if the queue is empty, false otherwise.
     */
    isEmpty(): boolean;
    /**
     * Checks if an entry is pending.
     * @param entry - The entry to check.
     * @returns True if the entry is pending, false otherwise.
     */
    isPending(entry: T): boolean;
    /**
     * Checks if there are no pending entries.
     * @returns True if there are no pending entries, false otherwise.
     */
    isPendingEmpty(): boolean;
    /**
     * Gets the number of pending entries.
     * @returns The number of entries that are pending to be added to the queue.
     */
    pendingSize(): number;
    /**
     * Gets the size of the queue.
     * @returns The number of entries in the queue.
     */
    size(): number;
}
