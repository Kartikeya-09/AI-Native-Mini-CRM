import express from 'express';
import { withAuth } from '../auth.js';
import CampaignStats from '../models/CampaignStats.js';
import {
  segmentIntent,
  campaignIntent,
  revisePlan,
  personalise,
  performanceSummary,
  compareCampaigns,
} from '../services/aiAgent.js';

const router = express.Router();

// POST /segment-intent — convert natural language to FilterCriteria
router.post('/segment-intent', withAuth, async (req, res) => {
  try {
    const { prompt, history } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'prompt is required' });
    }

    const result = await segmentIntent(prompt, history);
    res.json(result);
  } catch (error) {
    console.error('segment-intent error:', error);
    res.status(500).json({ error: 'Failed to process segment intent' });
  }
});

// POST /campaign-intent — convert natural language to campaign plan
router.post('/campaign-intent', withAuth, async (req, res) => {
  try {
    const { prompt, history } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'prompt is required' });
    }

    const result = await campaignIntent(prompt, history);
    res.json(result);
  } catch (error) {
    console.error('campaign-intent error:', error);
    res.status(500).json({ error: 'Failed to process campaign intent' });
  }
});

// POST /revise-plan — revise an existing campaign plan with feedback
router.post('/revise-plan', withAuth, async (req, res) => {
  try {
    const { plan, feedback, history } = req.body;

    if (!plan || !feedback) {
      return res.status(400).json({ error: 'plan and feedback are required' });
    }

    const result = await revisePlan(plan, feedback, history);
    res.json(result);
  } catch (error) {
    console.error('revise-plan error:', error);
    res.status(500).json({ error: 'Failed to revise plan' });
  }
});

// POST /personalise — replace template placeholders for each shopper
router.post('/personalise', withAuth, async (req, res) => {
  try {
    const { template, shoppers } = req.body;

    if (!template || !Array.isArray(shoppers)) {
      return res.status(400).json({ error: 'template and shoppers array are required' });
    }

    const messages = personalise(template, shoppers);
    res.json({ messages });
  } catch (error) {
    console.error('personalise error:', error);
    res.status(500).json({ error: 'Failed to personalise messages' });
  }
});

// GET /summary/:campaignId — generate performance summary for a campaign
router.get('/summary/:campaignId', withAuth, async (req, res) => {
  try {
    const { campaignId } = req.params;

    const stats = await CampaignStats.findOne({ campaignId });
    if (!stats) {
      return res.status(404).json({ error: 'Campaign stats not found' });
    }

    const summary = await performanceSummary(stats.toObject());
    res.json({ summary });
  } catch (error) {
    console.error('summary error:', error);
    res.status(500).json({ error: 'Failed to generate performance summary' });
  }
});

// POST /compare — compare performance of two campaigns
router.post('/compare', withAuth, async (req, res) => {
  try {
    const { campaignIdA, campaignIdB } = req.body;

    if (!campaignIdA || !campaignIdB) {
      return res.status(400).json({ error: 'campaignIdA and campaignIdB are required' });
    }

    const [statsA, statsB] = await Promise.all([
      CampaignStats.findOne({ campaignId: campaignIdA }),
      CampaignStats.findOne({ campaignId: campaignIdB }),
    ]);

    if (!statsA || !statsB) {
      return res.status(404).json({ error: 'Campaign stats not found for one or both campaigns' });
    }

    const comparison = await compareCampaigns(statsA.toObject(), statsB.toObject());
    res.json({ comparison });
  } catch (error) {
    console.error('compare error:', error);
    res.status(500).json({ error: 'Failed to compare campaigns' });
  }
});

export default router;
