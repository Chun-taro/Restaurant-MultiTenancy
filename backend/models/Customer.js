const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
  name: { type: String, required: true },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  passwordHash: { type: String, default: null },
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  lastOrderAt: { type: Date, default: null }
}, {
  timestamps: true
});

module.exports = mongoose.models.Customer || mongoose.model('Customer', customerSchema);
