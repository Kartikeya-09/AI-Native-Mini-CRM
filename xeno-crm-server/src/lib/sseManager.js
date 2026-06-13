class SSEManager {
  constructor() {
    // Map of marketerId (string) to Set of Express Response objects
    this.clients = new Map();

    // Send heartbeat every 30 seconds to keep connections alive
    setInterval(() => {
      this.clients.forEach((clientSet) => {
        clientSet.forEach(res => {
          res.write(':\n\n'); // SSE comment as heartbeat
        });
      });
    }, 30000);
  }

  register(marketerId, res) {
    const idStr = marketerId.toString();

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    res.write('retry: 10000\n\n'); // Optional: tell client to retry after 10s if disconnected

    if (!this.clients.has(idStr)) {
      this.clients.set(idStr, new Set());
    }
    this.clients.get(idStr).add(res);

    // Remove client on connection close
    res.on('close', () => {
      const clientSet = this.clients.get(idStr);
      if (clientSet) {
        clientSet.delete(res);
        if (clientSet.size === 0) {
          this.clients.delete(idStr);
        }
      }
    });
  }

  broadcast(marketerId, data) {
    const idStr = marketerId.toString();
    const clientSet = this.clients.get(idStr);
    
    if (clientSet) {
      const payload = `event: stats-update\ndata: ${JSON.stringify(data)}\n\n`;
      clientSet.forEach(res => {
        res.write(payload);
      });
    }
  }
}

export const sseManager = new SSEManager();
