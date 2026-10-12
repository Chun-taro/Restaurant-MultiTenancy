const mongoose = require('mongoose');

const restaurantTableSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
  tableNumber: { type: String, required: true },
  capacity: { type: Number, default: 4 },
  qrCodeKey: { type: String, required: true },
  status: { type: String, enum: ['available', 'occupied', 'reserved'], default: 'available' }
}, {
  timestamps: true
});

module.exports = mongoose.models.RestaurantTable || mongoose.model('RestaurantTable', restaurantTableSchema);
