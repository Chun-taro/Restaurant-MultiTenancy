const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true, lowercase: true, trim: true },
  description: { type: String, default: '' },
  priceMonthly: { type: Number, required: true },
  priceYearly: { type: Number, required: true },
  currency: { type: String, default: 'PHP' },
  maxProducts: { type: Number, default: 50 }, // -1 for unlimited
  maxStaff: { type: Number, default: 3 },
  maxMonthlyOrders: { type: Number, default: 300 }, // -1 for unlimited
  transactionFeePercent: { type: Number, default: 2.0 },
  hasQrOrdering: { type: Boolean, default: true },
  hasOnlinePayment: { type: Boolean, default: true },
  hasCustomDomain: { type: Boolean, default: false },
  hasAdvancedAnalytics: { type: Boolean, default: false },
  hasInventory: { type: Boolean, default: false },
  isPopular: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.models.SubscriptionPlan || mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
