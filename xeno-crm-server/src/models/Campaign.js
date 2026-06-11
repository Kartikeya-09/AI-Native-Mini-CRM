import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
  marketerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Marketer', required: true },
  segmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Segment', required: true },
  name: { type: String, required: true },
  channel: { type: String, enum: ['sms', 'email', 'push'], required: true },
  messageTemplate: String,
  status: { type: String, enum: ['draft', 'sending', 'completed', 'archived'], default: 'draft' },
  launchedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Campaign', campaignSchema);