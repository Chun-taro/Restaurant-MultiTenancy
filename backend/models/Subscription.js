const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, unique: true },
  planId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', required: true },
  status: { 
    type: String, 
    enum: ['active', 'trialing', 'past_due', 'cancelled'], 
    default: 'active' 
  },
  billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  currentPeriodStart: { type: Date, default: Date.now },
  currentPeriodEnd: { type: Date, required: true },
  trialEndsAt: { type: Date, default: null },
  autoRenew: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema);
