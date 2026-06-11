import mongoose from 'mongoose';

const segmentSchema = new mongoose.Schema({
  marketerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Marketer', required: true },
  name: { type: String, required: true },
  filterCriteria: mongoose.Schema.Types.Mixed,
  shopperCountAtSave: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Segment', segmentSchema);