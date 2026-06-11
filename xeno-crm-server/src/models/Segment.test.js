import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import fc from 'fast-check';
import Segment from './Segment.js';
import Marketer from './Marketer.js';

describe('Property 8: Segment persistence round-trip', () => {
  let mongoServer;
  let marketerId;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    const m = await Marketer.create({ email: 'test@example.com', passwordHash: 'hash' });
    marketerId = m._id;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await Segment.deleteMany({});
  });

  it('retrieving by _id returns identical fields and a non-null createdAt', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1 }),
          filterCriteria: fc.dictionary(fc.string(), fc.anything({ maxDepth: 2 })),
          shopperCountAtSave: fc.integer({ min: 0 })
        }),
        async (segmentData) => {
          const created = await Segment.create({
            marketerId,
            ...segmentData
          });

          const retrieved = await Segment.findById(created._id).lean();

          expect(retrieved.name).toBe(segmentData.name);
          expect(retrieved.shopperCountAtSave).toBe(segmentData.shopperCountAtSave);
          expect(retrieved.createdAt).toBeDefined();
          expect(retrieved.createdAt).toBeInstanceOf(Date);
        }
      ),
      { numRuns: 100 }
    );
  });
});
