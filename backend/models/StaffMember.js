const mongoose = require('mongoose');

const staffMemberSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
  name: { type: String, required: true },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  role: { type: String, enum: ['admin', 'manager', 'staff', 'kitchen', 'cashier'], default: 'staff' },
  pin: { type: String, default: '1234' },
  passwordHash: { type: String, default: null },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' }
}, {
  timestamps: true
});

module.exports = mongoose.models.StaffMember || mongoose.model('StaffMember', staffMemberSchema);
