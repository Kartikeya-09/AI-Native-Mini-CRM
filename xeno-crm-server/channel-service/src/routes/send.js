import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '../lib/logger.js';
import { scheduleCallbacks } from '../services/callbackLoop.js';

export const sendRouter = express.Router();

sendRouter.post('/', (req, res) => {
  // Validate API Key
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  if (token !== process.env.CS_API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { channel, to, body, messageId, campaignId } = req.body;

  // Validate body fields
  if (!channel || !to || !body || !messageId || !campaignId) {
    return res.status(400).json({ error: 'Missing required fields: channel, to, body, messageId, campaignId' });
  }

  // Generate unique tracking ID for this delivery
  const trackingId = uuidv4();

  // Log the send request
  logger.logSend(trackingId, { channel, to, messageId, campaignId });

  // Enqueue async callback loop
  scheduleCallbacks(messageId, trackingId, channel);

  // Respond immediately with 202 Accepted
  res.status(202).json({ trackingId });
});
