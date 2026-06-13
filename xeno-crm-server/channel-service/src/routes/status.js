import express from 'express';
import { logger } from '../lib/logger.js';

export const statusRouter = express.Router();

statusRouter.get('/', (req, res) => {
  // Validate API Key
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  if (token !== process.env.CS_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Return full stats
  res.json(logger.getStats());
});
