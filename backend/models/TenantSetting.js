const mongoose = require('mongoose');

const tenantSettingSchema = new mongoose.Schema({
  restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
  key: { type: String, required: true },
  value: { type: String, required: true }
}, {
  timestamps: true
});

tenantSettingSchema.index({ restaurantId: 1, key: 1 }, { unique: true });

module.exports = mongoose.models.TenantSetting || mongoose.model('TenantSetting', tenantSettingSchema);
