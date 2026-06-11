import express from 'express';
import { ingestShoppers } from '../services/ingestion.js';
import { withAuth } from '../auth.js';
import Shopper from '../models/Shopper.js';

const router = express.Router();

router.post('/batch', withAuth, async (req, res) => {
  try {
    const records = req.body.records;
    if (!Array.isArray(records)) {
      return res.status(400).json({ error: 'Body must contain a records array' });
    }
    const summary = await ingestShoppers(records, req.marketerId);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', withAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const query = { marketerId: req.marketerId };
    
    // Optional basic search filter
    if (req.query.q) {
      const searchRegex = new RegExp(req.query.q, 'i');
      query.$or = [
        { firstName: searchRegex },
        { lastName: searchRegex },
        { email: searchRegex }
      ];
    }

    const shoppers = await Shopper.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Shopper.countDocuments(query);

    res.json({
      data: shoppers,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
