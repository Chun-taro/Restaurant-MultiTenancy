require('dotenv').config({ quiet: true });
const path = require('node:path');
const fs = require('node:fs');
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const mongoose = require('mongoose');
const { DatabaseSync } = require('node:sqlite');

// Models
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');
const AuditLog = require('../models/AuditLog');
const SystemSetting = require('../models/SystemSetting');

const MenuCategory = require('../models/MenuCategory');
const MenuItem = require('../models/MenuItem');
const RestaurantTable = require('../models/RestaurantTable');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const StaffMember = require('../models/StaffMember');
const TenantSetting = require('../models/TenantSetting');
const MenuAddon = require('../models/MenuAddon');

async function migrate() {
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.error('No MONGODB_URI found in .env');
    process.exit(1);
  }

  console.log('[Migration] Connecting to MongoDB Atlas...');
  await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 10000 });
  console.log('[Migration] Connected to Atlas.');

  const dbPath = path.join(__dirname, '..', '..', 'data', 'saas_platform.db');
  if (!fs.existsSync(dbPath)) {
    console.log('[Migration] No SQLite saas_platform.db found to migrate.');
    process.exit(0);
  }

  const sqlite = new DatabaseSync(dbPath);

  // 1. Migrate Users
  const sqliteUsers = sqlite.prepare('SELECT * FROM users').all();
  console.log(`[Migration] Found ${sqliteUsers.length} users in SQLite.`);
  const userIdMap = new Map(); // sqlite id -> mongo _id

  for (const u of sqliteUsers) {
    let mongoUser = await User.findOne({ email: u.email.toLowerCase() });
    if (!mongoUser) {
      mongoUser = await User.create({
        name: u.name,
        email: u.email.toLowerCase(),
        password: u.password_hash || 'restosaasdev@123',
        role: u.role || 'restaurant_owner',
        phone: u.phone,
        avatar: u.avatar,
        status: u.status || 'active',
        createdAt: u.created_at ? new Date(u.created_at) : new Date(),
        updatedAt: u.updated_at ? new Date(u.updated_at) : new Date()
      });
      console.log(`  + Migrated user: ${u.email}`);
    }
    userIdMap.set(u.id, mongoUser._id);
  }

  // 2. Migrate Subscription Plans
  const sqlitePlans = sqlite.prepare('SELECT * FROM subscription_plans').all();
  console.log(`[Migration] Found ${sqlitePlans.length} plans in SQLite.`);
  const planIdMap = new Map();

  for (const p of sqlitePlans) {
    let mongoPlan = await SubscriptionPlan.findOne({ code: p.code.toLowerCase() });
    if (!mongoPlan) {
      mongoPlan = await SubscriptionPlan.create({
        name: p.name,
        code: p.code.toLowerCase(),
        description: p.description || '',
        priceMonthly: p.price_monthly,
        priceYearly: p.price_yearly,
        currency: p.currency || 'PHP',
        maxProducts: p.max_products,
        maxStaff: p.max_staff,
        maxMonthlyOrders: p.max_monthly_orders,
        transactionFeePercent: p.transaction_fee_percent,
        hasQrOrdering: !!p.has_qr_ordering,
        hasOnlinePayment: !!p.has_online_payment,
        hasCustomDomain: !!p.has_custom_domain,
        hasAdvancedAnalytics: !!p.has_advanced_analytics,
        hasInventory: !!p.has_inventory,
        isPopular: !!p.is_popular,
        isActive: !!p.is_active
      });
      console.log(`  + Migrated plan: ${p.code}`);
    }
    planIdMap.set(p.id, mongoPlan._id);
  }

  // 3. Migrate Restaurants
  const sqliteRestaurants = sqlite.prepare('SELECT * FROM restaurants').all();
  console.log(`[Migration] Found ${sqliteRestaurants.length} restaurants in SQLite.`);
  const restoIdMap = new Map(); // sqlite id -> mongo _id
  const restoSlugMap = new Map(); // slug -> mongo restaurant

  for (const r of sqliteRestaurants) {
    let mongoResto = await Restaurant.findOne({ slug: r.slug.toLowerCase() });
    if (!mongoResto) {
      const ownerId = userIdMap.get(r.owner_id) || null;
      mongoResto = await Restaurant.create({
        name: r.name,
        slug: r.slug.toLowerCase(),
        subdomain: (r.subdomain || r.slug).toLowerCase(),
        customDomain: r.custom_domain || null,
        cuisineType: r.cuisine_type || 'General Dining',
        logoUrl: r.logo_url || null,
        bannerUrl: r.banner_url || null,
        primaryColor: r.primary_color || '#6366F1',
        secondaryColor: r.secondary_color || '#1E293B',
        status: r.status || 'active',
        address: r.address || '',
        city: r.city || 'Metro Manila',
        phone: r.phone || '',
        email: r.email || '',
        currency: r.currency || 'PHP',
        ordersCount: r.orders_count || 0,
        totalVolume: r.total_volume || 0,
        suspendedReason: r.suspended_reason || null,
        ownerId: ownerId,
        createdAt: r.created_at ? new Date(r.created_at) : new Date(),
        updatedAt: r.updated_at ? new Date(r.updated_at) : new Date()
      });
      console.log(`  + Migrated restaurant: ${r.name} (${r.slug})`);
    }
    restoIdMap.set(r.id, mongoResto._id);
    restoSlugMap.set(r.slug.toLowerCase(), mongoResto);
  }

  // 4. Migrate Tenant Databases (Categories, MenuItems, Tables, Orders, Staff, etc.)
  const tenantsDir = path.join(__dirname, '..', '..', 'data', 'tenants');
  if (fs.existsSync(tenantsDir)) {
    const tenantFiles = fs.readdirSync(tenantsDir).filter(f => f.startsWith('tenant_') && f.endsWith('.db') && !f.includes('-wal') && !f.includes('-shm'));
    console.log(`[Migration] Found ${tenantFiles.length} tenant SQLite databases.`);

    for (const tFile of tenantFiles) {
      const slug = tFile.replace('tenant_', '').replace('.db', '').toLowerCase();
      const mongoResto = restoSlugMap.get(slug);
      if (!mongoResto) {
        console.log(`  - Skipping tenant DB ${tFile} (no matching restaurant for slug: ${slug})`);
        continue;
      }

      console.log(`  -> Processing tenant DB for: ${mongoResto.name} (${slug})`);
      const tSqlite = new DatabaseSync(path.join(tenantsDir, tFile));

      // Categories
      try {
        const categories = tSqlite.prepare('SELECT * FROM menu_categories').all();
        const catMap = new Map();
        for (const cat of categories) {
          let mCat = await MenuCategory.findOne({ restaurantId: mongoResto._id, name: cat.name });
          if (!mCat) {
            mCat = await MenuCategory.create({
              restaurantId: mongoResto._id,
              name: cat.name,
              description: cat.description || '',
              icon: cat.icon || 'ri-restaurant-line',
              sortOrder: cat.sort_order || 0,
              isActive: !!cat.is_active
            });
          }
          catMap.set(cat.id, mCat._id);
        }

        // Menu Items
        const items = tSqlite.prepare('SELECT * FROM menu_items').all();
        for (const it of items) {
          const catId = catMap.get(it.category_id);
          if (!catId) continue;
          const exists = await MenuItem.findOne({ restaurantId: mongoResto._id, name: it.name });
          if (!exists) {
            await MenuItem.create({
              restaurantId: mongoResto._id,
              categoryId: catId,
              name: it.name,
              description: it.description || '',
              price: it.price,
              imageUrl: it.image_url,
              isAvailable: !!it.is_available,
              isFeatured: !!it.is_featured,
              preparationTime: it.preparation_time || 15,
              badge: it.badge || null
            });
          }
        }
      } catch (e) {
        console.warn(`    Menu migration warning for ${slug}:`, e.message);
      }

      // Tables
      try {
        const tables = tSqlite.prepare('SELECT * FROM restaurant_tables').all();
        for (const tb of tables) {
          const exists = await RestaurantTable.findOne({ restaurantId: mongoResto._id, tableNumber: tb.table_number });
          if (!exists) {
            await RestaurantTable.create({
              restaurantId: mongoResto._id,
              tableNumber: tb.table_number,
              capacity: tb.capacity || 4,
              qrCodeKey: tb.qr_code_key || `qr_${slug}_${tb.table_number}`,
              status: tb.status || 'available'
            });
          }
        }
      } catch (e) {
        console.warn(`    Tables migration warning for ${slug}:`, e.message);
      }

      // Orders
      try {
        const orders = tSqlite.prepare('SELECT * FROM orders').all();
        for (const ord of orders) {
          const exists = await Order.findOne({ restaurantId: mongoResto._id, orderNumber: ord.order_number });
          if (!exists) {
            let orderItems = [];
            try {
              const oItems = tSqlite.prepare('SELECT * FROM order_items WHERE order_id = ?').all(ord.id);
              orderItems = oItems.map(oi => ({
                itemName: oi.item_name,
                price: oi.price,
                quantity: oi.quantity,
                instructions: oi.instructions || '',
                subtotal: oi.subtotal
              }));
            } catch (oiErr) {}

            await Order.create({
              restaurantId: mongoResto._id,
              orderNumber: ord.order_number,
              customerName: ord.customer_name,
              customerPhone: ord.customer_phone || '',
              orderType: ord.order_type || 'dine_in',
              tableNumber: ord.table_number || null,
              status: ord.status || 'pending',
              paymentMethod: ord.payment_method || 'gcash',
              paymentStatus: ord.payment_status || 'paid',
              subtotal: ord.subtotal || ord.total,
              tax: ord.tax || 0,
              total: ord.total,
              notes: ord.notes || '',
              items: orderItems,
              createdAt: ord.created_at ? new Date(ord.created_at) : new Date(),
              updatedAt: ord.updated_at ? new Date(ord.updated_at) : new Date()
            });
          }
        }
      } catch (e) {
        console.warn(`    Orders migration warning for ${slug}:`, e.message);
      }

      // Staff
      try {
        const staff = tSqlite.prepare('SELECT * FROM staff_members').all();
        for (const st of staff) {
          const exists = await StaffMember.findOne({ restaurantId: mongoResto._id, email: (st.email || '').toLowerCase() });
          if (!exists && st.name) {
            await StaffMember.create({
              restaurantId: mongoResto._id,
              name: st.name,
              email: (st.email || '').toLowerCase(),
              phone: st.phone || '',
              role: st.role || 'staff',
              pin: st.pin || '1234',
              passwordHash: st.password_hash || null,
              status: st.status || 'active'
            });
          }
        }
      } catch (e) {
        console.warn(`    Staff migration warning for ${slug}:`, e.message);
      }

      // Add-ons
      try {
        const addons = tSqlite.prepare('SELECT * FROM menu_addons').all();
        for (const ad of addons) {
          const exists = await MenuAddon.findOne({ restaurantId: mongoResto._id, name: ad.name });
          if (!exists) {
            await MenuAddon.create({
              restaurantId: mongoResto._id,
              name: ad.name,
              price: ad.price || 0,
              type: ad.type || 'food',
              isAvailable: !!ad.is_available
            });
          }
        }
      } catch (e) {}

      // Settings
      try {
        const tSettings = tSqlite.prepare('SELECT * FROM tenant_settings').all();
        for (const ts of tSettings) {
          await TenantSetting.findOneAndUpdate(
            { restaurantId: mongoResto._id, key: ts.key },
            { value: ts.value },
            { upsert: true }
          );
        }
      } catch (e) {}
    }
  }

  console.log('[Migration] All SQLite data migrated to MongoDB Atlas successfully!');
  await mongoose.disconnect();
}

migrate().catch(err => {
  console.error('[Migration Error]:', err);
  process.exit(1);
});
