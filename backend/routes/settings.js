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

// GET /api/settings
router.get('/', (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM system_settings').all();
    const settings = {};
    rows.forEach(r => {
      settings[r.key] = { value: r.value, category: r.category, description: r.description };
    });
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/settings
router.put('/', async (req, res) => {
  try {
    const { settings, admin_name = 'Alexandre Vance' } = req.body;
    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, error: 'Settings object is required' });
    }

    const now = new Date().toISOString();
    const upsertStmt = db.prepare(`
      INSERT INTO system_settings (key, value, category, description, updated_at)
      VALUES (?, ?, 'branding', '', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);

    for (const [key, value] of Object.entries(settings)) {
      upsertStmt.run(key, String(value), now);

      try {
        const SystemSetting = require('../models/SystemSetting');
        await SystemSetting.findOneAndUpdate(
          { key },
          { value: String(value), category: 'branding', updatedAt: new Date() },
          { upsert: true, new: true }
        );
      } catch (mongoErr) {
        // Mongo sync is optional if offline
      }
    }

    logAudit(
      admin_name,
      'superadmin',
      'UPDATE_SETTINGS',
      'system',
      'settings',
      `Updated platform configuration settings (${Object.keys(settings).join(', ')})`
    );

    res.json({ success: true, message: 'Settings saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
