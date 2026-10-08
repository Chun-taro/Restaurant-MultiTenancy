const express = require('express');
const router = express.Router();
const { db } = require('../db');

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: 'Email and password required' });

    const user = db.prepare(`
      SELECT id, name, email, role, avatar, phone, status, password_hash
      FROM users
      WHERE email = ? AND role = 'superadmin'
    `).get(email.trim().toLowerCase());

    if (!user || user.password_hash !== password) {
      return res.status(401).json({ success: false, error: 'Invalid superadmin credentials' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, error: 'This superadmin account is disabled' });
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(now, user.id);

    const { password_hash, ...safeUser } = user;
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: safeUser,
        token: `sess_${Buffer.from(String(user.id) + ':' + Date.now()).toString('base64')}`
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  try {
    const user = db.prepare(`
      SELECT id, name, email, role, avatar, phone, status, last_login_at
      FROM users
      WHERE role = 'superadmin' AND status = 'active'
      ORDER BY id ASC
      LIMIT 1
    `).get();

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
