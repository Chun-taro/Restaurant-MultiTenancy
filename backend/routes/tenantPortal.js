const express = require('express');
const router = express.Router();
const path = require('node:path');
const fs = require('node:fs');
const { db, getTenantDb, ensureTenantUploadDir } = require('../db');
const { hashPassword, comparePassword, generateToken, authRateLimiter } = require('../utils/auth');
const MongoSync = require('../mongoSync');

// Helper to resolve tenant database
function resolveTenant(restaurantId) {
  return getTenantDb(db, restaurantId);
}

// Helper to get active subscription plan and perks for a restaurant
function getTenantPlan(restaurantId) {
  try {
    return db.prepare(`
      SELECT p.*, s.status as subscription_status, s.billing_cycle
      FROM subscriptions s
      JOIN subscription_plans p ON s.plan_id = p.id
      WHERE s.restaurant_id = ?
    `).get(restaurantId);
  } catch (e) {
    return null;
  }
}

// Unified Email & Password Sign-In Handler for Restaurant Staff & Admins
function processUnifiedAuth(tenantCtx, payload) {
  const { db: tenantDb, restaurant } = tenantCtx;
  const rawEmail = String(payload.email || payload.identifier || '').trim().toLowerCase();
  const rawPassword = String(payload.password || '').trim();

  if (!rawEmail || !rawPassword) {
    throw new Error('Please enter both your work email and password.');
  }

  const devSuperEmail = process.env.DEV_SUPERADMIN_EMAIL ? process.env.DEV_SUPERADMIN_EMAIL.toLowerCase().trim() : null;
  const devSuperPass = process.env.DEV_SUPERADMIN_PASSWORD || null;
  const devOwnerEmail = process.env.DEV_OWNER_EMAIL ? process.env.DEV_OWNER_EMAIL.toLowerCase().trim() : null;
  const devOwnerPass = process.env.DEV_OWNER_PASSWORD || null;
  const devStaffEmail = process.env.DEV_STAFF_EMAIL ? process.env.DEV_STAFF_EMAIL.toLowerCase().trim() : null;
  const devStaffPass = process.env.DEV_STAFF_PASSWORD || null;

  let matchedUser = null;
  let userRole = null;

  // 1. Explicit Direct Verification for Universal Dev Accounts (from .env)
  if (devOwnerEmail && devOwnerPass && rawEmail === devOwnerEmail && rawPassword === devOwnerPass) {
    matchedUser = { id: 9991, name: process.env.DEV_OWNER_NAME || 'Restaurant Owner', email: devOwnerEmail, role: 'admin' };
    userRole = 'admin';
  } else if (devStaffEmail && devStaffPass && rawEmail === devStaffEmail && rawPassword === devStaffPass) {
    matchedUser = { id: 9992, name: process.env.DEV_STAFF_NAME || 'Restaurant Staff', email: devStaffEmail, role: 'staff' };
    userRole = 'staff';
  } else if (devSuperEmail && devSuperPass && rawEmail === devSuperEmail && rawPassword === devSuperPass) {
    matchedUser = { id: 9990, name: process.env.DEV_SUPERADMIN_NAME || 'Superadmin', email: devSuperEmail, role: 'superadmin' };
    userRole = 'admin';
  }

  // 2. Check Restaurant Owner / Assigned Admin from master users table
  if (!matchedUser) {
    let ownerUser = db.prepare(`
      SELECT u.id, u.name, u.email, u.password_hash, u.role as platform_role, ru.role as restaurant_role
      FROM users u
      JOIN restaurant_users ru ON u.id = ru.user_id
      WHERE ru.restaurant_id = ? AND LOWER(u.email) = ?
    `).get(restaurant.id, rawEmail);

    if (!ownerUser) {
      // Fallback: check if the user is registered as restaurant_owner or admin in users table
      const directUser = db.prepare(`
        SELECT id, name, email, password_hash, role as platform_role, 'owner' as restaurant_role
        FROM users
        WHERE LOWER(email) = ? AND (role = 'restaurant_owner' OR role = 'admin' OR role = 'superadmin')
      `).get(rawEmail);

      if (directUser) {
        const isLinked = db.prepare('SELECT id FROM restaurant_users WHERE restaurant_id = ? AND user_id = ?').get(restaurant.id, directUser.id);
        if (isLinked || (restaurant.email && restaurant.email.toLowerCase() === rawEmail) || directUser.role === 'restaurant_owner') {
          ownerUser = directUser;
        }
      }
    }

    // 3. Check Platform Superadmin
    const superadminUser = db.prepare(`
      SELECT id, name, email, password_hash, role as platform_role
      FROM users
      WHERE LOWER(email) = ? AND role = 'superadmin'
    `).get(rawEmail);

    // 4. Check Tenant staff_members table (for staff, chefs, managers, branch admins)
    let customStaffUser = null;
    try {
      customStaffUser = tenantDb.prepare("SELECT * FROM staff_members WHERE LOWER(email) = ? AND status = 'active'").get(rawEmail);
    } catch (e) {}

    if (ownerUser && comparePassword(rawPassword, ownerUser.password_hash)) {
      matchedUser = ownerUser;
      userRole = 'admin';
    } else if (superadminUser && comparePassword(rawPassword, superadminUser.password_hash)) {
      matchedUser = superadminUser;
      userRole = 'admin';
    } else if (customStaffUser && comparePassword(rawPassword, customStaffUser.password_hash)) {
      matchedUser = customStaffUser;
      userRole = customStaffUser.role || 'staff';
    }
  }

  if (matchedUser) {
    return {
      success: true,
      userType: userRole === 'admin' ? 'admin' : 'staff',
      message: `Signed in as ${matchedUser.name} (${userRole.toUpperCase()})`,
      data: {
        user: {
          id: matchedUser.id,
          name: matchedUser.name,
          email: matchedUser.email || rawEmail,
          role: userRole,
          restaurant: restaurant.name,
          restaurant_id: restaurant.id,
          slug: restaurant.slug
        },
        token: generateToken({
          id: matchedUser.id,
          name: matchedUser.name,
          email: matchedUser.email || rawEmail,
          role: userRole,
          slug: restaurant.slug,
          restaurant_id: restaurant.id
        }),
        redirectUrl: `/portal/${restaurant.slug}`
      }
    };
  } else {
    throw new Error(`Invalid email or password for ${rawEmail}. Please check your credentials.`);
  }
}

// POST /api/tenant/:restaurantId/auth/login - Unified Single Login
router.post('/:restaurantId/auth/login', authRateLimiter, (req, res) => {
  try {
    const { restaurantId } = req.params;
    const tenantCtx = resolveTenant(restaurantId);
    if (!tenantCtx) return res.status(404).json({ success: false, error: 'Restaurant not found' });

    const result = processUnifiedAuth(tenantCtx, req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// GET /api/tenant/:restaurantId/overview
router.get('/:restaurantId/overview', (req, res) => {
  try {
    const { restaurantId } = req.params;
    const tenantCtx = resolveTenant(restaurantId);
    if (!tenantCtx) return res.status(404).json({ success: false, error: 'Restaurant not found' });

    const { db: tenantDb, restaurant, dbName, dbPath } = tenantCtx;

    // Retrieve owner information from saas_platform.db
    const owner = db.prepare(`
      SELECT u.id, u.name, u.email, u.phone
      FROM users u
      JOIN restaurant_users ru ON u.id = ru.user_id
      WHERE ru.restaurant_id = ?
      LIMIT 1
    `).get(restaurant.id);

    // Orders summary from isolated tenant DB
    const orders = tenantDb.prepare('SELECT * FROM orders ORDER BY id DESC').all();
    const pendingOrders = orders.filter(o => o.status === 'pending').length;
    const preparingOrders = orders.filter(o => o.status === 'preparing').length;
    const readyOrders = orders.filter(o => o.status === 'ready').length;
    const completedOrders = orders.filter(o => o.status === 'completed').length;

    const totalSales = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((sum, o) => sum + (o.total || 0), 0);

    const tablesCount = tenantDb.prepare('SELECT COUNT(*) as count FROM restaurant_tables').get().count;
    const menuItemsCount = tenantDb.prepare('SELECT COUNT(*) as count FROM menu_items').get().count;

    // Recent 5 orders with items and food images
    const recentOrders = orders.slice(0, 5).map(o => {
      const items = tenantDb.prepare(`
        SELECT oi.*, m.image_url 
        FROM order_items oi 
        LEFT JOIN menu_items m ON oi.menu_item_id = m.id 
        WHERE oi.order_id = ?
      `).all(o.id);
      return { ...o, items };
    });

    res.json({
      success: true,
      data: {
        restaurant: {
          ...restaurant,
          owner: owner || null,
          db_name: dbName,
          db_path: dbPath
        },
        database: {
          name: dbName,
          path: dbPath,
          engine: 'SQLite DatabaseSync',
          isolation: 'DATABASE_PER_TENANT'
        },
        urls: {
          subdomain_storefront: `http://${restaurant.subdomain}.localhost:5173`,
          subdomain_portal: `http://${restaurant.subdomain}.localhost:5173/portal`,
          path_storefront: `http://localhost:5173/store/${restaurant.slug}`,
          path_portal: `http://localhost:5173/portal/${restaurant.slug}`,
          custom_domain: restaurant.custom_domain ? `https://${restaurant.custom_domain}` : null
        },
        metrics: {
          totalSales,
          totalOrders: orders.length,
          pendingOrders,
          preparingOrders,
          readyOrders,
          completedOrders,
          tablesCount,
          menuItemsCount
        },
        recentOrders
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/tenant/:restaurantId/orders
router.get('/:restaurantId/orders', (req, res) => {
  try {
    const { restaurantId } = req.params;
    const tenantCtx = resolveTenant(restaurantId);
    if (!tenantCtx) return res.status(404).json({ success: false, error: 'Restaurant not found' });
    const { db: tenantDb } = tenantCtx;

    const { status, type } = req.query;

    let query = 'SELECT * FROM orders WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      query += ' AND status = ?';
      params.push(status);
    }
    if (type && type !== 'all') {
      query += ' AND order_type = ?';
      params.push(type);
    }

    query += ' ORDER BY id DESC';

    const orders = tenantDb.prepare(query).all(...params);
    const enrichedOrders = orders.map(o => {
      const items = tenantDb.prepare(`
        SELECT oi.*, m.image_url 
        FROM order_items oi 
        LEFT JOIN menu_items m ON oi.menu_item_id = m.id 
        WHERE oi.order_id = ?
      `).all(o.id);
      return { ...o, items };
    });

    res.json({ success: true, data: enrichedOrders });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/tenant/:restaurantId/orders/:orderId/status
router.patch('/:restaurantId/orders/:orderId/status', (req, res) => {
  try {
    const { restaurantId, orderId } = req.params;
    const tenantCtx = resolveTenant(restaurantId);
    if (!tenantCtx) return res.status(404).json({ success: false, error: 'Restaurant not found' });
    const { db: tenantDb } = tenantCtx;

    const { status } = req.body;
    const validStatuses = ['pending', 'new', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const order = tenantDb.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    const now = new Date().toISOString();
    tenantDb.prepare('UPDATE orders SET status = ?, updated_at = ? WHERE id = ?').run(status, now, orderId);

    if (status === 'completed') {
      tenantDb.prepare("UPDATE orders SET payment_status = 'paid' WHERE id = ?").run(orderId);
    }

    const updated = tenantDb.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    const items = tenantDb.prepare(`
      SELECT oi.*, m.image_url 
      FROM order_items oi 
      LEFT JOIN menu_items m ON oi.menu_item_id = m.id 
      WHERE oi.order_id = ?
    `).all(orderId);

    try {
      MongoSync.updateOrderStatus(tenantCtx.restaurant.slug, order.order_number, status);
    } catch (sErr) {}

    res.json({
      success: true,
      message: `Order #${order.order_number} marked as ${status}`,
      data: { ...updated, items }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/tenant/:restaurantId/orders/:orderId/confirm-payment - Staff/Owner confirms GCash payment proof
router.patch('/:restaurantId/orders/:orderId/confirm-payment', (req, res) => {
  try {
    const { restaurantId, orderId } = req.params;
    const tenantCtx = resolveTenant(restaurantId);
    if (!tenantCtx) return res.status(404).json({ success: false, error: 'Restaurant not found' });
    const { db: tenantDb } = tenantCtx;

    const order = tenantDb.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found' });

    const { payment_status = 'paid', advance_status = true } = req.body;
    const now = new Date().toISOString();
    const nextStatus = (advance_status && (order.status === 'pending' || order.status === 'new')) ? 'confirmed' : order.status;

    tenantDb.prepare(`
      UPDATE orders SET
        payment_status = ?,
        status = ?,
        updated_at = ?
      WHERE id = ?
    `).run(payment_status, nextStatus, now, orderId);

    const updated = tenantDb.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    const items = tenantDb.prepare(`
      SELECT oi.*, m.image_url 
      FROM order_items oi 
      LEFT JOIN menu_items m ON oi.menu_item_id = m.id 
      WHERE oi.order_id = ?
    `).all(orderId);

    const methodLabel = String(order.payment_method || '').toLowerCase().includes('maya')
      ? 'Maya'
      : String(order.payment_method || '').toLowerCase().includes('gcash')
        ? 'GCash'
        : 'Payment';

    res.json({
      success: true,
      message: `${methodLabel} Payment for Order #${order.order_number} confirmed & approved!`,
      data: { ...updated, items }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/tenant/:restaurantId/menu
router.get('/:restaurantId/menu', (req, res) => {
  try {
    const { restaurantId } = req.params;
    const tenantCtx = resolveTenant(restaurantId);
    if (!tenantCtx) return res.status(404).json({ success: false, error: 'Restaurant not found' });
    const { db: tenantDb } = tenantCtx;

    const categories = tenantDb.prepare('SELECT * FROM menu_categories ORDER BY sort_order ASC, id ASC').all();
    const items = tenantDb.prepare('SELECT * FROM menu_items ORDER BY id DESC').all();

    const categoriesWithItems = categories.map(cat => ({
      ...cat,
      items: items.filter(item => item.category_id === cat.id)
    }));

    let addons = [];
    try {
      addons = tenantDb.prepare(`
        SELECT a.*, c.name as category_name
        FROM menu_addons a
        LEFT JOIN menu_categories c ON a.category_id = c.id
        ORDER BY a.id ASC
      `).all();
    } catch (e) {
      try {
        addons = tenantDb.prepare('SELECT * FROM menu_addons ORDER BY id ASC').all();
      } catch (err) {}
    }

    res.json({
      success: true,
      data: {
        categories: categoriesWithItems,
        totalItems: items.length,
        addons
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/tenant/:restaurantId/categories
router.post('/:restaurantId/categories', (req, res) => {
  try {
    const { restaurantId } = req.params;
    const tenantCtx = resolveTenant(restaurantId);
    if (!tenantCtx) return res.status(404).json({ success: false, error: 'Restaurant not found' });
    const { db: tenantDb } = tenantCtx;

    const { name, description, icon } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ success: false, error: 'Category name is required' });

    const maxSort = tenantDb.prepare('SELECT MAX(sort_order) as m FROM menu_categories').get()?.m || 0;
    const now = new Date().toISOString();

    const insert = tenantDb.prepare(`
      INSERT INTO menu_categories (name, description, icon, sort_order, is_active, created_at)
      VALUES (?, ?, ?, ?, 1, ?)
    `);
    insert.run(name.trim(), description || '', icon || 'ri-restaurant-line', maxSort + 1, now);
    const newId = tenantDb.prepare('SELECT last_insert_rowid() as id').get().id;
    const created = tenantDb.prepare('SELECT * FROM menu_categories WHERE id = ?').get(newId);

    try {
      MongoSync.syncCategory(tenantCtx.restaurant.slug, created);
    } catch (cErr) {}

    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/tenant/:restaurantId/categories/:id
router.delete('/:restaurantId/categories/:id', (req, res) => {
  try {
    const { restaurantId, id } = req.params;
    const tenantCtx = resolveTenant(restaurantId);
    if (!tenantCtx) return res.status(404).json({ success: false, error: 'Restaurant not found' });
    const { db: tenantDb } = tenantCtx;

    const cat = tenantDb.prepare('SELECT * FROM menu_categories WHERE id = ?').get(id);
    tenantDb.prepare('DELETE FROM menu_categories WHERE id = ?').run(id);

    try {
      if (cat) MongoSync.deleteCategory(tenantCtx.restaurant.slug, cat.name);
    } catch (dErr) {}

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/tenant/:restaurantId/items
router.post('/:restaurantId/items', (req, res) => {
  try {
    const { restaurantId } = req.params;
    const tenantCtx = resolveTenant(restaurantId);
    if (!tenantCtx) return res.status(404).json({ success: false, error: 'Restaurant not found' });
    const { db: tenantDb, restaurant } = tenantCtx;

    const { category_id, name, description, price, image_url, is_featured, preparation_time, badge } = req.body;
    if (!name || price === undefined || price === '' || !category_id) {
      return res.status(400).json({ success: false, error: 'Name, price, and category are required' });
    }

    const cat = tenantDb.prepare('SELECT id, name FROM menu_categories WHERE id = ?').get(Number(category_id));
    if (!cat) {
      return res.status(400).json({ success: false, error: 'The selected category does not exist in this restaurant database.' });
    }

    // Enforce Subscription Perk: Max Menu Items Quota
    const plan = getTenantPlan(restaurant.id);
    if (plan && plan.max_products !== -1) {
      const currentItems = tenantDb.prepare('SELECT COUNT(*) as c FROM menu_items').get()?.c || 0;
      if (currentItems >= plan.max_products) {
        return res.status(403).json({
          success: false,
          error: `Plan Quota Exceeded: Your current plan (${plan.name}) allows a maximum of ${plan.max_products} menu items. Please upgrade your plan in 'Subscription & Plan' to add more dishes.`
        });
      }
    }

    const now = new Date().toISOString();
    const insert = tenantDb.prepare(`
      INSERT INTO menu_items (
        category_id, name, description, price,
        image_url, is_available, is_featured, preparation_time, badge, created_at
      ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
    `);

    insert.run(
      cat.id,
      name.trim(),
      description || '',
      parseFloat(price),
      image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80',
      is_featured ? 1 : 0,
      parseInt(preparation_time) || 15,
      badge || null,
      now
    );

    const newId = tenantDb.prepare('SELECT last_insert_rowid() as id').get().id;
    const created = tenantDb.prepare('SELECT * FROM menu_items WHERE id = ?').get(newId);

    try {
      MongoSync.syncMenuItem(restaurant.slug, created, cat.name);
    } catch (iErr) {}

    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/tenant/:restaurantId/items/:id
router.put('/:restaurantId/items/:id', (req, res) => {
  try {
    const { restaurantId, id } = req.params;
    const tenantCtx = resolveTenant(restaurantId);
    if (!tenantCtx) return res.status(404).json({ success: false, error: 'Restaurant not found' });
    const { db: tenantDb } = tenantCtx;

    const { category_id, name, description, price, image_url, is_featured, preparation_time, badge, is_available } = req.body;

    tenantDb.prepare(`
      UPDATE menu_items SET
        category_id = ?,
        name = ?,
        description = ?,
        price = ?,
        image_url = ?,
        is_featured = ?,
        is_available = ?,
        preparation_time = ?,
        badge = ?
      WHERE id = ?
    `).run(
      category_id,
      name.trim(),
      description || '',
      parseFloat(price),
      image_url,
      is_featured ? 1 : 0,
      is_available ? 1 : 0,
      parseInt(preparation_time) || 15,
      badge || null,
      id
    );

    const updated = tenantDb.prepare('SELECT * FROM menu_items WHERE id = ?').get(id);
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PATCH /api/tenant/:restaurantId/items/:id/availability
router.patch('/:restaurantId/items/:id/availability', (req, res) => {
  try {
    const { restaurantId, id } = req.params;
    const tenantCtx = resolveTenant(restaurantId);
    if (!tenantCtx) return res.status(404).json({ success: false, error: 'Restaurant not found' });
    const { db: tenantDb } = tenantCtx;

    const current = tenantDb.prepare('SELECT is_available FROM menu_items WHERE id = ?').get(id);
    if (!current) return res.status(404).json({ success: false, error: 'Item not found' });

    const newStatus = current.is_available ? 0 : 1;
    tenantDb.prepare('UPDATE menu_items SET is_available = ? WHERE id = ?').run(newStatus, id);
    res.json({ success: true, is_available: newStatus });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/tenant/:restaurantId/items/:id
router.delete('/:restaurantId/items/:id', (req, res) => {
  try {
    const { restaurantId, id } = req.params;
    const tenantCtx = resolveTenant(restaurantId);
    if (!tenantCtx) return res.status(404).json({ success: false, error: 'Restaurant not found' });
    const { db: tenantDb } = tenantCtx;

    tenantDb.prepare('DELETE FROM menu_items WHERE id = ?').run(id);
    res.json({ success: true, message: 'Menu item deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/tenant/:restaurantId/addons
router.get('/:restaurantId/addons', (req, res) => {
  try {
    const { restaurantId } = req.params;
    const tenantCtx = resolveTenant(restaurantId);
    if (!tenantCtx) return res.status(404).json({ success: false, error: 'Restaurant not found' });
    const { db: tenantDb } = tenantCtx;

    let addons = [];
    try {
      addons = tenantDb.prepare(`
        SELECT a.*, c.name as category_name
        FROM menu_addons a
        LEFT JOIN menu_categories c ON a.category_id = c.id
        ORDER BY a.id ASC
      `).all();
    } catch (e) {
      addons = tenantDb.prepare('SELECT * FROM menu_addons ORDER BY id ASC').all();
    }
    res.json({ success: true, data: addons });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/tenant/:restaurantId/addons
router.post('/:restaurantId/addons', (req, res) => {
  try {
    const { restaurantId } = req.params;
    const tenantCtx = resolveTenant(restaurantId);
    if (!tenantCtx) return res.status(404).json({ success: false, error: 'Restaurant not found' });
    const { db: tenantDb } = tenantCtx;

    const { name, price = 0, type = 'food', category_id = null, is_available = 1 } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Add-on name is required' });
    }

    const now = new Date().toISOString();
    const insert = tenantDb.prepare(`
      INSERT INTO menu_addons (name, price, type, category_id, is_available, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const parsedCatId = category_id ? Number(category_id) : null;
    const result = insert.run(name.trim(), parseFloat(price) || 0, type || 'food', parsedCatId, is_available ? 1 : 0, now);
    let created;
    try {
      created = tenantDb.prepare(`
        SELECT a.*, c.name as category_name
        FROM menu_addons a
        LEFT JOIN menu_categories c ON a.category_id = c.id
        WHERE a.id = ?
      `).get(result.lastInsertRowid);
    } catch (e) {
      created = tenantDb.prepare('SELECT * FROM menu_addons WHERE id = ?').get(result.lastInsertRowid);
    }
    res.status(201).json({ success: true, data: created, message: 'Add-on created successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/tenant/:restaurantId/addons/:id
router.put('/:restaurantId/addons/:id', (req, res) => {
  try {
    const { restaurantId, id } = req.params;
    const tenantCtx = resolveTenant(restaurantId);
    if (!tenantCtx) return res.status(404).json({ success: false, error: 'Restaurant not found' });
    const { db: tenantDb } = tenantCtx;

    const { name, price, type, category_id, is_available } = req.body;
    
    tenantDb.prepare(`
      UPDATE menu_addons SET
        name = COALESCE(?, name),
        price = COALESCE(?, price),
        type = COALESCE(?, type),
        is_available = COALESCE(?, is_available)
      WHERE id = ?
    `).run(
      name ? name.trim() : null,
      price !== undefined ? parseFloat(price) : null,
      type || null,
      is_available !== undefined ? (is_available ? 1 : 0) : null,
      id
    );

    if (category_id !== undefined) {
      tenantDb.prepare('UPDATE menu_addons SET category_id = ? WHERE id = ?').run(
        category_id ? Number(category_id) : null,
        id
      );
    }

    let updated;
    try {
      updated = tenantDb.prepare(`
        SELECT a.*, c.name as category_name
        FROM menu_addons a
        LEFT JOIN menu_categories c ON a.category_id = c.id
        WHERE a.id = ?
      `).get(id);
    } catch (e) {
      updated = tenantDb.prepare('SELECT * FROM menu_addons WHERE id = ?').get(id);
    }
    res.json({ success: true, data: updated, message: 'Add-on updated successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/tenant/:restaurantId/addons/:id
router.delete('/:restaurantId/addons/:id', (req, res) => {
  try {
    const { restaurantId, id } = req.params;
    const tenantCtx = resolveTenant(restaurantId);
    if (!tenantCtx) return res.status(404).json({ success: false, error: 'Restaurant not found' });
    const { db: tenantDb } = tenantCtx;

    tenantDb.prepare('DELETE FROM menu_addons WHERE id = ?').run(id);
    res.json({ success: true, message: 'Add-on deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/tenant/:restaurantId/tables
router.get('/:restaurantId/tables', (req, res) => {
  try {
    const { restaurantId } = req.params;
    const tenantCtx = resolveTenant(restaurantId);
    if (!tenantCtx) return res.status(404).json({ success: false, error: 'Restaurant not found' });
    const { db: tenantDb } = tenantCtx;

    const tables = tenantDb.prepare('SELECT * FROM restaurant_tables ORDER BY table_number ASC').all();
    res.json({ success: true, data: tables });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/tenant/:restaurantId/tables
router.post('/:restaurantId/tables', (req, res) => {
  try {
    const { restaurantId } = req.params;
    const tenantCtx = resolveTenant(restaurantId);
    if (!tenantCtx) return res.status(404).json({ success: false, error: 'Restaurant not found' });
    const { db: tenantDb, restaurant } = tenantCtx;

    const { table_number, capacity } = req.body;
    if (!table_number) return res.status(400).json({ success: false, error: 'Table number is required' });

    const now = new Date().toISOString();
    const qrKey = `qr_${restaurant.slug}_${table_number.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

    tenantDb.prepare(`
      INSERT INTO restaurant_tables (table_number, capacity, qr_code_key, status, created_at)
      VALUES (?, ?, ?, 'available', ?)
    `).run(table_number.trim(), parseInt(capacity) || 4, qrKey, now);

    const newId = tenantDb.prepare('SELECT last_insert_rowid() as id').get().id;
    const created = tenantDb.prepare('SELECT * FROM restaurant_tables WHERE id = ?').get(newId);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/tenant/:restaurantId/settings
router.put('/:restaurantId/settings', (req, res) => {
  try {
    const { restaurantId } = req.params;
    const tenantCtx = resolveTenant(restaurantId);
    if (!tenantCtx) return res.status(404).json({ success: false, error: 'Restaurant not found' });
    const { restaurant } = tenantCtx;

    const {
      name, cuisine_type, primary_color, secondary_color,
      logo_url, banner_url, address, city, phone, email,
      theme_config
    } = req.body;

    const themeConfigStr = theme_config
      ? (typeof theme_config === 'string' ? theme_config : JSON.stringify(theme_config))
      : null;

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE restaurants SET
        name = COALESCE(?, name),
        cuisine_type = COALESCE(?, cuisine_type),
        primary_color = COALESCE(?, primary_color),
        secondary_color = COALESCE(?, secondary_color),
        logo_url = COALESCE(?, logo_url),
        banner_url = COALESCE(?, banner_url),
        address = COALESCE(?, address),
        city = COALESCE(?, city),
        phone = COALESCE(?, phone),
        email = COALESCE(?, email),
        theme_config = COALESCE(?, theme_config),
        updated_at = ?
      WHERE id = ?
    `).run(
      name ?? null,
      cuisine_type ?? null,
      primary_color ?? null,
      secondary_color ?? null,
      logo_url ?? null,
      banner_url ?? null,
      address ?? null,
      city ?? null,
      phone ?? null,
      email ?? null,
      themeConfigStr,
      now,
      restaurant.id
    );

    const updated = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(restaurant.id);
    
    // Sync restaurant branding & theme to MongoDB Atlas
    if (updated) {
      MongoSync.syncRestaurant(updated);
    }

    // Also persist to tenant's isolated database table
    try {
      const { db: tenantDb } = tenantCtx;
      if (tenantDb) {
        if (themeConfigStr) {
          tenantDb.prepare(`
            INSERT INTO tenant_settings (key, value, updated_at) VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
          `).run('theme_config', themeConfigStr, now);
        }
        if (logo_url) {
          tenantDb.prepare(`
            INSERT INTO tenant_settings (key, value, updated_at) VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
          `).run('logo_url', logo_url, now);
        }
        if (banner_url) {
          tenantDb.prepare(`
            INSERT INTO tenant_settings (key, value, updated_at) VALUES (?, ?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
          `).run('banner_url', banner_url, now);
        }
      }
    } catch (tErr) {}

    res.json({ success: true, data: updated, message: 'Restaurant settings updated!' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/tenant/:restaurantId/upload - Upload tenant custom media (logo, banner, dish photo)
router.post('/:restaurantId/upload', async (req, res) => {
  try {
    const { restaurantId } = req.params;
    const tenantCtx = resolveTenant(restaurantId);
    if (!tenantCtx) return res.status(404).json({ success: false, error: 'Restaurant not found' });
    const { restaurant } = tenantCtx;

    const { file, fileName, folder = 'menu' } = req.body;
    if (!file || typeof file !== 'string') {
      return res.status(400).json({ success: false, error: 'No image file data provided.' });
    }

    const uploadInfo = ensureTenantUploadDir(restaurant.slug);
    const tenantDir = uploadInfo.dirPath;

    const targetSub = ['logo', 'banner', 'menu', 'dishes', 'payments'].includes(folder) 
      ? (folder === 'dishes' ? 'menu' : folder) 
      : 'menu';
    const targetFolder = path.join(tenantDir, targetSub);
    if (!fs.existsSync(targetFolder)) {
      fs.mkdirSync(targetFolder, { recursive: true });
    }

    // Process base64 data URL
    const matches = file.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer;
    let ext = 'jpg';
    let contentType = 'image/jpeg';

    if (matches && matches.length === 3) {
      const mime = matches[1].toLowerCase();
      contentType = mime;
      if (mime.includes('png')) ext = 'png';
      else if (mime.includes('webp')) ext = 'webp';
      else if (mime.includes('gif')) ext = 'gif';
      else if (mime.includes('svg')) ext = 'svg';
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(file, 'base64');
    }

    const timestamp = Date.now();
    const cleanBase = (fileName || 'image')
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .toLowerCase();
    const finalName = `${timestamp}_${cleanBase}.${ext}`;
    const filePath = path.join(targetFolder, finalName);

    // 1. Save file to dedicated disk storage
    fs.writeFileSync(filePath, buffer);

    const publicUrl = `/uploads/tenants/${restaurant.slug}/${targetSub}/${finalName}`;

    // 2. Also persist to tenant's private MongoDB Atlas collection
    let mediaDoc = null;
    try {
      const { getTenantMongoDb } = require('../tenantMongoManager');
      const tenantMongo = getTenantMongoDb(restaurant.slug);
      if (tenantMongo?.Media) {
        mediaDoc = await tenantMongo.Media.create({
          fileName: finalName,
          folder: targetSub,
          contentType,
          dataUrl: file,
          size: buffer.length
        });
      }
    } catch (mongoErr) {
      console.warn('[Tenant Upload] Note: Atlas Media backup skipped:', mongoErr.message);
    }

    // 3. If uploading restaurant branding (logo or banner), immediately persist to restaurant record
    const nowIso = new Date().toISOString();
    if (targetSub === 'logo' || folder === 'logo') {
      try {
        db.prepare('UPDATE restaurants SET logo_url = ?, updated_at = ? WHERE id = ?').run(publicUrl, nowIso, restaurant.id);
        const updatedResto = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(restaurant.id);
        if (updatedResto) MongoSync.syncRestaurant(updatedResto);
        const { db: tenantDb } = tenantCtx;
        tenantDb?.prepare(`
          INSERT INTO tenant_settings (key, value, updated_at) VALUES (?, ?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
        `).run('logo_url', publicUrl, nowIso);
      } catch (saveErr) {
        console.warn('Auto-save logo error:', saveErr.message);
      }
    } else if (targetSub === 'banner' || folder === 'banner') {
      try {
        db.prepare('UPDATE restaurants SET banner_url = ?, updated_at = ? WHERE id = ?').run(publicUrl, nowIso, restaurant.id);
        const updatedResto = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(restaurant.id);
        if (updatedResto) MongoSync.syncRestaurant(updatedResto);
        const { db: tenantDb } = tenantCtx;
        tenantDb?.prepare(`
          INSERT INTO tenant_settings (key, value, updated_at) VALUES (?, ?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
        `).run('banner_url', publicUrl, nowIso);
      } catch (saveErr) {
        console.warn('Auto-save banner error:', saveErr.message);
      }
    }

    res.json({
      success: true,
      message: `Image saved to ${restaurant.name}'s dedicated media directory and private database!`,
      url: publicUrl,
      fileName: finalName,
      folderPath: `uploads/tenants/${restaurant.slug}/${targetSub}`,
      mediaId: mediaDoc?._id || null,
      cloudUrl: mediaDoc ? `/api/tenant/${restaurant.slug}/media/${mediaDoc._id}` : null
    });
  } catch (err) {
    console.error('Tenant upload error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/tenant/:restaurantId/customers
router.get('/:restaurantId/customers', (req, res) => {
  try {
    const { restaurantId } = req.params;
    const tenantCtx = resolveTenant(restaurantId);
    if (!tenantCtx) return res.status(404).json({ success: false, error: 'Restaurant not found' });
    const { db: tenantDb } = tenantCtx;

    const customers = tenantDb.prepare('SELECT * FROM customers ORDER BY total_spent DESC, id DESC').all();
    res.json({ success: true, data: customers });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/tenant/:restaurantId/reports
router.get('/:restaurantId/reports', (req, res) => {
  try {
    const { restaurantId } = req.params;
    const tenantCtx = resolveTenant(restaurantId);
    if (!tenantCtx) return res.status(404).json({ success: false, error: 'Restaurant not found' });
    const { db: tenantDb } = tenantCtx;

    const orders = tenantDb.prepare('SELECT * FROM orders ORDER BY id DESC').all();
    const orderItems = tenantDb.prepare('SELECT * FROM order_items').all();

    // Payment distribution
    const paymentBreakdown = {
      GCash: 0,
      Maya: 0,
      'Cash on Dine': 0,
      Other: 0
    };

    orders.forEach(o => {
      const p = (o.payment_method || '').toLowerCase();
      if (p.includes('gcash')) paymentBreakdown.GCash += 1;
      else if (p.includes('maya')) paymentBreakdown.Maya += 1;
      else if (p.includes('cash')) paymentBreakdown['Cash on Dine'] += 1;
      else paymentBreakdown.Other += 1;
    });

    // Top items
    const itemSales = {};
    orderItems.forEach(it => {
      if (!itemSales[it.item_name]) {
        itemSales[it.item_name] = { name: it.item_name, qty: 0, revenue: 0 };
      }
      itemSales[it.item_name].qty += it.quantity;
      itemSales[it.item_name].revenue += it.subtotal || (it.price * it.quantity);
    });

    const topItems = Object.values(itemSales)
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // Status breakdown
    const statusBreakdown = {
      pending: orders.filter(o => o.status === 'pending' || o.status === 'new').length,
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      ready: orders.filter(o => o.status === 'ready').length,
      completed: orders.filter(o => o.status === 'completed').length
    };

    const totalRevenue = orders
      .filter(o => o.status !== 'cancelled')
      .reduce((s, o) => s + (o.total || 0), 0);

    res.json({
      success: true,
      data: {
        totalOrders: orders.length,
        totalRevenue,
        averageOrderValue: orders.length > 0 ? (totalRevenue / orders.length).toFixed(2) : 0,
        statusBreakdown,
        paymentBreakdown,
        topItems
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/tenant/:restaurantId/seed-dine
router.post('/:restaurantId/seed-dine', (req, res) => {
  try {
    const { restaurantId } = req.params;
    const tenantCtx = resolveTenant(restaurantId);
    if (!tenantCtx) return res.status(404).json({ success: false, error: 'Restaurant not found' });
    const { db: tenantDb, restaurant, dbName } = tenantCtx;

    // Clear existing tables and reseed with DINE catalog
    tenantDb.exec(`
      DELETE FROM order_items;
      DELETE FROM orders;
      DELETE FROM customers;
      DELETE FROM menu_items;
      DELETE FROM menu_categories;
      DELETE FROM restaurant_tables;
    `);

    seedTenantDineCatalog(tenantDb, restaurant);

    res.json({
      success: true,
      message: `Successfully populated ${restaurant.name} (${dbName}) with complete DINE catalog, categories, items, tables & sample orders!`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/tenant/:restaurantId/staff - Get all staff and admins for this restaurant
router.get('/:restaurantId/staff', (req, res) => {
  try {
    const { restaurantId } = req.params;
    const tenantCtx = resolveTenant(restaurantId);
    if (!tenantCtx) return res.status(404).json({ success: false, error: 'Restaurant not found' });
    const { db: tenantDb, restaurant } = tenantCtx;

    // 1. Platform owner from SaaS platform DB
    const owners = db.prepare(`
      SELECT u.id, u.name, u.email, 'admin' as role, 'active' as status,
             'Owner Admin' as member_type, 'Email/Password' as auth_type, '' as pin, u.created_at
      FROM users u
      JOIN restaurant_users ru ON u.id = ru.user_id
      WHERE ru.restaurant_id = ?
    `).all(restaurant.id);

    // 2. Tenant private staff members
    let staffMembers = [];
    try {
      staffMembers = tenantDb.prepare(`
        SELECT id, name, email, phone, role, pin, password_hash, status, created_at, updated_at
        FROM staff_members
        ORDER BY id DESC
      `).all();
    } catch (e) {}

    const allMembers = [
      ...owners.map(o => ({ ...o, isOwner: true })),
      ...staffMembers.map(s => ({
        ...s,
        isOwner: false,
        member_type: s.role === 'admin' ? 'Restaurant Admin' : (s.role === 'manager' ? 'Shift Manager' : 'Kitchen / Staff'),
        auth_type: s.pin ? `PIN (${s.pin})` : 'Email/Password'
      }))
    ];

    res.json({
      success: true,
      data: {
        owners,
        staff: staffMembers,
        all: allMembers
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/tenant/:restaurantId/staff - Create new staff or admin member
router.post('/:restaurantId/staff', (req, res) => {
  try {
    const { restaurantId } = req.params;
    const tenantCtx = resolveTenant(restaurantId);
    if (!tenantCtx) return res.status(404).json({ success: false, error: 'Restaurant not found' });
    const { db: tenantDb, restaurant } = tenantCtx;
    const { name, email, phone, role = 'staff', pin, password, status = 'active' } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, error: 'Member name is required' });
    }

    // Enforce Subscription Perk: Max Staff Quota
    const plan = getTenantPlan(restaurant.id);
    if (plan && plan.max_staff !== -1) {
      const currentStaff = tenantDb.prepare('SELECT COUNT(*) as c FROM staff_members').get()?.c || 0;
      if (currentStaff >= plan.max_staff) {
        return res.status(403).json({
          success: false,
          error: `Staff Quota Exceeded: Your plan (${plan.name}) allows up to ${plan.max_staff} staff members. Upgrade to a higher tier to add more team members.`
        });
      }
    }

    const now = new Date().toISOString();
    const storedHash = password ? hashPassword(password) : '';
    tenantDb.prepare(`
      INSERT INTO staff_members (name, email, phone, role, pin, password_hash, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, email || null, phone || null, role, pin || null, storedHash, status, now, now);

    const newId = tenantDb.prepare('SELECT last_insert_rowid() as id').get().id;
    const created = tenantDb.prepare('SELECT * FROM staff_members WHERE id = ?').get(newId);

    res.status(201).json({
      success: true,
      message: `Created ${created.name} (${created.role.toUpperCase()}) successfully!`,
      data: created
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/tenant/:restaurantId/staff/:staffId - Update staff or admin member
router.put('/:restaurantId/staff/:staffId', (req, res) => {
  try {
    const { restaurantId, staffId } = req.params;
    const tenantCtx = resolveTenant(restaurantId);
    if (!tenantCtx) return res.status(404).json({ success: false, error: 'Restaurant not found' });
    const { db: tenantDb } = tenantCtx;
    const { name, email, phone, role, pin, password, status } = req.body;

    const existing = tenantDb.prepare('SELECT * FROM staff_members WHERE id = ?').get(staffId);
    if (!existing) return res.status(404).json({ success: false, error: 'Staff member not found' });

    const now = new Date().toISOString();
    let passwordToStore = existing.password_hash;
    if (password !== undefined && password !== '') {
      passwordToStore = hashPassword(password);
    }

    tenantDb.prepare(`
      UPDATE staff_members
      SET name = ?, email = ?, phone = ?, role = ?, pin = ?, password_hash = ?, status = ?, updated_at = ?
      WHERE id = ?
    `).run(
      name !== undefined ? name : existing.name,
      email !== undefined ? email : existing.email,
      phone !== undefined ? phone : existing.phone,
      role !== undefined ? role : existing.role,
      pin !== undefined ? pin : existing.pin,
      passwordToStore,
      status !== undefined ? status : existing.status,
      now,
      staffId
    );

    const updated = tenantDb.prepare('SELECT * FROM staff_members WHERE id = ?').get(staffId);
    res.json({ success: true, message: 'Team member updated successfully', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/tenant/:restaurantId/staff/:staffId - Remove staff member
router.delete('/:restaurantId/staff/:staffId', (req, res) => {
  try {
    const { restaurantId, staffId } = req.params;
    const tenantCtx = resolveTenant(restaurantId);
    if (!tenantCtx) return res.status(404).json({ success: false, error: 'Restaurant not found' });
    const { db: tenantDb } = tenantCtx;

    const staff = tenantDb.prepare('SELECT * FROM staff_members WHERE id = ?').get(staffId);
    const devOwnerEmail = process.env.DEV_OWNER_EMAIL ? process.env.DEV_OWNER_EMAIL.toLowerCase().trim() : null;
    const devStaffEmail = process.env.DEV_STAFF_EMAIL ? process.env.DEV_STAFF_EMAIL.toLowerCase().trim() : null;

    if (staff && staff.email && ((devOwnerEmail && staff.email.toLowerCase() === devOwnerEmail) || (devStaffEmail && staff.email.toLowerCase() === devStaffEmail))) {
      return res.status(403).json({
        success: false,
        error: 'Security Restriction: Developer testing accounts are protected and cannot be deleted.'
      });
    }

    tenantDb.prepare('DELETE FROM staff_members WHERE id = ?').run(staffId);
    res.json({ success: true, message: 'Team member removed successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/tenant/:restaurantId/auth/register - Direct account creation (Customer or Staff)
router.post('/:restaurantId/auth/register', authRateLimiter, (req, res) => {
  try {
    const { restaurantId } = req.params;
    const tenantCtx = resolveTenant(restaurantId);
    if (!tenantCtx) return res.status(404).json({ success: false, error: 'Restaurant not found' });
    const { db: tenantDb, restaurant } = tenantCtx;
    const { name, phone, email, role = 'customer', pin, password = '' } = req.body;

    if (!name || (!phone && !email)) {
      return res.status(400).json({ success: false, error: 'Name and either Mobile Phone or Email are required' });
    }

    const now = new Date().toISOString();

    if (role === 'staff' || role === 'admin') {
      const storedHash = password ? hashPassword(password) : '';
      tenantDb.prepare(`
        INSERT INTO staff_members (name, email, phone, role, pin, password_hash, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)
      `).run(name, email || null, phone || null, role, pin || null, storedHash, now, now);
      const newId = tenantDb.prepare('SELECT last_insert_rowid() as id').get().id;
      const staffUser = tenantDb.prepare('SELECT * FROM staff_members WHERE id = ?').get(newId);

      return res.status(201).json({
        success: true,
        userType: role,
        message: `Account created for ${staffUser.name} (${role.toUpperCase()})`,
        data: {
          user: {
            id: staffUser.id,
            name: staffUser.name,
            email: staffUser.email,
            role: staffUser.role,
            restaurant: restaurant.name,
            restaurant_id: restaurant.id,
            slug: restaurant.slug
          },
          token: generateToken({
            id: staffUser.id,
            name: staffUser.name,
            email: staffUser.email,
            role: staffUser.role,
            slug: restaurant.slug,
            restaurant_id: restaurant.id
          }),
          redirectUrl: `/portal/${restaurant.slug}`
        }
      });
    }

    // Otherwise Customer registration
    let customer = null;
    if (phone) {
      customer = tenantDb.prepare('SELECT * FROM customers WHERE phone = ?').get(phone);
    }
    if (!customer && email) {
      customer = tenantDb.prepare('SELECT * FROM customers WHERE email = ?').get(email);
    }

    const customerHash = password ? hashPassword(password) : '';
    if (!customer) {
      tenantDb.prepare(`
        INSERT INTO customers (name, phone, email, password_hash, total_orders, total_spent, last_order_at, created_at)
        VALUES (?, ?, ?, ?, 0, 0, NULL, ?)
      `).run(name, phone || '', email || '', customerHash, now);
      const newId = tenantDb.prepare('SELECT last_insert_rowid() as id').get().id;
      customer = tenantDb.prepare('SELECT * FROM customers WHERE id = ?').get(newId);
    } else if (password) {
      tenantDb.prepare('UPDATE customers SET password_hash = ? WHERE id = ?').run(customerHash, customer.id);
    }

    return res.status(201).json({
      success: true,
      userType: 'customer',
      message: `Account created! Welcome, ${customer.name}!`,
      data: {
        user: {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          role: 'customer',
          restaurant: restaurant.name,
          restaurant_id: restaurant.id,
          slug: restaurant.slug
        },
        token: generateToken({
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          role: 'customer',
          slug: restaurant.slug,
          restaurant_id: restaurant.id
        }),
        redirectUrl: `/store/${restaurant.slug}`
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/tenant/:restaurantId/subscription
router.get('/:restaurantId/subscription', (req, res) => {
  try {
    const { restaurantId } = req.params;
    const tenantCtx = resolveTenant(restaurantId);
    if (!tenantCtx) return res.status(404).json({ success: false, error: 'Restaurant not found' });
    const { db: tenantDb, restaurant } = tenantCtx;

    // 1. Get current subscription and plan
    const sub = db.prepare(`
      SELECT 
        s.id as subscription_id,
        s.status as subscription_status,
        s.billing_cycle,
        s.current_period_start,
        s.current_period_end,
        s.trial_ends_at,
        s.auto_renew,
        p.id as plan_id,
        p.name as plan_name,
        p.code as plan_code,
        p.description as plan_description,
        p.price_monthly,
        p.price_yearly,
        p.max_products,
        p.max_staff,
        p.max_monthly_orders,
        p.transaction_fee_percent,
        p.has_qr_ordering,
        p.has_online_payment,
        p.has_custom_domain,
        p.has_advanced_analytics,
        p.has_inventory,
        p.is_popular
      FROM subscriptions s
      JOIN subscription_plans p ON s.plan_id = p.id
      WHERE s.restaurant_id = ?
    `).get(restaurant.id);

    // 2. Resource usage from tenant DB
    const tablesCount = tenantDb.prepare('SELECT COUNT(*) as c FROM restaurant_tables').get()?.c || 0;
    const menuItemsCount = tenantDb.prepare('SELECT COUNT(*) as c FROM menu_items').get()?.c || 0;
    const staffCount = tenantDb.prepare('SELECT COUNT(*) as c FROM staff_members').get()?.c || 0;
    const ordersCount = tenantDb.prepare('SELECT COUNT(*) as c FROM orders').get()?.c || 0;

    // 3. Available plans for upgrade/downgrade
    const availablePlans = db.prepare(`
      SELECT * FROM subscription_plans WHERE is_active = 1 ORDER BY price_monthly ASC
    `).all();

    // 4. Invoices / billing history
    const invoices = db.prepare(`
      SELECT * FROM invoices 
      WHERE restaurant_id = ? 
      ORDER BY id DESC
    `).all(restaurant.id);

    res.json({
      success: true,
      data: {
        subscription: sub || null,
        usage: {
          tablesCount,
          menuItemsCount,
          maxProducts: sub?.max_products || 50,
          staffCount,
          maxStaff: sub?.max_staff || 3,
          ordersCount,
          maxMonthlyOrders: sub?.max_monthly_orders || 300
        },
        availablePlans,
        invoices
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/tenant/:restaurantId/subscription/change-plan
router.post('/:restaurantId/subscription/change-plan', (req, res) => {
  try {
    const { restaurantId } = req.params;
    const { plan_id } = req.body;
    const tenantCtx = resolveTenant(restaurantId);
    if (!tenantCtx) return res.status(404).json({ success: false, error: 'Restaurant not found' });
    const { restaurant } = tenantCtx;

    const plan = db.prepare('SELECT * FROM subscription_plans WHERE id = ?').get(plan_id);
    if (!plan) return res.status(400).json({ success: false, error: 'Selected plan not found' });

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE subscriptions SET
        plan_id = ?,
        updated_at = ?
      WHERE restaurant_id = ?
    `).run(plan_id, now, restaurant.id);

    // Log audit
    db.prepare(`
      INSERT INTO audit_logs (actor_name, actor_role, action, entity_type, entity_id, details, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      restaurant.name,
      'tenant_admin',
      'CHANGE_SUBSCRIPTION_PLAN',
      'subscription',
      restaurant.id,
      `Changed plan to ${plan.name} (₱${plan.price_monthly}/mo)`,
      now
    );

    res.json({
      success: true,
      message: `Subscription plan updated to ${plan.name}!`,
      plan
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/tenant/:slugOrId/media/:mediaId - Serve image directly from tenant's private Atlas database
router.get('/:slugOrId/media/:mediaId', async (req, res) => {
  try {
    const { slugOrId, mediaId } = req.params;
    const tenantCtx = resolveTenant(slugOrId);
    const slug = tenantCtx?.restaurant?.slug || String(slugOrId).toLowerCase().trim();

    const { getTenantMongoDb } = require('../tenantMongoManager');
    const tenantMongo = getTenantMongoDb(slug);
    if (!tenantMongo) return res.status(404).send('Not found');

    const mediaDoc = await tenantMongo.Media.findById(mediaId).lean();
    if (!mediaDoc || !mediaDoc.dataUrl) return res.status(404).send('Image not found');

    const matches = mediaDoc.dataUrl.match(/^data:([a-zA-Z0-9\/+-]+);base64,(.+)$/);
    if (!matches) {
      return res.redirect(mediaDoc.dataUrl);
    }

    const contentType = matches[1] || mediaDoc.contentType || 'image/jpeg';
    const buffer = Buffer.from(matches[2], 'base64');

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.end(buffer);
  } catch (err) {
    res.status(500).send('Error serving media');
  }
});

module.exports = router;

