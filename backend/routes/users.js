const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { hashPassword } = require('../utils/auth');
const MongoSync = require('../mongoSync');

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

// GET /api/users - List users with optional filter
router.get('/', (req, res) => {
  try {
    const { role, search } = req.query;

    let query = `
      SELECT 
        u.id, u.name, u.email, u.role, u.phone, u.avatar, u.status, u.last_login_at, u.created_at,
        MIN(r.id) as restaurant_id,
        GROUP_CONCAT(r.name, ', ') as restaurant_name
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

    query += ` GROUP BY u.id ORDER BY u.id DESC`;

    const users = db.prepare(query).all(...params);
    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/users/profile - Update current superadmin's profile (name, email, password, phone, avatar)
router.put('/profile', (req, res) => {
  try {
    const { id, name, email, password, phone, avatar, current_password } = req.body;
    if (!id && !email) {
      return res.status(400).json({ success: false, error: 'User ID or email is required' });
    }

    // Find existing user
    let user = null;
    if (id) {
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    } else if (email) {
      user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(email.trim().toLowerCase());
    }

    if (!user) {
      return res.status(404).json({ success: false, error: 'Superadmin account not found' });
    }

    // If new email provided, verify not taken by another user
    const newEmail = email ? email.trim().toLowerCase() : user.email;
    if (newEmail !== user.email) {
      const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ? AND id != ?').get(newEmail, user.id);
      if (existing) {
        return res.status(400).json({ success: false, error: 'This email address is already in use by another account' });
      }
    }

    const newName = name ? name.trim() : user.name;
    const newPhone = phone !== undefined ? phone : user.phone;
    const newAvatar = avatar || user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(newName)}`;
    const now = new Date().toISOString();

    let newPasswordHash = user.password_hash;
    if (password && password.trim().length > 0) {
      newPasswordHash = hashPassword(password.trim());
    }

    db.prepare(`
      UPDATE users SET
        name = ?,
        email = ?,
        password_hash = ?,
        phone = ?,
        avatar = ?,
        updated_at = ?
      WHERE id = ?
    `).run(newName, newEmail, newPasswordHash, newPhone, newAvatar, now, user.id);

    const updatedUser = db.prepare(`
      SELECT id, name, email, role, phone, avatar, status, last_login_at, created_at, updated_at
      FROM users
      WHERE id = ?
    `).get(user.id);

    logAudit(
      updatedUser.name,
      'superadmin',
      'UPDATE_SUPERADMIN_PROFILE',
      'user',
      user.id,
      `Superadmin updated profile details (Name: ${newName}, Email: ${newEmail})`
    );

    try {
      if (updatedUser) MongoSync.syncUser({ ...updatedUser, password_hash: newPasswordHash });
    } catch (mErr) {}

    res.json({
      success: true,
      message: 'Superadmin profile updated successfully!',
      data: updatedUser
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/users - Create new Superadmin or User
router.post('/', (req, res) => {
  try {
    const { name, email, password, role = 'superadmin', phone, avatar } = req.body;
    if (!name || !email || !password) return res.status(400).json({ success: false, error: 'Name, email, and password are required' });

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(cleanEmail);
    if (existing) return res.status(400).json({ success: false, error: 'A user with this email already exists' });

    const now = new Date().toISOString();
    const avatarUrl = avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name.trim())}`;
    const hashedPassword = hashPassword(password.trim());

    const insert = db.prepare(`
      INSERT INTO users (name, email, password_hash, role, phone, avatar, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'active', ?, ?)
    `);

    insert.run(
      name.trim(),
      cleanEmail,
      hashedPassword,
      role,
      phone || null,
      avatarUrl,
      now,
      now
    );

    const newUserId = db.prepare('SELECT last_insert_rowid() as id').get().id;

    logAudit(
      req.body?.admin_name || 'Superadmin',
      'superadmin',
      'CREATE_ADMIN_USER',
      'user',
      newUserId,
      `Created new ${role === 'superadmin' ? 'Super Administrator' : 'User'}: ${name.trim()} (${cleanEmail})`
    );

    const created = db.prepare(`
      SELECT id, name, email, role, phone, avatar, status, created_at
      FROM users
      WHERE id = ?
    `).get(newUserId);

    try {
      if (created) MongoSync.syncUser({ ...created, password_hash: hashedPassword });
    } catch (uErr) {}

    res.status(201).json({
      success: true,
      message: `Super Administrator '${name}' created successfully!`,
      data: created
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/users/:id - Edit any user / superadmin
router.put('/:id', (req, res) => {
  try {
    const userId = Number(req.params.id);
    const { name, email, password, role, phone, avatar, status, admin_name, requester_email } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const isDevAccount = user.email.toLowerCase() === 'restosaasdev@gmail.com';
    const actingEmail = (requester_email || req.headers['x-admin-email'] || admin_name || '').toLowerCase().trim();
    if (isDevAccount && actingEmail !== 'restosaasdev@gmail.com') {
      return res.status(403).json({
        success: false,
        error: 'Security Restriction: The Developer Superadmin account (RestoSaasDev@gmail.com) is system-protected and can only be modified by the Developer account itself.'
      });
    }

    const cleanEmail = isDevAccount ? 'restosaasdev@gmail.com' : (email ? email.trim().toLowerCase() : user.email);
    if (cleanEmail !== user.email) {
      const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ? AND id != ?').get(cleanEmail, userId);
      if (existing) {
        return res.status(400).json({ success: false, error: 'This email is already in use by another user' });
      }
    }

    const newName = name ? name.trim() : user.name;
    const newRole = isDevAccount ? 'superadmin' : (role || user.role);
    const newPhone = phone !== undefined ? phone : user.phone;
    const newStatus = isDevAccount ? 'active' : (status || user.status);
    const newAvatar = avatar || user.avatar;
    const now = new Date().toISOString();

    let newPasswordHash = user.password_hash;
    if (password && password.trim().length > 0) {
      newPasswordHash = hashPassword(password.trim());
    }

    db.prepare(`
      UPDATE users SET
        name = ?,
        email = ?,
        password_hash = ?,
        role = ?,
        phone = ?,
        avatar = ?,
        status = ?,
        updated_at = ?
      WHERE id = ?
    `).run(newName, cleanEmail, newPasswordHash, newRole, newPhone, newAvatar, newStatus, now, userId);

    logAudit(
      admin_name || 'Superadmin',
      'superadmin',
      'UPDATE_USER_ACCOUNT',
      'user',
      userId,
      `Updated user account #${userId} (${newName}, role: ${newRole})`
    );

    const updated = db.prepare(`
      SELECT id, name, email, role, phone, avatar, status, last_login_at, created_at, updated_at
      FROM users
      WHERE id = ?
    `).get(userId);

    try {
      if (updated) MongoSync.syncUser({ ...updated, password_hash: newPasswordHash });
    } catch (uErr) {}

    res.json({
      success: true,
      message: 'Account updated successfully!',
      data: updated
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/users/:id - Delete a user
router.delete('/:id', (req, res) => {
  try {
    const userId = Number(req.params.id);
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Safety check: Dev account is permanently protected
    if (user.email.toLowerCase() === 'restosaasdev@gmail.com') {
      return res.status(403).json({
        success: false,
        error: 'Security Restriction: The Developer Superadmin account (RestoSaasDev@gmail.com) is permanently protected and cannot be deleted.'
      });
    }

    // Safety check: Don't allow deleting the only superadmin
    if (user.role === 'superadmin') {
      const superadminCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'superadmin' AND status = 'active'").get().count;
      if (superadminCount <= 1) {
        return res.status(400).json({ success: false, error: 'Cannot delete the only remaining active Super Administrator account.' });
      }
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(userId);

    try {
      MongoSync.deleteUser(user.email);
    } catch (dErr) {}

    logAudit(
      req.body?.admin_name || 'Superadmin',
      'superadmin',
      'DELETE_USER_ACCOUNT',
      'user',
      userId,
      `Deleted user #${userId} (${user.name}, ${user.email})`
    );

    res.json({ success: true, message: `User '${user.name}' deleted successfully.` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PATCH /api/users/:id/status - Toggle status
router.patch('/:id/status', (req, res) => {
  try {
    const userId = req.params.id;
    const { status, admin_name = 'Superadmin' } = req.body;

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (user.email.toLowerCase() === 'restosaasdev@gmail.com') {
      return res.status(403).json({
        success: false,
        error: 'Security Restriction: The Developer Superadmin account cannot be deactivated.'
      });
    }

    db.prepare('UPDATE users SET status = ?, updated_at = ? WHERE id = ?').run(status, new Date().toISOString(), userId);

    try {
      const toggled = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
      if (toggled) MongoSync.syncUser(toggled);
    } catch (tErr) {}

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
