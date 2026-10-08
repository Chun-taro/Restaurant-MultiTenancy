const express = require('express');
const router = express.Router();
const { db } = require('../db');

// GET /api/audit-logs
router.get('/', (req, res) => {
  try {
    const { action, limit = 50 } = req.query;

    let query = 'SELECT * FROM audit_logs';
    const params = [];

    if (action && action !== 'all') {
      query += ' WHERE action = ?';
      params.push(action);
    }

    query += ' ORDER BY id DESC LIMIT ?';
    params.push(Number(limit));

    const logs = db.prepare(query).all(...params);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
