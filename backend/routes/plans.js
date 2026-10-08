const express = require('express');
const router = express.Router();
const { db } = require('../db');

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

// GET /api/plans
router.get('/', (req, res) => {
  try {
    const plans = db.prepare(`
      SELECT 
        p.*,
        COUNT(CASE WHEN s.status IN ('active', 'trialing') THEN s.id END) as active_subscribers,
        SUM(
          CASE 
            WHEN s.status IN ('active', 'trialing') AND s.billing_cycle = 'yearly' THEN p.price_yearly / 12.0
            WHEN s.status IN ('active', 'trialing') THEN p.price_monthly
            ELSE 0
          END
        ) as total_mrr
      FROM subscription_plans p
      LEFT JOIN subscriptions s ON p.id = s.plan_id
      GROUP BY p.id
      ORDER BY p.price_monthly ASC
    `).all();

    res.json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/plans
router.post('/', (req, res) => {
  try {
    const {
      name, code, description, price_monthly, price_yearly,
      max_products = 50, max_staff = 3, max_monthly_orders = 500,
      transaction_fee_percent = 2.0, has_qr_ordering = 1,
      has_online_payment = 1, has_custom_domain = 0,
      has_advanced_analytics = 0, has_inventory = 0, is_popular = 0
    } = req.body;

    const cleanCode = code.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-');
    const existing = db.prepare('SELECT id FROM subscription_plans WHERE code = ?').get(cleanCode);
    if (existing) {
      return res.status(400).json({ success: false, error: 'A plan with this code already exists' });
    }

    const calculatedYearly = price_yearly != null ? price_yearly : (price_monthly * 10);
    const now = new Date().toISOString();

    const insert = db.prepare(`
      INSERT INTO subscription_plans (
        name, code, description, price_monthly, price_yearly, currency,
        max_products, max_staff, max_monthly_orders, transaction_fee_percent,
        has_qr_ordering, has_online_payment, has_custom_domain, has_advanced_analytics,
        has_inventory, is_popular, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, 'PHP', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `);

    insert.run(
      name.trim(),
      cleanCode,
      description || '',
      Number(price_monthly),
      Number(calculatedYearly),
      Number(max_products),
      Number(max_staff),
      Number(max_monthly_orders),
      Number(transaction_fee_percent),
      has_qr_ordering ? 1 : 0,
      has_online_payment ? 1 : 0,
      has_custom_domain ? 1 : 0,
      has_advanced_analytics ? 1 : 0,
      has_inventory ? 1 : 0,
      is_popular ? 1 : 0,
      now
    );

    const newPlanId = db.prepare('SELECT last_insert_rowid() as id').get().id;

    logAudit(
      req.body?.admin_name || 'Alexandre Vance',
      'superadmin',
      'CREATE_PLAN',
      'plan',
      newPlanId,
      `Created new subscription plan '${name}' (₱${price_monthly}/mo)`
    );

    res.status(201).json({ success: true, message: 'Plan created successfully', data: { id: newPlanId } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/plans/:id
router.put('/:id', (req, res) => {
  try {
    const planId = req.params.id;
    const body = req.body;

    const update = db.prepare(`
      UPDATE subscription_plans SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        price_monthly = COALESCE(?, price_monthly),
        price_yearly = COALESCE(?, price_yearly),
        max_products = COALESCE(?, max_products),
        max_staff = COALESCE(?, max_staff),
        transaction_fee_percent = COALESCE(?, transaction_fee_percent),
        has_qr_ordering = COALESCE(?, has_qr_ordering),
        has_online_payment = COALESCE(?, has_online_payment),
        has_custom_domain = COALESCE(?, has_custom_domain),
        has_advanced_analytics = COALESCE(?, has_advanced_analytics),
        has_inventory = COALESCE(?, has_inventory),
        is_popular = COALESCE(?, is_popular)
      WHERE id = ?
    `);

    update.run(
      body.name,
      body.description,
      body.price_monthly != null ? Number(body.price_monthly) : null,
      body.price_yearly != null ? Number(body.price_yearly) : null,
      body.max_products != null ? Number(body.max_products) : null,
      body.max_staff != null ? Number(body.max_staff) : null,
      body.transaction_fee_percent != null ? Number(body.transaction_fee_percent) : null,
      body.has_qr_ordering != null ? (body.has_qr_ordering ? 1 : 0) : null,
      body.has_online_payment != null ? (body.has_online_payment ? 1 : 0) : null,
      body.has_custom_domain != null ? (body.has_custom_domain ? 1 : 0) : null,
      body.has_advanced_analytics != null ? (body.has_advanced_analytics ? 1 : 0) : null,
      body.has_inventory != null ? (body.has_inventory ? 1 : 0) : null,
      body.is_popular != null ? (body.is_popular ? 1 : 0) : null,
      planId
    );

    res.json({ success: true, message: 'Plan updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/plans/:id/toggle
router.patch('/:id/toggle', (req, res) => {
  try {
    const planId = req.params.id;
    const plan = db.prepare('SELECT is_active, name FROM subscription_plans WHERE id = ?').get(planId);
    if (!plan) return res.status(404).json({ success: false, error: 'Plan not found' });

    const newActive = plan.is_active ? 0 : 1;
    db.prepare('UPDATE subscription_plans SET is_active = ? WHERE id = ?').run(newActive, planId);

    logAudit(
      req.body?.admin_name || 'Alexandre Vance',
      'superadmin',
      'TOGGLE_PLAN_STATUS',
      'plan',
      planId,
      `${newActive ? 'Activated' : 'Archived'} plan '${plan.name}'`
    );

    res.json({ success: true, message: `Plan status changed to ${newActive ? 'Active' : 'Archived'}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
