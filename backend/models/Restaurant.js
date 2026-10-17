const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  subdomain: { type: String, required: true, unique: true, lowercase: true, trim: true },
  customDomain: { type: String, default: null },
  cuisineType: { type: String, default: 'General Dining' },
  logoUrl: { type: String },
  bannerUrl: { type: String, default: null },
  primaryColor: { type: String, default: '#6366F1' },
  secondaryColor: { type: String, default: '#1E293B' },
  status: { 
    type: String, 
    enum: ['active', 'trialing', 'suspended', 'pending'], 
    default: 'active' 
  },
  address: { type: String, default: '' },
  city: { type: String, default: 'Metro Manila' },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  currency: { type: String, default: 'PHP' },
  ordersCount: { type: Number, default: 0 },
  totalVolume: { type: Number, default: 0 },
  suspendedReason: { type: String, default: null },
  themeConfig: { type: mongoose.Schema.Types.Mixed, default: null },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

module.exports = mongoose.models.Restaurant || mongoose.model('Restaurant', restaurantSchema);
