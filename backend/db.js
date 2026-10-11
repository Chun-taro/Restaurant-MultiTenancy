const path = require('node:path');
const fs = require('node:fs');

// Ensure .env is loaded regardless of execution working directory
const envPaths = [
  path.join(__dirname, '.env'),
  path.join(__dirname, '..', '.env')
];
for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath, quiet: true });
  }
}
require('dotenv').config({ quiet: true });

const { DatabaseSync } = require('node:sqlite');

const DB_PATH = path.join(__dirname, '..', 'data', 'saas_platform.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new DatabaseSync(DB_PATH);
try {
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA busy_timeout = 5000;');
  db.exec('PRAGMA foreign_keys = ON;');
} catch (e) {}

/**
 * Executes a callback within an atomic SQLite transaction (BEGIN IMMEDIATE / COMMIT / ROLLBACK)
 * @param {DatabaseSync} targetDb 
 * @param {Function} callback 
 * @returns {*}
 */
function withTransaction(targetDb, callback) {
  targetDb.exec('BEGIN IMMEDIATE;');
  try {
    const result = callback(targetDb);
    targetDb.exec('COMMIT;');
    return result;
  } catch (err) {
    try {
      targetDb.exec('ROLLBACK;');
    } catch (rbErr) {}
    throw err;
  }
}

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
  // Safe migration for theme_config column in restaurants
  try {
    db.exec('ALTER TABLE restaurants ADD COLUMN theme_config TEXT;');
  } catch (e) {}
}

function seedCleanData() {
  const now = new Date().toISOString();

  // 1. Seed Master Super Admin account if users table is empty
  const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (usersCount === 0) {
    const superName = process.env.DEV_SUPERADMIN_NAME || 'RestoSaaS Dev Admin';
    const superEmail = (process.env.DEV_SUPERADMIN_EMAIL || 'RestoSaasDev@gmail.com').toLowerCase().trim();
    const superPass = process.env.DEV_SUPERADMIN_PASSWORD || 'restosaasdev@123';

    const insertUser = db.prepare(`
      INSERT OR IGNORE INTO users (name, email, password_hash, role, phone, avatar, status, last_login_at, created_at, updated_at)
      VALUES (?, ?, ?, 'superadmin', ?, ?, 'active', ?, ?, ?)
    `);

    const superAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(superName)}`;
    insertUser.run(
      superName,
      superEmail,
      superPass,
      null,
      superAvatar,
      now,
      now,
      now
    );
  }

  // 2. Seed Subscription Plan Templates if subscription_plans table is empty
  const plansCount = db.prepare('SELECT COUNT(*) as count FROM subscription_plans').get().count;
  if (plansCount === 0) {
    const insertPlan = db.prepare(`
      INSERT OR IGNORE INTO subscription_plans (
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
  }

  // 3. System Settings if system_settings table is empty
  const settingsCount = db.prepare('SELECT COUNT(*) as count FROM system_settings').get().count;
  if (settingsCount === 0) {
    const insertSetting = db.prepare(`
      INSERT OR IGNORE INTO system_settings (key, value, category, description, updated_at)
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
  }

  // 4. Initial audit log if audit_logs table is empty
  const auditCount = db.prepare('SELECT COUNT(*) as count FROM audit_logs').get().count;
  if (auditCount === 0) {
    const insertAudit = db.prepare(`
      INSERT INTO audit_logs (actor_name, actor_role, action, entity_type, entity_id, details, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, '127.0.0.1', ?)
    `);
    insertAudit.run('System Root', 'System', 'SYSTEM_INIT', 'platform', '0', 'Clean platform database initialized. Zero tenants provisioned.', now);
  }
}

function ensureDevMasterAccounts() {
  const now = new Date().toISOString();

  // 1. Permanent Developer Superadmin Account
  const devSuperName = process.env.DEV_SUPERADMIN_NAME || 'RestoSaaS Dev Admin';
  const devSuperEmail = (process.env.DEV_SUPERADMIN_EMAIL || 'RestoSaasDev@gmail.com').trim();
  const devSuperPass = process.env.DEV_SUPERADMIN_PASSWORD || 'restosaasdev@123';

  if (devSuperName && devSuperEmail && devSuperPass) {
    const existingDev = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(devSuperEmail.toLowerCase());
    if (!existingDev) {
      db.prepare(`
        INSERT INTO users (name, email, password_hash, role, phone, avatar, status, created_at, updated_at)
        VALUES (?, ?, ?, 'superadmin', ?, ?, 'active', ?, ?)
      `).run(
        devSuperName,
        devSuperEmail,
        devSuperPass,
        null,
        `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(devSuperName)}`,
        now,
        now
      );
    } else {
      db.prepare(`
        UPDATE users SET name = ?, password_hash = ?, role = 'superadmin', status = 'active'
        WHERE id = ?
      `).run(devSuperName, devSuperPass, existingDev.id);
    }
  }

  // 2. Dev Owner Account
  const devOwnerName = process.env.DEV_OWNER_NAME || 'Restaurant Dev admin';
  const devOwnerEmail = (process.env.DEV_OWNER_EMAIL || 'DevOwner@gmail.com').trim();
  const devOwnerPass = process.env.DEV_OWNER_PASSWORD || 'devowner@123';

  if (devOwnerName && devOwnerEmail && devOwnerPass) {
    const existingOwner = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(devOwnerEmail.toLowerCase());
    if (!existingOwner) {
      db.prepare(`
        INSERT INTO users (name, email, password_hash, role, phone, avatar, status, created_at, updated_at)
        VALUES (?, ?, ?, 'restaurant_owner', ?, ?, 'active', ?, ?)
      `).run(
        devOwnerName,
        devOwnerEmail,
        devOwnerPass,
        null,
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(devOwnerName)}`,
        now,
        now
      );
    } else {
      db.prepare(`
        UPDATE users SET name = ?, password_hash = ?, status = 'active'
        WHERE id = ?
      `).run(devOwnerName, devOwnerPass, existingOwner.id);
    }
  }
}

// Multi-tenant Database Isolation Engine
const { getTenantDb, provisionAllTenantDatabases, ensureTenantUploadDir } = require('./tenantDbManager');

initDatabase();
ensureDevMasterAccounts();
provisionAllTenantDatabases(db);

module.exports = {
  db,
  withTransaction,
  initDatabase,
  ensureDevMasterAccounts,
  getTenantDb,
  provisionAllTenantDatabases,
  ensureTenantUploadDir
};

