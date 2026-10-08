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

// GET /api/billing/invoices
router.get('/invoices', (req, res) => {
  try {
    const { status, search } = req.query;

    let query = `
      SELECT 
        i.*,
        r.name as restaurant_name,
        r.slug as restaurant_slug,
        p.name as plan_name,
        p.code as plan_code
      FROM invoices i
      JOIN restaurants r ON i.restaurant_id = r.id
      JOIN subscription_plans p ON i.plan_id = p.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      query += ` AND i.status = ?`;
      params.push(status);
    }

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      query += ` AND (i.invoice_number LIKE ? OR r.name LIKE ? OR r.slug LIKE ?)`;
      params.push(term, term, term);
    }

    query += ` ORDER BY i.id DESC`;

    const invoices = db.prepare(query).all(...params);

    const stats = db.prepare(`
      SELECT 
        SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_collected,
        SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as total_pending,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
        COUNT(*) as total_invoices
      FROM invoices
    `).get();

    res.json({
      success: true,
      data: {
        invoices,
        stats: {
          totalCollected: stats.total_collected || 0,
          totalPending: stats.total_pending || 0,
          failedCount: stats.failed_count || 0,
          totalInvoices: stats.total_invoices || 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/billing/invoices/:id/status
router.patch('/invoices/:id/status', (req, res) => {
  try {
    const invoiceId = req.params.id;
    const { status, admin_name = 'Alexandre Vance' } = req.body;

    const now = new Date().toISOString();
    const paidAt = status === 'paid' ? now : null;

    db.prepare(`
      UPDATE invoices SET
        status = ?,
        paid_at = ?
      WHERE id = ?
    `).run(status, paidAt, invoiceId);

    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);

    logAudit(
      admin_name,
      'superadmin',
      'UPDATE_INVOICE_STATUS',
      'invoice',
      invoiceId,
      `Marked invoice ${invoice ? invoice.invoice_number : invoiceId} as '${status}'`
    );

    res.json({ success: true, message: `Invoice updated to ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
