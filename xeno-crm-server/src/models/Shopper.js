import mongoose from 'mongoose';

const shopperSchema = new mongoose.Schema({
  marketerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Marketer', required: true },
  externalId: { type: String, required: true },
  firstName: String,
  lastName: String,
  email: String,
  attributes: { type: mongoose.Schema.Types.Mixed, default: {} }
}, { timestamps: true });

shopperSchema.index({ externalId: 1, marketerId: 1 }, { unique: true });

export default mongoose.model('Shopper', shopperSchema);