require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');
const AuditLog = require('../models/AuditLog');
const SystemSetting = require('../models/SystemSetting');

let isConnected = false;

async function connectDB() {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/restosaas';

  try {
    console.log(`Connecting to MongoDB at: ${mongoURI}...`);
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2500
    });
    isConnected = true;
    console.log('[DB] Connected to MongoDB successfully.');
    await seedMongoData();
  } catch (err) {
    console.warn(`[DB] Local MongoDB daemon is not running on 27017 (${err.message}).`);
    console.log('[DB] Using embedded document store with Mongoose model architecture.');
    console.log('[DB] Set MONGODB_URI in .env to connect to MongoDB Atlas or local MongoDB.');
    await seedMemoryData();
  }
}

// In-memory / file fallback store keeping Mongoose Model APIs working flawlessly
const memoryStore = {
  users: [],
  restaurants: [],
  plans: [],
  subscriptions: [],
  invoices: [],
  auditLogs: [],
  settings: []
};

function generateId() {
  const chars = 'abcdef0123456789';
  let s = '';
  for (let i = 0; i < 24; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

async function seedMemoryData() {
  if (memoryStore.users.length > 0) return;

  const now = new Date();
  const past30Days = new Date(Date.now() - 30 * 86400000);
  const next30Days = new Date(Date.now() + 30 * 86400000);
  const nextYear = new Date(Date.now() + 365 * 86400000);

  // 1. Super Admins
  const devSuperName = process.env.DEV_SUPERADMIN_NAME || 'Platform Admin';
  const devSuperEmail = process.env.DEV_SUPERADMIN_EMAIL || 'admin@example.com';
  const devSuperPass = process.env.DEV_SUPERADMIN_PASSWORD || '';

  if (devSuperPass) {
    const admin1 = {
      _id: generateId(),
      name: devSuperName,
      email: devSuperEmail,
      password: devSuperPass,
      role: 'superadmin',
      phone: '+63 900 000 0001',
      avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(devSuperName)}`,
      status: 'active',
      lastLoginAt: now,
      createdAt: past30Days,
      updatedAt: now
    };
    memoryStore.users.push(admin1);
  }

  // 2. Subscription Plans
  const starter = {
    _id: generateId(),
    name: 'Starter Cafe',
    code: 'starter',
    description: 'Perfect for food trucks, pop-up kiosks, and small cafes beginning their digital journey.',
    priceMonthly: 1499,
    priceYearly: 14990,
    currency: 'PHP',
    maxProducts: 40,
    maxStaff: 2,
    maxMonthlyOrders: 300,
    transactionFeePercent: 3.0,
    hasQrOrdering: true,
    hasOnlinePayment: true,
    hasCustomDomain: false,
    hasAdvancedAnalytics: false,
    hasInventory: false,
    isPopular: false,
    isActive: true,
    createdAt: past30Days
  };

  const growth = {
    _id: generateId(),
    name: 'Growth Bistro',
    code: 'growth',
    description: 'The standard choice for full-service dining, bistros, and expanding local favorites.',
    priceMonthly: 2999,
    priceYearly: 29990,
    currency: 'PHP',
    maxProducts: 150,
    maxStaff: 6,
    maxMonthlyOrders: 1200,
    transactionFeePercent: 2.0,
    hasQrOrdering: true,
    hasOnlinePayment: true,
    hasCustomDomain: true,
    hasAdvancedAnalytics: true,
    hasInventory: false,
    isPopular: true,
    isActive: true,
    createdAt: past30Days
  };

  const pro = {
    _id: generateId(),
    name: 'Pro Restaurant',
    code: 'pro',
    description: 'Comprehensive powerhouse for bustling multi-branch restaurants with high order volume.',
    priceMonthly: 5499,
    priceYearly: 54990,
    currency: 'PHP',
    maxProducts: -1,
    maxStaff: 15,
    maxMonthlyOrders: -1,
    transactionFeePercent: 1.2,
    hasQrOrdering: true,
    hasOnlinePayment: true,
    hasCustomDomain: true,
    hasAdvancedAnalytics: true,
    hasInventory: true,
    isPopular: false,
    isActive: true,
    createdAt: past30Days
  };

  const enterprise = {
    _id: generateId(),
    name: 'Enterprise Franchise',
    code: 'enterprise',
    description: 'Custom SLA, dedicated cloud database isolation, zero commission, and custom POS integration.',
    priceMonthly: 12999,
    priceYearly: 129990,
    currency: 'PHP',
    maxProducts: -1,
    maxStaff: 50,
    maxMonthlyOrders: -1,
    transactionFeePercent: 0.5,
    hasQrOrdering: true,
    hasOnlinePayment: true,
    hasCustomDomain: true,
    hasAdvancedAnalytics: true,
    hasInventory: true,
    isPopular: false,
    isActive: true,
    createdAt: past30Days
  };

  memoryStore.plans.push(starter, growth, pro, enterprise);

  // 3. Seed Restaurants
  const tenants = [
    {
      name: "Juan's Smokehouse BBQ",
      slug: "juans-smokehouse",
      subdomain: "juans-smokehouse",
      customDomain: "juanssmokehouse.ph",
      cuisineType: "Filipino Grill & BBQ",
      logoUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=120&auto=format&fit=crop&q=80",
      primaryColor: "#E11D48",
      status: "active",
      address: "24 Kalayaan Ave, Diliman",
      city: "Quezon City",
      phone: "+63 917 501 2233",
      email: "order@juanssmokehouse.ph",
      owner: { name: "Juan De la Cruz", email: "juan@juanssmokehouse.ph" },
      plan: growth,
      cycle: "monthly",
      orders: 842,
      volume: 382400.00
    },
    {
      name: "Sakura Ramen Izakaya",
      slug: "sakura-ramen",
      subdomain: "sakura-ramen",
      customDomain: "sakuraramen.com",
      cuisineType: "Japanese Authentic Ramen",
      logoUrl: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=120&auto=format&fit=crop&q=80",
      primaryColor: "#F97316",
      status: "active",
      address: "GF Bonifacio High Street, BGC",
      city: "Taguig City",
      phone: "+63 920 443 8899",
      email: "contact@sakuraramen.com",
      owner: { name: "Kenji Sato", email: "kenji@sakuraramen.com" },
      plan: pro,
      cycle: "yearly",
      orders: 1420,
      volume: 712050.00
    },
    {
      name: "Bella Italia Trattoria",
      slug: "bella-italia",
      subdomain: "bella-italia",
      customDomain: null,
      cuisineType: "Italian Artisan Pasta & Pizza",
      logoUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=120&auto=format&fit=crop&q=80",
      primaryColor: "#10B981",
      status: "active",
      address: "Greenbelt 5, Ayala Center",
      city: "Makati City",
      phone: "+63 918 200 7711",
      email: "ciao@bellaitalia.ph",
      owner: { name: "Marco Rossi", email: "marco@bellaitalia.ph" },
      plan: growth,
      cycle: "monthly",
      orders: 615,
      volume: 320900.00
    },
    {
      name: "Brew & Bean Specialty Cafe",
      slug: "brew-and-bean",
      subdomain: "brew-and-bean",
      customDomain: "brewandbeancafe.ph",
      cuisineType: "Specialty Coffee & Pastries",
      logoUrl: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=120&auto=format&fit=crop&q=80",
      primaryColor: "#D97706",
      status: "trialing",
      address: "IT Park, Lahug",
      city: "Cebu City",
      phone: "+63 932 998 1230",
      email: "hello@brewandbeancafe.ph",
      owner: { name: "Bea Alcantara", email: "bea@brewandbeancafe.ph" },
      plan: starter,
      cycle: "monthly",
      orders: 124,
      volume: 48500.00
    },
    {
      name: "Taqueria Dos Hermanos",
      slug: "taqueria-dos-hermanos",
      subdomain: "taqueria-dos-hermanos",
      customDomain: null,
      cuisineType: "Mexican Street Food",
      logoUrl: "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=120&auto=format&fit=crop&q=80",
      primaryColor: "#EC4899",
      status: "active",
      address: "Poblacion Heritage District",
      city: "Makati City",
      phone: "+63 927 771 9081",
      email: "tacos@doshermanos.ph",
      owner: { name: "Mateo Gomez", email: "mateo@doshermanos.ph" },
      plan: starter,
      cycle: "monthly",
      orders: 395,
      volume: 142200.00
    },
    {
      name: "Golden Bay Seafood Pavilion",
      slug: "golden-bay-seafood",
      subdomain: "golden-bay-seafood",
      customDomain: "goldenbayseafood.com.ph",
      cuisineType: "Cantonese & Seafood Banquets",
      logoUrl: "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=120&auto=format&fit=crop&q=80",
      primaryColor: "#8B5CF6",
      status: "active",
      address: "Macapagal Blvd, Bay City",
      city: "Pasay City",
      phone: "+63 917 650 3344",
      email: "inquiry@goldenbayseafood.com.ph",
      owner: { name: "Winston Chen", email: "winston@goldenbayseafood.com.ph" },
      plan: enterprise,
      cycle: "yearly",
      orders: 2190,
      volume: 1650800.00
    },
    {
      name: "Mama Sita's Heritage Pot",
      slug: "mama-sitas-heritage",
      subdomain: "mama-sitas-heritage",
      customDomain: null,
      cuisineType: "Classic Filipino Comfort Food",
      logoUrl: "https://images.unsplash.com/photo-1544025162-d76694265947?w=120&auto=format&fit=crop&q=80",
      primaryColor: "#DC2626",
      status: "suspended",
      address: "Roxas Ave, Poblacion",
      city: "Davao City",
      phone: "+63 945 112 4001",
      email: "billing@mamasitasdavao.ph",
      owner: { name: "Clara Santos", email: "clara@mamasitasdavao.ph" },
      plan: starter,
      cycle: "monthly",
      orders: 89,
      volume: 29800.00,
      suspendedReason: "Failed renewal billing after 3 attempts (Past due 14 days)."
    },
    {
      name: "The Healthy Bowl Co.",
      slug: "healthy-bowl-co",
      subdomain: "healthy-bowl-co",
      customDomain: null,
      cuisineType: "Salads & Vegan Grain Bowls",
      logoUrl: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=120&auto=format&fit=crop&q=80",
      primaryColor: "#059669",
      status: "pending",
      address: "Alabang Town Center, Muntinlupa",
      city: "Metro Manila",
      phone: "+63 919 444 8721",
      email: "hello@healthybowl.co",
      owner: { name: "Patricia Lopez", email: "patricia@healthybowl.co" },
      plan: growth,
      cycle: "monthly",
      orders: 0,
      volume: 0.00
    }
  ];

  let invIdx = 1001;

  tenants.forEach(t => {
    const ownerUser = {
      _id: generateId(),
      name: t.owner.name,
      email: t.owner.email,
      password: process.env.DEV_OWNER_PASSWORD || '',
      role: 'restaurant_owner',
      phone: t.phone,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(t.owner.name)}`,
      status: 'active',
      lastLoginAt: now,
      createdAt: past30Days,
      updatedAt: now
    };
    memoryStore.users.push(ownerUser);

    const restaurant = {
      _id: generateId(),
      name: t.name,
      slug: t.slug,
      subdomain: t.subdomain,
      customDomain: t.customDomain,
      cuisineType: t.cuisineType,
      logoUrl: t.logoUrl,
      bannerUrl: null,
      primaryColor: t.primaryColor,
      secondaryColor: '#1E293B',
      status: t.status,
      address: t.address,
      city: t.city,
      phone: t.phone,
      email: t.email,
      currency: 'PHP',
      ordersCount: t.orders,
      totalVolume: t.volume,
      suspendedReason: t.suspendedReason || null,
      ownerId: ownerUser._id,
      createdAt: past30Days,
      updatedAt: now
    };
    memoryStore.restaurants.push(restaurant);

    const sub = {
      _id: generateId(),
      restaurantId: restaurant._id,
      planId: t.plan._id,
      status: t.status === 'suspended' ? 'past_due' : (t.status === 'trialing' ? 'trialing' : 'active'),
      billingCycle: t.cycle,
      currentPeriodStart: past30Days,
      currentPeriodEnd: t.cycle === 'yearly' ? nextYear : next30Days,
      trialEndsAt: t.status === 'trialing' ? next30Days : null,
      autoRenew: true,
      createdAt: past30Days,
      updatedAt: now
    };
    memoryStore.subscriptions.push(sub);

    const amount = t.cycle === 'yearly' ? t.plan.priceYearly : t.plan.priceMonthly;
    const invStatus = t.status === 'suspended' ? 'failed' : (t.status === 'pending' || t.status === 'trialing' ? 'pending' : 'paid');

    const inv = {
      _id: generateId(),
      invoiceNumber: `INV-2026-${invIdx++}`,
      restaurantId: restaurant._id,
      planId: t.plan._id,
      amount,
      currency: 'PHP',
      status: invStatus,
      billingPeriod: `${now.toLocaleString('en-US', { month: 'short', year: 'numeric' })} Subscription`,
      dueDate: next30Days,
      paidAt: invStatus === 'paid' ? past30Days : null,
      paymentMethod: 'Maya Business / GCash',
      createdAt: past30Days
    };
    memoryStore.invoices.push(inv);
  });

  // 4. Audit Logs
  memoryStore.auditLogs.push(
    { _id: generateId(), actorName: 'System Automation', actorRole: 'System', action: 'PROVISION_TENANT', entityType: 'restaurant', entityId: '1', details: "Provisioned tenant: Juan's Smokehouse BBQ with Growth plan", ipAddress: '127.0.0.1', createdAt: past30Days },
    { _id: generateId(), actorName: 'Alexandre Vance', actorRole: 'superadmin', action: 'APPROVE_DOMAIN', entityType: 'restaurant', entityId: '2', details: "Approved custom domain 'sakuraramen.com' for Sakura Ramen Izakaya", ipAddress: '112.198.74.12', createdAt: past30Days },
    { _id: generateId(), actorName: 'Sofia Reyes', actorRole: 'superadmin', action: 'UPDATE_PLAN_PRICING', entityType: 'plan', entityId: '2', details: "Updated Growth Bistro plan monthly pricing to ₱2,999.00", ipAddress: '112.198.74.15', createdAt: past30Days },
    { _id: generateId(), actorName: 'Alexandre Vance', actorRole: 'superadmin', action: 'SUSPEND_TENANT', entityType: 'restaurant', entityId: '7', details: "Suspended Mama Sita's Heritage Pot due to past due payments", ipAddress: '112.198.74.12', createdAt: now },
    { _id: generateId(), actorName: 'Alexandre Vance', actorRole: 'superadmin', action: 'LOGIN', entityType: 'auth', entityId: '1', details: "Super Admin login successful", ipAddress: '112.198.74.12', createdAt: now }
  );

  // 5. System Settings
  memoryStore.settings.push(
    { _id: generateId(), key: 'platform_name', value: 'RestoSaaS Platform Suite', category: 'general', description: 'Public platform name' },
    { _id: generateId(), key: 'default_currency', value: 'PHP', category: 'localization', description: 'Base platform currency' },
    { _id: generateId(), key: 'platform_support_email', value: 'support@restosaas.com', category: 'general', description: 'Support email' },
    { _id: generateId(), key: 'trial_days_default', value: '14', category: 'billing', description: 'Default trial period' },
    { _id: generateId(), key: 'allow_self_signup', value: 'true', category: 'general', description: 'Self-signup allowed' },
    { _id: generateId(), key: 'maintenance_mode', value: 'false', category: 'system', description: 'Maintenance mode toggle' },
    { _id: generateId(), key: 'payment_gateway_mode', value: 'sandbox', category: 'payments', description: 'Gateway mode' },
    { _id: generateId(), key: 'webhook_signing_secret', value: 'whsec_9934f828a1d77a0c8b21e8e4a9918b82', category: 'security', description: 'Webhook HMAC secret' }
  );
}

async function seedMongoData() {
  const usersCount = await User.countDocuments();
  if (usersCount > 0) return;

  await seedMemoryData();

  await User.insertMany(memoryStore.users);
  await SubscriptionPlan.insertMany(memoryStore.plans);
  await Restaurant.insertMany(memoryStore.restaurants);
  await Subscription.insertMany(memoryStore.subscriptions);
  await Invoice.insertMany(memoryStore.invoices);
  await AuditLog.insertMany(memoryStore.auditLogs);
  await SystemSetting.insertMany(memoryStore.settings);
  console.log('[DB] Seeded initial multi-tenant data into MongoDB successfully.');
}

module.exports = {
  connectDB,
  isConnected: () => isConnected,
  memoryStore,
  generateId
};
