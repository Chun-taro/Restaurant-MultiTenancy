require('dotenv').config();
const express = require('express');
const path = require('node:path');
const fs = require('node:fs');
const { db } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/tenants', require('./routes/tenants'));
app.use('/api/plans', require('./routes/plans'));
app.use('/api/billing', require('./routes/billing'));
app.use('/api/users', require('./routes/users'));
app.use('/api/audit-logs', require('./routes/audit'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/tenant', require('./routes/tenantPortal'));
app.use('/api/storefront', require('./routes/storefront'));

// System health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    platform: 'RestoSaaS Platform Engine (React + Node.js + SQLite)',
    database: 'SQLite (No XAMPP / No MySQL / Zero-Config Embedded)',
    dbPath: 'data/saas_platform.db',
    version: '2.0.0',
    timestamp: new Date().toISOString()
  });
});

// Serve React production build from 'frontend/dist' or 'dist' if exists, otherwise fallback to public
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
const rootDist = path.join(__dirname, '..', 'dist');
const staticPath = fs.existsSync(frontendDist) ? frontendDist : (fs.existsSync(rootDist) ? rootDist : path.join(__dirname, '..', 'frontend', 'public'));

app.use(express.static(staticPath));
app.use((req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 RestoSaaS Superadmin Core is running!`);
  console.log(`📁 Database: SQLite (Zero external software / No XAMPP required)`);
  console.log(`📍 URL: http://localhost:${PORT}`);
  console.log(`🛡️  Admin Account: admin@restosaas.com / admin123`);
  console.log(`====================================================`);
});
