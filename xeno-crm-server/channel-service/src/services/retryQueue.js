import { logger } from '../lib/logger.js';

/**
 * Attempts to send a callback payload to a URL with exponential backoff.
 * Attempts 1–5: on non-2xx or network errors, wait Math.pow(2, attempt-1) * 1000 * jitter, then retry.
 * After 5 failures, increments permanentlyFailed counter and resolves without throwing.
 */
export async function callbackWithRetry(url, payload, headers, trackingId, statusPayload) {
  const maxAttempts = 5;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      logger.logCallbackAttempt(trackingId, attempt, statusPayload, url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        return; // Success, we can exit
      }
      
      // If we got here, it's a non-2xx status code. We will fall through to retry.
    } catch (err) {
      // Network error, fall through to retry
    }

    if (attempt === maxAttempts) {
      // Out of attempts
      logger.logCallbackPermanentFailure(trackingId, statusPayload, url);
      return;
    }

    // Wait and retry
    const jitter = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
    const delayMs = Math.pow(2, attempt - 1) * 1000 * jitter;
    
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
}
