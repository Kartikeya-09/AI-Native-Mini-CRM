import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  marketerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Marketer', required: true },
  shopperId: { type: mongoose.Schema.Types.ObjectId, ref: 'Shopper', required: true },
  externalId: { type: String, required: true },
  orderedAt: Date,
  currency: String,
  totalAmount: Number,
  lineItems: [{
    productName: String,
    quantity: Number,
    category: String
  }]
}, { timestamps: true });

orderSchema.index({ externalId: 1, marketerId: 1 }, { unique: true });

export default mongoose.model('Order', orderSchema);