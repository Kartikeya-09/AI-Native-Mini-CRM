import Shopper from '../models/Shopper.js';
import Order from '../models/Order.js';

export async function ingestShoppers(records, marketerId) {
  let totalAccepted = 0;
  let totalRejected = 0;
  const rejections = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    if (!record.externalId || !record.firstName || !record.lastName || !record.email) {
      rejections.push({ index: i, reason: 'Missing required field: externalId, firstName, lastName, or email' });
      totalRejected++;
      continue;
    }

    try {
      await Shopper.findOneAndUpdate(
        { externalId: record.externalId, marketerId },
        {
          $set: {
            firstName: record.firstName,
            lastName: record.lastName,
            email: record.email,
            attributes: record.attributes || {},
            updatedAt: new Date()
          }
        },
        { upsert: true, new: true }
      );
      totalAccepted++;
    } catch (error) {
      rejections.push({ index: i, reason: error.message });
      totalRejected++;
    }
  }

  return { totalReceived: records.length, totalAccepted, totalRejected, rejections };
}

export async function ingestOrders(records, marketerId) {
  let totalAccepted = 0;
  let totalRejected = 0;
  const rejections = [];

  for (let i = 0; i < records.length; i++) {
    const record = records[i];
    if (!record.externalId || !record.shopperExternalId || !record.orderedAt || !record.currency || record.totalAmount === undefined || !record.lineItems || !record.lineItems.length) {
      rejections.push({ index: i, reason: 'Missing required fields' });
      totalRejected++;
      continue;
    }

    try {
      const shopper = await Shopper.findOne({ externalId: record.shopperExternalId, marketerId });
      if (!shopper) {
        rejections.push({ index: i, reason: `Shopper not found for externalId: ${record.shopperExternalId}` });
        totalRejected++;
        continue;
      }

      await Order.findOneAndUpdate(
        { externalId: record.externalId, marketerId },
        {
          $set: {
            shopperId: shopper._id,
            orderedAt: new Date(record.orderedAt),
            currency: record.currency,
            totalAmount: record.totalAmount,
            lineItems: record.lineItems,
            updatedAt: new Date()
          }
        },
        { upsert: true, new: true }
      );

      totalAccepted++;
      // TODO: Enqueue attribution check here once AttributionEngine is implemented
      // generalQueue.add(() => attributeOrder(order));
    } catch (error) {
      rejections.push({ index: i, reason: error.message });
      totalRejected++;
    }
  }

  return { totalReceived: records.length, totalAccepted, totalRejected, rejections };
}
