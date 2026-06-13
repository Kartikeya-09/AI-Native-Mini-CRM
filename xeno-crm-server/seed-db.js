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

    // Seed data for ALL existing marketers
    const marketers = await Marketer.find({});

    if (marketers.length === 0) {
      console.log('No marketers found. Please create a user first, then run seed.');
      return;
    }

    console.log(`Found ${marketers.length} marketer(s). Seeding for all...`);

    for (const marketer of marketers) {
      console.log(`Seeding for marketer: ${marketer.email} (${marketer._id})`);
      await seedData(marketer._id);
      console.log(`Done seeding for ${marketer.email}`);
    }

    console.log('Seeding complete!');
  } catch (err) {
    console.error('Seeding failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected.');
  }
}

runSeed();