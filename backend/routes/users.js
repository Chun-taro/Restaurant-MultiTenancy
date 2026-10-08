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

// GET /api/users
router.get('/', (req, res) => {
  try {
    const { role, search } = req.query;

    let query = `
      SELECT 
        u.id, u.name, u.email, u.role, u.phone, u.avatar, u.status, u.last_login_at, u.created_at,
        r.id as restaurant_id, r.name as restaurant_name
      FROM users u
      LEFT JOIN restaurant_users ru ON u.id = ru.user_id
      LEFT JOIN restaurants r ON ru.restaurant_id = r.id
      WHERE 1=1
    `;
    const params = [];

    if (role && role !== 'all') {
      query += ` AND u.role = ?`;
      params.push(role);
    }

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      query += ` AND (u.name LIKE ? OR u.email LIKE ?)`;
      params.push(term, term);
    }

    query += ` ORDER BY u.id DESC`;

    const users = db.prepare(query).all(...params);
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/users
router.post('/', (req, res) => {
  try {
    const { name, email, password = 'password123', role = 'superadmin', phone } = req.body;
    if (!name || !email) return res.status(400).json({ success: false, error: 'Name and email are required' });

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());
    if (existing) return res.status(400).json({ success: false, error: 'User with this email already exists' });

    const now = new Date().toISOString();
    const insert = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, phone, avatar, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)
    `);

    insert.run(
      name.trim(),
      email.trim().toLowerCase(),
      password,
      role,
      phone || null,
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`,
      now,
      now
    );

    const newUserId = db.prepare('SELECT last_insert_rowid() as id').get().id;

    logAudit(
      req.body?.admin_name || 'Alexandre Vance',
      'superadmin',
      'CREATE_ADMIN_USER',
      'user',
      newUserId,
      `Created platform ${role} account: ${email}`
    );

    res.status(201).json({ success: true, message: 'User created successfully', data: { id: newUserId } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/users/:id/status
router.patch('/:id/status', (req, res) => {
  try {
    const userId = req.params.id;
    const { status, admin_name = 'Alexandre Vance' } = req.body;

    db.prepare('UPDATE users SET status = ?, updated_at = ? WHERE id = ?').run(status, new Date().toISOString(), userId);

    logAudit(
      admin_name,
      'superadmin',
      'TOGGLE_USER_STATUS',
      'user',
      userId,
      `Set user #${userId} status to ${status}`
    );

    res.json({ success: true, message: `User status changed to ${status}` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
