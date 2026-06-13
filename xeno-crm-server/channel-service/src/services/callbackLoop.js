import { callbackWithRetry } from './retryQueue.js';

// Probabilities for the mock delivery funnel
const PROB_DELIVERED = parseFloat(process.env.PROB_DELIVERED || '0.85');
const PROB_OPENED = parseFloat(process.env.PROB_OPENED || '0.5');
const PROB_READ = parseFloat(process.env.PROB_READ || '0.7');
const PROB_CLICKED = parseFloat(process.env.PROB_CLICKED || '0.3');

/**
 * Schedule asynchronous callback webhooks simulating an external messaging provider.
 */
export function scheduleCallbacks(messageId, trackingId, channel) {
  // Start the background loop immediately without blocking the caller
  (async () => {
    // 1. Wait a random delay between 1s and 30s before sending first status
    const initialDelay = 1000 + Math.random() * 29000;
    await sleep(initialDelay);

    // Initial status: always 'sent' (since we successfully enqueued it)
    await sendReceipt(messageId, trackingId, 'sent');

    // Roll for next state (delivered vs failed)
    await sleep(1000 + Math.random() * 5000);
    const deliveredRoll = Math.random();
    if (deliveredRoll > PROB_DELIVERED) {
      // It failed
      await sendReceipt(messageId, trackingId, 'failed');
      return; // End of life
    }

    // It was delivered
    await sendReceipt(messageId, trackingId, 'delivered');

    // Only email/push can realistically track opens. SMS doesn't easily, but let's allow it per spec.
    await sleep(1000 + Math.random() * 15000);
    const openedRoll = Math.random();
    if (openedRoll > PROB_OPENED) {
      return; // Stops at delivered
    }
    await sendReceipt(messageId, trackingId, 'opened');

    await sleep(500 + Math.random() * 5000);
    const readRoll = Math.random();
    if (readRoll > PROB_READ) {
      return; // Stops at opened
    }
    await sendReceipt(messageId, trackingId, 'read');

    await sleep(1000 + Math.random() * 10000);
    const clickedRoll = Math.random();
    if (clickedRoll <= PROB_CLICKED) {
      await sendReceipt(messageId, trackingId, 'clicked');
    }
  })();
}

async function sendReceipt(messageId, trackingId, status) {
  const url = process.env.REACH_RECEIPT_URL;
  if (!url) {
    console.warn('Missing REACH_RECEIPT_URL environment variable');
    return;
  }

  const payload = {
    messageId,
    trackingId,
    status,
    timestamp: new Date().toISOString()
  };

  const headers = {
    'Authorization': `Bearer ${process.env.CHANNEL_SERVICE_TOKEN}`
  };

  // Uses the retry queue logic (Task 11.3)
  await callbackWithRetry(url, payload, headers, trackingId, status);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
