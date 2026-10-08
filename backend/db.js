const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const DB_PATH = path.join(__dirname, '..', 'data', 'saas_platform.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'superadmin',
      phone TEXT,
      avatar TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      last_login_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS restaurants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      subdomain TEXT UNIQUE NOT NULL,
      custom_domain TEXT,
      cuisine_type TEXT,
      logo_url TEXT,
      banner_url TEXT,
      primary_color TEXT DEFAULT '#6366F1',
      secondary_color TEXT DEFAULT '#1E293B',
      status TEXT NOT NULL DEFAULT 'active',
      address TEXT,
      city TEXT,
      phone TEXT,
      email TEXT,
      currency TEXT DEFAULT 'PHP',
      orders_count INTEGER DEFAULT 0,
      total_volume REAL DEFAULT 0,
      suspended_reason TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS restaurant_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role TEXT NOT NULL DEFAULT 'owner',
      created_at TEXT NOT NULL,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS subscription_plans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      price_monthly REAL NOT NULL,
      price_yearly REAL NOT NULL,
      currency TEXT DEFAULT 'PHP',
      max_products INTEGER DEFAULT 50,
      max_staff INTEGER DEFAULT 3,
      max_monthly_orders INTEGER DEFAULT 300,
      transaction_fee_percent REAL DEFAULT 2.0,
      has_qr_ordering INTEGER DEFAULT 1,
      has_online_payment INTEGER DEFAULT 1,
      has_custom_domain INTEGER DEFAULT 0,
      has_advanced_analytics INTEGER DEFAULT 0,
      has_inventory INTEGER DEFAULT 0,
      is_popular INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER UNIQUE NOT NULL,
      plan_id INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      billing_cycle TEXT NOT NULL DEFAULT 'monthly',
      current_period_start TEXT NOT NULL,
      current_period_end TEXT NOT NULL,
      trial_ends_at TEXT,
      auto_renew INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
      FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number TEXT UNIQUE NOT NULL,
      restaurant_id INTEGER NOT NULL,
      plan_id INTEGER NOT NULL,
      amount REAL NOT NULL,
      currency TEXT DEFAULT 'PHP',
      status TEXT NOT NULL DEFAULT 'paid',
      billing_period TEXT NOT NULL,
      due_date TEXT NOT NULL,
      paid_at TEXT,
      payment_method TEXT DEFAULT 'Maya / GCash',
      created_at TEXT NOT NULL,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
      FOREIGN KEY (plan_id) REFERENCES subscription_plans(id)
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_name TEXT NOT NULL,
      actor_role TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details TEXT,
      ip_address TEXT DEFAULT '127.0.0.1',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS menu_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT DEFAULT 'ri-restaurant-line',
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      image_url TEXT,
      is_available INTEGER DEFAULT 1,
      is_featured INTEGER DEFAULT 0,
      preparation_time INTEGER DEFAULT 15,
      badge TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS restaurant_tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL,
      table_number TEXT NOT NULL,
      capacity INTEGER DEFAULT 4,
      qr_code_key TEXT NOT NULL,
      status TEXT DEFAULT 'available',
      created_at TEXT NOT NULL,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      restaurant_id INTEGER NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT,
      order_type TEXT NOT NULL DEFAULT 'dine_in',
      table_number TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      payment_method TEXT NOT NULL DEFAULT 'gcash',
      payment_status TEXT NOT NULL DEFAULT 'paid',
      subtotal REAL NOT NULL,
      tax REAL DEFAULT 0,
      total REAL NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      menu_item_id INTEGER,
      item_name TEXT NOT NULL,
      price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      instructions TEXT,
      subtotal REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);

  seedCleanData();
  seedAllTenantsDefaults();
}

function seedCleanData() {
  const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (usersCount > 0) return;

  const now = new Date().toISOString();

  // Seed ONLY the master Super Admin account
  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password_hash, role, phone, avatar, status, last_login_at, created_at, updated_at)
    VALUES (?, ?, ?, 'superadmin', ?, ?, 'active', ?, ?, ?)
  `);

  insertUser.run(
    'Alexandre Vance',
    'admin@restosaas.com',
    'admin123',
    '+63 917 888 1234',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    now,
    now,
    now
  );

  // Seed Subscription Plan Templates
  const insertPlan = db.prepare(`
    INSERT INTO subscription_plans (
      name, code, description, price_monthly, price_yearly, currency,
      max_products, max_staff, max_monthly_orders, transaction_fee_percent,
      has_qr_ordering, has_online_payment, has_custom_domain, has_advanced_analytics,
      has_inventory, is_popular, is_active, created_at
    ) VALUES (?, ?, ?, ?, ?, 'PHP', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `);

  insertPlan.run(
    'Starter Cafe',
    'starter',
    'For pop-ups, food carts, and small bistros starting their digital storefront.',
    1499.00,
    14990.00,
    40, 2, 300, 3.0,
    1, 1, 0, 0, 0, 0, now
  );

  insertPlan.run(
    'Growth Bistro',
    'growth',
    'Standard plan for fast-casual and full-service dining restaurants.',
    2999.00,
    29990.00,
    150, 6, 1200, 2.0,
    1, 1, 1, 1, 0, 1, now
  );

  insertPlan.run(
    'Pro Restaurant',
    'pro',
    'Advanced capabilities with inventory control and unlimited menu items.',
    5499.00,
    54990.00,
    -1, 15, -1, 1.2,
    1, 1, 1, 1, 1, 0, now
  );

  insertPlan.run(
    'Enterprise Franchise',
    'enterprise',
    'Custom limits, dedicated SLA, and multi-branch management.',
    12999.00,
    129990.00,
    -1, 50, -1, 0.5,
    1, 1, 1, 1, 1, 0, now
  );

  // System Settings
  const insertSetting = db.prepare(`
    INSERT INTO system_settings (key, value, category, description, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertSetting.run('platform_name', 'RestoSaaS Platform Suite', 'general', 'Public platform name', now);
  insertSetting.run('default_currency', 'PHP', 'localization', 'Base platform currency (₱ PHP)', now);
  insertSetting.run('currency_symbol', '₱', 'localization', 'Currency display symbol', now);
  insertSetting.run('platform_support_email', 'support@restosaas.com', 'general', 'Master support contact email', now);
  insertSetting.run('trial_days_default', '14', 'billing', 'Default free trial days', now);
  insertSetting.run('allow_self_signup', 'true', 'general', 'Allow public registration', now);
  insertSetting.run('maintenance_mode', 'false', 'system', 'Maintenance mode', now);
  insertSetting.run('payment_gateway_mode', 'sandbox', 'payments', 'Payment gateway operational mode', now);
  insertSetting.run('webhook_signing_secret', 'whsec_9934f828a1d77a0c8b21e8e4a9918b82', 'security', 'HMAC webhook secret', now);

  // Clean initial audit log
  const insertAudit = db.prepare(`
    INSERT INTO audit_logs (actor_name, actor_role, action, entity_type, entity_id, details, ip_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, '127.0.0.1', ?)
  `);
  insertAudit.run('System Root', 'System', 'SYSTEM_INIT', 'platform', '0', 'Clean platform database initialized. Zero tenants provisioned.', now);
}

function seedAllTenantsDefaults() {
  const restaurants = db.prepare('SELECT id, name FROM restaurants').all();
  for (const r of restaurants) {
    seedRestaurantDefaults(r.id, r.name);
  }
}

function seedRestaurantDefaults(restaurantId, restaurantName = 'Restaurant') {
  const catCount = db.prepare('SELECT COUNT(*) as count FROM menu_categories WHERE restaurant_id = ?').get(restaurantId).count;
  if (catCount > 0) return;

  const now = new Date().toISOString();

  // 1. Categories
  const insertCat = db.prepare(`
    INSERT INTO menu_categories (restaurant_id, name, description, icon, sort_order, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, 1, ?)
  `);

  insertCat.run(restaurantId, 'Signature Sizzlers', 'Sizzling hotplates fresh from the grill', 'ri-fire-line', 1, now);
  const cat1 = db.prepare('SELECT last_insert_rowid() as id').get().id;

  insertCat.run(restaurantId, 'Heritage Mains', 'Hearty comfort dishes crafted with authentic recipes', 'ri-restaurant-line', 2, now);
  const cat2 = db.prepare('SELECT last_insert_rowid() as id').get().id;

  insertCat.run(restaurantId, 'Rice & Noodles', 'Fragrant wok-tossed garlic rice and noodles', 'ri-bowl-line', 3, now);
  const cat3 = db.prepare('SELECT last_insert_rowid() as id').get().id;

  insertCat.run(restaurantId, 'Beverages & Brews', 'Chilled handcrafted refreshments & signature drinks', 'ri-cup-line', 4, now);
  const cat4 = db.prepare('SELECT last_insert_rowid() as id').get().id;

  // 2. Menu Items
  const insertItem = db.prepare(`
    INSERT INTO menu_items (
      restaurant_id, category_id, name, description, price,
      image_url, is_available, is_featured, preparation_time, badge, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
  `);

  // Category 1: Sizzlers
  insertItem.run(
    restaurantId, cat1, 'Crispy Sizzling Pork Sisig',
    'Minced pork belly and jowl served on a cast-iron skillet with chili, calamansi & fresh egg.',
    285.00,
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80',
    1, 15, 'Bestseller', now
  );
  const item1 = db.prepare('SELECT last_insert_rowid() as id').get().id;

  insertItem.run(
    restaurantId, cat1, 'Grilled Pork Liempo Inasal',
    'Thick-cut pork belly marinated in lemongrass, annatto, and garlic, flame-grilled to perfection.',
    320.00,
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&auto=format&fit=crop&q=80',
    1, 18, 'Chef Pick', now
  );
  const item2 = db.prepare('SELECT last_insert_rowid() as id').get().id;

  insertItem.run(
    restaurantId, cat1, 'Sizzling Garlic Pepper Beef',
    'Tender beef strips in rich mushroom gravy topped with toasted garlic flakes and butter.',
    360.00,
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=500&auto=format&fit=crop&q=80',
    0, 15, 'Popular', now
  );

  // Category 2: Mains
  insertItem.run(
    restaurantId, cat2, 'Slow-Cooked Beef Kare-Kare',
    'Tender beef shank in peanut sauce with string beans, eggplant, and savory shrimp paste (bagoong).',
    440.00,
    'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop&q=80',
    1, 20, 'Signature', now
  );
  const item3 = db.prepare('SELECT last_insert_rowid() as id').get().id;

  insertItem.run(
    restaurantId, cat2, 'Crispy Pata Golden Roast',
    'Whole pork knuckle deep-fried to a brittle golden crackle, served with soy-vinegar dipping sauce.',
    690.00,
    'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80',
    1, 25, 'Feast', now
  );

  insertItem.run(
    restaurantId, cat2, 'Sinigang na Hipon sa Sampalok',
    'Fresh tiger prawns in a rich sour tamarind broth loaded with kangkong, radish, and tomatoes.',
    395.00,
    'https://images.unsplash.com/photo-1551218808-94e220e084d2?w=500&auto=format&fit=crop&q=80',
    0, 18, null, now
  );

  // Category 3: Rice & Noodles
  insertItem.run(
    restaurantId, cat3, 'Signature Toasted Garlic Rice Platter',
    'Wok-fried Jasmine rice with roasted garlic bits and garlic infused oil. Good for 3-4 persons.',
    160.00,
    'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&auto=format&fit=crop&q=80',
    0, 10, 'Side', now
  );
  const item4 = db.prepare('SELECT last_insert_rowid() as id').get().id;

  insertItem.run(
    restaurantId, cat3, 'Pancit Canton Guisado Especial',
    'Egg noodles stir-fried with pork cuts, chicken livers, shrimp, and fresh seasonal crisp veggies.',
    290.00,
    'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop&q=80',
    1, 15, 'Family Size', now
  );

  // Category 4: Drinks
  insertItem.run(
    restaurantId, cat4, 'Fresh Honey Calamansi Cooler',
    'Freshly squeezed Philippine calamansi with pure honey and crushed mint over ice.',
    95.00,
    'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=500&auto=format&fit=crop&q=80',
    1, 5, 'Refreshing', now
  );
  const item5 = db.prepare('SELECT last_insert_rowid() as id').get().id;

  insertItem.run(
    restaurantId, cat4, 'Ripe Mango Tapioca Shake',
    'Sweet Carabao mangoes blended with milk, shaved ice, and chewy tapioca pearls.',
    125.00,
    'https://images.unsplash.com/photo-1553787499-6f9133860278?w=500&auto=format&fit=crop&q=80',
    1, 5, 'Bestseller', now
  );

  // 3. Tables
  const insertTable = db.prepare(`
    INSERT INTO restaurant_tables (restaurant_id, table_number, capacity, qr_code_key, status, created_at)
    VALUES (?, ?, ?, ?, 'available', ?)
  `);

  insertTable.run(restaurantId, 'T-01', 2, `qr_${restaurantId}_t01`, now);
  insertTable.run(restaurantId, 'T-02', 4, `qr_${restaurantId}_t02`, now);
  insertTable.run(restaurantId, 'T-03', 4, `qr_${restaurantId}_t03`, now);
  insertTable.run(restaurantId, 'T-04', 6, `qr_${restaurantId}_t04`, now);
  insertTable.run(restaurantId, 'VIP-1', 8, `qr_${restaurantId}_vip1`, now);

  // 4. Initial Demo Orders (so orders dashboard is immediately live!)
  const insertOrder = db.prepare(`
    INSERT INTO orders (
      order_number, restaurant_id, customer_name, customer_phone, order_type,
      table_number, status, payment_method, payment_status, subtotal, tax, total, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
  `);

  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (order_id, menu_item_id, item_name, price, quantity, instructions, subtotal)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  // Order 1: Preparing
  const o1Num = `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  insertOrder.run(
    o1Num, restaurantId, 'Marco Valderama', '+63 917 555 1290', 'dine_in',
    'T-02', 'preparing', 'gcash', 'paid', 605.00, 605.00, 'Extra spicy on the sisig please', now, now
  );
  const o1Id = db.prepare('SELECT last_insert_rowid() as id').get().id;
  insertOrderItem.run(o1Id, item1, 'Crispy Sizzling Pork Sisig', 285.00, 1, 'Extra spicy', 285.00);
  insertOrderItem.run(o1Id, item2, 'Grilled Pork Liempo Inasal', 320.00, 1, 'Well done', 320.00);

  // Order 2: Ready
  const o2Num = `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  insertOrder.run(
    o2Num, restaurantId, 'Sarah Jenkins', '+63 920 888 3412', 'dine_in',
    'T-01', 'ready', 'maya', 'paid', 255.00, 255.00, 'No ice on calamansi', now, now
  );
  const o2Id = db.prepare('SELECT last_insert_rowid() as id').get().id;
  insertOrderItem.run(o2Id, item4, 'Signature Toasted Garlic Rice Platter', 160.00, 1, null, 160.00);
  insertOrderItem.run(o2Id, item5, 'Fresh Honey Calamansi Cooler', 95.00, 1, 'No ice', 95.00);

  // Update restaurant stats
  db.prepare(`
    UPDATE restaurants SET
      orders_count = orders_count + 2,
      total_volume = total_volume + 860.00
    WHERE id = ?
  `).run(restaurantId);
}

// Multi-tenant Database Isolation Engine
const { getTenantDb, provisionAllTenantDatabases, seedTenantDineCatalog } = require('./tenantDbManager');

initDatabase();
provisionAllTenantDatabases(db);

module.exports = {
  db,
  initDatabase,
  seedRestaurantDefaults,
  getTenantDb,
  provisionAllTenantDatabases,
  seedTenantDineCatalog
};
