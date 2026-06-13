import Message from '../models/Message.js';
import { generalQueue } from '../lib/queue.js';
import { incrementStat } from './statsAggregator.js';
import { checkAttributionsForReceipt } from './attributionEngine.js';

const STATUS_ORDER = {
  queued: 0,
  sent: 1,
  delivered: 2,
  opened: 3,
  read: 4,
  clicked: 5,
  failed: 1.5,
};

/**
 * Process an incoming delivery receipt from the channel service.
 */
export async function processReceipt(receipt) {
  const { messageId, trackingId, status, timestamp } = receipt;
  const receiptTime = new Date(timestamp);
  const newOrder = STATUS_ORDER[status];

  if (newOrder === undefined) {
    const err = new Error('Invalid status');
    err.status = 400;
    throw err;
  }

  // Ensure forward-only status progression and handle concurrent deterministic updates
  const updated = await Message.findOneAndUpdate(
    {
      _id: messageId,
      statusOrder: { $lt: newOrder },
      // Optional extra safety: ensure we aren't processing an older timestamp 
      // over a newer one (though statusOrder usually handles this)
      $or: [
        { statusUpdatedAt: { $lt: receiptTime } },
        { statusUpdatedAt: null },
        { statusUpdatedAt: { $exists: false } }
      ]
    },
    {
      $set: {
        status,
        statusOrder: newOrder,
        statusUpdatedAt: receiptTime,
        channelTrackingId: trackingId,
      },
    },
    { new: true } // Returns the updated document
  );

  if (updated === null) {
    // Check if the message even exists
    const msgExists = await Message.exists({ _id: messageId });
    if (!msgExists) {
      const err = new Error('Message not found');
      err.status = 404;
      throw err;
    }
    
    // Valid concurrent ignore — either already at a higher state, or a stale webhook
    const err = new Error('Invalid status transition');
    err.status = 409;
    throw err;
  }

  // 1. Enqueue stats aggregation
  generalQueue.add(async () => {
    try {
      await incrementStat(updated.campaignId, status);
    } catch (e) {
      console.error('Failed to increment stats:', e.message);
    }
  });

  // 2. Enqueue attribution check for delivered/opened/read/clicked
  if (['delivered', 'opened', 'read', 'clicked'].includes(status)) {
    generalQueue.add(async () => {
      try {
        await checkAttributionsForReceipt({ 
          shopperId: updated.shopperId,
          timestamp: receiptTime
        });
      } catch (e) {
        console.error('Failed to trigger attribution:', e.message);
      }
    });
  }

  return updated;
}
