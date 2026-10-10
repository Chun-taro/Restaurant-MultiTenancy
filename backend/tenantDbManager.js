const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const TENANTS_DIR = path.join(__dirname, '..', 'data', 'tenants');
if (!fs.existsSync(TENANTS_DIR)) {
  fs.mkdirSync(TENANTS_DIR, { recursive: true });
}

// Dedicated root directory for tenant media and image uploads
const TENANTS_UPLOADS_DIR = path.join(__dirname, '..', 'uploads', 'tenants');
if (!fs.existsSync(TENANTS_UPLOADS_DIR)) {
  fs.mkdirSync(TENANTS_UPLOADS_DIR, { recursive: true });
}

/**
 * Ensures an isolated upload directory structure exists for a specific tenant
 * Structure: uploads/tenants/<slug>/{logo, banner, menu}
 */
function ensureTenantUploadDir(slug) {
  if (!slug) return null;
  const clean = String(slug).toLowerCase().trim().replace(/[^a-z0-9_-]/g, '-');
  const tenantDir = path.join(TENANTS_UPLOADS_DIR, clean);
  
  if (!fs.existsSync(tenantDir)) {
    fs.mkdirSync(tenantDir, { recursive: true });
  }

  // Pre-create standard customization subfolders
  const subfolders = ['logo', 'banner', 'menu'];
  for (const sub of subfolders) {
    const subPath = path.join(tenantDir, sub);
    if (!fs.existsSync(subPath)) {
      fs.mkdirSync(subPath, { recursive: true });
    }
  }

  return {
    dirPath: tenantDir,
    publicUrl: `/uploads/tenants/${clean}`,
    subfolders: {
      logo: path.join(tenantDir, 'logo'),
      banner: path.join(tenantDir, 'banner'),
      menu: path.join(tenantDir, 'menu')
    }
  };
}

// In-memory connection pool for open tenant databases
const tenantDbCache = new Map();

/**
 * Initialize isolated schema for a tenant's private database
 */
function initTenantSchema(tenantDb, restaurant = null) {
  tenantDb.exec(`
    CREATE TABLE IF NOT EXISTS menu_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      icon TEXT DEFAULT 'ri-restaurant-line',
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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
      FOREIGN KEY (category_id) REFERENCES menu_categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS restaurant_tables (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_number TEXT NOT NULL,
      capacity INTEGER DEFAULT 4,
      qr_code_key TEXT NOT NULL,
      status TEXT DEFAULT 'available',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
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
      updated_at TEXT NOT NULL
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

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      password_hash TEXT,
      total_orders INTEGER DEFAULT 0,
      total_spent REAL DEFAULT 0,
      last_order_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS staff_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      role TEXT NOT NULL DEFAULT 'staff',
      pin TEXT,
      password_hash TEXT,
      status TEXT NOT NULL DEFAULT 'active',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tenant_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS menu_addons (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      price REAL NOT NULL DEFAULT 0,
      type TEXT DEFAULT 'food',
      is_available INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );
  `);

  // Safe migrations for existing tenant databases
  try {
    tenantDb.prepare('ALTER TABLE customers ADD COLUMN password_hash TEXT').run();
  } catch (e) {}
  try {
    tenantDb.prepare('ALTER TABLE staff_members ADD COLUMN password_hash TEXT').run();
  } catch (e) {}

  const now = new Date().toISOString();

  // Ensure default starter add-ons exist for tenant if empty
  try {
    const addonCount = tenantDb.prepare('SELECT COUNT(*) as count FROM menu_addons').get()?.count || 0;
    if (addonCount === 0) {
      const insertAddon = tenantDb.prepare(`
        INSERT INTO menu_addons (name, price, type, is_available, created_at)
        VALUES (?, ?, ?, 1, ?)
      `);
      insertAddon.run('Extra Garlic Rice', 25, 'food', now);
      insertAddon.run('Sunny-Side Egg', 20, 'food', now);
      insertAddon.run('Melted Cheese Sauce', 25, 'food', now);
      insertAddon.run('Extra Espresso Shot', 30, 'drink', now);
      insertAddon.run('Upgrade to Oat Milk', 25, 'drink', now);
    }
  } catch (e) {}

  // Ensure starter tables exist for QR dine-in ordering if empty
  try {
    const tableCount = tenantDb.prepare('SELECT COUNT(*) as count FROM restaurant_tables').get()?.count || 0;
    if (tableCount === 0) {
      const slug = restaurant?.slug || 'resto';
      const insertTable = tenantDb.prepare(`
        INSERT INTO restaurant_tables (table_number, capacity, qr_code_key, status, created_at)
        VALUES (?, ?, ?, 'available', ?)
      `);
      for (let i = 1; i <= 6; i++) {
        insertTable.run(`Table ${i}`, 4, `qr_${slug}_t${i}`, now);
      }
    }
  } catch (e) {
    // Silently ignore
  }



  // Ensure universal Developer accounts exist in every tenant database if specified in .env
  try {
    const devOwnerName = process.env.DEV_OWNER_NAME;
    const devOwnerEmail = process.env.DEV_OWNER_EMAIL ? process.env.DEV_OWNER_EMAIL.trim() : null;
    const devOwnerPass = process.env.DEV_OWNER_PASSWORD;

    const devStaffName = process.env.DEV_STAFF_NAME;
    const devStaffEmail = process.env.DEV_STAFF_EMAIL ? process.env.DEV_STAFF_EMAIL.trim() : null;
    const devStaffPass = process.env.DEV_STAFF_PASSWORD;

    const devCustomerName = process.env.DEV_CUSTOMER_NAME;
    const devCustomerEmail = process.env.DEV_CUSTOMER_EMAIL ? process.env.DEV_CUSTOMER_EMAIL.trim() : null;
    const devCustomerPass = process.env.DEV_CUSTOMER_PASSWORD;

    // 1. Dev Owner (Role: admin in staff_members)
    if (devOwnerName && devOwnerEmail && devOwnerPass) {
      const existingDevOwner = tenantDb.prepare("SELECT id FROM staff_members WHERE LOWER(email) = ?").get(devOwnerEmail.toLowerCase());
      if (!existingDevOwner) {
        tenantDb.prepare(`
          INSERT INTO staff_members (name, email, phone, role, pin, password_hash, status, created_at, updated_at)
          VALUES (?, ?, '+63 900 000 0002', 'admin', '1234', ?, 'active', ?, ?)
        `).run(devOwnerName, devOwnerEmail, devOwnerPass, now, now);
      } else {
        tenantDb.prepare(`
          UPDATE staff_members SET name = ?, password_hash = ?, role = 'admin', status = 'active'
          WHERE id = ?
        `).run(devOwnerName, devOwnerPass, existingDevOwner.id);
      }
    }

    // 2. Dev Staff (Role: staff in staff_members)
    if (devStaffName && devStaffEmail && devStaffPass) {
      const existingDevStaff = tenantDb.prepare("SELECT id FROM staff_members WHERE LOWER(email) = ?").get(devStaffEmail.toLowerCase());
      if (!existingDevStaff) {
        tenantDb.prepare(`
          INSERT INTO staff_members (name, email, phone, role, pin, password_hash, status, created_at, updated_at)
          VALUES (?, ?, '+63 900 000 0003', 'staff', '1234', ?, 'active', ?, ?)
        `).run(devStaffName, devStaffEmail, devStaffPass, now, now);
      } else {
        tenantDb.prepare(`
          UPDATE staff_members SET name = ?, password_hash = ?, role = 'staff', status = 'active'
          WHERE id = ?
        `).run(devStaffName, devStaffPass, existingDevStaff.id);
      }
    }

    // 3. Dev Customer (In customers table)
    if (devCustomerName && devCustomerEmail && devCustomerPass) {
      const existingDevCustomer = tenantDb.prepare("SELECT id FROM customers WHERE LOWER(email) = ?").get(devCustomerEmail.toLowerCase());
      if (!existingDevCustomer) {
        tenantDb.prepare(`
          INSERT INTO customers (name, phone, email, password_hash, total_orders, total_spent, last_order_at, created_at)
          VALUES (?, '09999999999', ?, ?, 0, 0, NULL, ?)
        `).run(devCustomerName, devCustomerEmail, devCustomerPass, now);
      } else {
        tenantDb.prepare(`
          UPDATE customers SET name = ?, password_hash = ?
          WHERE id = ?
        `).run(devCustomerName, devCustomerPass, existingDevCustomer.id);
      }
    }
  } catch (e) {
    // Silently handle
  }
}

/**
 * Gets or dynamically initializes an isolated SQLite database connection for a tenant
 * @param {object} masterDb - Master SQLite database handle
 * @param {string|number} identifier - Restaurant ID or slug or subdomain
 * @returns {object} { db: DatabaseSync, restaurant: object, dbPath: string, dbName: string }
 */
function getTenantDb(masterDb, identifier) {
  let restaurant;
  if (typeof identifier === 'number' || /^\d+$/.test(String(identifier))) {
    restaurant = masterDb.prepare('SELECT * FROM restaurants WHERE id = ?').get(Number(identifier));
  } else {
    const clean = String(identifier).toLowerCase().trim();
    restaurant = masterDb.prepare('SELECT * FROM restaurants WHERE slug = ? OR subdomain = ?').get(clean, clean);
  }

  if (!restaurant) {
    return null;
  }

  const dbName = `tenant_${restaurant.slug}.db`;
  const dbPath = path.join(TENANTS_DIR, dbName);

  let tenantDb = tenantDbCache.get(restaurant.slug);
  if (!tenantDb) {
    tenantDb = new DatabaseSync(dbPath);
    try {
      tenantDb.exec('PRAGMA journal_mode = WAL;');
      tenantDb.exec('PRAGMA busy_timeout = 5000;');
    } catch (e) {}
    initTenantSchema(tenantDb, restaurant);

    tenantDbCache.set(restaurant.slug, tenantDb);

    // Update master restaurant record with its database metadata
    try {
      masterDb.prepare(`
        UPDATE restaurants SET
          db_name = ?,
          db_path = ?
        WHERE id = ?
      `).run(dbName, `data/tenants/${dbName}`, restaurant.id);
    } catch (e) {
      // Column might not exist yet if migration hasn't run
    }
  }

  // Ensure individual upload folder exists for this tenant
  const uploadInfo = ensureTenantUploadDir(restaurant.slug);

  return {
    db: tenantDb,
    restaurant,
    dbPath: `data/tenants/${dbName}`,
    dbName,
    fullPath: dbPath,
    uploadDir: uploadInfo?.dirPath,
    uploadUrl: uploadInfo?.publicUrl
  };
}

/**
 * Ensures all existing restaurants have their isolated database created
 */
function provisionAllTenantDatabases(masterDb) {
  // Add columns to master restaurants table if not present
  try {
    masterDb.exec(`ALTER TABLE restaurants ADD COLUMN db_name TEXT`);
  } catch (e) {}
  try {
    masterDb.exec(`ALTER TABLE restaurants ADD COLUMN db_path TEXT`);
  } catch (e) {}

  const restaurants = masterDb.prepare('SELECT id, slug, name FROM restaurants').all();
  for (const r of restaurants) {
    ensureTenantUploadDir(r.slug);
    getTenantDb(masterDb, r.id);
  }
}

module.exports = {
  getTenantDb,
  provisionAllTenantDatabases,
  ensureTenantUploadDir,
  initTenantSchema,
  TENANTS_DIR,
  TENANTS_UPLOADS_DIR
};
