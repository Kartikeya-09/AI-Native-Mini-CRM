const MAX_ENTRIES = 1000;

class Logger {
  constructor() {
    this.buffer = [];
    this.stats = {
      totalSendRequests: 0,
      totalCallbacksAttempted: 0,
      totalCallbacksPermanentlyFailed: 0,
    };
  }

  logSend(trackingId, details) {
    this.stats.totalSendRequests++;
    this._addEntry({ type: 'SEND', trackingId, timestamp: new Date(), ...details });
  }

  logCallbackAttempt(trackingId, attemptNumber, status, url) {
    this.stats.totalCallbacksAttempted++;
    this._addEntry({ type: 'CALLBACK_ATTEMPT', trackingId, attemptNumber, status, url, timestamp: new Date() });
  }

  logCallbackPermanentFailure(trackingId, status, url) {
    this.stats.totalCallbacksPermanentlyFailed++;
    this._addEntry({ type: 'CALLBACK_FAILED', trackingId, status, url, timestamp: new Date() });
  }

  getRecentRequests() {
    return this.buffer.slice().reverse();
  }

  getStats() {
    return {
      ...this.stats,
      recentRequests: this.getRecentRequests()
    };
  }

  _addEntry(entry) {
    if (this.buffer.length >= MAX_ENTRIES) {
      this.buffer.shift(); // Remove oldest
    }
    this.buffer.push(entry);
  }
}

export const logger = new Logger();
