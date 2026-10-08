const express = require('express');
const router = express.Router();
const { db, getTenantDb } = require('../db');

// Helper to resolve tenant
function resolveTenant(slugOrIdentifier) {
  return getTenantDb(db, slugOrIdentifier);
}

// POST /api/storefront/:slug/auth/customer-login - Customer diner authentication & account retrieval
router.post('/:slug/auth/customer-login', (req, res) => {
  try {
    const { slug } = req.params;
    const tenantCtx = resolveTenant(slug);
    if (!tenantCtx) return res.status(404).json({ success: false, error: 'Restaurant not found' });
    const { db: tenantDb, restaurant } = tenantCtx;

    const { phone, name, email } = req.body;
    if (!name && !phone) {
      return res.status(400).json({ success: false, error: 'Please provide diner name or mobile number' });
    }

    const cleanName = (name || '').trim();
    const cleanPhone = (phone || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const now = new Date().toISOString();

    // Check if customer exists in isolated tenant database
    let customer = null;
    if (cleanPhone) {
      customer = tenantDb.prepare('SELECT * FROM customers WHERE phone = ?').get(cleanPhone);
    }
    if (!customer && cleanName) {
      customer = tenantDb.prepare('SELECT * FROM customers WHERE name = ?').get(cleanName);
    }

    if (!customer) {
      // Register new customer in tenant's isolated database
      tenantDb.prepare(`
        INSERT INTO customers (name, phone, email, total_orders, total_spent, last_order_at, created_at)
        VALUES (?, ?, ?, 0, 0, NULL, ?)
      `).run(cleanName || 'Diner', cleanPhone, cleanEmail, now);
      const newId = tenantDb.prepare('SELECT last_insert_rowid() as id').get().id;
      customer = tenantDb.prepare('SELECT * FROM customers WHERE id = ?').get(newId);
    } else if (cleanName && customer.name !== cleanName) {
      // Update name if provided
      tenantDb.prepare('UPDATE customers SET name = ? WHERE id = ?').run(cleanName, customer.id);
      customer.name = cleanName;
    }

    // Retrieve past orders from tenant's isolated database
    const pastOrders = tenantDb.prepare(`
      SELECT * FROM orders
      WHERE customer_name = ? OR customer_phone = ?
      ORDER BY id DESC LIMIT 10
    `).all(customer.name, customer.phone || '---');

    res.json({
      success: true,
      message: `Welcome back, ${customer.name}!`,
      data: {
        customer,
        pastOrders,
        token: `cust_${Buffer.from(String(customer.id) + ':' + Date.now()).toString('base64')}`
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/storefront/:slug - Public restaurant profile & menu for customer
router.get('/:slug', (req, res) => {
  try {
    const { slug } = req.params;
    const tenantCtx = resolveTenant(slug);

    if (!tenantCtx) {
      return res.status(404).json({ success: false, error: 'Restaurant not found' });
    }

    const { db: tenantDb, restaurant, dbName, dbPath } = tenantCtx;

    if (restaurant.status === 'suspended') {
      return res.status(403).json({ success: false, error: 'This restaurant storefront is currently unavailable.' });
    }

    // Categories from isolated tenant database
    const categories = tenantDb.prepare(`
      SELECT * FROM menu_categories
      WHERE is_active = 1
      ORDER BY sort_order ASC, id ASC
    `).all();

    // Available menu items from isolated tenant database
    const items = tenantDb.prepare(`
      SELECT * FROM menu_items
      WHERE is_available = 1
      ORDER BY is_featured DESC, id ASC
    `).all();

    // Available tables from isolated tenant database
    const tables = tenantDb.prepare(`
      SELECT id, table_number, capacity, qr_code_key
      FROM restaurant_tables
      WHERE status = 'available'
      ORDER BY table_number ASC
    `).all();

    const categoriesWithItems = categories.map(cat => ({
      ...cat,
      items: items.filter(it => it.category_id === cat.id)
    }));

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
          engine: 'SQLite (Isolated Tenant DB)'
        },
        urls: {
          subdomain_url: `http://${restaurant.subdomain}.localhost:5173`,
          path_url: `http://localhost:5173/store/${restaurant.slug}`,
          custom_domain: restaurant.custom_domain ? `https://${restaurant.custom_domain}` : null
        },
        categories: categoriesWithItems,
        featuredItems: items.filter(it => it.is_featured === 1),
        tables
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/storefront/:slug/orders - Customer places an order into tenant's isolated DB
router.post('/:slug/orders', (req, res) => {
  try {
    const { slug } = req.params;
    const tenantCtx = resolveTenant(slug);
    if (!tenantCtx) return res.status(404).json({ success: false, error: 'Restaurant not found' });

    const { db: tenantDb, restaurant, dbName } = tenantCtx;
    if (restaurant.status === 'suspended') {
      return res.status(403).json({ success: false, error: 'Restaurant is currently unavailable' });
    }

    const {
      customer_name,
      customer_phone,
      order_type = 'dine_in',
      table_number,
      payment_method = 'gcash',
      notes,
      items
    } = req.body;

    if (!customer_name || !customer_name.trim()) {
      return res.status(400).json({ success: false, error: 'Your name is required to place an order.' });
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Your cart is empty. Please add items to checkout.' });
    }

    // Validate against isolated tenant items table
    let subtotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const dbItem = tenantDb.prepare('SELECT * FROM menu_items WHERE id = ?').get(item.id);
      if (!dbItem) continue;

      const qty = Math.max(1, parseInt(item.quantity) || 1);
      const itemSubtotal = dbItem.price * qty;
      subtotal += itemSubtotal;

      validatedItems.push({
        menu_item_id: dbItem.id,
        item_name: dbItem.name,
        price: dbItem.price,
        quantity: qty,
        instructions: item.instructions || '',
        subtotal: itemSubtotal
      });
    }

    if (validatedItems.length === 0) {
      return res.status(400).json({ success: false, error: 'No valid items found in order.' });
    }

    const total = subtotal;
    const orderNumber = `ORD-${Date.now().toString().slice(-4)}${Math.floor(10 + Math.random() * 90)}`;
    const now = new Date().toISOString();

    // Insert order directly into isolated tenant database
    const insertOrder = tenantDb.prepare(`
      INSERT INTO orders (
        order_number, customer_name, customer_phone,
        order_type, table_number, status, payment_method, payment_status,
        subtotal, tax, total, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, 'pending', ?, 'paid', ?, 0, ?, ?, ?, ?)
    `);

    insertOrder.run(
      orderNumber,
      customer_name.trim(),
      customer_phone || '',
      order_type,
      table_number || (order_type === 'takeaway' ? 'Takeout' : 'Walk-in'),
      payment_method,
      subtotal,
      total,
      notes || '',
      now,
      now
    );

    const orderId = tenantDb.prepare('SELECT last_insert_rowid() as id').get().id;

    // Insert order items into isolated tenant database
    const insertItem = tenantDb.prepare(`
      INSERT INTO order_items (order_id, menu_item_id, item_name, price, quantity, instructions, subtotal)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const vItem of validatedItems) {
      insertItem.run(
        orderId,
        vItem.menu_item_id,
        vItem.item_name,
        vItem.price,
        vItem.quantity,
        vItem.instructions,
        vItem.subtotal
      );
    }

    // Record or update customer profile in tenant's isolated database
    try {
      const existingCust = tenantDb.prepare('SELECT id FROM customers WHERE name = ?').get(customer_name.trim());
      if (existingCust) {
        tenantDb.prepare(`
          UPDATE customers SET
            total_orders = total_orders + 1,
            total_spent = total_spent + ?,
            last_order_at = ?
          WHERE id = ?
        `).run(total, now, existingCust.id);
      } else {
        tenantDb.prepare(`
          INSERT INTO customers (name, phone, email, total_orders, total_spent, last_order_at, created_at)
          VALUES (?, ?, '', 1, ?, ?, ?)
        `).run(customer_name.trim(), customer_phone || '', total, now, now);
      }
    } catch (e) {}

    // Update global platform metrics in master database
    db.prepare(`
      UPDATE restaurants SET
        orders_count = orders_count + 1,
        total_volume = total_volume + ?
      WHERE id = ?
    `).run(total, restaurant.id);

    const createdOrder = tenantDb.prepare('SELECT * FROM orders WHERE id = ?').get(orderId);
    const orderItems = tenantDb.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);

    res.status(201).json({
      success: true,
      message: `Order #${orderNumber} placed in isolated tenant DB (${dbName})!`,
      data: {
        ...createdOrder,
        restaurant_name: restaurant.name,
        database_file: dbName,
        items: orderItems
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/storefront/:slug/orders/:orderNumber - Customer real-time order tracking
router.get('/:slug/orders/:orderNumber', (req, res) => {
  try {
    const { slug, orderNumber } = req.params;
    const tenantCtx = resolveTenant(slug);
    if (!tenantCtx) return res.status(404).json({ success: false, error: 'Restaurant not found' });

    const { db: tenantDb, restaurant, dbName } = tenantCtx;

    const order = tenantDb.prepare('SELECT * FROM orders WHERE order_number = ?').get(orderNumber);
    if (!order) return res.status(404).json({ success: false, error: 'Order not found in restaurant database' });

    const items = tenantDb.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);

    res.json({
      success: true,
      data: {
        ...order,
        database_file: dbName,
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          logo_url: restaurant.logo_url,
          primary_color: restaurant.primary_color,
          phone: restaurant.phone,
          address: restaurant.address
        },
        items
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
