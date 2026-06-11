import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  shopperId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shopper', required: true },
  body: String,
  status: { type: String, enum: ['queued', 'sent', 'delivered', 'failed', 'opened', 'read', 'clicked'], default: 'queued' },
  statusOrder: { type: Number, default: 0 },
  channelTrackingId: String,
  sentAt: Date,
  statusUpdatedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

messageSchema.index({ shopperId: 1, sentAt: 1 });

export default mongoose.model('Message', messageSchema);