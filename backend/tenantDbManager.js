const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const TENANTS_DIR = path.join(__dirname, '..', 'data', 'tenants');
if (!fs.existsSync(TENANTS_DIR)) {
  fs.mkdirSync(TENANTS_DIR, { recursive: true });
}

// In-memory connection pool for open tenant databases
const tenantDbCache = new Map();

/**
 * Initialize isolated schema for a tenant's private database
 */
function initTenantSchema(tenantDb) {
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
      total_orders INTEGER DEFAULT 0,
      total_spent REAL DEFAULT 0,
      last_order_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tenant_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
}

/**
 * Seeds starter menu items into a freshly created tenant database
 */
function seedTenantInitialData(tenantDb, restaurant) {
  const catCount = tenantDb.prepare('SELECT COUNT(*) as count FROM menu_categories').get().count;
  if (catCount > 0) return;

  seedTenantDineCatalog(tenantDb, restaurant);
}

/**
 * Seeds the authentic DINE prototype catalog with 10 categories, 36 menu items, tables, and starter orders
 */
function seedTenantDineCatalog(tenantDb, restaurant) {
  const now = new Date().toISOString();

  // 1. Categories
  const DINE_CATEGORIES = [
    { name: 'Rice Meals', desc: 'Hearty silog plates & crispy fillet combos', icon: 'ri-bowl-line' },
    { name: 'Pasta', desc: 'Creamy carbonara & rich savory pastas', icon: 'ri-restaurant-line' },
    { name: 'Snacks', desc: 'Crispy golden fries, wedges, nachos & bites', icon: 'ri-cake-3-line' },
    { name: 'Ramen', desc: 'Bold spicy Samyang noodles & broth ramen', icon: 'ri-fire-line' },
    { name: 'Desserts', desc: 'Sweet mango floats, fudgy brownies & cookies', icon: 'ri-cup-line' },
    { name: 'Coffee', desc: 'Smooth house blends, oat lattes & macchiato', icon: 'ri-cup-line' },
    { name: 'Matcha', desc: 'Ceremonial matcha, oat blends & fruit layers', icon: 'ri-leaf-line' },
    { name: 'Hojicha', desc: 'Aromatic roasted green tea with oat milk', icon: 'ri-water-flash-line' },
    { name: 'Milk Series', desc: 'Creamy fresh milk infused with real fruit puree', icon: 'ri-drinks-line' },
    { name: 'Soda Pop', desc: 'Vibrant refreshing fizzy fruit sodas', icon: 'ri-bubble-chart-line' }
  ];

  const insertCat = tenantDb.prepare(`
    INSERT INTO menu_categories (name, description, icon, sort_order, is_active, created_at)
    VALUES (?, ?, ?, ?, 1, ?)
  `);

  const catMap = {};
  DINE_CATEGORIES.forEach((cat, idx) => {
    insertCat.run(cat.name, cat.desc, cat.icon, idx + 1, now);
    catMap[cat.name] = tenantDb.prepare('SELECT last_insert_rowid() as id').get().id;
  });

  // 2. Menu Items
  const DINE_ITEMS = [
    // Rice Meals
    { cat: 'Rice Meals', name: 'Lumpiasilog', desc: 'Crispy lumpia with garlic rice & egg.', price: 99, img: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=500&auto=format&fit=crop&q=80', badge: 'Bestseller', featured: 1 },
    { cat: 'Rice Meals', name: 'Tocilog', desc: 'Sweet tocino with garlic rice & egg.', price: 99, img: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?w=500&auto=format&fit=crop&q=80', badge: null, featured: 0 },
    { cat: 'Rice Meals', name: 'Hotsilog', desc: 'Juicy hotdog with garlic rice & egg.', price: 99, img: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500&auto=format&fit=crop&q=80', badge: null, featured: 0 },
    { cat: 'Rice Meals', name: 'Spamsilog', desc: 'Savory Spam with garlic rice & egg.', price: 99, img: 'https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=500&auto=format&fit=crop&q=80', badge: null, featured: 0 },
    { cat: 'Rice Meals', name: 'Creamy Cheese Chicken Fillet', desc: 'Crispy chicken in creamy cheese sauce.', price: 129, img: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=500&auto=format&fit=crop&q=80', badge: 'Popular', featured: 1 },
    { cat: 'Rice Meals', name: 'Buffalo Chicken Fillet', desc: 'Crispy chicken tossed in spicy buffalo sauce.', price: 129, img: 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=500&auto=format&fit=crop&q=80', badge: null, featured: 0 },
    { cat: 'Rice Meals', name: "Fika's Platter", desc: 'Crispy chicken with spring rolls and potato wedges perfectly seasoned.', price: 189, img: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=80', badge: 'Chef Pick', featured: 1 },

    // Pasta
    { cat: 'Pasta', name: 'Cheesy Carbonara', desc: 'Creamy, savory pasta with a rich carbonara sauce.', price: 129, img: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=500&auto=format&fit=crop&q=80', badge: 'Bestseller', featured: 1 },
    { cat: 'Pasta', name: 'Carbonara with Chicken', desc: 'Creamy carbonara pasta topped with tender chicken.', price: 159, img: 'https://images.unsplash.com/photo-1555949258-eb67b1ef0ceb?w=500&auto=format&fit=crop&q=80', badge: null, featured: 0 },
    { cat: 'Pasta', name: 'Spaghetti', desc: 'Classic spaghetti tossed in a rich, tomato sauce.', price: 129, img: 'https://images.unsplash.com/photo-1598866594230-a7c12756260f?w=500&auto=format&fit=crop&q=80', badge: null, featured: 0 },
    { cat: 'Pasta', name: 'Spaghetti with Chicken', desc: 'Classic spaghetti with savory tomato sauce and tender chicken.', price: 159, img: 'https://images.unsplash.com/photo-1637361004745-0b7f2e3ba4e5?w=500&auto=format&fit=crop&q=80', badge: null, featured: 0 },

    // Snacks
    { cat: 'Snacks', name: 'French Fries', desc: 'Crispy golden fries — sour cream, BBQ, or cheese.', price: 65, img: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=500&auto=format&fit=crop&q=80', badge: 'Popular', featured: 1 },
    { cat: 'Snacks', name: 'Potato Wedges', desc: 'Crispy golden potato wedges perfectly seasoned and savory.', price: 190, img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80', badge: null, featured: 0 },
    { cat: 'Snacks', name: 'Crunchy Nachos', desc: 'Crispy nacho chips filled with seasoned ground chicken and fresh veggies.', price: 169, img: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=500&auto=format&fit=crop&q=80', badge: null, featured: 0 },
    { cat: 'Snacks', name: 'Cheesydog', desc: 'Cheesy hotdog topped with ground chicken with garlic mayo and hot sauce.', price: 69, img: 'https://images.unsplash.com/photo-1612392061787-2d30e9b20ac6?w=500&auto=format&fit=crop&q=80', badge: null, featured: 0 },
    { cat: 'Snacks', name: 'Ceasars Salad', desc: 'Crisp greens with creamy Caesar dressing and savory toppings.', price: 130, img: 'https://images.unsplash.com/photo-1512852939750-1305098529bf?w=500&auto=format&fit=crop&q=80', badge: null, featured: 0 },

    // Ramen
    { cat: 'Ramen', name: 'Plain Samyang', desc: 'Bold, spicy Samyang noodles cooked to perfection.', price: 140, img: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop&q=80', badge: 'Hot', featured: 1 },
    { cat: 'Ramen', name: 'Samyang with Cheese', desc: 'Spicy Samyang topped with creamy melted cheese.', price: 150, img: 'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?w=500&auto=format&fit=crop&q=80', badge: 'Popular', featured: 0 },
    { cat: 'Ramen', name: 'Samyang with Cheese & Chicken', desc: 'Samyang with cheese and tender chicken fillet.', price: 189, img: 'https://images.unsplash.com/photo-1555126634-323283e090fa?w=500&auto=format&fit=crop&q=80', badge: 'Signature', featured: 1 },
    { cat: 'Ramen', name: 'Soup Ramen', desc: 'Comforting broth-based ramen with rich, savory flavors.', price: 140, img: 'https://images.unsplash.com/photo-1570275239925-4af0aa93a0dc?w=500&auto=format&fit=crop&q=80', badge: null, featured: 0 },

    // Desserts
    { cat: 'Desserts', name: 'Mango Float', desc: 'Layers of graham, cream, and ripe mango.', price: 150, img: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=500&auto=format&fit=crop&q=80', badge: 'Bestseller', featured: 1 },
    { cat: 'Desserts', name: 'Brownies', desc: 'Fudgy, rich chocolate brownies.', price: 40, img: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=80', badge: null, featured: 0 },
    { cat: 'Desserts', name: 'Cookies', desc: 'Freshly baked cookies with a golden finish.', price: 35, img: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=500&auto=format&fit=crop&q=80', badge: null, featured: 0 },

    // Coffee
    { cat: 'Coffee', name: 'Americano', desc: 'Rich, bold coffee brewed to a smooth, balanced finish.', price: 99, img: 'https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?w=500&auto=format&fit=crop&q=80', badge: null, featured: 0 },
    { cat: 'Coffee', name: "Fika's Houseblend", desc: 'A comforting blend of bold coffee and silky smooth special cream.', price: 155, img: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=500&auto=format&fit=crop&q=80', badge: 'Bestseller', featured: 1 },
    { cat: 'Coffee', name: 'Caramel Oat Macchiato', desc: 'Creamy oat milk layered with rich caramel.', price: 165, img: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=500&auto=format&fit=crop&q=80', badge: null, featured: 0 },
    { cat: 'Coffee', name: 'Biscoff Oat Latte', desc: 'Velvety oat latte infused with sweet Biscoff goodness.', price: 175, img: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=500&auto=format&fit=crop&q=80', badge: 'Popular', featured: 0 },
    { cat: 'Coffee', name: 'Seasalt Oat Latte', desc: 'Creamy Oat Latte with a hint of seasalt for a smooth balanced cup.', price: 175, img: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?w=500&auto=format&fit=crop&q=80', badge: null, featured: 0 },
    { cat: 'Coffee', name: 'Egg Coffee', desc: 'Bold Coffee topped with creamy egg foam.', price: 165, img: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=80', badge: null, featured: 0 },

    // Matcha
    { cat: 'Matcha', name: 'Matcha Oat Latte', desc: 'Smooth matcha blended with creamy oat milk.', price: 160, img: 'https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?w=500&auto=format&fit=crop&q=80', badge: 'Bestseller', featured: 1 },
    { cat: 'Matcha', name: 'Oat Matcha Ichigo', desc: 'Creamy oat matcha layered with sweet strawberry goodness.', price: 175, img: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&auto=format&fit=crop&q=80', badge: 'Signature', featured: 1 },
    { cat: 'Matcha', name: 'Bannamon Oat Matcha', desc: 'Comforting matcha infused with caramelized Banana and Cinnamon.', price: 180, img: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500&auto=format&fit=crop&q=80', badge: null, featured: 0 },
    { cat: 'Matcha', name: 'Earl Grey Oat Matcha', desc: 'Earthy matcha infused with fragrant Earl Grey & creamy oat milk.', price: 175, img: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80', badge: null, featured: 0 },
    { cat: 'Matcha', name: 'Biscoff Oat Matcha', desc: 'Creamy oat matcha with sweet, Biscoff.', price: 180, img: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=500&auto=format&fit=crop&q=80', badge: null, featured: 0 },
    { cat: 'Matcha', name: 'Egg Brûlée Matcha', desc: 'Earthy oat matcha with rich, nutty black sesame.', price: 175, img: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=500&auto=format&fit=crop&q=80', badge: null, featured: 0 },

    // Hojicha
    { cat: 'Hojicha', name: 'Hojicha Oat Latte', desc: 'Roasted hojicha blended with creamy oat milk.', price: 160, img: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&auto=format&fit=crop&q=80', badge: 'Popular', featured: 0 },
    { cat: 'Hojicha', name: 'Oat Hojicha Ichigo', desc: 'Roasted hojicha with creamy oat milk and sweet strawberry.', price: 175, img: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=500&auto=format&fit=crop&q=80', badge: null, featured: 0 },
    { cat: 'Hojicha', name: 'Maple Oat Hojicha', desc: 'Smooth oat hojicha with rich maple notes.', price: 155, img: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=500&auto=format&fit=crop&q=80', badge: null, featured: 0 },
    { cat: 'Hojicha', name: 'Biscoff Oat Hojicha', desc: 'Roasty hojicha with creamy oat milk and sweet Biscoff.', price: 180, img: 'https://images.unsplash.com/photo-1498804103079-a6351b050096?w=500&auto=format&fit=crop&q=80', badge: null, featured: 0 },

    // Milk Series
    { cat: 'Milk Series', name: 'Milk me Baerry', desc: 'Creamy milk blended with sweet crushed strawberries.', price: 120, img: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=500&auto=format&fit=crop&q=80', badge: 'Popular', featured: 1 },
    { cat: 'Milk Series', name: 'Milk me Mango', desc: 'Smooth milk with juicy mango goodness.', price: 120, img: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80', badge: null, featured: 0 },
    { cat: 'Milk Series', name: 'Bluebaerry Milk', desc: 'Berry smooth milk with a blueberry twist.', price: 120, img: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=80', badge: null, featured: 0 },

    // Soda Pop
    { cat: 'Soda Pop', name: 'Blue Lemonade Soda', desc: 'Tangy lemonade with a vibrant blue twist.', price: 39, img: 'https://images.unsplash.com/photo-1437418747212-8d9709afab22?w=500&auto=format&fit=crop&q=80', badge: 'Refresh', featured: 0 },
    { cat: 'Soda Pop', name: 'Green Apple Soda', desc: 'Crisp, refreshing green apple fizz.', price: 39, img: 'https://images.unsplash.com/photo-1459411552884-841db9b3cc2a?w=500&auto=format&fit=crop&q=80', badge: null, featured: 0 },
    { cat: 'Soda Pop', name: 'Blueberry Soda', desc: 'Sweet and fizzy blueberry soda.', price: 39, img: 'https://images.unsplash.com/photo-1491882720853-3d75e5399feb?w=500&auto=format&fit=crop&q=80', badge: null, featured: 0 },
    { cat: 'Soda Pop', name: 'Strawberry Soda', desc: 'Bright strawberry soda, perfectly sweet.', price: 39, img: 'https://images.unsplash.com/photo-1527661591475-527312dd65f5?w=500&auto=format&fit=crop&q=80', badge: 'Popular', featured: 1 }
  ];

  const insertItem = tenantDb.prepare(`
    INSERT INTO menu_items (
      category_id, name, description, price,
      image_url, is_available, is_featured, preparation_time, badge, created_at
    ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?)
  `);

  const itemMap = {};
  DINE_ITEMS.forEach(it => {
    const catId = catMap[it.cat];
    insertItem.run(catId, it.name, it.desc, it.price, it.img, it.featured, 12, it.badge, now);
    itemMap[it.name] = tenantDb.prepare('SELECT last_insert_rowid() as id').get().id;
  });

  // 3. Tables
  const insertTable = tenantDb.prepare(`
    INSERT INTO restaurant_tables (table_number, capacity, qr_code_key, status, created_at)
    VALUES (?, ?, ?, 'available', ?)
  `);

  for (let i = 1; i <= 8; i++) {
    insertTable.run(`Table ${i}`, 4, `qr_${restaurant.slug}_t${i}`, now);
  }
  insertTable.run('VIP Table', 8, `qr_${restaurant.slug}_vip`, now);
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
    const isNew = !fs.existsSync(dbPath);
    tenantDb = new DatabaseSync(dbPath);
    initTenantSchema(tenantDb);

    if (isNew) {
      seedTenantInitialData(tenantDb, restaurant);
    }

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

  return {
    db: tenantDb,
    restaurant,
    dbPath: `data/tenants/${dbName}`,
    dbName,
    fullPath: dbPath
  };
}

/**
 * Ensures all existing restaurants have their isolated database created and seeded
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
    getTenantDb(masterDb, r.id);
  }
}

module.exports = {
  getTenantDb,
  provisionAllTenantDatabases,
  seedTenantDineCatalog,
  TENANTS_DIR
};
