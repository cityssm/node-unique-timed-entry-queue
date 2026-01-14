import Debug from 'debug';
import exitHook from 'exit-hook';
import { DEBUG_NAMESPACE } from './debug.config.js';
import { valueToString } from './utilities.js';
const debug = Debug(`${DEBUG_NAMESPACE}:index`);
/**
 * A queue that enqueues unique entries after a specified delay.
 */
export default class UniqueTimedEntryQueue {
    delayMilliseconds;
    pendingEntries;
    queue;
    /**
     * Creates a new UniqueTimedEntryQueue.
     * @param delayMilliseconds - The delay in milliseconds before an entry is added to the queue. Default is 60000 (1 minute).
     */
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    constructor(delayMilliseconds = 60_000) {
        this.delayMilliseconds = delayMilliseconds;
        this.pendingEntries = new Map();
        this.queue = [];
        exitHook(() => {
            debug('Process exiting, clearing pending entries.');
            this.clearPending();
        });
    }
    /**
     * Clears all entries from the queue.
     */
    clear() {
        this.queue.length = 0;
    }
    /**
     * Clears all entries from the queue and all pending entries.
     */
    clearAll() {
        this.clearPending();
        this.clear();
    }
    /**
     * Clears all pending entries.
     */
    clearPending() {
        for (const timeout of this.pendingEntries.values()) {
            clearTimeout(timeout);
        }
        this.pendingEntries.clear();
    }
    /**
     * Clears a specific pending entry.
     * @param entry - The entry to clear from pending.
     * @returns True if the entry was found and cleared, false otherwise.
     */
    clearPendingEntry(entry) {
        const stringEntry = valueToString(entry);
        if (this.pendingEntries.has(stringEntry)) {
            debug(`Clearing pending entry: ${stringEntry}`);
            clearTimeout(this.pendingEntries.get(stringEntry));
            this.pendingEntries.delete(stringEntry);
            return true;
        }
        return false;
    }
    /**
     * Dequeues an entry from the front of the queue.
     * @returns The dequeued entry, or undefined if the queue is empty.
     */
    dequeue() {
        return this.queue.shift();
    }
    /**
     * Enqueues an entry after the specified delay. If the entry is already pending, the delay is reset.
     * @param entry - The entry to enqueue.
     * @param entryDelayMilliseconds - Optional delay in milliseconds for this specific entry. If not provided, the default delay is used.
     */
    enqueue(entry, entryDelayMilliseconds) {
        const stringEntry = valueToString(entry);
        if (this.pendingEntries.has(stringEntry)) {
            clearTimeout(this.pendingEntries.get(stringEntry));
        }
        const timeout = setTimeout(() => {
            this.queue.push(entry);
            debug(`Enqueued entry: ${stringEntry}`);
            this.pendingEntries.delete(stringEntry);
        }, entryDelayMilliseconds ?? this.delayMilliseconds);
        this.pendingEntries.set(stringEntry, timeout);
    }
    /**
     * Checks if the queue is empty.
     * @returns True if the queue is empty, false otherwise.
     */
    isEmpty() {
        return this.queue.length === 0;
    }
    /**
     * Checks if an entry is pending.
     * @param entry - The entry to check.
     * @returns True if the entry is pending, false otherwise.
     */
    isPending(entry) {
        const stringEntry = valueToString(entry);
        return this.pendingEntries.has(stringEntry);
    }
    /**
     * Checks if there are no pending entries.
     * @returns True if there are no pending entries, false otherwise.
     */
    isPendingEmpty() {
        return this.pendingEntries.size === 0;
    }
    /**
     * Gets the number of pending entries.
     * @returns The number of entries that are pending to be added to the queue.
     */
    pendingSize() {
        return this.pendingEntries.size;
    }
    /**
     * Gets the size of the queue.
     * @returns The number of entries in the queue.
     */
    size() {
        return this.queue.length;
    }
}
