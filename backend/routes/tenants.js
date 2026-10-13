const express = require('express');
const router = express.Router();
const { db, withTransaction, getTenantDb } = require('../db');
const MongoSync = require('../mongoSync');

// Helper to log audit actions
function logAudit(actorName, actorRole, action, entityType, entityId, details) {
  try {
    const insert = db.prepare(`
      INSERT INTO audit_logs (actor_name, actor_role, action, entity_type, entity_id, details, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, '127.0.0.1', ?)
    `);
    insert.run(actorName || 'Super Admin', actorRole || 'superadmin', action, entityType, String(entityId), details, new Date().toISOString());
    MongoSync.syncAuditLog({ actor_name: actorName, actor_role: actorRole, action, entity_type: entityType, entity_id: entityId, details, ip_address: '127.0.0.1' });
  } catch (e) {
    console.error('Audit log failed:', e);
  }
}

// GET /api/tenants - list all tenants
router.get('/', (req, res) => {
  try {
    const { status, plan_id, search, sort } = req.query;

    let query = `
      SELECT 
        r.*,
        p.id as plan_id,
        p.name as plan_name,
        p.code as plan_code,
        p.price_monthly,
        s.status as subscription_status,
        s.billing_cycle,
        s.current_period_end,
        s.trial_ends_at,
        u.id as owner_id,
        u.name as owner_name,
        u.email as owner_email,
        u.phone as owner_phone
      FROM restaurants r
      LEFT JOIN subscriptions s ON r.id = s.restaurant_id
      LEFT JOIN subscription_plans p ON s.plan_id = p.id
      LEFT JOIN restaurant_users ru ON r.id = ru.restaurant_id AND ru.role = 'owner'
      LEFT JOIN users u ON ru.user_id = u.id
      WHERE 1=1
    `;

    const params = [];

    if (status && status !== 'all') {
      query += ` AND r.status = ?`;
      params.push(status);
    }

    if (plan_id && plan_id !== 'all') {
      query += ` AND p.id = ?`;
      params.push(Number(plan_id));
    }

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      query += ` AND (r.name LIKE ? OR r.slug LIKE ? OR r.city LIKE ? OR u.name LIKE ? OR u.email LIKE ?)`;
      params.push(term, term, term, term, term);
    }

    let orderClause = 'ORDER BY r.id DESC';
    if (sort === 'oldest') {
      orderClause = 'ORDER BY r.id ASC';
    } else if (sort === 'volume_desc') {
      orderClause = 'ORDER BY r.total_volume DESC';
    } else if (sort === 'name_asc') {
      orderClause = 'ORDER BY r.name ASC';
    }

    query += ` GROUP BY r.id ${orderClause}`;

    const tenants = db.prepare(query).all(...params);
    res.json({ success: true, data: tenants });
  } catch (error) {
    console.error('Error listing tenants:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/tenants/:id - detailed tenant view
router.get('/:id', (req, res) => {
  try {
    const tenantId = req.params.id;

    const tenant = db.prepare(`
      SELECT 
        r.*,
        p.id as plan_id,
        p.name as plan_name,
        p.code as plan_code,
        p.price_monthly,
        p.price_yearly,
        p.max_products,
        p.max_staff,
        p.has_qr_ordering,
        p.has_online_payment,
        p.has_custom_domain,
        s.id as subscription_id,
        s.status as subscription_status,
        s.billing_cycle,
        s.current_period_start,
        s.current_period_end,
        s.trial_ends_at,
        u.id as owner_id,
        u.name as owner_name,
        u.email as owner_email,
        u.phone as owner_phone,
        u.avatar as owner_avatar
      FROM restaurants r
      LEFT JOIN subscriptions s ON r.id = s.restaurant_id
      LEFT JOIN subscription_plans p ON s.plan_id = p.id
      LEFT JOIN restaurant_users ru ON r.id = ru.restaurant_id AND ru.role = 'owner'
      LEFT JOIN users u ON ru.user_id = u.id
      WHERE r.id = ?
    `).get(tenantId);

    if (!tenant) {
      return res.status(404).json({ success: false, error: 'Restaurant tenant not found' });
    }

    // Invoices for this tenant
    const invoices = db.prepare(`
      SELECT * FROM invoices 
      WHERE restaurant_id = ? 
      ORDER BY id DESC
    `).all(tenantId);

    res.json({
      success: true,
      data: {
        ...tenant,
        invoices
      }
    });
  } catch (error) {
    console.error('Error fetching tenant:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/tenants - Provision new restaurant tenant
router.post('/', (req, res) => {
  try {
    const {
      name,
      slug,
      subdomain,
      custom_domain,
      cuisine_type,
      primary_color = '#6366F1',
      address,
      city,
      phone,
      email,
      owner_name,
      owner_email,
      owner_password,
      owner_phone,
      plan_id = 2,
      billing_cycle = 'monthly',
      status = 'active'
    } = req.body;

    if (!name || !slug || !owner_name || !owner_email || !owner_password) {
      return res.status(400).json({ success: false, error: 'Name, slug, owner name, owner email, and owner password are required.' });
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    const cleanSubdomain = (subdomain || cleanSlug).toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');

    const existing = db.prepare('SELECT id FROM restaurants WHERE slug = ? OR subdomain = ?').get(cleanSlug, cleanSubdomain);
    if (existing) {
      return res.status(400).json({ success: false, error: 'A restaurant with this slug or subdomain already exists.' });
    }

    const now = new Date().toISOString();
    const nextPeriod = new Date(Date.now() + (billing_cycle === 'yearly' ? 365 : 30) * 86400000).toISOString();
    const trialEnds = status === 'trialing' ? new Date(Date.now() + 14 * 86400000).toISOString() : null;

    // Execute multi-table provisioning inside an atomic transaction (BEGIN IMMEDIATE / COMMIT / ROLLBACK)
    const { restaurantId, ownerId, selectedPlan } = withTransaction(db, () => {
      // 1. Owner user
      let owner = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(owner_email.trim().toLowerCase());
      let resolvedOwnerId;
      if (owner) {
        resolvedOwnerId = owner.id;
        if (owner_password) {
          db.prepare('UPDATE users SET password_hash = ?, status = ?, updated_at = ? WHERE id = ?')
            .run(owner_password, 'active', now, owner.id);
        }
      } else {
        const insertUser = db.prepare(`
          INSERT INTO users (name, email, password_hash, role, phone, avatar, status, created_at, updated_at)
          VALUES (?, ?, ?, 'restaurant_owner', ?, ?, 'active', ?, ?)
        `);
        const userResult = insertUser.run(
          owner_name.trim(),
          owner_email.trim().toLowerCase(),
          owner_password,
          owner_phone || null,
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(owner_name)}`,
          now,
          now
        );
        resolvedOwnerId = Number(userResult.lastInsertRowid);
      }

      // 2. Restaurant
      const defaultThemeConfig = JSON.stringify({
        preset: 'teal_pink_dine',
        primary_color: primary_color || '#00C4CC',
        secondary_color: '#1E293B',
        accent_color: '#FF2A85',
        bg_style: 'slate_clean',
        font_family: 'Plus Jakarta Sans',
        border_radius: 'smooth',
        hero_style: 'cinematic',
        card_density: 'grid_spacious'
      });

      const insertRest = db.prepare(`
        INSERT INTO restaurants (
          name, slug, subdomain, custom_domain, cuisine_type, logo_url,
          primary_color, secondary_color, status, address, city, phone, email,
          currency, orders_count, total_volume, theme_config, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, '#1E293B', ?, ?, ?, ?, ?, 'PHP', 0, 0, ?, ?, ?)
      `);

      const restResult = insertRest.run(
        name.trim(),
        cleanSlug,
        cleanSubdomain,
        custom_domain ? custom_domain.trim().toLowerCase() : null,
        cuisine_type || 'General Dining',
        `https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=120&auto=format&fit=crop&q=80`,
        primary_color,
        status,
        address || '',
        city || 'Metro Manila',
        phone || owner_phone || '',
        email || owner_email,
        defaultThemeConfig,
        now,
        now
      );
      const newRestaurantId = Number(restResult.lastInsertRowid);

      // 3. Link owner
      db.prepare(`
        INSERT INTO restaurant_users (restaurant_id, user_id, role, created_at)
        VALUES (?, ?, 'owner', ?)
      `).run(newRestaurantId, resolvedOwnerId, now);

      // 4. Subscription
      const plan = db.prepare('SELECT * FROM subscription_plans WHERE id = ?').get(plan_id) || db.prepare('SELECT * FROM subscription_plans LIMIT 1').get();
      db.prepare(`
        INSERT INTO subscriptions (
          restaurant_id, plan_id, status, billing_cycle,
          current_period_start, current_period_end, trial_ends_at, auto_renew,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
      `).run(
        newRestaurantId,
        plan.id,
        status === 'trialing' ? 'trialing' : 'active',
        billing_cycle,
        now,
        nextPeriod,
        trialEnds,
        now,
        now
      );

      // 5. Initial Invoice
      const invAmount = billing_cycle === 'yearly' ? plan.price_yearly : plan.price_monthly;
      db.prepare(`
        INSERT INTO invoices (
          invoice_number, restaurant_id, plan_id, amount, currency, status,
          billing_period, due_date, paid_at, payment_method, created_at
        ) VALUES (?, ?, ?, ?, 'PHP', ?, ?, ?, ?, 'Provisioning Invoice', ?)
      `).run(
        `INV-2026-${1000 + newRestaurantId}`,
        newRestaurantId,
        plan.id,
        invAmount,
        status === 'trialing' ? 'pending' : 'paid',
        `Initial Onboarding (${billing_cycle})`,
        nextPeriod,
        status === 'trialing' ? null : now,
        now
      );

      return { restaurantId: newRestaurantId, ownerId: resolvedOwnerId, selectedPlan: plan };
    });

    logAudit(
      req.body?.admin_name || 'Super Admin',
      'superadmin',
      'PROVISION_TENANT',
      'restaurant',
      restaurantId,
      `Provisioned restaurant '${name}' (${cleanSlug}) on plan '${selectedPlan.name}' with owner ${owner_email}`
    );

    let tenantDbInfo = { db_name: `tenant_${cleanSlug}.db`, db_path: `data/tenants/tenant_${cleanSlug}.db`, upload_dir: `uploads/tenants/${cleanSlug}`, upload_url: `/uploads/tenants/${cleanSlug}` };
    try {
      if (typeof getTenantDb === 'function') {
        const tCtx = getTenantDb(db, restaurantId);
        if (tCtx) {
          tenantDbInfo = {
            db_name: tCtx.dbName,
            db_path: tCtx.dbPath,
            upload_dir: tCtx.uploadDir,
            upload_url: tCtx.uploadUrl
          };

          // Register owner into isolated tenant staff_members table
          try {
            const cleanOwnerEmail = owner_email.trim().toLowerCase();
            const existingStaff = tCtx.db.prepare("SELECT id FROM staff_members WHERE LOWER(email) = ?").get(cleanOwnerEmail);
            if (!existingStaff) {
              tCtx.db.prepare(`
                INSERT INTO staff_members (name, email, phone, role, pin, password_hash, status, created_at, updated_at)
                VALUES (?, ?, ?, 'admin', '1234', ?, 'active', ?, ?)
              `).run(owner_name.trim(), cleanOwnerEmail, owner_phone || null, owner_password, now, now);
            } else {
              tCtx.db.prepare(`
                UPDATE staff_members SET name = ?, password_hash = ?, role = 'admin', status = 'active', updated_at = ?
                WHERE id = ?
              `).run(owner_name.trim(), owner_password, now, existingStaff.id);
            }
          } catch (staffErr) {
            console.warn('Tenant staff sync note:', staffErr.message);
          }
        }
      }
    } catch (e) {
      console.warn('Tenant DB initialization warning:', e.message);
    }

    try {
      const createdResto = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(restaurantId);
      if (createdResto) {
        MongoSync.syncRestaurant(createdResto);
        MongoSync.syncSubscription(createdResto.slug, { plan_id, status, billing_cycle });
      }
    } catch (sErr) {}

    res.status(201).json({
      success: true,
      message: `Restaurant tenant provisioned with isolated database: ${tenantDbInfo.db_name} and media folder: ${tenantDbInfo.upload_dir}!`,
      data: {
        id: restaurantId,
        name,
        slug: cleanSlug,
        subdomain: cleanSubdomain,
        db_name: tenantDbInfo.db_name,
        db_path: tenantDbInfo.db_path,
        upload_dir: tenantDbInfo.upload_dir,
        upload_url: tenantDbInfo.upload_url,
        storefront_url: `http://${cleanSubdomain}.localhost:5173`,
        path_url: `http://localhost:5173/store/${cleanSlug}`
      }
    });
  } catch (error) {
    console.error('Error provisioning tenant:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/tenants/:id/status
router.patch('/:id/status', (req, res) => {
  try {
    const tenantId = req.params.id;
    const { status, reason, admin_name = 'Alexandre Vance' } = req.body;

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE restaurants SET
        status = ?,
        suspended_reason = ?,
        updated_at = ?
      WHERE id = ?
    `).run(status, status === 'suspended' ? (reason || 'Admin manual suspension') : null, now, tenantId);

    const subStatus = status === 'suspended' ? 'past_due' : (status === 'active' ? 'active' : status);
    db.prepare(`
      UPDATE subscriptions SET status = ?, updated_at = ? WHERE restaurant_id = ?
    `).run(subStatus, now, tenantId);

    try {
      const updatedResto = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(tenantId);
      if (updatedResto) MongoSync.syncRestaurant(updatedResto);
    } catch (e) {}

    logAudit(
      admin_name,
      'superadmin',
      status === 'suspended' ? 'SUSPEND_TENANT' : 'ACTIVATE_TENANT',
      'restaurant',
      tenantId,
      `Set status to '${status}'${reason ? ` (Reason: ${reason})` : ''}`
    );

    res.json({ success: true, message: `Tenant status changed to ${status}` });
  } catch (error) {
    console.error('Error changing tenant status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/tenants/:id/plan
router.patch('/:id/plan', (req, res) => {
  try {
    const tenantId = req.params.id;
    const { plan_id, billing_cycle = 'monthly', admin_name = 'Alexandre Vance' } = req.body;

    const plan = db.prepare('SELECT * FROM subscription_plans WHERE id = ?').get(plan_id);
    if (!plan) return res.status(404).json({ success: false, error: 'Plan not found' });

    const now = new Date().toISOString();
    const nextPeriod = new Date(Date.now() + (billing_cycle === 'yearly' ? 365 : 30) * 86400000).toISOString();

    db.prepare(`
      UPDATE subscriptions SET
        plan_id = ?,
        billing_cycle = ?,
        current_period_end = ?,
        updated_at = ?
      WHERE restaurant_id = ?
    `).run(plan_id, billing_cycle, nextPeriod, now, tenantId);

    logAudit(
      admin_name,
      'superadmin',
      'CHANGE_PLAN',
      'subscription',
      tenantId,
      `Migrated tenant #${tenantId} to '${plan.name}' (${billing_cycle})`
    );

    res.json({ success: true, message: `Plan updated to ${plan.name}` });
  } catch (error) {
    console.error('Error changing plan:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/tenants/:id/impersonate
router.post('/:id/impersonate', (req, res) => {
  try {
    const tenantId = req.params.id;
    const tenant = db.prepare(`
      SELECT r.*, u.name as owner_name, u.email as owner_email
      FROM restaurants r
      LEFT JOIN restaurant_users ru ON r.id = ru.restaurant_id AND ru.role = 'owner'
      LEFT JOIN users u ON ru.user_id = u.id
      WHERE r.id = ?
    `).get(tenantId);

    if (!tenant) return res.status(404).json({ success: false, error: 'Restaurant not found' });

    logAudit(
      req.body?.admin_name || 'Alexandre Vance',
      'superadmin',
      'IMPERSONATE_OWNER',
      'restaurant',
      tenantId,
      `Started impersonation session for ${tenant.name} as ${tenant.owner_email}`
    );

    res.json({
      success: true,
      message: `Impersonation token created for ${tenant.name}`,
      data: {
        impersonating: true,
        tenantId: tenant.id,
        restaurantName: tenant.name,
        slug: tenant.slug,
        ownerEmail: tenant.owner_email,
        storefrontUrl: `https://${tenant.subdomain}.restosaas.ph`,
        dashboardUrl: `https://${tenant.subdomain}.restosaas.ph/owner/dashboard`
      }
    });
  } catch (error) {
    console.error('Error impersonating:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/tenants/:id
router.delete('/:id', (req, res) => {
  try {
    const tenantId = req.params.id;
    const tenant = db.prepare('SELECT name FROM restaurants WHERE id = ?').get(tenantId);
    if (!tenant) return res.status(404).json({ success: false, error: 'Restaurant not found' });

    withTransaction(db, () => {
      db.prepare('DELETE FROM restaurant_users WHERE restaurant_id = ?').run(tenantId);
      db.prepare('DELETE FROM subscriptions WHERE restaurant_id = ?').run(tenantId);
      db.prepare('DELETE FROM invoices WHERE restaurant_id = ?').run(tenantId);
      db.prepare('DELETE FROM restaurants WHERE id = ?').run(tenantId);
    });

    logAudit(
      req.body?.admin_name || 'Super Admin',
      'superadmin',
      'DELETE_TENANT',
      'restaurant',
      tenantId,
      `Permanently deleted tenant '${tenant.name}' (ID: ${tenantId})`
    );

    res.json({ success: true, message: `Tenant deleted successfully` });
  } catch (error) {
    console.error('Error deleting tenant:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/tenants/seed-demo - Quick 1-click provision of the starter demo restaurant
router.post('/seed-demo', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM restaurants WHERE slug = ?').get('brandobar');
    if (existing) {
      return res.json({
        success: true,
        message: 'Demo restaurant "Brando Bar & Grill" is already provisioned',
        data: existing
      });
    }

    const now = new Date().toISOString();
    const nextPeriod = new Date(Date.now() + 30 * 86400000).toISOString();

    const plan = db.prepare("SELECT id FROM subscription_plans WHERE code = 'growth' OR code = 'starter' LIMIT 1").get();
    const planId = plan ? plan.id : 1;

    let owner = db.prepare('SELECT id FROM users WHERE role = ? OR LOWER(email) = ? LIMIT 1').get('restaurant_owner', 'devowner@gmail.com');
    let ownerId;
    if (owner) {
      ownerId = owner.id;
    } else {
      const ownerResult = db.prepare(`
        INSERT INTO users (name, email, password_hash, role, phone, avatar, status, created_at, updated_at)
        VALUES (?, 'devowner@gmail.com', 'devowner@123', 'restaurant_owner', '+63 900 000 0002', ?, 'active', ?, ?)
      `).run(
        'Restaurant Dev admin',
        `https://api.dicebear.com/7.x/avataaars/svg?seed=DevOwner`,
        now,
        now
      );
      ownerId = Number(ownerResult.lastInsertRowid);
    }

    const restResult = db.prepare(`
      INSERT INTO restaurants (
        name, slug, subdomain, custom_domain, cuisine_type, logo_url, banner_url,
        primary_color, secondary_color, status, address, city, phone, email,
        currency, orders_count, total_volume, theme_config, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, 'PHP', 0, 0, ?, ?, ?)
    `).run(
      'Brando Bar & Grill',
      'brandobar',
      'brandobar',
      null,
      'American & Barbecue',
      'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=240&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
      '#00C4CC',
      '#1E293B',
      'High Street South Block, 26th St',
      'Bonifacio Global City, Taguig',
      '+63 917 888 1234',
      'hello@brandobar.ph',
      JSON.stringify({
        preset: 'teal_pink_dine',
        primary_color: '#00C4CC',
        secondary_color: '#1E293B',
        accent_color: '#FF2A85',
        bg_style: 'slate_clean',
        font_family: 'Plus Jakarta Sans',
        border_radius: 'smooth',
        hero_style: 'cinematic',
        card_density: 'grid_spacious'
      }),
      now,
      now
    );

    const restaurantId = Number(restResult.lastInsertRowid);

    db.prepare(`
      INSERT INTO restaurant_users (restaurant_id, user_id, role, created_at)
      VALUES (?, ?, 'owner', ?)
    `).run(restaurantId, ownerId, now);

    db.prepare(`
      INSERT INTO subscriptions (restaurant_id, plan_id, status, billing_cycle, current_period_start, current_period_end, created_at)
      VALUES (?, ?, 'active', 'monthly', ?, ?, ?)
    `).run(restaurantId, planId, now, nextPeriod, now);

    // Initialize isolated tenant DB and starter menu items
    const tenantCtx = getTenantDb(db, 'brandobar');
    if (tenantCtx) {
      const { db: tenantDb } = tenantCtx;
      const catCount = tenantDb.prepare('SELECT COUNT(*) as count FROM menu_categories').get()?.count || 0;
      if (catCount === 0) {
        const cat1Res = tenantDb.prepare(`
          INSERT INTO menu_categories (name, description, icon, sort_order, is_active, created_at)
          VALUES ('Smoked BBQ & Steaks', 'Wood-fired slow smoked meats & ribs', 'ri-fire-line', 1, 1, ?)
        `).run(now);
        const cat1Id = Number(cat1Res.lastInsertRowid);

        const cat2Res = tenantDb.prepare(`
          INSERT INTO menu_categories (name, description, icon, sort_order, is_active, created_at)
          VALUES ('Artisanal Burgers', 'Brioche buns with double ground patties', 'ri-restaurant-line', 2, 1, ?)
        `).run(now);
        const cat2Id = Number(cat2Res.lastInsertRowid);

        const cat3Res = tenantDb.prepare(`
          INSERT INTO menu_categories (name, description, icon, sort_order, is_active, created_at)
          VALUES ('Craft Beverages', 'House draft beer, cold brew & sodas', 'ri-cup-line', 3, 1, ?)
        `).run(now);
        const cat3Id = Number(cat3Res.lastInsertRowid);

        // Dishes for BBQ
        tenantDb.prepare(`
          INSERT INTO menu_items (category_id, name, description, price, image_url, is_available, is_featured, preparation_time, badge, created_at)
          VALUES (?, ?, ?, ?, ?, 1, 1, 25, 'Chef Special', ?)
        `).run(
          cat1Id,
          'Texas Style Smoked Ribs',
          'Fall-off-the-bone tender baby back ribs glazed with house honey hickory BBQ sauce.',
          780,
          'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
          now
        );

        tenantDb.prepare(`
          INSERT INTO menu_items (category_id, name, description, price, image_url, is_available, is_featured, preparation_time, badge, created_at)
          VALUES (?, ?, ?, ?, ?, 1, 0, 20, 'Signature', ?)
        `).run(
          cat1Id,
          'Slow-Smoked Beef Brisket',
          '14-hour hickory smoked brisket served with pickled red onions and garlic rice.',
          650,
          'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=600&auto=format&fit=crop&q=80',
          now
        );

        // Dishes for Burgers
        tenantDb.prepare(`
          INSERT INTO menu_items (category_id, name, description, price, image_url, is_available, is_featured, preparation_time, badge, created_at)
          VALUES (?, ?, ?, ?, ?, 1, 1, 15, 'Best Seller', ?)
        `).run(
          cat2Id,
          'The Truffle Melt Burger',
          'Double Angus smashed beef patty, black truffle aioli, Swiss Emmental and caramelized sweet onions.',
          450,
          'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
          now
        );

        tenantDb.prepare(`
          INSERT INTO menu_items (category_id, name, description, price, image_url, is_available, is_featured, preparation_time, badge, created_at)
          VALUES (?, ?, ?, ?, ?, 1, 0, 15, null, ?)
        `).run(
          cat2Id,
          'Crispy Bacon Smash Burger',
          'Smoked applewood bacon, aged Wisconsin cheddar, house secret relish and buttered brioche.',
          380,
          'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&auto=format&fit=crop&q=80',
          now
        );

        // Dishes for Drinks
        tenantDb.prepare(`
          INSERT INTO menu_items (category_id, name, description, price, image_url, is_available, is_featured, preparation_time, badge, created_at)
          VALUES (?, ?, ?, ?, ?, 1, 0, 5, 'Local Craft', ?)
        `).run(
          cat3Id,
          'BGC Craft Draft Lager',
          'Refreshing crisp microbrewed golden lager served ice cold with citrus hints.',
          190,
          'https://images.unsplash.com/photo-1608270119273-e3802380fce0?w=600&auto=format&fit=crop&q=80',
          now
        );

        tenantDb.prepare(`
          INSERT INTO menu_items (category_id, name, description, price, image_url, is_available, is_featured, preparation_time, badge, created_at)
          VALUES (?, ?, ?, ?, ?, 1, 0, 5, null, ?)
        `).run(
          cat3Id,
          'House Cold Brew Lemonade',
          'Signature iced Earl Grey tea shaken with fresh honey calamansi and mint leaves.',
          160,
          'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop&q=80',
          now
        );
      }
    }

    logAudit('System', 'system', 'PROVISION_DEMO', 'restaurant', restaurantId, 'Provisioned demo restaurant "Brando Bar & Grill"');

    const createdTenant = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(restaurantId);
    res.json({
      success: true,
      message: 'Demo restaurant "Brando Bar & Grill" provisioned successfully!',
      data: createdTenant
    });
  } catch (error) {
    console.error('Error provisioning demo restaurant:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
