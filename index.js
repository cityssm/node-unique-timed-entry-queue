import Debug from 'debug';
import exitHook from 'exit-hook';
import { DEBUG_NAMESPACE } from './debug.config.js';
import { generateUniqueListenerId, valueToString } from './utilities.js';
const debug = Debug(`${DEBUG_NAMESPACE}:index`);
export const eventTypes = ['enqueue'];
/**
 * A queue that enqueues unique entries after a specified delay.
 */
export default class UniqueTimedEntryQueue {
    enqueueDelayMilliseconds;
    eventListeners;
    pendingEntries;
    queue;
    /**
     * Creates a new UniqueTimedEntryQueue.
     * @param enqueueDelayMilliseconds - The delay in milliseconds before an entry is added to the queue. Default is 60000 (1 minute).
     */
    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    constructor(enqueueDelayMilliseconds = 60_000) {
        this.enqueueDelayMilliseconds = Math.max(0, enqueueDelayMilliseconds);
        if (enqueueDelayMilliseconds === 0) {
            debug('Warning: enqueueDelayMilliseconds is set to 0, entries will be added immediately and uniqueness will not be enforced.');
        }
        this.eventListeners = {
            enqueue: {}
        };
        this.pendingEntries = new Map();
        this.queue = [];
        exitHook(() => {
            debug('Process exiting, clearing pending entry timeouts.');
            this.clearPending();
        });
    }
    /**
     * Adds an event listener for the specified event type.
     * @param eventType - The event type to listen for.
     * @param listener - The listener function to call when the event occurs.
     * @returns A unique ID for the listener.
     */
    addEventListener(eventType, listener) {
        const listenerId = generateUniqueListenerId();
        // eslint-disable-next-line security/detect-object-injection
        this.eventListeners[eventType][listenerId] = listener;
        return listenerId;
    }
    /**
     * Clears all entries from the queue.
     */
    clear() {
        this.queue.length = 0;
    }
    /**
     * Clears all entries from the queue and all pending entries.
     * This is the same as calling both `clearPending` and `clear`.
     */
    clearAll() {
        this.clearPending();
        this.clear();
    }
    /**
     * Clears all pending entries.
     * This does not affect entries already in the queue.
     * This is useful for stopping all pending enqueues, and should be called before destroying the queue.
     */
    clearPending() {
        for (const timeout of this.pendingEntries.values()) {
            clearTimeout(timeout.timeout);
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
            debug(`Clearing pending entry timeout: ${stringEntry}`);
            clearTimeout(this.pendingEntries.get(stringEntry)?.timeout);
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
        this.clearPendingEntry(entry);
        const delay = entryDelayMilliseconds ?? this.enqueueDelayMilliseconds;
        if (delay <= 0) {
            this.queue.push(entry);
            this.triggerEvents('enqueue', entry);
            debug(`Enqueued entry immediately (zero delay): ${valueToString(entry)}`);
            return;
        }
        const stringEntry = valueToString(entry);
        const timeout = setTimeout(() => {
            this.pendingEntries.delete(stringEntry);
            this.queue.push(entry);
            this.triggerEvents('enqueue', entry);
            debug(`Enqueued entry: ${stringEntry}`);
        }, delay);
        this.pendingEntries.set(stringEntry, { timeout, value: entry });
    }
    /**
     * Enqueues a list of entries after the specified delay. If an entry is already pending, the delay is reset.
     * @param entries - The entries to enqueue.
     * @param entryDelayMilliseconds - Optional delay in milliseconds for these specific entries. If not provided, the default delay is used.
     */
    enqueueAll(entries, entryDelayMilliseconds) {
        for (const entry of entries) {
            this.enqueue(entry, entryDelayMilliseconds);
        }
    }
    /**
     * Gets the enqueue delay in milliseconds.
     * @returns The enqueue delay in milliseconds.
     */
    enqueueDelay() {
        return this.enqueueDelayMilliseconds;
    }
    /**
     * Enqueues all pending entries immediately, bypassing the delay.
     */
    enqueuePending() {
        for (const stringValue of this.pendingEntries.keys()) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-type-assertion
            const pendingEntry = this.pendingEntries.get(stringValue);
            this.pendingEntries.delete(stringValue);
            clearTimeout(pendingEntry.timeout);
            this.queue.push(pendingEntry.value);
            this.triggerEvents('enqueue', pendingEntry.value);
            debug(`Enqueued pending entry immediately: ${stringValue}`);
        }
    }
    /**
     * Checks if there are pending entries.
     * @returns True if there are pending entries, false otherwise.
     */
    hasPending() {
        return this.pendingEntries.size > 0;
    }
    /**
     * Checks if an entry is pending.
     * @param entry - The entry to check.
     * @returns True if the entry is pending, false otherwise.
     */
    hasPendingEntry(entry) {
        const stringEntry = valueToString(entry);
        return this.pendingEntries.has(stringEntry);
    }
    /**
     * Checks if the queue is empty.
     * @returns True if the queue is empty, false otherwise.
     */
    isEmpty() {
        return this.queue.length === 0;
    }
    /**
     * Gets the number of pending entries.
     * @returns The number of entries that are pending to be added to the queue.
     */
    pendingSize() {
        return this.pendingEntries.size;
    }
    /**
     * Converts the pending entries to an array.
     * @returns An array containing the pending entries.
     */
    pendingToArray() {
        const pendingValues = [];
        for (const pendingEntry of this.pendingEntries.values()) {
            pendingValues.push(pendingEntry.value);
        }
        return pendingValues;
    }
    /**
     * Removes an event listener.
     * @param eventType - The event type.
     * @param listenerId - The unique ID of the listener to remove.
     */
    removeEventListener(eventType, listenerId) {
        // eslint-disable-next-line security/detect-object-injection
        const listeners = this.eventListeners[eventType];
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        if (listeners !== undefined && Object.hasOwn(listeners, listenerId)) {
            // eslint-disable-next-line security/detect-object-injection, @typescript-eslint/no-dynamic-delete
            delete listeners[listenerId];
        }
    }
    /**
     * Gets the size of the queue.
     * @returns The number of entries in the queue.
     */
    size() {
        return this.queue.length;
    }
    /**
     * Converts the queue to an array.
     * @returns An array containing the entries in the queue.
     */
    toArray() {
        return [...this.queue];
    }
    triggerEvents(eventType, entry) {
        // eslint-disable-next-line security/detect-object-injection
        for (const listener of Object.values(this.eventListeners[eventType])) {
            listener(entry);
        }
    }
}
