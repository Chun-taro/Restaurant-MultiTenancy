const mongoose = require('mongoose');

// Master Models
const User = require('./models/User');
const Restaurant = require('./models/Restaurant');
const SubscriptionPlan = require('./models/SubscriptionPlan');
const Subscription = require('./models/Subscription');
const Invoice = require('./models/Invoice');
const AuditLog = require('./models/AuditLog');
const SystemSetting = require('./models/SystemSetting');

// Tenant Isolated Database Manager
const { getTenantMongoDb } = require('./tenantMongoManager');

/**
 * Hydrates the master in-memory database directly from MongoDB Atlas
 * @param {object} masterDb - In-memory DatabaseSync instance
 */
async function hydrateMasterFromAtlas(masterDb) {
  if (mongoose.connection.readyState !== 1) return;

  try {
    // 1. Subscription Plans
    const plans = await SubscriptionPlan.find().lean();
    if (plans.length > 0) {
      masterDb.exec('DELETE FROM subscription_plans;');
      const insertPlan = masterDb.prepare(`
        INSERT INTO subscription_plans (
          id, name, code, description, price_monthly, price_yearly, currency,
          max_products, max_staff, max_monthly_orders, transaction_fee_percent,
          has_qr_ordering, has_online_payment, has_custom_domain,
          has_advanced_analytics, has_inventory, is_popular, is_active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      let planIdx = 1;
      for (const p of plans) {
        insertPlan.run(
          planIdx++,
          p.name,
          p.code,
          p.description || '',
          p.priceMonthly || 0,
          p.priceYearly || 0,
          p.currency || 'PHP',
          p.maxProducts ?? 50,
          p.maxStaff ?? 3,
          p.maxMonthlyOrders ?? 300,
          p.transactionFeePercent ?? 2.0,
          p.hasQrOrdering ? 1 : 0,
          p.hasOnlinePayment ? 1 : 0,
          p.hasCustomDomain ? 1 : 0,
          p.hasAdvancedAnalytics ? 1 : 0,
          p.hasInventory ? 1 : 0,
          p.isPopular ? 1 : 0,
          p.isActive ? 1 : 0,
          p.createdAt ? p.createdAt.toISOString() : new Date().toISOString()
        );
      }
    }

    // 2. Users
    const users = await User.find().lean();
    const userMongoToIdMap = new Map();
    if (users.length > 0) {
      masterDb.exec('DELETE FROM users;');
      const insertUser = masterDb.prepare(`
        INSERT INTO users (
          id, name, email, password_hash, role, phone, avatar, status, last_login_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      let uIdx = 1;
      for (const u of users) {
        const id = uIdx++;
        userMongoToIdMap.set(String(u._id), id);
        insertUser.run(
          id,
          u.name,
          u.email,
          u.password || 'restosaasdev@123',
          u.role || 'restaurant_owner',
          u.phone || null,
          u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(u.name)}`,
          u.status || 'active',
          u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
          u.createdAt ? u.createdAt.toISOString() : new Date().toISOString(),
          u.updatedAt ? u.updatedAt.toISOString() : new Date().toISOString()
        );
      }
    }

    // 3. Restaurants
    const restos = await Restaurant.find().lean();
    const restoMongoToIdMap = new Map();
    if (restos.length > 0) {
      masterDb.exec('DELETE FROM restaurants;');
      masterDb.exec('DELETE FROM restaurant_users;');
      const insertResto = masterDb.prepare(`
        INSERT INTO restaurants (
          id, name, slug, subdomain, custom_domain, cuisine_type, logo_url, banner_url,
          primary_color, secondary_color, status, address, city, phone, email, currency,
          orders_count, total_volume, suspended_reason, theme_config, db_name, db_path,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const linkOwner = masterDb.prepare(`
        INSERT INTO restaurant_users (restaurant_id, user_id, role, created_at)
        VALUES (?, ?, 'owner', ?)
      `);

      let rIdx = 1;
      for (const r of restos) {
        const id = rIdx++;
        restoMongoToIdMap.set(String(r._id), id);
        const now = r.createdAt ? r.createdAt.toISOString() : new Date().toISOString();
        let themeConfigVal = null;
        if (r.themeConfig) {
          themeConfigVal = typeof r.themeConfig === 'string' ? r.themeConfig : JSON.stringify(r.themeConfig);
        } else {
          try {
            const tenantMongo = getTenantMongoDb(r.slug);
            const savedSetting = await tenantMongo?.TenantSetting?.findOne({ key: 'theme_config' }).lean();
            if (savedSetting?.value) {
              themeConfigVal = savedSetting.value;
            }
          } catch (e) {}

          if (!themeConfigVal) {
            themeConfigVal = JSON.stringify({
              preset: 'teal_pink_dine',
              primary_color: r.primaryColor || '#00C4CC',
              secondary_color: r.secondaryColor || '#1E293B',
              accent_color: '#FF2A85',
              bg_style: 'slate_clean',
              font_family: 'Plus Jakarta Sans',
              border_radius: 'smooth',
              hero_style: 'cinematic',
              card_density: 'grid_spacious'
            });
          }
        }

        let restoLogo = r.logoUrl || null;
        let restoBanner = r.bannerUrl || null;
        try {
          const tenantMongo = getTenantMongoDb(r.slug);
          if (!restoLogo) {
            const savedLogo = await tenantMongo?.TenantSetting?.findOne({ key: 'logo_url' }).lean();
            if (savedLogo?.value) restoLogo = savedLogo.value;
          }
          if (!restoBanner) {
            const savedBanner = await tenantMongo?.TenantSetting?.findOne({ key: 'banner_url' }).lean();
            if (savedBanner?.value) restoBanner = savedBanner.value;
          }
        } catch (e) {}

        insertResto.run(
          id,
          r.name,
          r.slug,
          r.subdomain || r.slug,
          r.customDomain || null,
          r.cuisineType || 'General Dining',
          restoLogo,
          restoBanner,
          r.primaryColor || '#6366F1',
          r.secondaryColor || '#1E293B',
          r.status || 'active',
          r.address || '',
          r.city || 'Metro Manila',
          r.phone || '',
          r.email || '',
          r.currency || 'PHP',
          r.ordersCount || 0,
          r.totalVolume || 0,
          r.suspendedReason || null,
          themeConfigVal,
          `restosaas_tenant_${r.slug}`,
          `Atlas Cloud: restosaas_tenant_${r.slug}`,
          now,
          r.updatedAt ? r.updatedAt.toISOString() : now
        );

        if (r.ownerId) {
          const mappedUserId = userMongoToIdMap.get(String(r.ownerId)) || 1;
          try {
            linkOwner.run(id, mappedUserId, now);
          } catch (e) {}
        }
      }
    }

    // 4. Subscriptions
    const subs = await Subscription.find().populate('planId').lean();
    if (subs.length > 0) {
      masterDb.exec('DELETE FROM subscriptions;');
      const insertSub = masterDb.prepare(`
        INSERT INTO subscriptions (
          id, restaurant_id, plan_id, status, billing_cycle, current_period_start,
          current_period_end, trial_ends_at, auto_renew, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      let sIdx = 1;
      for (const s of subs) {
        const mappedRestoId = restoMongoToIdMap.get(String(s.restaurantId));
        if (!mappedRestoId) continue;
        let planRow = masterDb.prepare('SELECT id FROM subscription_plans WHERE code = ?').get(s.planId?.code);
        const planId = planRow ? planRow.id : 1;
        insertSub.run(
          sIdx++,
          mappedRestoId,
          planId,
          s.status || 'active',
          s.billingCycle || 'monthly',
          s.currentPeriodStart ? s.currentPeriodStart.toISOString() : new Date().toISOString(),
          s.currentPeriodEnd ? s.currentPeriodEnd.toISOString() : new Date().toISOString(),
          s.trialEndsAt ? s.trialEndsAt.toISOString() : null,
          s.autoRenew ? 1 : 0,
          s.createdAt ? s.createdAt.toISOString() : new Date().toISOString(),
          s.updatedAt ? s.updatedAt.toISOString() : new Date().toISOString()
        );
      }
    }

    // 5. Invoices
    const invoices = await Invoice.find().lean();
    if (invoices.length > 0) {
      masterDb.exec('DELETE FROM invoices;');
      const insertInv = masterDb.prepare(`
        INSERT INTO invoices (
          id, invoice_number, restaurant_id, plan_id, amount, currency, status,
          billing_period, due_date, paid_at, payment_method, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      let iIdx = 1;
      for (const inv of invoices) {
        const mappedRestoId = restoMongoToIdMap.get(String(inv.restaurantId)) || 1;
        insertInv.run(
          iIdx++,
          inv.invoiceNumber,
          mappedRestoId,
          1,
          inv.amount || 0,
          inv.currency || 'PHP',
          inv.status || 'paid',
          inv.billingPeriod || 'Subscription',
          inv.dueDate ? inv.dueDate.toISOString() : new Date().toISOString(),
          inv.paidAt ? inv.paidAt.toISOString() : null,
          inv.paymentMethod || 'Maya Business / GCash',
          inv.createdAt ? inv.createdAt.toISOString() : new Date().toISOString()
        );
      }
    }

    // 6. Audit Logs
    const auditLogs = await AuditLog.find().sort({ createdAt: -1 }).limit(100).lean();
    if (auditLogs.length > 0) {
      masterDb.exec('DELETE FROM audit_logs;');
      const insertAudit = masterDb.prepare(`
        INSERT INTO audit_logs (
          id, actor_name, actor_role, action, entity_type, entity_id, details, ip_address, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      let aIdx = 1;
      for (const a of auditLogs.reverse()) {
        insertAudit.run(
          aIdx++,
          a.actorName || 'System',
          a.actorRole || 'system',
          a.action,
          a.entityType,
          a.entityId || '',
          a.details || '',
          a.ipAddress || '127.0.0.1',
          a.createdAt ? a.createdAt.toISOString() : new Date().toISOString()
        );
      }
    }

    // 7. System Settings
    const settings = await SystemSetting.find().lean();
    if (settings.length > 0) {
      masterDb.exec('DELETE FROM system_settings;');
      const insertSet = masterDb.prepare(`
        INSERT INTO system_settings (key, value, category, description, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      for (const st of settings) {
        insertSet.run(
          st.key,
          st.value,
          st.category || 'general',
          st.description || '',
          st.updatedAt ? st.updatedAt.toISOString() : new Date().toISOString()
        );
      }
    }

    console.log('[MongoHydration] Master in-memory database successfully loaded from MongoDB Atlas.');
  } catch (err) {
    console.warn('[MongoHydration Error]:', err.message);
  }
}

/**
 * Hydrates a tenant's in-memory database directly from their private Atlas database
 * @param {string} slug - Restaurant slug
 * @param {object} tenantDb - In-memory DatabaseSync instance
 */
async function hydrateTenantFromAtlas(slug, tenantDb) {
  if (mongoose.connection.readyState !== 1) return;

  try {
    const mongoModels = getTenantMongoDb(slug);
    if (!mongoModels) return;

    // 1. Categories
    const categories = await mongoModels.MenuCategory.find().sort({ sortOrder: 1, createdAt: 1 }).lean();
    const catMongoToIdMap = new Map();
    if (categories.length > 0) {
      tenantDb.exec('DELETE FROM menu_categories;');
      const insertCat = tenantDb.prepare(`
        INSERT INTO menu_categories (id, name, description, icon, sort_order, is_active, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      let cIdx = 1;
      for (const cat of categories) {
        const id = cIdx++;
        catMongoToIdMap.set(String(cat._id), id);
        insertCat.run(
          id,
          cat.name,
          cat.description || '',
          cat.icon || 'ri-restaurant-line',
          cat.sortOrder || 0,
          cat.isActive ? 1 : 0,
          cat.createdAt ? cat.createdAt.toISOString() : new Date().toISOString()
        );
      }
    }

    // 2. Menu Items
    const items = await mongoModels.MenuItem.find().lean();
    if (items.length > 0) {
      tenantDb.exec('DELETE FROM menu_items;');
      const insertItem = tenantDb.prepare(`
        INSERT INTO menu_items (
          id, category_id, name, description, price, image_url, is_available,
          is_featured, preparation_time, badge, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      let itIdx = 1;
      for (const it of items) {
        const catId = (it.categoryId && catMongoToIdMap.get(String(it.categoryId))) || 1;
        insertItem.run(
          itIdx++,
          catId,
          it.name,
          it.description || '',
          it.price || 0,
          it.imageUrl || null,
          it.isAvailable ? 1 : 0,
          it.isFeatured ? 1 : 0,
          it.preparationTime || 15,
          it.badge || null,
          it.createdAt ? it.createdAt.toISOString() : new Date().toISOString()
        );
      }
    }

    // 3. Tables
    const tables = await mongoModels.RestaurantTable.find().lean();
    if (tables.length > 0) {
      tenantDb.exec('DELETE FROM restaurant_tables;');
      const insertTable = tenantDb.prepare(`
        INSERT INTO restaurant_tables (id, table_number, capacity, qr_code_key, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      let tbIdx = 1;
      for (const tb of tables) {
        insertTable.run(
          tbIdx++,
          tb.tableNumber,
          tb.capacity || 4,
          tb.qrCodeKey || `qr_${slug}_${tb.tableNumber}`,
          tb.status || 'available',
          tb.createdAt ? tb.createdAt.toISOString() : new Date().toISOString()
        );
      }
    }

    // 4. Orders & Items
    const orders = await mongoModels.Order.find().lean();
    if (orders.length > 0) {
      tenantDb.exec('DELETE FROM orders;');
      tenantDb.exec('DELETE FROM order_items;');
      const insertOrder = tenantDb.prepare(`
        INSERT INTO orders (
          id, order_number, customer_name, customer_phone, order_type, table_number,
          status, payment_method, payment_status, payment_proof, payment_reference,
          subtotal, tax, total, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const insertOrderItem = tenantDb.prepare(`
        INSERT INTO order_items (order_id, menu_item_id, item_name, price, quantity, instructions, subtotal)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      let oIdx = 1;
      for (const ord of orders) {
        const orderId = oIdx++;
        const now = ord.createdAt ? ord.createdAt.toISOString() : new Date().toISOString();
        insertOrder.run(
          orderId,
          ord.orderNumber,
          ord.customerName,
          ord.customerPhone || '',
          ord.orderType || 'dine_in',
          ord.tableNumber || null,
          ord.status || 'pending',
          ord.paymentMethod || 'gcash',
          ord.paymentStatus || 'paid',
          ord.paymentProof || null,
          ord.paymentReference || null,
          ord.subtotal || ord.total || 0,
          ord.tax || 0,
          ord.total || 0,
          ord.notes || '',
          now,
          ord.updatedAt ? ord.updatedAt.toISOString() : now
        );

        if (Array.isArray(ord.items)) {
          for (const oi of ord.items) {
            insertOrderItem.run(
              orderId,
              null,
              oi.itemName || oi.name,
              oi.price || 0,
              oi.quantity || 1,
              oi.instructions || '',
              oi.subtotal || ((oi.price || 0) * (oi.quantity || 1))
            );
          }
        }
      }
    }

    // 5. Staff
    const staff = await mongoModels.StaffMember.find().lean();
    if (staff.length > 0) {
      tenantDb.exec('DELETE FROM staff_members;');
      const insertStaff = tenantDb.prepare(`
        INSERT INTO staff_members (id, name, email, phone, role, pin, password_hash, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      let stIdx = 1;
      for (const st of staff) {
        const now = st.createdAt ? st.createdAt.toISOString() : new Date().toISOString();
        insertStaff.run(
          stIdx++,
          st.name,
          st.email || '',
          st.phone || '',
          st.role || 'staff',
          st.pin || '1234',
          st.passwordHash || null,
          st.status || 'active',
          now,
          st.updatedAt ? st.updatedAt.toISOString() : now
        );
      }
    }

    // 6. Addons
    const addons = await mongoModels.MenuAddon.find().lean();
    if (addons.length > 0) {
      tenantDb.exec('DELETE FROM menu_addons;');
      const insertAddon = tenantDb.prepare(`
        INSERT INTO menu_addons (id, name, price, type, is_available, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      let adIdx = 1;
      for (const ad of addons) {
        insertAddon.run(
          adIdx++,
          ad.name,
          ad.price || 0,
          ad.type || 'food',
          ad.isAvailable ? 1 : 0,
          ad.createdAt ? ad.createdAt.toISOString() : new Date().toISOString()
        );
      }
    }

    // 7. Settings
    const tenantSettings = await mongoModels.TenantSetting.find().lean();
    if (tenantSettings.length > 0) {
      tenantDb.exec('DELETE FROM tenant_settings;');
      const insertTSetting = tenantDb.prepare(`
        INSERT INTO tenant_settings (key, value, updated_at)
        VALUES (?, ?, ?)
      `);
      for (const ts of tenantSettings) {
        insertTSetting.run(
          ts.key,
          ts.value,
          ts.updatedAt ? ts.updatedAt.toISOString() : new Date().toISOString()
        );
      }
    }
  } catch (err) {
    console.warn(`[MongoHydration] Tenant ${slug} load note:`, err.message);
  }
}

module.exports = {
  hydrateMasterFromAtlas,
  hydrateTenantFromAtlas
};
