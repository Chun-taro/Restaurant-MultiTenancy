const mongoose = require('mongoose');

const menuCategorySchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: String, default: 'ri-restaurant-line' },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.models.MenuCategory || mongoose.model('MenuCategory', menuCategorySchema);
