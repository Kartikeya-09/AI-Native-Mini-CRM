import mongoose from 'mongoose';

const campaignStatsSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true, unique: true },
  sent: { type: Number, default: 0 },
  delivered: { type: Number, default: 0 },
  failed: { type: Number, default: 0 },
  opened: { type: Number, default: 0 },
  read: { type: Number, default: 0 },
  clicked: { type: Number, default: 0 },
  attributedOrders: { type: Number, default: 0 },
  attributedRevenue: { type: Number, default: 0 },
  lastUpdated: { type: Date, default: Date.now }
});

export default mongoose.model('CampaignStats', campaignStatsSchema);