import express from 'express';
import { ingestOrders } from '../services/ingestion.js';
import { withAuth } from '../auth.js';

const router = express.Router();

router.post('/batch', withAuth, async (req, res) => {
  try {
    const records = req.body.records;
    if (!Array.isArray(records)) {
      return res.status(400).json({ error: 'Body must contain a records array' });
    }
    const summary = await ingestOrders(records, req.marketerId);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
