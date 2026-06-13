import express from 'express';
import mongoose from 'mongoose';
import { withAuth } from '../auth.js';
import Campaign from '../models/Campaign.js';
import CampaignStats from '../models/CampaignStats.js';
import { seedData } from '../services/seedData.js';
import { launchCampaign } from '../services/campaignOrchestrator.js';

const router = express.Router();

// Track which marketers have been seeded (in-memory, resets on restart)
const seededMarketers = new Set();

/**
 * Lazy seed trigger — seeds demo data on first authenticated request
 */
async function lazySeed(marketerId) {
  if (seededMarketers.has(marketerId)) return;
  seededMarketers.add(marketerId);
  try {
    await seedData(marketerId);
  } catch (error) {
    console.error('Seed data error:', error.message);
    // Non-blocking — don't fail the request
  }
}

// POST /api/campaigns — create a new campaign (draft)
router.post('/', withAuth, async (req, res) => {
  try {
    const { name, segmentId, channel, messageTemplate } = req.body;

    if (!name || !segmentId || !channel || !messageTemplate) {
      return res.status(400).json({
        error: 'name, segmentId, channel, and messageTemplate are required',
      });
    }

    if (!['sms', 'email', 'push'].includes(channel)) {
      return res.status(400).json({ error: 'channel must be sms, email, or push' });
    }

    const campaign = await Campaign.create({
      marketerId: new mongoose.Types.ObjectId(req.marketerId),
      segmentId: new mongoose.Types.ObjectId(segmentId),
      name,
      channel,
      messageTemplate,
      status: 'draft',
    });

    res.status(201).json(campaign);
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/campaigns — list campaigns for marketer with stats joined
router.get('/', withAuth, async (req, res) => {
  try {
    // Trigger lazy seed
    await lazySeed(req.marketerId);

    const campaigns = await Campaign.aggregate([
      {
        $match: {
          marketerId: new mongoose.Types.ObjectId(req.marketerId),
        },
      },
      {
        $lookup: {
          from: 'campaignstats',
          localField: '_id',
          foreignField: 'campaignId',
          as: 'stats',
        },
      },
      {
        $addFields: {
          stats: { $arrayElemAt: ['$stats', 0] },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    res.json(campaigns);
  } catch (error) {
    console.error('Error listing campaigns:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/campaigns/:id — single campaign with stats
router.get('/:id', withAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid campaign ID' });
    }

    const results = await Campaign.aggregate([
      {
        $match: {
          _id: new mongoose.Types.ObjectId(id),
          marketerId: new mongoose.Types.ObjectId(req.marketerId),
        },
      },
      {
        $lookup: {
          from: 'campaignstats',
          localField: '_id',
          foreignField: 'campaignId',
          as: 'stats',
        },
      },
      {
        $addFields: {
          stats: { $arrayElemAt: ['$stats', 0] },
        },
      },
    ]);

    if (results.length === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json(results[0]);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/campaigns/:id/launch — launch a campaign
router.post('/:id/launch', withAuth, async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid campaign ID' });
    }

    const result = await launchCampaign(id, req.marketerId);
    res.json(result);
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    console.error('Error launching campaign:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
