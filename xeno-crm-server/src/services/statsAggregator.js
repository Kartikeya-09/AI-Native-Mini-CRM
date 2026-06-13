import CampaignStats from '../models/CampaignStats.js';
import Campaign from '../models/Campaign.js';
import { sseManager } from '../lib/sseManager.js';

export async function incrementStat(campaignId, statusOrField) {
  const updatedStats = await CampaignStats.findOneAndUpdate(
    { campaignId },
    {
      $inc: { [statusOrField]: 1 },
      $set: { lastUpdated: new Date() }
    },
    { upsert: true, new: true }
  );

  // Find the campaign to get the marketerId so we can broadcast to the right client
  const campaign = await Campaign.findById(campaignId);
  if (campaign) {
    sseManager.broadcast(campaign.marketerId, {
      type: 'stats-update',
      campaignId,
      stats: updatedStats
    });
  }

  return updatedStats;
}

export async function getCampaignStats(campaignId) {
  const stats = await CampaignStats.findOne({ campaignId });
  if (!stats) return null;

  const s = stats.toObject();
  const sent = s.sent || 0;

  // Compute rates with divide-by-zero guards
  return {
    ...s,
    deliveryRate: sent > 0 ? (s.delivered || 0) / sent : 0,
    openRate: sent > 0 ? (s.opened || 0) / sent : 0,
    readRate: sent > 0 ? (s.read || 0) / sent : 0,
    clickRate: sent > 0 ? (s.clicked || 0) / sent : 0,
  };
}

export async function getSegmentStats(segmentId) {
  const campaigns = await Campaign.find({ segmentId }).select('_id');
  const campaignIds = campaigns.map(c => c._id);

  const statsList = await CampaignStats.find({ campaignId: { $in: campaignIds } });

  // Aggregate
  const agg = {
    sent: 0, delivered: 0, failed: 0, opened: 0, read: 0, clicked: 0,
    attributedOrders: 0, attributedRevenue: 0
  };

  for (const s of statsList) {
    agg.sent += s.sent || 0;
    agg.delivered += s.delivered || 0;
    agg.failed += s.failed || 0;
    agg.opened += s.opened || 0;
    agg.read += s.read || 0;
    agg.clicked += s.clicked || 0;
    agg.attributedOrders += s.attributedOrders || 0;
    agg.attributedRevenue += s.attributedRevenue || 0;
  }

  return {
    ...agg,
    deliveryRate: agg.sent > 0 ? agg.delivered / agg.sent : 0,
    openRate: agg.sent > 0 ? agg.opened / agg.sent : 0,
    readRate: agg.sent > 0 ? agg.read / agg.sent : 0,
    clickRate: agg.sent > 0 ? agg.clicked / agg.sent : 0,
  };
}

export async function compareStats(campaignIdA, campaignIdB) {
  const [statsA, statsB] = await Promise.all([
    getCampaignStats(campaignIdA),
    getCampaignStats(campaignIdB)
  ]);
  return {
    statsA: statsA || null,
    statsB: statsB || null
  };
}
