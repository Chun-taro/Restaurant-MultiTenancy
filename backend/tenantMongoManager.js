const mongoose = require('mongoose');

// Tenant-isolated schemas
const menuCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  icon: { type: String, default: 'ri-restaurant-line' },
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const menuItemSchema = new mongoose.Schema({
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuCategory' },
  name: { type: String, required: true },
  description: { type: String, default: '' },
  price: { type: Number, required: true },
  imageUrl: { type: String, default: null },
  isAvailable: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  preparationTime: { type: Number, default: 15 },
  badge: { type: String, default: null }
}, { timestamps: true });

const restaurantTableSchema = new mongoose.Schema({
  tableNumber: { type: String, required: true },
  capacity: { type: Number, default: 4 },
  qrCodeKey: { type: String, required: true },
  status: { type: String, enum: ['available', 'occupied', 'reserved'], default: 'available' }
}, { timestamps: true });

const orderItemSchema = new mongoose.Schema({
  menuItemId: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
  itemName: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  instructions: { type: String, default: '' },
  subtotal: { type: Number, required: true }
}, { _id: true });

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customerName: { type: String, required: true },
  customerPhone: { type: String, default: '' },
  orderType: { type: String, enum: ['dine_in', 'takeout', 'takeaway', 'delivery'], default: 'dine_in' },
  tableNumber: { type: String, default: null },
  status: { 
    type: String, 
    enum: ['pending', 'new', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'], 
    default: 'pending',
    index: true 
  },
  paymentMethod: { type: String, default: 'gcash' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'pending_verification', 'failed'], default: 'paid' },
  paymentProof: { type: String, default: null },
  paymentReference: { type: String, default: null },
  subtotal: { type: Number, required: true },
  tax: { type: Number, default: 0 },
  total: { type: Number, required: true },
  notes: { type: String, default: '' },
  items: [orderItemSchema]
}, { timestamps: true });

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, default: '' },
  email: { type: String, default: '' },
  passwordHash: { type: String, default: null },
  totalOrders: { type: Number, default: 0 },
  totalSpent: { type: Number, default: 0 },
  lastOrderAt: { type: Date, default: null }
}, { timestamps: true });

const staffMemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, default: '' },
  phone: { type: String, default: '' },
  role: { type: String, default: 'staff' },
  pin: { type: String, default: '1234' },
  passwordHash: { type: String, default: null },
  status: { type: String, default: 'active' }
}, { timestamps: true });

const menuAddonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, default: 0 },
  type: { type: String, default: 'food' },
  isAvailable: { type: Boolean, default: true }
}, { timestamps: true });

const tenantSettingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: String, required: true }
}, { timestamps: true });

const mediaSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  folder: { type: String, enum: ['logo', 'banner', 'menu', 'payments'], default: 'menu' },
  contentType: { type: String, default: 'image/jpeg' },
  dataUrl: { type: String, required: true },
  size: { type: Number, default: 0 }
}, { timestamps: true });

/**
 * Returns isolated models bound to a private tenant database on MongoDB Atlas
 * Database name pattern: restosaas_tenant_<slug>
 * @param {string} slug - Tenant restaurant slug
 */
function getTenantMongoDb(slug) {
  if (!slug) return null;
  const cleanSlug = String(slug).toLowerCase().trim().replace(/[^a-z0-9_-]/g, '_');
  const dbName = `restosaas_tenant_${cleanSlug}`;

  // Switch to or retrieve cached tenant database on the active MongoDB Atlas connection
  const tenantConn = mongoose.connection.useDb(dbName, { useCache: true });

  return {
    dbName,
    conn: tenantConn,
    MenuCategory: tenantConn.model('MenuCategory', menuCategorySchema),
    MenuItem: tenantConn.model('MenuItem', menuItemSchema),
    RestaurantTable: tenantConn.model('RestaurantTable', restaurantTableSchema),
    Order: tenantConn.model('Order', orderSchema),
    StaffMember: tenantConn.model('StaffMember', staffMemberSchema),
    Customer: tenantConn.model('Customer', customerSchema),
    MenuAddon: tenantConn.model('MenuAddon', menuAddonSchema),
    TenantSetting: tenantConn.model('TenantSetting', tenantSettingSchema),
    Media: tenantConn.model('Media', mediaSchema)
  };
}

module.exports = {
  getTenantMongoDb
};
