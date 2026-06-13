import Shopper from '../models/Shopper.js';
import Order from '../models/Order.js';

export async function seedData(marketerId) {
  const count = await Shopper.countDocuments({ marketerId });
  if (count > 0) {
    return;
  }

  // Use fixed 2026 dates to match AI prompts
  const currentYear = 2026;
  const lastMonthStart = new Date(`${currentYear}-05-01T00:00:00Z`);
  const lastMonthEnd = new Date(`${currentYear}-06-01T00:00:00Z`);
  const dayMs = 24 * 60 * 60 * 1000;

  // ─── GUARANTEED DEMO SHOPPERS ───────────────────────────────────────────────
  // These shoppers are specifically crafted to match your demo prompts perfectly

  const guaranteedShoppers = [
    // California + electronics + high spenders (for "Cali Electronics Whales")
    { firstName: 'James', lastName: 'Carter', email: 'james.carter@example.com', city: 'California', tier: 'gold' },
    { firstName: 'Sophia', lastName: 'Lee', email: 'sophia.lee@example.com', city: 'California', tier: 'gold' },
    { firstName: 'Mason', lastName: 'Walker', email: 'mason.walker@example.com', city: 'California', tier: 'platinum' },
    { firstName: 'Olivia', lastName: 'Hall', email: 'olivia.hall@example.com', city: 'California', tier: 'gold' },
    { firstName: 'Liam', lastName: 'Young', email: 'liam.young@example.com', city: 'California', tier: 'silver' },
    { firstName: 'Emma', lastName: 'Allen', email: 'emma.allen@example.com', city: 'California', tier: 'platinum' },
    { firstName: 'Noah', lastName: 'Scott', email: 'noah.scott@example.com', city: 'California', tier: 'gold' },
    { firstName: 'Ava', lastName: 'Green', email: 'ava.green@example.com', city: 'California', tier: 'gold' },

    // Gold loyalty tier shoppers (for "gold tier" campaigns)
    { firstName: 'Ethan', lastName: 'King', email: 'ethan.king@example.com', city: 'New York', tier: 'gold' },
    { firstName: 'Isabella', lastName: 'Wright', email: 'isabella.wright@example.com', city: 'New York', tier: 'gold' },
    { firstName: 'Lucas', lastName: 'Lopez', email: 'lucas.lopez@example.com', city: 'Chicago', tier: 'gold' },
    { firstName: 'Mia', lastName: 'Hill', email: 'mia.hill@example.com', city: 'Chicago', tier: 'gold' },

    // Inactive shoppers 30+ days (for "win-back" campaigns)
    { firstName: 'Aiden', lastName: 'Adams', email: 'aiden.adams@example.com', city: 'New York', tier: 'silver' },
    { firstName: 'Harper', lastName: 'Baker', email: 'harper.baker@example.com', city: 'London', tier: 'silver' },
    { firstName: 'Elijah', lastName: 'Gonzalez', email: 'elijah.gonzalez@example.com', city: 'Mumbai', tier: 'bronze' },
    { firstName: 'Evelyn', lastName: 'Nelson', email: 'evelyn.nelson@example.com', city: 'Sydney', tier: 'silver' },
    { firstName: 'Oliver', lastName: 'Carter', email: 'oliver.carter@example.com', city: 'Paris', tier: 'bronze' },
    { firstName: 'Abigail', lastName: 'Mitchell', email: 'abigail.mitchell@example.com', city: 'Berlin', tier: 'silver' },

    // High spenders (for "total spend > $2000" campaigns)
    { firstName: 'Jacob', lastName: 'Perez', email: 'jacob.perez@example.com', city: 'New York', tier: 'platinum' },
    { firstName: 'Emily', lastName: 'Roberts', email: 'emily.roberts@example.com', city: 'California', tier: 'platinum' },
    { firstName: 'Michael', lastName: 'Turner', email: 'michael.turner@example.com', city: 'Chicago', tier: 'platinum' },
    { firstName: 'Charlotte', lastName: 'Phillips', email: 'charlotte.phillips@example.com', city: 'New York', tier: 'platinum' },
  ];

  // ─── RANDOM SHOPPERS ────────────────────────────────────────────────────────
  const firstNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Heidi', 'Ivan', 'Judy',
    'Kevin', 'Laura', 'Mike', 'Nancy', 'Oscar', 'Paula', 'Quinn', 'Rachel', 'Steve', 'Tina'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Moore'];
  const cities = ['New York', 'London', 'Mumbai', 'Tokyo', 'Sydney', 'Paris', 'Berlin', 'Chicago', 'California', 'Toronto'];
  const tiers = ['silver', 'gold', 'platinum', 'bronze'];

  const randomShoppers = [];
  for (let i = 0; i < 178; i++) {
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    randomShoppers.push({
      firstName: fn,
      lastName: ln,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@example.com`,
      city: cities[Math.floor(Math.random() * cities.length)],
      tier: tiers[Math.floor(Math.random() * tiers.length)]
    });
  }

  // ─── INSERT ALL SHOPPERS ─────────────────────────────────────────────────────
  const allShopperDocs = [
    ...guaranteedShoppers.map((s, i) => ({
      marketerId,
      externalId: `SEED_GUARANTEED_${i}`,
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      attributes: { city: s.city, loyaltyTier: s.tier }
    })),
    ...randomShoppers.map((s, i) => ({
      marketerId,
      externalId: `SEED_CUST_${i}`,
      firstName: s.firstName,
      lastName: s.lastName,
      email: s.email,
      attributes: { city: s.city, loyaltyTier: s.tier }
    }))
  ];

  const insertedShoppers = await Shopper.insertMany(allShopperDocs);

  // ─── ORDERS ──────────────────────────────────────────────────────────────────
  const orders = [];

  // Guaranteed: California shoppers with electronics > $500 LAST MONTH (May 2026)
  const californiShoppers = insertedShoppers.slice(0, 8); // first 8 are California
  for (const shopper of californiShoppers) {
    orders.push({
      marketerId,
      shopperId: shopper._id,
      externalId: `SEED_CALI_ORD_${shopper._id}`,
      orderedAt: new Date(lastMonthStart.getTime() + Math.random() * (lastMonthEnd - lastMonthStart)),
      currency: 'USD',
      totalAmount: Math.floor(Math.random() * 500) + 500, // $500 - $1000
      lineItems: [{ productName: 'Premium Electronics Product', quantity: 1, category: 'electronics' }]
    });
  }

  // Guaranteed: Gold tier shoppers with recent orders (June 2026)
  const goldShoppers = insertedShoppers.slice(8, 12);
  const recentStart = new Date(`${currentYear}-06-01T00:00:00Z`);
  const recentEnd = new Date(`${currentYear}-06-20T00:00:00Z`);
  for (const shopper of goldShoppers) {
    orders.push({
      marketerId,
      shopperId: shopper._id,
      externalId: `SEED_GOLD_ORD_${shopper._id}`,
      orderedAt: new Date(recentStart.getTime() + Math.random() * (recentEnd - recentStart)),
      currency: 'USD',
      totalAmount: Math.floor(Math.random() * 300) + 200,
      lineItems: [{ productName: 'Fashion Item', quantity: 1, category: 'fashion' }]
    });
  }

  // Guaranteed: Inactive shoppers — last order in early 2026 (45+ days ago from June)
  const inactiveShoppers = insertedShoppers.slice(12, 18);
  const inactiveStart = new Date(`${currentYear}-02-01T00:00:00Z`);
  const inactiveEnd = new Date(`${currentYear}-03-31T00:00:00Z`);
  for (const shopper of inactiveShoppers) {
    orders.push({
      marketerId,
      shopperId: shopper._id,
      externalId: `SEED_INACTIVE_ORD_${shopper._id}`,
      orderedAt: new Date(inactiveStart.getTime() + Math.random() * (inactiveEnd - inactiveStart)),
      currency: 'USD',
      totalAmount: Math.floor(Math.random() * 200) + 100,
      lineItems: [{ productName: 'Beauty Product', quantity: 1, category: 'beauty' }]
    });
  }

  // Guaranteed: High spenders — multiple big orders in early 2026
  const highSpenders = insertedShoppers.slice(18, 22);
  const highSpendStart = new Date(`${currentYear}-01-01T00:00:00Z`);
  const highSpendEnd = new Date(`${currentYear}-04-30T00:00:00Z`);
  for (const shopper of highSpenders) {
    for (let o = 0; o < 5; o++) {
      orders.push({
        marketerId,
        shopperId: shopper._id,
        externalId: `SEED_HIGHSPEND_ORD_${shopper._id}_${o}`,
        orderedAt: new Date(highSpendStart.getTime() + Math.random() * (highSpendEnd - highSpendStart)),
        currency: 'USD',
        totalAmount: Math.floor(Math.random() * 400) + 400, // $400-$800 per order → total > $2000
        lineItems: [{ productName: 'Premium Product', quantity: 1, category: 'electronics' }]
      });
    }
  }

  // Random orders for remaining shoppers throughout 2026
  const categories = ['coffee', 'fashion', 'beauty', 'electronics'];
  const remainingShoppers = insertedShoppers.slice(22);
  const yearStart = new Date(`${currentYear}-01-01T00:00:00Z`);
  const yearEnd = new Date(`${currentYear}-06-13T00:00:00Z`); // up to today
  for (let i = 0; i < 400; i++) {
    const shopper = remainingShoppers[Math.floor(Math.random() * remainingShoppers.length)];
    const category = categories[Math.floor(Math.random() * categories.length)];
    orders.push({
      marketerId,
      shopperId: shopper._id,
      externalId: `SEED_ORD_${i}`,
      orderedAt: new Date(yearStart.getTime() + Math.random() * (yearEnd - yearStart)),
      currency: 'USD',
      totalAmount: Math.floor(Math.random() * 300) + 50,
      lineItems: [{ productName: `Seed ${category} product`, quantity: Math.floor(Math.random() * 3) + 1, category }]
    });
  }

  await Order.insertMany(orders);
}