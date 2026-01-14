# Unique, Timed-Entry Queue for Node

**A queue with delayed enqueue of unique entries, perfect for queuing update notifications.**

For use in scenarios where, for example, a user can trigger a notification
after updating a record, but may perform several updates close together,
and in the end only one notification should be sent.

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
Adds an entry to the queue **after the specified delay**.
The enqueue delay can optionally be overridden for the specific entry.
If the entry is still waiting to be added to the queue,
the delay will be reset.

`dequeue()`<br />
Dequeues an entry from the queue.

### Size Checks

`size()`<br />
Returns the size of the queue.

`pendingSize()`<br />
Returns the number of entries waiting to be added to the queue.

`isEmpty()`<br />
Returns `true` if the queue is empty.

`isPendingEmpty()`<br />
Returns `true` if there are no pending entries.

### Pending Checks

`isPending(entry)`<br />
Returns `true` if the entry is waiting to be added to the queue.

### Clear Functions

`clear()`<br />
Clears all queue entries.

`clearPending()`<br />
Clears all pending queue entries.

`clearPendingEntry(entry)`<br />
Clears a specific pending entry.

`clearAll()`<br />
Clears all queue entries, and all pending entries.
