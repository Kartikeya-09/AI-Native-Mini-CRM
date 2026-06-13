import Campaign from '../models/Campaign.js';
import Segment from '../models/Segment.js';
import Message from '../models/Message.js';
import CampaignStats from '../models/CampaignStats.js';
import { evaluateSegment } from './segmentation.js';
import { personalise } from './aiAgent.js';
import { campaignQueue } from '../lib/queue.js';
import { config } from '../config.js';

/**
 * Launch a campaign: evaluate segment, create messages, dispatch via channel service.
 *
 * @param {string} campaignId - Campaign ObjectId
 * @param {string} marketerId - Marketer ObjectId
 * @returns {{ message: string, audienceCount: number }}
 */
async function launchCampaign(campaignId, marketerId) {
  // 1. Load campaign + segment
  const campaign = await Campaign.findOne({ _id: campaignId, marketerId });
  if (!campaign) {
    const err = new Error('Campaign not found');
    err.status = 404;
    throw err;
  }

  if (campaign.status !== 'draft') {
    const err = new Error('Campaign has already been launched');
    err.status = 400;
    throw err;
  }

  const segment = await Segment.findById(campaign.segmentId);
  if (!segment) {
    const err = new Error('Segment not found');
    err.status = 404;
    throw err;
  }

  // 2. Evaluate segment for live shopper list
  const { matchingCount, shopperIds } = await evaluateSegment(
    segment.filterCriteria,
    marketerId
  );

  if (matchingCount === 0) {
    const err = new Error('Segment has zero matching shoppers');
    err.status = 400;
    throw err;
  }

  // 3. Bulk create queued messages for all shoppers
  const messageDocs = shopperIds.map((shopperId) => ({
    campaignId: campaign._id,
    shopperId,
    body: '',
    status: 'queued',
    statusOrder: 0,
    createdAt: new Date(),
  }));

  const messages = await Message.insertMany(messageDocs);

  // 4. Initialize campaign stats
  await CampaignStats.findOneAndUpdate(
    { campaignId: campaign._id },
    {
      $set: {
        sent: 0,
        delivered: 0,
        failed: 0,
        opened: 0,
        read: 0,
        clicked: 0,
        attributedOrders: 0,
        attributedRevenue: 0,
        lastUpdated: new Date(),
      },
    },
    { upsert: true }
  );

  // 5. Set campaign status to 'sending'
  campaign.status = 'sending';
  campaign.launchedAt = new Date();
  await campaign.save();

  // 6. Import Shopper model for lookups inside queue jobs
  const { default: Shopper } = await import('../models/Shopper.js');

  // 7. Enqueue each message to the campaign queue
  const dispatchPromises = messages.map((msg) =>
    campaignQueue.add(async () => {
      try {
        // Load the shopper for personalisation
        const shopper = await Shopper.findById(msg.shopperId);
        if (!shopper) return;

        // Personalise the message template
        const [personalizedBody] = personalise(campaign.messageTemplate, [shopper]);

        // Send via channel service
        const response = await fetch(`${config.CHANNEL_SERVICE_URL}/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.CHANNEL_SERVICE_TOKEN}`,
          },
          body: JSON.stringify({
            channel: campaign.channel,
            to: shopper.email,
            body: personalizedBody,
            messageId: msg._id.toString(),
            campaignId: campaign._id.toString(),
          }),
        });

        if (response.ok) {
          const data = await response.json();
          // Update message: status → sent, store tracking ID
          await Message.findByIdAndUpdate(msg._id, {
            $set: {
              body: personalizedBody,
              status: 'sent',
              statusOrder: 1,
              channelTrackingId: data.trackingId,
              sentAt: new Date(),
              statusUpdatedAt: new Date(),
            },
          });

          // Increment sent counter
          await CampaignStats.findOneAndUpdate(
            { campaignId: campaign._id },
            { $inc: { sent: 1 }, $set: { lastUpdated: new Date() } }
          );
        } else {
          // Mark as failed
          await Message.findByIdAndUpdate(msg._id, {
            $set: {
              body: personalizedBody,
              status: 'failed',
              statusOrder: 1.5,
              statusUpdatedAt: new Date(),
            },
          });

          await CampaignStats.findOneAndUpdate(
            { campaignId: campaign._id },
            { $inc: { failed: 1 }, $set: { lastUpdated: new Date() } }
          );
        }
      } catch (error) {
        console.error(`Failed to dispatch message ${msg._id}:`, error.message);
        // Mark as failed on network/unexpected errors
        await Message.findByIdAndUpdate(msg._id, {
          $set: {
            status: 'failed',
            statusOrder: 1.5,
            statusUpdatedAt: new Date(),
          },
        });

        await CampaignStats.findOneAndUpdate(
          { campaignId: campaign._id },
          { $inc: { failed: 1 }, $set: { lastUpdated: new Date() } }
        );
      }
    })
  );

  // 8. After all jobs drain, set campaign status to 'completed'
  // This runs in the background — we don't await it before responding
  Promise.all(dispatchPromises)
    .then(async () => {
      await Campaign.findByIdAndUpdate(campaign._id, {
        $set: { status: 'completed' },
      });
      console.log(`Campaign ${campaign._id} completed — all messages dispatched`);
    })
    .catch((error) => {
      console.error(`Campaign ${campaign._id} dispatch error:`, error.message);
    });

  return {
    message: 'Campaign launched',
    audienceCount: matchingCount,
  };
}

export { launchCampaign };
