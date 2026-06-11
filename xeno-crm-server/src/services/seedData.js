import Shopper from '../models/Shopper.js';
import Order from '../models/Order.js';

export async function seedData(marketerId) {
  const count = await Shopper.countDocuments({ marketerId });
  if (count > 0) {
    return;
  }

  const shoppers = [];
  const firstNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  const cities = ['New York', 'London', 'Mumbai', 'Tokyo', 'Sydney', 'Paris', 'Berlin'];
  const tiers = ['silver', 'gold', 'platinum'];

  for (let i = 0; i < 200; i++) {
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    shoppers.push({
      marketerId,
      externalId: `SEED_CUST_${i}`,
      firstName: fn,
      lastName: ln,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@example.com`,
      attributes: {
        city: cities[Math.floor(Math.random() * cities.length)],
        loyaltyTier: tiers[Math.floor(Math.random() * tiers.length)]
      }
    });
  }
  const insertedShoppers = await Shopper.insertMany(shoppers);

  const orders = [];
  const categories = ['coffee', 'fashion', 'beauty'];
  const now = Date.now();
  const halfYearMs = 180 * 24 * 60 * 60 * 1000;

  for (let i = 0; i < 500; i++) {
    const shopper = insertedShoppers[Math.floor(Math.random() * insertedShoppers.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    const orderedAt = new Date(now - Math.random() * halfYearMs);
    
    orders.push({
      marketerId,
      shopperId: shopper._id,
      externalId: `SEED_ORD_${i}`,
      orderedAt,
      currency: 'USD',
      totalAmount: Math.floor(Math.random() * 150) + 10,
      lineItems: [{
        productName: `Seed ${category} product`,
        quantity: Math.floor(Math.random() * 3) + 1,
        category
      }]
    });
  }
  await Order.insertMany(orders);
}
