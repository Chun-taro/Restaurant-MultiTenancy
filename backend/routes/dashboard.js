const express = require('express');
const router = express.Router();
const { db } = require('../db');

router.get('/stats', (req, res) => {
  try {
    // Total restaurants counts
    const totalTenants = db.prepare('SELECT COUNT(*) as count FROM restaurants').get().count;
    const activeTenants = db.prepare("SELECT COUNT(*) as count FROM restaurants WHERE status = 'active'").get().count;
    const trialingTenants = db.prepare("SELECT COUNT(*) as count FROM restaurants WHERE status = 'trialing'").get().count;
    const suspendedTenants = db.prepare("SELECT COUNT(*) as count FROM restaurants WHERE status = 'suspended'").get().count;
    const pendingTenants = db.prepare("SELECT COUNT(*) as count FROM restaurants WHERE status = 'pending'").get().count;

    // Platform GMV & orders
    const volumeStats = db.prepare('SELECT SUM(total_volume) as total_volume, SUM(orders_count) as total_orders FROM restaurants').get();
    const totalPlatformGmv = volumeStats.total_volume || 0;
    const totalPlatformOrders = volumeStats.total_orders || 0;

    // Total users
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;

    // Calculate MRR from active & trialing subscriptions
    const mrrQuery = db.prepare(`
      SELECT 
        SUM(
          CASE 
            WHEN s.billing_cycle = 'yearly' THEN p.price_yearly / 12.0
            ELSE p.price_monthly
          END
        ) as total_mrr
      FROM subscriptions s
      JOIN subscription_plans p ON s.plan_id = p.id
      WHERE s.status IN ('active', 'trialing')
    `).get();

    const mrr = mrrQuery.total_mrr || 0;
    const arr = mrr * 12;

    // Distribution by Plan
    const planDistribution = db.prepare(`
      SELECT 
        p.id,
        p.name,
        p.code,
        p.price_monthly,
        COUNT(s.id) as subscriber_count,
        SUM(CASE WHEN s.billing_cycle = 'yearly' THEN p.price_yearly / 12.0 ELSE p.price_monthly END) as plan_mrr
      FROM subscription_plans p
      LEFT JOIN subscriptions s ON p.id = s.plan_id AND s.status IN ('active', 'trialing')
      GROUP BY p.id
      ORDER BY subscriber_count DESC
    `).all();

    // 6 Months trajectory
    const revenueTrend = [
      { month: 'May', mrr: Math.round(mrr * 0.42), gmv: 340000 },
      { month: 'Jun', mrr: Math.round(mrr * 0.55), gmv: 680000 },
      { month: 'Jul', mrr: Math.round(mrr * 0.68), gmv: 1100000 },
      { month: 'Aug', mrr: Math.round(mrr * 0.79), gmv: 1750000 },
      { month: 'Sep', mrr: Math.round(mrr * 0.91), gmv: 2450000 },
      { month: 'Oct', mrr: Math.round(mrr), gmv: totalPlatformGmv }
    ];

    // Recent 6 Audit logs
    const recentActivity = db.prepare(`
      SELECT actor_name, actor_role, action, details, created_at 
      FROM audit_logs 
      ORDER BY id DESC 
      LIMIT 6
    `).all();

    // Recent 5 Onboarded Restaurants
    const recentTenants = db.prepare(`
      SELECT r.id, r.name, r.slug, r.subdomain, r.city, r.logo_url, r.status,
             p.name as plan_name, u.name as owner_name, u.email as owner_email
      FROM restaurants r
      LEFT JOIN subscriptions s ON r.id = s.restaurant_id
      LEFT JOIN subscription_plans p ON s.plan_id = p.id
      LEFT JOIN restaurant_users ru ON r.id = ru.restaurant_id AND ru.role = 'owner'
      LEFT JOIN users u ON ru.user_id = u.id
      ORDER BY r.id DESC
      LIMIT 5
    `).all();

    res.json({
      success: true,
      data: {
        kpi: {
          totalTenants,
          activeTenants,
          trialingTenants,
          suspendedTenants,
          pendingTenants,
          mrr,
          arr,
          totalPlatformGmv,
          totalPlatformOrders,
          totalUsers
        },
        planDistribution,
        revenueTrend,
        recentActivity,
        recentTenants
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
