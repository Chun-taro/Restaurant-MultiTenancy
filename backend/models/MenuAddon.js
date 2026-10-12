const mongoose = require('mongoose');

const menuAddonSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
  name: { type: String, required: true },
  price: { type: Number, default: 0 },
  type: { type: String, enum: ['food', 'drink'], default: 'food' },
  isAvailable: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.models.MenuAddon || mongoose.model('MenuAddon', menuAddonSchema);
