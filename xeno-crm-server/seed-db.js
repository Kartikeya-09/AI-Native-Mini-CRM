import 'dotenv/config';
import mongoose from 'mongoose';
import { seedData } from './src/services/seedData.js';
import Marketer from './src/models/Marketer.js';

async function runSeed() {
  try {
    const uri = process.env.MONGODB_URI;
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('Connected.');

    // Find or create a default marketer to own the data
    let marketer = await Marketer.findOne({ email: 'demo@example.com' });
    if (!marketer) {
      marketer = await Marketer.create({ email: 'demo@example.com', passwordHash: 'mocked' });
    }

    console.log(`Using marketer ID: ${marketer._id}`);
    
    // Seed data
    console.log('Running seed data...');
    await seedData(marketer._id);
    
    console.log('Seeding complete!');
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

runSeed();
