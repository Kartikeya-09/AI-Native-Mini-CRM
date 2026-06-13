import express from 'express';
import { ingestShoppers } from '../services/ingestion.js';
import { withAuth } from '../auth.js';
import Shopper from '../models/Shopper.js';
import mongoose from 'mongoose';

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
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip  = (page - 1) * limit;

    const matchStage = { marketerId: new mongoose.Types.ObjectId(req.marketerId) };

    // Optional search filter
    if (req.query.q) {
      const searchRegex = new RegExp(req.query.q, 'i');
      matchStage.$or = [
        { firstName: searchRegex },
        { lastName:  searchRegex },
        { email:     searchRegex }
      ];
    }

    const [result] = await Shopper.aggregate([
      { $match: matchStage },
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          // Get paginated shoppers with order summary
          data: [
            { $skip: skip },
            { $limit: limit },
            {
              $lookup: {
                from: 'orders',
                localField: '_id',
                foreignField: 'shopperId',
                as: 'orders'
              }
            },
            {
              $addFields: {
                orderCount: { $size: '$orders' },
                totalSpent: {
                  $reduce: {
                    input: '$orders',
                    initialValue: 0,
                    in: { $add: ['$$value', '$$this.totalAmount'] }
                  }
                }
              }
            },
            { $unset: 'orders' } // remove full orders array, keep only summary
          ],
          // Get total count
          total: [{ $count: 'count' }]
        }
      }
    ]);

    const total = result.total[0]?.count || 0;

    res.json({
      data: result.data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) }
    });
  } catch (error) {
    console.error('Shoppers route error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;