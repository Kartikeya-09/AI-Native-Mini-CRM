import express from 'express';
import { withAuth } from '../auth.js';
import { getCampaignStats, getSegmentStats, compareStats } from '../services/statsAggregator.js';
import { sseManager } from '../lib/sseManager.js';
import Campaign from '../models/Campaign.js';
import Segment from '../models/Segment.js';

const router = express.Router();

router.get('/live', withAuth, (req, res) => {
  // Subscribe to live Server-Sent Events updates
  sseManager.register(req.marketerId, res);
});

router.get('/campaigns/:id', withAuth, async (req, res) => {
  try {
    // Ensure campaign belongs to marketer
    const campaign = await Campaign.findOne({ _id: req.params.id, marketerId: req.marketerId });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const stats = await getCampaignStats(req.params.id);
    res.json(stats || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/segments/:id', withAuth, async (req, res) => {
  try {
    // Ensure segment belongs to marketer
    const segment = await Segment.findOne({ _id: req.params.id, marketerId: req.marketerId });
    if (!segment) return res.status(404).json({ error: 'Segment not found' });

    const stats = await getSegmentStats(req.params.id);
    res.json(stats || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/compare', withAuth, async (req, res) => {
  try {
    const { a, b } = req.query;
    if (!a || !b) return res.status(400).json({ error: 'Missing campaign IDs a and b' });

    // Validate both belong to marketer
    const campaigns = await Campaign.find({ _id: { $in: [a, b] }, marketerId: req.marketerId });
    if (campaigns.length !== 2 && a !== b) {
      return res.status(404).json({ error: 'One or both campaigns not found' });
    }

    const comparison = await compareStats(a, b);
    res.json(comparison);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
