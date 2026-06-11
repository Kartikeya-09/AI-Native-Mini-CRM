import mongoose from 'mongoose';

const marketerSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  passwordHash: String,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Marketer', marketerSchema);