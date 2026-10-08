const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'PHP' },
  status: { type: String, enum: ['paid', 'pending', 'failed'], default: 'paid' },
  billingPeriod: { type: String, required: true },
  dueDate: { type: Date, required: true },
  paidAt: { type: Date, default: null },
  paymentMethod: { type: String, default: 'Maya Business / GCash' }
}, {
  timestamps: true
});

module.exports = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);
