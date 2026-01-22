# Unique, Timed-Entry Queue for Node

[![DeepSource](https://app.deepsource.com/gh/cityssm/node-unique-timed-entry-queue.svg/?label=active+issues&show_trend=true&token=7XhMG59eghaYWmwSFMmUt71O)](https://app.deepsource.com/gh/cityssm/node-unique-timed-entry-queue/)
[![codecov](https://codecov.io/gh/cityssm/node-unique-timed-entry-queue/graph/badge.svg?token=OFRV0QFN69)](https://codecov.io/gh/cityssm/node-unique-timed-entry-queue)

**A queue with delayed enqueue of unique entries, perfect for queuing update notifications.**

For use in scenarios where, for example, a user can trigger a notification
after updating a record, but may perform several updates close together,
and in the end only one notification should be sent.

💡 **For best results, use numbers or strings for queue entries**
as uniqueness is easier to determine.

## Installation

```bash
npm install @cityssm/unique-timed-entry-queue
```

## Usage

```javascript
import UniqueTimedEntryQueue from '@cityssm/unique-timed-entry-queue'

// Initialize a queue that adds entries after a 5 minute delay.
const queue = new UniqueTimedEntryQueue(5 * 60_000)

// Add a work order number to the queue.
queue.enqueue('WO.26.00001')

// Check the queue immediately. It's empty.
console.log(queue.size())
// => 0

// Wait 5 minutes, plus a second.
await wait(5 * 60_000 + 1000)

// Check the queue. The work order is now there.
console.log(queue.size())
// => 1
```

Supports all of the standard queue functions for using the queue,
along with additional functions for managing the pending entries.

### Basic Functions

`enqueue(entry, [entryDelayMilliseconds])`<br />
`enqueueAll(entries, [entryDelayMilliseconds])`<br />
Adds an entry (or entries) to the queue **after the specified delay**.
The enqueue delay can optionally be overridden for the specific entry.
If the entry is still waiting to be added to the queue, the delay will be reset.
If the entry exists in the queue, it is discarded.

`enqueuePending()`<br />
Immediately add all pending entries to the queue.

`dequeue()`<br />
Dequeues an entry from the queue.

### Queue Checks

`size()`<br />
Returns the size of the queue, not including any pending entries.

`pendingSize()`<br />
Returns the number of pending entries waiting to be added to the queue.

`isEmpty()`<br />
Returns `true` if the queue is empty.

`hasPending()`<br />
Returns `true` if there are pending entries.

`hasPendingEntry(entry)`<br />
Returns `true` if the entry is waiting to be added to the queue.

### Clear Functions

`clear()`<br />
Clears all queue entries.
Returns the number of cleared entries.

`clearPending()`<br />
Clears all pending queue entries.
Returns the number of cleared pending entries.

`clearPendingEntry(entry)`<br />
Clears a specific pending entry.
Returns `true` if the pending entry was found and cleared.

`clearAll()`<br />
Clears all queue entries, and all pending entries.
Returns the total number of cleared entries.

### Event Listeners

Right now, only one event is available.

`addEventListener('enqueue', (entry) => {})`<br />
Adds an event listener that is called when the entry moves to the queue from pending.
Returns an event listener id that can be used to remove the event listener.

`removeEventListener('enqueue', eventListenerId)`<br />
Removes an event listener.

### Export Functions

`toArray()`<br />
Exports all queue entries to an array.

`pendingToArray()`<br />
Exports all pending entries to an array.

## Note Regarding Shutdown

This queue uses timeouts for moving pending entries to the queue.
These timeouts are cancelled automatically when the application quits,
however they may need to be cancelled manually if the queue is no longer needed.

To ensure all timeouts are cancelled and that garbage collection can run,
include `clearPending()` or `clearAll()` in your cleanup process.

## Related Projects

[**ShiftLog**](https://github.com/cityssm/shiftlog/)<br />
A work management system with work order recording, shift activity logging,
and timesheet tracking. Uses a `UniqueTimedEntryQueue` to dispatch notifications
when work orders have been updated.
