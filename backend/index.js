require('dotenv').config({ quiet: true });
const express = require('express');
const path = require('node:path');
const fs = require('node:fs');
const { db } = require('./db');
const { connectDB, isConnected } = require('./config/db');
const { hydrateMasterFromAtlas } = require('./mongoHydration');

// Initialize MongoDB Atlas connection & load master data
connectDB().then(() => {
  return hydrateMasterFromAtlas(db);
}).catch(err => {
  console.warn('[MongoDB Atlas Startup Warning]:', err.message);
});

const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for Vercel frontend and any custom domain
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware (with 50mb limit for tenant image uploads)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads serving for tenant media (logos, banners, dishes)
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

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
  const atlasOnline = isConnected();
  res.json({
    status: 'online',
    platform: 'RestoSaaS Platform Engine (React + Node.js + MongoDB Atlas)',
    database: atlasOnline ? 'MongoDB Atlas Cloud (Online)' : 'MongoDB Atlas (Connecting...)',
    cloudCluster: 'restosaas.6ucox8v.mongodb.net',
    connected: atlasOnline,
    version: '2.5.0',
    timestamp: new Date().toISOString()
  });
});

// Serve React production build from 'frontend/dist' or 'dist' if exists
const frontendDist = path.join(__dirname, '..', 'frontend', 'dist');
const rootDist = path.join(__dirname, '..', 'dist');
const staticPath = fs.existsSync(frontendDist) ? frontendDist : (fs.existsSync(rootDist) ? rootDist : null);

if (staticPath) {
  app.use(express.static(staticPath));
  app.use((req, res) => {
    res.sendFile(path.join(staticPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>RestoSaaS API Server</title></head>
      <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 90vh; text-align: center; background: #0f172a; color: #f8fafc;">
        <h2 style="color: #6366f1;">RestoSaaS Backend API is Running on Port ${PORT}</h2>
        <p style="color: #94a3b8; max-width: 500px;">To view the application, start the Vite development server:</p>
        <code style="background: #1e293b; padding: 12px 20px; border-radius: 8px; color: #38bdf8; font-size: 15px;">cd frontend && npm run dev</code>
        <p style="margin-top: 15px;"><a href="http://localhost:5173" style="color: #6366f1; text-decoration: underline;">Open http://localhost:5173</a></p>
      </body>
      </html>
    `);
  });
}

// Start Server
app.listen(PORT);

