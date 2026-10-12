require('dotenv').config({ quiet: true });
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const mongoose = require('mongoose');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const SubscriptionPlan = require('../models/SubscriptionPlan');
const Subscription = require('../models/Subscription');
const Invoice = require('../models/Invoice');
const AuditLog = require('../models/AuditLog');
const SystemSetting = require('../models/SystemSetting');

let isConnected = false;

async function seedInitialPlansAndSettings() {
  const plansCount = await SubscriptionPlan.countDocuments();
  if (plansCount === 0) {
    const plans = [
      {
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
        isActive: true
      },
      {
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
        isActive: true
      },
      {
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
        isActive: true
      },
      {
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
        isActive: true
      }
    ];
    await SubscriptionPlan.insertMany(plans);
  }

  const settingsCount = await SystemSetting.countDocuments();
  if (settingsCount === 0) {
    const settings = [
      { key: 'platform_name', value: 'RestoSaaS Platform Suite', category: 'general', description: 'Public platform name' },
      { key: 'default_currency', value: 'PHP', category: 'localization', description: 'Base platform currency' },
      { key: 'platform_support_email', value: 'support@restosaas.com', category: 'general', description: 'Support email' },
      { key: 'trial_days_default', value: '14', category: 'billing', description: 'Default trial period' },
      { key: 'allow_self_signup', value: 'true', category: 'general', description: 'Self-signup allowed' },
      { key: 'maintenance_mode', value: 'false', category: 'system', description: 'Maintenance mode toggle' },
      { key: 'payment_gateway_mode', value: 'sandbox', category: 'payments', description: 'Gateway mode' },
      { key: 'webhook_signing_secret', value: 'whsec_9934f828a1d77a0c8b21e8e4a9918b82', category: 'security', description: 'Webhook HMAC secret' }
    ];
    await SystemSetting.insertMany(settings);
  }
}

async function connectDB() {
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    console.warn('[DB] No MONGODB_URI set in .env.');
    return;
  }

  try {
    const isAtlas = mongoURI.includes('mongodb+srv://') || mongoURI.includes('mongodb.net');
    console.log(`[DB] Connecting to MongoDB (${isAtlas ? 'Atlas Cloud' : 'Local'})...`);
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000
    });
    isConnected = true;
    console.log('[DB] Connected to MongoDB Atlas successfully.');
    await seedInitialPlansAndSettings();
  } catch (err) {
    console.warn(`[DB] MongoDB Atlas connection failed: ${err.message}`);
  }
}

module.exports = {
  connectDB,
  isConnected: () => isConnected
};
