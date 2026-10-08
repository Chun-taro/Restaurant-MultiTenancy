const express = require('express');
const router = express.Router();
const { db, getTenantDb, seedTenantDineCatalog } = require('../db');

// Helper to resolve tenant database
function resolveTenant(restaurantId) {
  return getTenantDb(db, restaurantId);
}

// POST /api/tenant/:restaurantId/auth/login
router.post('/:restaurantId/auth/login', (req, res) => {
  try {
    const { restaurantId } = req.params;
    const tenantCtx = resolveTenant(restaurantId);
    if (!tenantCtx) return res.status(404).json({ success: false, error: 'Restaurant not found' });
    const { restaurant } = tenantCtx;

    const { pin, email, password } = req.body;

    // 1. PIN-based kitchen staff login (Default: 1234 or 9999)
    if (pin) {
      if (pin === '1234' || pin === '9999' || pin === '0000') {
        return res.json({
          success: true,
          message: 'Kitchen staff authenticated via PIN',
          data: {
            user: { name: 'Kitchen Staff', role: 'kitchen', restaurant: restaurant.name },
            token: `staff_${Buffer.from(restaurant.slug + ':' + Date.now()).toString('base64')}`
          }
        });
      } else {
        return res.status(401).json({ success: false, error: 'Invalid Staff PIN. (Demo PIN: 1234)' });
      }
    }

    // 2. Email & Password staff login
    if (email) {
      const cleanEmail = email.trim().toLowerCase();
      // Allow demo staff or matching restaurant email
      if (password === 'staff123' || password === 'admin123' || cleanEmail.includes(restaurant.slug)) {
        return res.json({
          success: true,
          message: 'Restaurant manager authenticated',
          data: {
            user: { name: 'Restaurant Manager', email: cleanEmail, role: 'manager', restaurant: restaurant.name },
            token: `mgr_${Buffer.from(restaurant.slug + ':' + Date.now()).toString('base64')}`
          }
        });
      } else {
        return res.status(401).json({ success: false, error: 'Invalid staff credentials. (Demo pass: staff123)' });
      }
    }

    return res.status(400).json({ success: false, error: 'Please enter Staff PIN or Manager Credentials' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/tenant/:restaurantId/overview
router.get('/:restaurantId/overview', (req, res) => {
  try {
    const { restaurantId } = req.params;
    const tenantCtx = resolveTenant(restaurantId);
    if (!tenantCtx) return res.status(404).json({ success: false, error: 'Restaurant not found' });

    const { db: tenantDb, restaurant, dbName, dbPath } = tenantCtx;

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

    // Recent 5 orders with items
    const recentOrders = orders.slice(0, 5).map(o => {
      const items = tenantDb.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id);
      return { ...o, items };
    });

    res.json({
      success: true,
      data: {
        restaurant: {
          ...restaurant,
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
      const items = tenantDb.prepare('SELECT * FROM order_items WHERE order_id = ?').all(o.id);
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
    const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];
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
    const items = tenantDb.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);

    res.json({
      success: true,
      message: `Order #${order.order_number} marked as ${status}`,
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

    res.json({
      success: true,
      data: {
        categories: categoriesWithItems,
        totalItems: items.length
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

    tenantDb.prepare('DELETE FROM menu_categories WHERE id = ?').run(id);
    res.json({ success: true, message: 'Category deleted from tenant database' });
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
    const { db: tenantDb } = tenantCtx;

    const { category_id, name, description, price, image_url, is_featured, preparation_time, badge } = req.body;
    if (!name || !price || !category_id) {
      return res.status(400).json({ success: false, error: 'Name, price, and category are required' });
    }

    const now = new Date().toISOString();
    const insert = tenantDb.prepare(`
      INSERT INTO menu_items (
        category_id, name, description, price,
        image_url, is_available, is_featured, preparation_time, badge, created_at
      ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
    `);

    insert.run(
      category_id,
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
    res.json({ success: true, message: 'Item deleted from tenant database' });
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
      logo_url, banner_url, address, city, phone, email
    } = req.body;

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
        updated_at = ?
      WHERE id = ?
    `).run(
      name, cuisine_type, primary_color, secondary_color,
      logo_url, banner_url, address, city, phone, email,
      now, restaurant.id
    );

    const updated = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(restaurant.id);
    res.json({ success: true, data: updated, message: 'Restaurant settings updated!' });
  } catch (err) {
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

module.exports = router;
