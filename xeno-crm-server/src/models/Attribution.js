import mongoose from 'mongoose';

const attributionSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', required: true },
  messageId: { type: mongoose.Schema.Types.ObjectId, ref: 'Message', required: true },
  attributedAt: { type: Date, default: Date.now }
});

export default mongoose.model('Attribution', attributionSchema);