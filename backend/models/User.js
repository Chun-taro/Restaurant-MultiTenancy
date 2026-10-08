const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    required: true, 
    enum: ['superadmin', 'restaurant_owner', 'manager', 'staff', 'customer'],
    default: 'restaurant_owner' 
  },
  phone: { type: String },
  avatar: { type: String },
  status: { type: String, enum: ['active', 'disabled'], default: 'active' },
  lastLoginAt: { type: Date }
}, {
  timestamps: true
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
