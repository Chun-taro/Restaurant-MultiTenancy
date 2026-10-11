const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { comparePassword, generateToken, authRateLimiter } = require('../utils/auth');

// POST /api/auth/login
router.post('/login', authRateLimiter, (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ success: false, error: 'Email and password required' });

    const cleanEmail = email.trim().toLowerCase();
    const cleanPassword = password.trim();

    const devSuperEmail = (process.env.DEV_SUPERADMIN_EMAIL || 'RestoSaasDev@gmail.com').toLowerCase().trim();
    const devSuperPass = process.env.DEV_SUPERADMIN_PASSWORD || 'restosaasdev@123';
    const devOwnerEmail = (process.env.DEV_OWNER_EMAIL || 'DevOwner@gmail.com').toLowerCase().trim();
    const devOwnerPass = process.env.DEV_OWNER_PASSWORD || 'devowner@123';
    const devStaffEmail = (process.env.DEV_STAFF_EMAIL || 'DevStaff@gmail.com').toLowerCase().trim();
    const devStaffPass = process.env.DEV_STAFF_PASSWORD || 'devstaff@123';

    // 1. Direct match for Developer accounts (configured in .env)
    if (devSuperEmail && devSuperPass && cleanEmail === devSuperEmail && cleanPassword === devSuperPass) {
      const devUser = db.prepare("SELECT * FROM users WHERE LOWER(email) = ?").get(devSuperEmail) || {
        id: 9990,
        name: process.env.DEV_SUPERADMIN_NAME || 'Superadmin',
        email: devSuperEmail,
        role: 'superadmin',
        status: 'active'
      };
      const { password_hash, ...safeDev } = devUser;
      return res.json({
        success: true,
        message: 'Developer Superadmin Login successful',
        data: {
          user: safeDev,
          token: generateToken({ id: devUser.id, email: devUser.email, role: 'superadmin' })
        }
      });
    }

    if (devOwnerEmail && devOwnerPass && cleanEmail === devOwnerEmail && cleanPassword === devOwnerPass) {
      const ownerUser = db.prepare("SELECT * FROM users WHERE LOWER(email) = ?").get(devOwnerEmail) || {
        id: 9991,
        name: process.env.DEV_OWNER_NAME || 'Restaurant Owner',
        email: devOwnerEmail,
        role: 'restaurant_owner',
        status: 'active'
      };
      const { password_hash, ...safeOwner } = ownerUser;
      return res.json({
        success: true,
        message: 'Dev Owner Login successful',
        data: {
          user: safeOwner,
          token: generateToken({ id: ownerUser.id, email: ownerUser.email, role: 'restaurant_owner' })
        }
      });
    }

    if (devStaffEmail && devStaffPass && cleanEmail === devStaffEmail && cleanPassword === devStaffPass) {
      const staffUser = {
        id: 9992,
        name: process.env.DEV_STAFF_NAME || 'Restaurant Staff',
        email: devStaffEmail,
        role: 'staff',
        status: 'active'
      };
      return res.json({
        success: true,
        message: 'Dev Staff Login successful',
        data: {
          user: staffUser,
          token: generateToken({ id: staffUser.id, email: staffUser.email, role: 'staff' })
        }
      });
    }

    // 2. Database user lookup with bcrypt comparison
    const user = db.prepare(`
      SELECT id, name, email, role, avatar, phone, status, password_hash
      FROM users
      WHERE LOWER(email) = ?
    `).get(cleanEmail);

    if (!user || !comparePassword(cleanPassword, user.password_hash)) {
      return res.status(401).json({ success: false, error: 'Invalid email or password' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ success: false, error: 'This account is disabled' });
    }

    const now = new Date().toISOString();
    db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(now, user.id);

    const { password_hash, ...safeUser } = user;
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: safeUser,
        token: generateToken({ id: user.id, email: user.email, role: user.role })
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
