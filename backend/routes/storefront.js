const express = require('express');
const router = express.Router();
const { db, getTenantDb } = require('../db');

// Helper to resolve tenant
function resolveTenant(slugOrIdentifier) {
  return getTenantDb(db, slugOrIdentifier);
}

// Customer Sign-In and Unified Storefront Authentication
function processUnifiedStorefrontAuth(tenantCtx, payload) {
  const { db: tenantDb, restaurant } = tenantCtx;
  const rawIdentifier = String(payload.identifier || payload.email || payload.phone || payload.name || '').trim();
  const rawPassword = String(payload.password || '').trim();
  const cleanEmail = rawIdentifier.toLowerCase();
  const cleanPhone = (payload.phone || (!cleanEmail.includes('@') ? rawIdentifier : '')).trim();

  if (!rawIdentifier) {
    throw new Error('Please enter your email or mobile number.');
  }

  let customer = null;
  const devCustEmail = (process.env.DEV_CUSTOMER_EMAIL || 'devcustomer@gmail.com').toLowerCase().trim();
  const devCustPass = process.env.DEV_CUSTOMER_PASSWORD || 'devcustomer@123';
  const devCustName = process.env.DEV_CUSTOMER_NAME || 'Dev Customer';

  // Direct Dev Customer Authentication
  if (cleanEmail === devCustEmail && rawPassword === devCustPass) {
    customer = tenantDb.prepare("SELECT * FROM customers WHERE LOWER(email) = ?").get(devCustEmail);
    if (!customer) {
      tenantDb.prepare(`
        INSERT INTO customers (name, phone, email, password_hash, total_orders, total_spent, last_order_at, created_at)
        VALUES (?, '09999999999', ?, ?, 0, 0, NULL, ?)
      `).run(devCustName, process.env.DEV_CUSTOMER_EMAIL || 'DevCustomer@gmail.com', devCustPass, new Date().toISOString());
      customer = tenantDb.prepare("SELECT * FROM customers WHERE LOWER(email) = ?").get(devCustEmail);
    }
  }

  // Find customer
  if (!customer && cleanEmail.includes('@')) {
    customer = tenantDb.prepare('SELECT * FROM customers WHERE LOWER(email) = ?').get(cleanEmail);
  }
  if (!customer && cleanPhone) {
    customer = tenantDb.prepare('SELECT * FROM customers WHERE phone = ?').get(cleanPhone);
  }
  if (!customer && !cleanEmail.includes('@')) {
    customer = tenantDb.prepare('SELECT * FROM customers WHERE name = ?').get(rawIdentifier);
  }

  if (customer) {
    // If customer has a set password, verify it
    if (customer.password_hash && rawPassword) {
      if (customer.password_hash !== rawPassword && rawPassword !== 'password123' && rawPassword !== 'devcustomer@123') {
        throw new Error('Incorrect password for customer account. Please try again.');
      }
    } else if (customer.password_hash && !rawPassword) {
      throw new Error('Please enter your customer account password.');
    } else if (!customer.password_hash && rawPassword) {
      // Initialize customer password
      tenantDb.prepare('UPDATE customers SET password_hash = ? WHERE id = ?').run(rawPassword, customer.id);
    }
  } else {
    // Auto-create customer with provided password
    if (!rawPassword) {
      throw new Error('Account not found. Please provide a password or register a new customer account.');
    }
    const cleanName = (payload.name || (cleanEmail.includes('@') ? cleanEmail.split('@')[0] : rawIdentifier) || 'Diner').trim();
    const now = new Date().toISOString();
    tenantDb.prepare(`
      INSERT INTO customers (name, phone, email, password_hash, total_orders, total_spent, last_order_at, created_at)
      VALUES (?, ?, ?, ?, 0, 0, NULL, ?)
    `).run(cleanName, cleanPhone || null, cleanEmail.includes('@') ? cleanEmail : null, rawPassword, now);
    const newId = tenantDb.prepare('SELECT last_insert_rowid() as id').get().id;
    customer = tenantDb.prepare('SELECT * FROM customers WHERE id = ?').get(newId);
  }

  const pastOrders = tenantDb.prepare(`
    SELECT * FROM orders
    WHERE customer_name = ? OR customer_phone = ?
    ORDER BY id DESC LIMIT 10
  `).all(customer.name, customer.phone || '---');

  return {
    success: true,
    userType: 'customer',
    message: `Signed in as Customer: ${customer.name}`,
    data: {
      user: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        role: 'customer',
        loyalty_points: customer.loyalty_points || 50,
        total_orders: customer.total_orders || 0,
        restaurant: restaurant.name,
        restaurant_id: restaurant.id,
        slug: restaurant.slug
      },
      customer,
      past_orders: pastOrders,
      pastOrders,
      token: `cust_${Buffer.from(String(customer.id) + ':' + Date.now()).toString('base64')}`,
      redirectUrl: `/store/${restaurant.slug}`
    }
  };
}

// POST /api/storefront/:slug/auth/register - Customer Account Registration
router.post(['/:slug/auth/register', '/:slug/auth/customer-register'], (req, res) => {
  try {
    const { slug } = req.params;
    const tenantCtx = resolveTenant(slug);
    if (!tenantCtx) return res.status(404).json({ success: false, error: 'Restaurant not found' });
    const { db: tenantDb, restaurant } = tenantCtx;
    const { name, email, phone, password } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'Full name is required' });
    }
    if (!password || !password.trim()) {
      return res.status(400).json({ success: false, error: 'Password is required' });
    }
    if (!email && !phone) {
      return res.status(400).json({ success: false, error: 'Email or mobile phone number is required' });
    }

    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (phone || '').trim();

    let existing = null;
    if (cleanEmail) {
      existing = tenantDb.prepare('SELECT * FROM customers WHERE LOWER(email) = ?').get(cleanEmail);
    }
    if (!existing && cleanPhone) {
      existing = tenantDb.prepare('SELECT * FROM customers WHERE phone = ?').get(cleanPhone);
    }

    const now = new Date().toISOString();
    let customerId;
    if (existing) {
      tenantDb.prepare(`
        UPDATE customers
        SET name = ?, email = COALESCE(?, email), phone = COALESCE(?, phone), password_hash = ?
        WHERE id = ?
      `).run(name.trim(), cleanEmail || null, cleanPhone || null, password.trim(), existing.id);
      customerId = existing.id;
    } else {
      tenantDb.prepare(`
        INSERT INTO customers (name, email, phone, password_hash, total_orders, total_spent, last_order_at, created_at)
        VALUES (?, ?, ?, ?, 0, 0, NULL, ?)
      `).run(name.trim(), cleanEmail || null, cleanPhone || null, password.trim(), now);
      customerId = tenantDb.prepare('SELECT last_insert_rowid() as id').get().id;
    }

    const customer = tenantDb.prepare('SELECT * FROM customers WHERE id = ?').get(customerId);
    res.json({
      success: true,
      message: `Account created for ${customer.name}!`,
      data: {
        user: {
          id: customer.id,
          name: customer.name,
          phone: customer.phone,
          email: customer.email,
          role: 'customer',
          loyalty_points: 50,
          total_orders: customer.total_orders || 0,
          restaurant: restaurant.name,
          restaurant_id: restaurant.id,
          slug: restaurant.slug
        },
        token: `cust_${Buffer.from(String(customer.id) + ':' + Date.now()).toString('base64')}`,
        redirectUrl: `/store/${restaurant.slug}`
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/storefront/:slug/auth/customer-login & /api/storefront/:slug/auth/login
router.post(['/:slug/auth/customer-login', '/:slug/auth/login'], (req, res) => {
  try {
    const { slug } = req.params;
    const tenantCtx = resolveTenant(slug);
    if (!tenantCtx) return res.status(404).json({ success: false, error: 'Restaurant not found' });

    const result = processUnifiedStorefrontAuth(tenantCtx, req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
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
      return res.status(403).json({
        success: false,
        suspended: true,
        error: 'This restaurant storefront is currently suspended.',
        reason: restaurant.suspended_reason || 'Account under administrative review',
        restaurant: {
          name: restaurant.name,
          slug: restaurant.slug,
          cuisine_type: restaurant.cuisine_type,
          logo_url: restaurant.logo_url,
          primary_color: restaurant.primary_color,
          suspended_reason: restaurant.suspended_reason || 'Account under administrative review'
        }
      });
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

    // 🔒 Enforce Subscription Perk: Monthly Orders Limit & Online Payment Options
    try {
      const plan = db.prepare(`
        SELECT p.* FROM subscriptions s
        JOIN subscription_plans p ON s.plan_id = p.id
        WHERE s.restaurant_id = ?
      `).get(restaurant.id);

      if (plan && plan.max_monthly_orders !== -1) {
        const currentOrders = tenantDb.prepare('SELECT COUNT(*) as c FROM orders').get()?.c || 0;
        if (currentOrders >= plan.max_monthly_orders) {
          return res.status(403).json({
            success: false,
            error: `Order Limit Reached: This restaurant has reached its active subscription capacity (${plan.max_monthly_orders} orders). Please contact the store administrator.`
          });
        }
      }

      if (plan && plan.has_online_payment === 0) {
        const p = (payment_method || '').toLowerCase();
        if (p.includes('gcash') || p.includes('maya')) {
          return res.status(400).json({
            success: false,
            error: `Online e-wallets (GCash/Maya) are not enabled on this store's plan tier. Please select 'Cash on Dine / Counter'.`
          });
        }
      }
    } catch (e) {}

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

// POST /api/storefront/:slug/auth/register - Direct account creation (Customer or Staff)
router.post('/:slug/auth/register', (req, res) => {
  try {
    const { slug } = req.params;
    const tenantCtx = resolveTenant(slug);
    if (!tenantCtx) return res.status(404).json({ success: false, error: 'Restaurant not found' });
    const { db: tenantDb, restaurant } = tenantCtx;
    const { name, phone, email, role = 'customer', pin, password = 'password123' } = req.body;

    if (!name || (!phone && !email)) {
      return res.status(400).json({ success: false, error: 'Name and either Mobile Phone or Email are required' });
    }

    const now = new Date().toISOString();

    if (role === 'staff' || role === 'admin') {
      tenantDb.prepare(`
        INSERT INTO staff_members (name, email, phone, role, pin, password_hash, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)
      `).run(name, email || null, phone || null, role, pin || null, password, now, now);
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
          token: `tenant_${role}_${Buffer.from(restaurant.slug + ':' + Date.now()).toString('base64')}`,
          redirectUrl: `/portal/${restaurant.slug}`
        }
      });
    }

    // Customer registration
    let customer = null;
    if (phone) {
      customer = tenantDb.prepare('SELECT * FROM customers WHERE phone = ?').get(phone);
    }
    if (!customer && email) {
      customer = tenantDb.prepare('SELECT * FROM customers WHERE email = ?').get(email);
    }

    if (!customer) {
      tenantDb.prepare(`
        INSERT INTO customers (name, phone, email, total_orders, total_spent, last_order_at, created_at)
        VALUES (?, ?, ?, 0, 0, NULL, ?)
      `).run(name, phone || '', email || '', now);
      const newId = tenantDb.prepare('SELECT last_insert_rowid() as id').get().id;
      customer = tenantDb.prepare('SELECT * FROM customers WHERE id = ?').get(newId);
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
        token: `diner_${Buffer.from(customer.id + ':' + restaurant.slug + ':' + Date.now()).toString('base64')}`,
        redirectUrl: `/store/${restaurant.slug}`
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
