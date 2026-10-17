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

// Dynamic cloud media fallback: If tenant upload media is missing from local disk, serve directly from MongoDB Atlas Media collection and restore to disk
app.get('/uploads/tenants/:slug/:folder/:filename', async (req, res, next) => {
  try {
    const { slug, folder, filename } = req.params;
    const filePath = path.join(uploadsDir, 'tenants', slug, folder, filename);
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
    const { getTenantMongoDb } = require('./tenantMongoManager');
    const tenantMongo = getTenantMongoDb(slug);
    if (tenantMongo?.Media) {
      const media = await tenantMongo.Media.findOne({ fileName: filename }).lean();
      if (media && media.dataUrl) {
        const matches = media.dataUrl.match(/^data:([a-zA-Z0-9\/+-]+);base64,(.+)$/);
        const contentType = matches ? matches[1] : (media.contentType || 'image/jpeg');
        const buffer = matches ? Buffer.from(matches[2], 'base64') : Buffer.from(media.dataUrl, 'base64');

        // Restore to disk cache for subsequent rapid requests
        try {
          const dir = path.dirname(filePath);
          if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(filePath, buffer);
        } catch (e) {}

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Length', buffer.length);
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(buffer);
      }
    }
    next();
  } catch (err) {
    next();
  }
});

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
    platform: 'Dine Platform Engine (React + Node.js + MongoDB Atlas)',
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
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return res.status(404).json({ success: false, error: 'Endpoint not found' });
    }
    res.sendFile(path.join(staticPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head><title>Dine API Server</title></head>
      <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 90vh; text-align: center; background: #0f172a; color: #f8fafc;">
        <h2 style="color: #6366f1;">Dine Backend API is Running on Port ${PORT}</h2>
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

