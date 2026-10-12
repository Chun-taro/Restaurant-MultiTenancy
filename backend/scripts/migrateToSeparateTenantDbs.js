require('dotenv').config({ quiet: true });
const path = require('node:path');
const fs = require('node:fs');
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const mongoose = require('mongoose');
const { DatabaseSync } = require('node:sqlite');
const { getTenantMongoDb } = require('../tenantMongoManager');

// Master Models
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');

async function migrateToIsolatedDatabases() {
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.error('No MONGODB_URI found.');
    process.exit(1);
  }

  console.log('[Isolated DB Migration] Connecting to MongoDB Atlas...');
  await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 10000 });
  console.log('[Isolated DB Migration] Connected to Atlas.');

  const restaurants = await Restaurant.find();
  console.log(`[Isolated DB Migration] Found ${restaurants.length} restaurants in platform registry.`);

  const tenantsDir = path.join(__dirname, '..', '..', 'data', 'tenants');

  for (const resto of restaurants) {
    const slug = resto.slug.toLowerCase().trim();
    const tenantDb = getTenantMongoDb(slug);
    console.log(`\n========================================`);
    console.log(`Provisioning Atlas Private DB: ${tenantDb.dbName} for ${resto.name}`);
    console.log(`========================================`);

    // Check if we have an SQLite file to pull rich data from
    const sqlitePath = path.join(tenantsDir, `tenant_${slug}.db`);
    if (fs.existsSync(sqlitePath)) {
      const tSqlite = new DatabaseSync(sqlitePath);

      // 1. Categories
      try {
        const categories = tSqlite.prepare('SELECT * FROM menu_categories').all();
        const catMap = new Map();
        for (const cat of categories) {
          let mCat = await tenantDb.MenuCategory.findOne({ name: cat.name });
          if (!mCat) {
            mCat = await tenantDb.MenuCategory.create({
              name: cat.name,
              description: cat.description || '',
              icon: cat.icon || 'ri-restaurant-line',
              sortOrder: cat.sort_order || 0,
              isActive: !!cat.is_active
            });
          }
          catMap.set(cat.id, mCat._id);
        }
        console.log(`  + Seeded ${categories.length} categories into ${tenantDb.dbName}`);

        // 2. Menu Items
        const items = tSqlite.prepare('SELECT * FROM menu_items').all();
        for (const it of items) {
          const catId = catMap.get(it.category_id);
          const exists = await tenantDb.MenuItem.findOne({ name: it.name });
          if (!exists) {
            await tenantDb.MenuItem.create({
              categoryId: catId || null,
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
        console.log(`  + Seeded ${items.length} menu items into ${tenantDb.dbName}`);
      } catch (e) {
        console.warn('  ! Menu import note:', e.message);
      }

      // 3. Tables
      try {
        const tables = tSqlite.prepare('SELECT * FROM restaurant_tables').all();
        for (const tb of tables) {
          const exists = await tenantDb.RestaurantTable.findOne({ tableNumber: tb.table_number });
          if (!exists) {
            await tenantDb.RestaurantTable.create({
              tableNumber: tb.table_number,
              capacity: tb.capacity || 4,
              qrCodeKey: tb.qr_code_key || `qr_${slug}_${tb.table_number}`,
              status: tb.status || 'available'
            });
          }
        }
        console.log(`  + Seeded ${tables.length} dining tables into ${tenantDb.dbName}`);
      } catch (e) {
        console.warn('  ! Tables import note:', e.message);
      }

      // 4. Orders
      try {
        const orders = tSqlite.prepare('SELECT * FROM orders').all();
        for (const ord of orders) {
          const exists = await tenantDb.Order.findOne({ orderNumber: ord.order_number });
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

            await tenantDb.Order.create({
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
        console.log(`  + Seeded ${orders.length} orders into ${tenantDb.dbName}`);
      } catch (e) {
        console.warn('  ! Orders import note:', e.message);
      }

      // 5. Staff
      try {
        const staff = tSqlite.prepare('SELECT * FROM staff_members').all();
        for (const st of staff) {
          const exists = await tenantDb.StaffMember.findOne({ email: (st.email || '').toLowerCase() });
          if (!exists && st.name) {
            await tenantDb.StaffMember.create({
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
        console.log(`  + Seeded ${staff.length} staff members into ${tenantDb.dbName}`);
      } catch (e) {
        console.warn('  ! Staff import note:', e.message);
      }

      // 6. Addons
      try {
        const addons = tSqlite.prepare('SELECT * FROM menu_addons').all();
        for (const ad of addons) {
          const exists = await tenantDb.MenuAddon.findOne({ name: ad.name });
          if (!exists) {
            await tenantDb.MenuAddon.create({
              name: ad.name,
              price: ad.price || 0,
              type: ad.type || 'food',
              isAvailable: !!ad.is_available
            });
          }
        }
      } catch (e) {}

      // 7. Settings
      try {
        const tSettings = tSqlite.prepare('SELECT * FROM tenant_settings').all();
        for (const ts of tSettings) {
          await tenantDb.TenantSetting.findOneAndUpdate(
            { key: ts.key },
            { value: ts.value },
            { upsert: true }
          );
        }
      } catch (e) {}
    } else {
      // Create initial starter tables and categories if empty
      const tableCount = await tenantDb.RestaurantTable.countDocuments();
      if (tableCount === 0) {
        for (let i = 1; i <= 6; i++) {
          await tenantDb.RestaurantTable.create({
            tableNumber: `Table ${i}`,
            capacity: 4,
            qrCodeKey: `qr_${slug}_t${i}`,
            status: 'available'
          });
        }
      }
      console.log(`  + Initialized starter tables for ${tenantDb.dbName}`);
    }

    // Update restaurant record in master database with its Atlas tenant DB name
    await Restaurant.updateOne(
      { _id: resto._id },
      { dbName: tenantDb.dbName }
    );
  }

  // Cleanup tenant-specific collections from the master 'restosaas' database
  console.log('\n[Isolated DB Migration] Cleaning tenant collections from master database (restosaas)...');
  const masterDb = mongoose.connection.db;
  const collectionsToDrop = ['menucategories', 'menuitems', 'restauranttables', 'orders', 'staffmembers', 'menuaddons', 'customers', 'tenantsettings'];
  for (const cName of collectionsToDrop) {
    try {
      await masterDb.collection(cName).drop();
      console.log(`  - Dropped ${cName} from master database.`);
    } catch (e) {
      // Collection might not exist, ignore
    }
  }

  console.log('\n[Isolated DB Migration] COMPLETED!');
  console.log('Every tenant now has its own isolated database on MongoDB Atlas!');
  await mongoose.disconnect();
}

migrateToIsolatedDatabases().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
