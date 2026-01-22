// eslint-disable-next-line @eslint-community/eslint-comments/disable-enable-pair
/* eslint-disable @typescript-eslint/no-magic-numbers */
import assert from 'node:assert';
import { afterEach, describe, it } from 'node:test';
import Debug from 'debug';
import { DEBUG_ENABLE_NAMESPACES } from '../debug.config.js';
import UniqueTimedEntryQueue from '../index.js';
import { wait } from './utilities.js';
Debug.enable(DEBUG_ENABLE_NAMESPACES);
await describe('Unique Timed Entry Queue - Event Listeners', async () => {
    let queue;
    afterEach(() => {
        queue?.clearAll();
    });
    await it('dispatches "enqueue" event', async () => {
        queue = new UniqueTimedEntryQueue(100);
        let eventDispatched = false;
        queue.addEventListener('enqueue', (entry) => {
            eventDispatched = true;
            assert.strictEqual(entry, 'test-entry', 'Dispatched entry should match');
        });
        queue.enqueue('test-entry');
        await wait(150);
        assert.strictEqual(eventDispatched, true, '"enqueue" event should have been dispatched');
    });
    await it('adds and removes event listeners', () => {
        queue = new UniqueTimedEntryQueue();
        let eventDispatched = false;
        const listenerId = queue.addEventListener('enqueue', (entry) => {
            eventDispatched = true;
        });
        queue.enqueue('test-entry', 0);
        assert.strictEqual(eventDispatched, true, '"enqueue" event should have been dispatched');
        // Remove the listener
        eventDispatched = false;
        queue.removeEventListener('enqueue', listenerId);
        queue.enqueue('another-entry', 0);
        assert.strictEqual(eventDispatched, false, '"enqueue" event should not have been dispatched after listener removal');
    });
});
