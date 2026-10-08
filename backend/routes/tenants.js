const express = require('express');
const router = express.Router();
const { db, seedRestaurantDefaults, getTenantDb } = require('../db');

// Helper to log audit actions
function logAudit(actorName, actorRole, action, entityType, entityId, details) {
  try {
    const insert = db.prepare(`
      INSERT INTO audit_logs (actor_name, actor_role, action, entity_type, entity_id, details, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, '127.0.0.1', ?)
    `);
    insert.run(actorName || 'Alexandre Vance', actorRole || 'superadmin', action, entityType, String(entityId), details, new Date().toISOString());
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

    if (sort === 'oldest') {
      query += ` ORDER BY r.id ASC`;
    } else if (sort === 'volume_desc') {
      query += ` ORDER BY r.total_volume DESC`;
    } else if (sort === 'name_asc') {
      query += ` ORDER BY r.name ASC`;
    } else {
      query += ` ORDER BY r.id DESC`;
    }

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
      owner_password = 'password123',
      owner_phone,
      plan_id = 2,
      billing_cycle = 'monthly',
      status = 'active'
    } = req.body;

    if (!name || !slug || !owner_name || !owner_email) {
      return res.status(400).json({ success: false, error: 'Name, slug, owner name and owner email are required.' });
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

    // 1. Owner user
    let owner = db.prepare('SELECT id FROM users WHERE email = ?').get(owner_email.trim().toLowerCase());
    let ownerId;
    if (owner) {
      ownerId = owner.id;
    } else {
      const insertUser = db.prepare(`
        INSERT INTO users (name, email, password_hash, role, phone, avatar, status, created_at, updated_at)
        VALUES (?, ?, ?, 'restaurant_owner', ?, ?, 'active', ?, ?)
      `);
      insertUser.run(
        owner_name.trim(),
        owner_email.trim().toLowerCase(),
        owner_password,
        owner_phone || null,
        `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(owner_name)}`,
        now,
        now
      );
      ownerId = db.prepare('SELECT last_insert_rowid() as id').get().id;
    }

    // 2. Restaurant
    const insertRest = db.prepare(`
      INSERT INTO restaurants (
        name, slug, subdomain, custom_domain, cuisine_type, logo_url,
        primary_color, secondary_color, status, address, city, phone, email,
        currency, orders_count, total_volume, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, '#1E293B', ?, ?, ?, ?, ?, 'PHP', 0, 0, ?, ?)
    `);

    insertRest.run(
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
      now,
      now
    );
    const restaurantId = db.prepare('SELECT last_insert_rowid() as id').get().id;

    // 3. Link owner
    db.prepare(`
      INSERT INTO restaurant_users (restaurant_id, user_id, role, created_at)
      VALUES (?, ?, 'owner', ?)
    `).run(restaurantId, ownerId, now);

    // 4. Subscription
    const selectedPlan = db.prepare('SELECT * FROM subscription_plans WHERE id = ?').get(plan_id) || db.prepare('SELECT * FROM subscription_plans LIMIT 1').get();
    db.prepare(`
      INSERT INTO subscriptions (
        restaurant_id, plan_id, status, billing_cycle,
        current_period_start, current_period_end, trial_ends_at, auto_renew,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `).run(
      restaurantId,
      selectedPlan.id,
      status === 'trialing' ? 'trialing' : 'active',
      billing_cycle,
      now,
      nextPeriod,
      trialEnds,
      now,
      now
    );

    // 5. Initial Invoice
    const invAmount = billing_cycle === 'yearly' ? selectedPlan.price_yearly : selectedPlan.price_monthly;
    db.prepare(`
      INSERT INTO invoices (
        invoice_number, restaurant_id, plan_id, amount, currency, status,
        billing_period, due_date, paid_at, payment_method, created_at
      ) VALUES (?, ?, ?, ?, 'PHP', ?, ?, ?, ?, 'Provisioning Invoice', ?)
    `).run(
      `INV-2026-${1000 + restaurantId}`,
      restaurantId,
      selectedPlan.id,
      invAmount,
      status === 'trialing' ? 'pending' : 'paid',
      `Initial Onboarding (${billing_cycle})`,
      nextPeriod,
      status === 'trialing' ? null : now,
      now
    );

    logAudit(
      req.body?.admin_name || 'Alexandre Vance',
      'superadmin',
      'PROVISION_TENANT',
      'restaurant',
      restaurantId,
      `Provisioned restaurant '${name}' (${cleanSlug}) on plan '${selectedPlan.name}' with owner ${owner_email}`
    );

    let tenantDbInfo = { db_name: `tenant_${cleanSlug}.db`, db_path: `data/tenants/tenant_${cleanSlug}.db` };
    try {
      if (typeof getTenantDb === 'function') {
        const tCtx = getTenantDb(db, restaurantId);
        if (tCtx) {
          tenantDbInfo = {
            db_name: tCtx.dbName,
            db_path: tCtx.dbPath
          };
        }
      }
    } catch (e) {
      console.warn('Tenant DB initialization warning:', e.message);
    }

    res.status(201).json({
      success: true,
      message: `Restaurant tenant provisioned with isolated database: ${tenantDbInfo.db_name}!`,
      data: {
        id: restaurantId,
        name,
        slug: cleanSlug,
        subdomain: cleanSubdomain,
        db_name: tenantDbInfo.db_name,
        db_path: tenantDbInfo.db_path,
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

    db.prepare('DELETE FROM restaurants WHERE id = ?').run(tenantId);

    logAudit(
      req.body?.admin_name || 'Alexandre Vance',
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

module.exports = router;
