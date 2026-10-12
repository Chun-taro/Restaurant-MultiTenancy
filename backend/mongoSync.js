const mongoose = require('mongoose');

// Master Models
const User = require('./models/User');
const Restaurant = require('./models/Restaurant');
const SubscriptionPlan = require('./models/SubscriptionPlan');
const Subscription = require('./models/Subscription');
const Invoice = require('./models/Invoice');
const AuditLog = require('./models/AuditLog');
const SystemSetting = require('./models/SystemSetting');

// Tenant Isolated Database Manager (Database-per-Tenant)
const { getTenantMongoDb } = require('./tenantMongoManager');

function isMongoConnected() {
  return mongoose.connection.readyState === 1;
}

// Background safe runner to prevent blocking HTTP responses
function safeMongoSync(fn) {
  if (!isMongoConnected()) return;
  Promise.resolve().then(fn).catch(err => {
    console.warn('[MongoSync Error]:', err.message);
  });
}

/**
 * Platform and Tenant level sync helpers
 */
const MongoSync = {
  // Sync User in Master DB
  syncUser(user) {
    if (!user || !user.email) return;
    safeMongoSync(async () => {
      await User.findOneAndUpdate(
        { email: user.email.toLowerCase() },
        {
          name: user.name,
          email: user.email.toLowerCase(),
          password: user.password_hash || 'restosaasdev@123',
          role: user.role || 'restaurant_owner',
          phone: user.phone || '',
          avatar: user.avatar || null,
          status: user.status || 'active',
          lastLoginAt: user.last_login_at ? new Date(user.last_login_at) : null
        },
        { upsert: true, new: true }
      );
    });
  },

  deleteUser(email) {
    if (!email) return;
    safeMongoSync(async () => {
      await User.deleteOne({ email: email.toLowerCase() });
    });
  },

  // Sync Restaurant in Master DB
  syncRestaurant(resto) {
    if (!resto || !resto.slug) return;
    safeMongoSync(async () => {
      const tenantDb = getTenantMongoDb(resto.slug);
      await Restaurant.findOneAndUpdate(
        { slug: resto.slug.toLowerCase() },
        {
          name: resto.name,
          slug: resto.slug.toLowerCase(),
          subdomain: (resto.subdomain || resto.slug).toLowerCase(),
          customDomain: resto.custom_domain || null,
          cuisineType: resto.cuisine_type || 'General Dining',
          logoUrl: resto.logo_url || null,
          bannerUrl: resto.banner_url || null,
          primaryColor: resto.primary_color || '#6366F1',
          secondaryColor: resto.secondary_color || '#1E293B',
          status: resto.status || 'active',
          address: resto.address || '',
          city: resto.city || 'Metro Manila',
          phone: resto.phone || '',
          email: resto.email || '',
          currency: resto.currency || 'PHP',
          ordersCount: resto.orders_count || 0,
          totalVolume: resto.total_volume || 0,
          suspendedReason: resto.suspended_reason || null,
          dbName: tenantDb.dbName
        },
        { upsert: true, new: true }
      );
    });
  },

  // Delete Restaurant in Master DB and drop its private tenant DB in Atlas
  deleteRestaurant(slug) {
    if (!slug) return;
    safeMongoSync(async () => {
      const cleanSlug = String(slug).toLowerCase().trim();
      await Restaurant.deleteOne({ slug: cleanSlug });
      const tenantDb = getTenantMongoDb(cleanSlug);
      if (tenantDb && tenantDb.conn) {
        try {
          await tenantDb.conn.dropDatabase();
          console.log(`[MongoSync] Dropped isolated tenant database: ${tenantDb.dbName}`);
        } catch (e) {
          console.warn(`[MongoSync] Failed to drop ${tenantDb.dbName}:`, e.message);
        }
      }
    });
  },

  // Sync Subscription in Master DB
  syncSubscription(restaurantSlug, subData) {
    safeMongoSync(async () => {
      const resto = await Restaurant.findOne({ slug: restaurantSlug.toLowerCase() });
      if (!resto) return;
      let plan = null;
      if (subData.plan_id) {
        plan = await SubscriptionPlan.findOne({ $or: [{ code: subData.plan_code }, { name: subData.plan_name }] });
      }
      if (!plan) {
        plan = await SubscriptionPlan.findOne();
      }
      if (!plan) return;

      await Subscription.findOneAndUpdate(
        { restaurantId: resto._id },
        {
          restaurantId: resto._id,
          planId: plan._id,
          status: subData.status || 'active',
          billingCycle: subData.billing_cycle || 'monthly',
          currentPeriodStart: subData.current_period_start ? new Date(subData.current_period_start) : new Date(),
          currentPeriodEnd: subData.current_period_end ? new Date(subData.current_period_end) : new Date(Date.now() + 30 * 86400000),
          trialEndsAt: subData.trial_ends_at ? new Date(subData.trial_ends_at) : null
        },
        { upsert: true }
      );
    });
  },

  // Sync Plan in Master DB
  syncPlan(plan) {
    if (!plan || !plan.code) return;
    safeMongoSync(async () => {
      await SubscriptionPlan.findOneAndUpdate(
        { code: plan.code.toLowerCase() },
        {
          name: plan.name,
          code: plan.code.toLowerCase(),
          description: plan.description || '',
          priceMonthly: plan.price_monthly,
          priceYearly: plan.price_yearly,
          currency: plan.currency || 'PHP',
          maxProducts: plan.max_products,
          maxStaff: plan.max_staff,
          maxMonthlyOrders: plan.max_monthly_orders,
          transactionFeePercent: plan.transaction_fee_percent,
          hasQrOrdering: !!plan.has_qr_ordering,
          hasOnlinePayment: !!plan.has_online_payment,
          hasCustomDomain: !!plan.has_custom_domain,
          hasAdvancedAnalytics: !!plan.has_advanced_analytics,
          hasInventory: !!plan.has_inventory,
          isPopular: !!plan.is_popular,
          isActive: !!plan.is_active
        },
        { upsert: true }
      );
    });
  },

  // Sync Audit Log in Master DB
  syncAuditLog(log) {
    safeMongoSync(async () => {
      await AuditLog.create({
        actorName: log.actor_name || 'System',
        actorRole: log.actor_role || 'system',
        action: log.action,
        entityType: log.entity_type,
        entityId: String(log.entity_id || ''),
        details: log.details || '',
        ipAddress: log.ip_address || '127.0.0.1'
      });
    });
  },

  // Sync Settings in Master DB
  syncSetting(key, value, category) {
    safeMongoSync(async () => {
      await SystemSetting.findOneAndUpdate(
        { key },
        { value: String(value), category: category || 'general' },
        { upsert: true }
      );
    });
  },

  /**
   * ========================================================
   * Tenant Level Sync Helpers (Target Private Tenant Database)
   * ========================================================
   */

  // Sync Menu Category into isolated database: restosaas_tenant_<slug>
  syncCategory(slug, cat) {
    safeMongoSync(async () => {
      const tenantDb = getTenantMongoDb(slug);
      if (!tenantDb) return;
      await tenantDb.MenuCategory.findOneAndUpdate(
        { name: cat.name },
        {
          name: cat.name,
          description: cat.description || '',
          icon: cat.icon || 'ri-restaurant-line',
          sortOrder: cat.sort_order || 0,
          isActive: cat.is_active !== undefined ? !!cat.is_active : true
        },
        { upsert: true }
      );
    });
  },

  deleteCategory(slug, catName) {
    safeMongoSync(async () => {
      const tenantDb = getTenantMongoDb(slug);
      if (!tenantDb) return;
      const cat = await tenantDb.MenuCategory.findOne({ name: catName });
      if (cat) {
        await tenantDb.MenuItem.deleteMany({ categoryId: cat._id });
        await tenantDb.MenuCategory.deleteOne({ _id: cat._id });
      }
    });
  },

  // Sync Menu Item into isolated database: restosaas_tenant_<slug>
  syncMenuItem(slug, item, catName) {
    safeMongoSync(async () => {
      const tenantDb = getTenantMongoDb(slug);
      if (!tenantDb) return;
      let cat = null;
      if (catName) {
        cat = await tenantDb.MenuCategory.findOne({ name: catName });
      }
      if (!cat) {
        cat = await tenantDb.MenuCategory.findOne();
      }

      await tenantDb.MenuItem.findOneAndUpdate(
        { name: item.name },
        {
          categoryId: cat ? cat._id : null,
          name: item.name,
          description: item.description || '',
          price: Number(item.price) || 0,
          imageUrl: item.image_url || null,
          isAvailable: item.is_available !== undefined ? !!item.is_available : true,
          isFeatured: !!item.is_featured,
          preparationTime: Number(item.preparation_time) || 15,
          badge: item.badge || null
        },
        { upsert: true }
      );
    });
  },

  deleteMenuItem(slug, itemName) {
    safeMongoSync(async () => {
      const tenantDb = getTenantMongoDb(slug);
      if (!tenantDb) return;
      await tenantDb.MenuItem.deleteOne({ name: itemName });
    });
  },

  // Sync Order into isolated database: restosaas_tenant_<slug>
  syncOrder(slug, order, items = []) {
    safeMongoSync(async () => {
      const tenantDb = getTenantMongoDb(slug);
      if (!tenantDb) return;

      const mappedItems = (items || []).map(it => ({
        itemName: it.item_name || it.name,
        price: Number(it.price) || 0,
        quantity: Number(it.quantity) || 1,
        instructions: it.instructions || '',
        subtotal: Number(it.subtotal) || ((Number(it.price) || 0) * (Number(it.quantity) || 1))
      }));

      await tenantDb.Order.findOneAndUpdate(
        { orderNumber: order.order_number },
        {
          orderNumber: order.order_number,
          customerName: order.customer_name,
          customerPhone: order.customer_phone || '',
          orderType: order.order_type || 'dine_in',
          tableNumber: order.table_number || null,
          status: order.status || 'pending',
          paymentMethod: order.payment_method || 'gcash',
          paymentStatus: order.payment_status || 'paid',
          paymentProof: order.payment_proof || null,
          paymentReference: order.payment_reference || null,
          subtotal: Number(order.subtotal) || Number(order.total) || 0,
          tax: Number(order.tax) || 0,
          total: Number(order.total) || 0,
          notes: order.notes || '',
          items: mappedItems.length > 0 ? mappedItems : undefined
        },
        { upsert: true }
      );
    });
  },

  updateOrderStatus(slug, orderNumber, status) {
    safeMongoSync(async () => {
      const tenantDb = getTenantMongoDb(slug);
      if (!tenantDb) return;
      await tenantDb.Order.updateOne(
        { orderNumber },
        { status }
      );
    });
  },

  // Sync Dining Table into isolated database: restosaas_tenant_<slug>
  syncTable(slug, table) {
    safeMongoSync(async () => {
      const tenantDb = getTenantMongoDb(slug);
      if (!tenantDb) return;
      await tenantDb.RestaurantTable.findOneAndUpdate(
        { tableNumber: table.table_number },
        {
          tableNumber: table.table_number,
          capacity: Number(table.capacity) || 4,
          qrCodeKey: table.qr_code_key || `qr_${slug}_${table.table_number}`,
          status: table.status || 'available'
        },
        { upsert: true }
      );
    });
  },

  // Sync Staff into isolated database: restosaas_tenant_<slug>
  syncStaff(slug, staff) {
    safeMongoSync(async () => {
      const tenantDb = getTenantMongoDb(slug);
      if (!tenantDb) return;
      await tenantDb.StaffMember.findOneAndUpdate(
        { email: (staff.email || '').toLowerCase() },
        {
          name: staff.name,
          email: (staff.email || '').toLowerCase(),
          phone: staff.phone || '',
          role: staff.role || 'staff',
          pin: staff.pin || '1234',
          passwordHash: staff.password_hash || null,
          status: staff.status || 'active'
        },
        { upsert: true }
      );
    });
  },

  // Sync Addon into isolated database: restosaas_tenant_<slug>
  syncAddon(slug, addon) {
    safeMongoSync(async () => {
      const tenantDb = getTenantMongoDb(slug);
      if (!tenantDb) return;
      await tenantDb.MenuAddon.findOneAndUpdate(
        { name: addon.name },
        {
          price: Number(addon.price) || 0,
          type: addon.type || 'food',
          isAvailable: addon.is_available !== undefined ? !!addon.is_available : true
        },
        { upsert: true }
      );
    });
  }
};

module.exports = MongoSync;
