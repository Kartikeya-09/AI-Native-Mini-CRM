import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
import { config } from './config.js';

import { connectDB } from './db.js';
import authRouter from './routes/auth.js';
import shoppersRouter from './routes/shoppers.js';
import ordersRouter from './routes/orders.js';
import segmentsRouter from './routes/segments.js';
import campaignsRouter from './routes/campaigns.js';
import aiRouter from './routes/ai.js';
import receiptsRouter from './routes/receipts.js';
import statsRouter from './routes/stats.js';

import Campaign from './models/Campaign.js';
import Message from './models/Message.js';
import CampaignStats from './models/CampaignStats.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/shoppers', shoppersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/segments', segmentsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/receipts', receiptsRouter);
app.use('/api/stats', statsRouter);

// Task 15.1: 90-day retention cleanup
function scheduleCleanup() {
  setTimeout(async () => {
    try {
      const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      const oldCampaigns = await Campaign.find({ createdAt: { $lt: ninetyDaysAgo } }, { _id: 1 });
      const oldCampaignIds = oldCampaigns.map(c => c._id);

      if (oldCampaignIds.length > 0) {
        await Message.deleteMany({ campaignId: { $in: oldCampaignIds } });
        await CampaignStats.deleteMany({ campaignId: { $in: oldCampaignIds } });
        console.log(`Cleanup: Deleted messages and stats for ${oldCampaignIds.length} campaigns older than 90 days.`);
      }
    } catch (e) {
      console.error('Retention cleanup failed:', e.message);
    } finally {
      scheduleCleanup(); // schedule next run
    }
  }, 24 * 60 * 60 * 1000);
}

connectDB().then(() => {
  scheduleCleanup(); // Start the background cleanup loop
  app.listen(config.PORT, () => {
    console.log(`Server running on port ${config.PORT}`);
  });
});
