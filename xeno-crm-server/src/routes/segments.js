import express from 'express';
import { withAuth } from '../auth.js';
import Segment from '../models/Segment.js';
import { evaluateSegment } from '../services/segmentation.js';

const router = express.Router();

router.post('/', withAuth, async (req, res) => {
  try {
    const { name, filterCriteria } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    if (!filterCriteria) {
      return res.status(400).json({ error: 'Filter criteria is required' });
    }

    // ← ADD THIS: evaluate segment count before saving
    console.log('Evaluating segment for marketerId:', req.marketerId);
    const { matchingCount } = await evaluateSegment(filterCriteria, req.marketerId);
    console.log('Matching count:', matchingCount);

    const segment = new Segment({
      marketerId: req.marketerId,
      name,
      filterCriteria,
      shopperCountAtSave: matchingCount  // ← was hardcoded 0, now dynamic
    });

    const savedSegment = await segment.save();
    res.status(201).json(savedSegment);
  } catch (error) {
    console.error('Segment save error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/', withAuth, async (req, res) => {
  try {
    const segments = await Segment.find({ marketerId: req.marketerId })
      .sort({ createdAt: -1 });

    res.json(segments);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/evaluate', withAuth, async (req, res) => {
  try {
    const { filterCriteria } = req.body;

    if (!filterCriteria) {
      return res.status(400).json({ error: 'Filter criteria is required' });
    }
    console.log('Evaluating segment for marketerId:', req.marketerId);
    console.log('Filter criteria:', JSON.stringify(filterCriteria, null, 2));
    const result = await evaluateSegment(filterCriteria, req.marketerId);
    console.log('Result:', result);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
