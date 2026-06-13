import Message from '../models/Message.js';
import Attribution from '../models/Attribution.js';
import CampaignStats from '../models/CampaignStats.js';
import Order from '../models/Order.js';

/**
 * Attributes an order to the most recent qualifying message within the attribution window.
 *
 * @param {Object} order - The order document
 */
export async function attributeOrder(order) {
  // If order is missing orderedAt, fallback to createdAt or skip
  const orderedAt = order.orderedAt || order.createdAt;
  if (!orderedAt) return;

  const windowDays = parseInt(process.env.ATTRIBUTION_WINDOW_DAYS || '7', 10);
  const windowStart = new Date(orderedAt.getTime() - windowDays * 86400000);

  // Find most recent qualifying message
  const msg = await Message.findOne({
    shopperId: order.shopperId,
    status: { $in: ['delivered', 'opened', 'read', 'clicked'] },
    sentAt: { $gte: windowStart, $lte: orderedAt },
  }).sort({ sentAt: -1 });

  if (msg) {
    // Upsert Attribution
    const attribution = await Attribution.findOneAndUpdate(
      { orderId: order._id },
      {
        $set: {
          campaignId: msg.campaignId,
          messageId: msg._id,
          attributedAt: new Date(),
        },
      },
      { upsert: true, new: false } // new: false returns the doc BEFORE update
    );

    // If it's a brand new attribution (attribution was null), increment stats
    if (!attribution) {
      await CampaignStats.findOneAndUpdate(
        { campaignId: msg.campaignId },
        {
          $inc: {
            attributedOrders: 1,
            attributedRevenue: order.totalAmount || 0,
          },
          $set: { lastUpdated: new Date() }
        },
        { upsert: true }
      );
    } else if (attribution.campaignId.toString() !== msg.campaignId.toString()) {
      // Re-attribution logic: If attributed to a different campaign previously,
      // decrement old, increment new. (Optional but good practice)
      await CampaignStats.findOneAndUpdate(
        { campaignId: attribution.campaignId },
        {
          $inc: {
            attributedOrders: -1,
            attributedRevenue: -(order.totalAmount || 0),
          },
        }
      );
      await CampaignStats.findOneAndUpdate(
        { campaignId: msg.campaignId },
        {
          $inc: {
            attributedOrders: 1,
            attributedRevenue: order.totalAmount || 0,
          },
          $set: { lastUpdated: new Date() }
        },
        { upsert: true }
      );
    }
  }
}

/**
 * Called when a message receipt arrives. 
 * Finds orders placed after the message was sent (but within the window)
 * that haven't been attributed to an equal or more recent message,
 * and runs attribution on them.
 */
export async function checkAttributionsForReceipt(receiptTrigger) {
  const { shopperId, timestamp } = receiptTrigger;
  const receiptTime = new Date(timestamp);
  
  const windowDays = parseInt(process.env.ATTRIBUTION_WINDOW_DAYS || '7', 10);
  const windowEnd = new Date(receiptTime.getTime() + windowDays * 86400000);

  // Find orders placed by this shopper AFTER the message was sent, up to the window end
  const orders = await Order.find({
    shopperId,
    orderedAt: { $gte: receiptTime, $lte: windowEnd }
  });

  for (const order of orders) {
    await attributeOrder(order);
  }
}
