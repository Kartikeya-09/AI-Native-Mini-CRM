import express from 'express';
import { processReceipt } from '../services/receiptProcessor.js';
import { config } from '../config.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    // Validate API Key from the channel service
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    if (token !== config.CHANNEL_SERVICE_TOKEN) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const receipt = req.body;
    if (!receipt || !receipt.messageId || !receipt.status || !receipt.timestamp) {
      return res.status(400).json({ error: 'Missing required receipt fields' });
    }

    await processReceipt(receipt);
    res.status(200).json({ message: 'Receipt processed' });
    
  } catch (error) {
    if (error.status === 404) {
      return res.status(404).json({ error: error.message });
    }
    if (error.status === 409) {
      return res.status(409).json({ error: error.message });
    }
    console.error('Receipt processor error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
