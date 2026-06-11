import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import fc from 'fast-check';
import { ingestShoppers, ingestOrders } from './ingestion.js';
import Marketer from '../models/Marketer.js';
import Shopper from '../models/Shopper.js';
import Order from '../models/Order.js';
import { jest } from '@jest/globals';

jest.setTimeout(30000);

describe('Ingestion Pipeline', () => {
  let mongoServer;
  let marketerId;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    const m = await Marketer.create({ email: 'ingest@example.com', passwordHash: 'hash' });
    marketerId = m._id;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await Shopper.deleteMany({});
    await Order.deleteMany({});
  });

  describe('Property 1: Batch upsert idempotency', () => {
    it('ingesting same record leaves count unchanged and reflects recent payload', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.record({
            externalId: fc.string({ minLength: 1 }),
            firstName: fc.string({ minLength: 1 }),
            lastName: fc.string({ minLength: 1 }),
            email: fc.emailAddress()
          }),
          fc.record({
            firstName: fc.string({ minLength: 1 }),
            lastName: fc.string({ minLength: 1 })
          }),
          async (record1, record2Mods) => {
            await ingestShoppers([record1], marketerId);
            const countAfterFirst = await Shopper.countDocuments({ marketerId });
            
            const record2 = { ...record1, ...record2Mods };
            await ingestShoppers([record2], marketerId);
            const countAfterSecond = await Shopper.countDocuments({ marketerId });
            
            const finalRecord = await Shopper.findOne({ externalId: record1.externalId, marketerId });
            
            expect(countAfterFirst).toBe(countAfterSecond);
            expect(finalRecord.firstName).toBe(record2.firstName);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Property 2: Batch partial failure independence', () => {
    it('valid records accepted and invalid rejected regardless of position', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.array(
            fc.tuple(
              fc.boolean(),
              fc.record({
                externalId: fc.string({ minLength: 1 }),
                firstName: fc.string({ minLength: 1 }),
                lastName: fc.string({ minLength: 1 }),
                email: fc.emailAddress()
              })
            ),
            { minLength: 1 }
          ),
          async (tuples) => {
            await Shopper.deleteMany({});
            
            let expectedValidCount = 0;
            let expectedInvalidCount = 0;
            
            const batch = tuples.map(([isValid, rec]) => {
              if (isValid) {
                expectedValidCount++;
                return rec;
              } else {
                expectedInvalidCount++;
                return { ...rec, externalId: undefined }; // Invalidate record
              }
            });
            
            const summary = await ingestShoppers(batch, marketerId);
            
            expect(summary.totalReceived).toBe(batch.length);
            expect(summary.totalAccepted).toBe(expectedValidCount);
            expect(summary.totalRejected).toBe(expectedInvalidCount);
            expect(summary.totalReceived).toBe(summary.totalAccepted + summary.totalRejected);
          }
        ),
        { numRuns: 10 }
      );
    });
  });

  describe('Order batch partial failure', () => {
    it('resolves shopper via externalId and rejects orders referencing unknown shoppers', async () => {
      const shopperExternalId = 'known_shopper_123';
      await Shopper.create({ marketerId, externalId: shopperExternalId, firstName: 'A', lastName: 'B', email: 'a@example.com' });

      const batch = [
        { // valid
          externalId: 'ord_1',
          shopperExternalId,
          orderedAt: new Date().toISOString(),
          currency: 'USD',
          totalAmount: 100,
          lineItems: [{ productName: 'P1', quantity: 1, category: 'C' }]
        },
        { // invalid (unknown shopper)
          externalId: 'ord_2',
          shopperExternalId: 'unknown_shopper_456',
          orderedAt: new Date().toISOString(),
          currency: 'USD',
          totalAmount: 50,
          lineItems: [{ productName: 'P2', quantity: 1, category: 'C' }]
        }
      ];

      const summary = await ingestOrders(batch, marketerId);
      expect(summary.totalReceived).toBe(2);
      expect(summary.totalAccepted).toBe(1);
      expect(summary.totalRejected).toBe(1);
      expect(summary.rejections[0].reason).toContain('Shopper not found for externalId: unknown_shopper_456');

      const orders = await Order.find({ marketerId });
      expect(orders.length).toBe(1);
      expect(orders[0].externalId).toBe('ord_1');
    });
  });
});
