import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import Shopper from '../src/models/Shopper.js';
import { ingestShoppers } from '../src/services/ingestion.js';

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany();
  }
});

describe('Ingestion Pipeline', () => {
  it('should successfully ingest new shoppers and return a summary', async () => {
    const marketerId = new mongoose.Types.ObjectId().toString();
    const records = [
      { email: 'test1@example.com', firstName: 'Alice' },
      { email: 'test2@example.com', firstName: 'Bob' }
    ];

    const result = await ingestShoppers(records, marketerId);
    
    expect(result.insertedCount).toBe(2);
    expect(result.updatedCount).toBe(0);

    const shoppers = await Shopper.find({ marketerId });
    expect(shoppers.length).toBe(2);
    expect(shoppers[0].email).toBe('test1@example.com');
  });

  it('should update existing shoppers instead of duplicating them', async () => {
    const marketerId = new mongoose.Types.ObjectId().toString();
    
    // First batch
    await ingestShoppers([
      { externalId: 'u123', email: 'test@example.com', firstName: 'OldName' }
    ], marketerId);

    // Second batch with same externalId
    const result = await ingestShoppers([
      { externalId: 'u123', email: 'test@example.com', firstName: 'NewName' }
    ], marketerId);

    expect(result.insertedCount).toBe(0);
    expect(result.updatedCount).toBe(1);

    const shoppers = await Shopper.find({ marketerId });
    expect(shoppers.length).toBe(1);
    expect(shoppers[0].firstName).toBe('NewName');
  });
});
