const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true },
  category: { type: String, default: 'general' },
  description: { type: String, default: '' }
}, {
  timestamps: true
});

module.exports = mongoose.models.SystemSetting || mongoose.model('SystemSetting', systemSettingSchema);
