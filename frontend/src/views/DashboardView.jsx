import React, { useState } from 'react';
import SVGChart from '../components/SVGChart';

export default function DashboardView({ stats, onNavigate, onOpenProvision, onInspectTenant }) {
  const [chartTab, setChartTab] = useState('mrr');

  if (!stats) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <i className="ri-loader-4-line ri-spin" style={{ fontSize: '32px', color: 'var(--primary)' }}></i>
      </div>
    );
  }

  const { kpi, planDistribution, revenueTrend, recentActivity, recentTenants } = stats;

  const chartData = (revenueTrend || []).map(d => ({
    label: d.month,
    value: chartTab === 'mrr' ? d.mrr : d.gmv
  }));

  const colorMap = {
    starter: '#0D9488',
    growth: '#E05A2B',
    pro: '#10B981',
    enterprise: '#F59E0B'
  };

  return (
    <div>
      {/* Top KPI Stat Cards */}
      <div className="kpi-grid">
        {/* KPI 1 */}
        <div className="kpi-card" style={{ '--card-accent': 'var(--primary)', '--kpi-icon-bg': 'var(--primary-glow)', '--kpi-icon-color': 'var(--primary-light)' }}>
          <div className="kpi-top">
            <span className="kpi-label">Monthly Recurring Revenue</span>
            <div className="kpi-icon"><i className="ri-money-dollar-circle-line"></i></div>
          </div>
          <div className="kpi-value">₱{Math.round(kpi.mrr).toLocaleString()}</div>
          <div className="kpi-footer">
            <span className="kpi-trend trend-up"><i className="ri-arrow-up-line"></i> +18.4%</span>
            <span className="trend-subtext">ARR run-rate: ₱{Math.round(kpi.arr).toLocaleString()}</span>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="kpi-card" style={{ '--card-accent': '#10B981', '--kpi-icon-bg': 'rgba(16, 185, 129, 0.12)', '--kpi-icon-color': '#34D399' }}>
          <div className="kpi-top">
            <span className="kpi-label">Active Restaurant Tenants</span>
            <div className="kpi-icon"><i className="ri-restaurant-2-line"></i></div>
          </div>
          <div className="kpi-value">
            {kpi.activeTenants} <span style={{ fontSize: '16px', fontWeight: 500, color: 'var(--text-muted)' }}>/ {kpi.totalTenants}</span>
          </div>
          <div className="kpi-footer">
            <span className="kpi-trend trend-up"><i className="ri-time-line"></i> {kpi.trialingTenants} Trialing</span>
            <span className="trend-subtext">· {kpi.suspendedTenants} Suspended</span>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="kpi-card" style={{ '--card-accent': '#F59E0B', '--kpi-icon-bg': 'rgba(245, 158, 11, 0.12)', '--kpi-icon-color': '#FBBF24' }}>
          <div className="kpi-top">
            <span className="kpi-label">Platform Gross Volume (GMV)</span>
            <div className="kpi-icon"><i className="ri-shopping-bag-3-line"></i></div>
          </div>
          <div className="kpi-value">₱{Math.round(kpi.totalPlatformGmv).toLocaleString()}</div>
          <div className="kpi-footer">
            <span className="kpi-trend trend-up"><i className="ri-file-list-3-line"></i> {kpi.totalPlatformOrders.toLocaleString()}</span>
            <span className="trend-subtext">Orders across storefronts</span>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="kpi-card" style={{ '--card-accent': '#0EA5E9', '--kpi-icon-bg': 'rgba(14, 165, 233, 0.12)', '--kpi-icon-color': '#38BDF8' }}>
          <div className="kpi-top">
            <span className="kpi-label">Platform Identities</span>
            <div className="kpi-icon"><i className="ri-user-shared-line"></i></div>
          </div>
          <div className="kpi-value">{kpi.totalUsers}</div>
          <div className="kpi-footer">
            <span className="kpi-trend trend-up"><i className="ri-shield-user-line"></i> {kpi.superAdminCount != null ? kpi.superAdminCount : 1} Superadmins</span>
            <span className="trend-subtext">· {kpi.ownerCount != null ? kpi.ownerCount : kpi.totalTenants} Owners</span>
          </div>
        </div>
      </div>

      {/* Enterprise Architecture Banner */}
      <div style={{
        background: '#141924',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: '18px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <i className="ri-database-2-fill"></i>
          </div>
          <div>
            <h4 style={{ color: '#fff', fontSize: '14px', fontWeight: 700 }}>Multi-Tenant Architecture Active</h4>
            <p style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
              Subdomain Routing · Table QR Engine · POS & Kitchen Integrations
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('plans')}>
            <i className="ri-price-tag-3-line"></i> Manage Plans
          </button>
          <button className="btn btn-primary btn-sm" onClick={onOpenProvision}>
            <i className="ri-add-line"></i> Provision New Restaurant
          </button>
        </div>
      </div>

      {/* Middle: SVG Chart & Plan Breakdown */}
      <div className="charts-grid">
        <div className="card">
          <div className="chart-header">
            <div>
              <div className="card-title"><i className="ri-line-chart-line" style={{ color: 'var(--primary-light)' }}></i> SaaS Revenue Trajectory</div>
              <div className="card-subtitle">Monthly Recurring Revenue growth over the last 6 months</div>
            </div>
            <div className="chart-filters">
              <button
                className={`chart-tab-btn ${chartTab === 'mrr' ? 'active' : ''}`}
                onClick={() => setChartTab('mrr')}
              >
                MRR (₱)
              </button>
              <button
                className={`chart-tab-btn ${chartTab === 'gmv' ? 'active' : ''}`}
                onClick={() => setChartTab('gmv')}
              >
                GMV Volume
              </button>
            </div>
          </div>
          <div style={{ width: '100%', height: '220px' }}>
            <SVGChart data={chartData} height={210} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title"><i className="ri-pie-chart-line" style={{ color: 'var(--emerald)' }}></i> Subscription Distribution</div>
              <div className="card-subtitle">Active restaurant allocation by tier</div>
            </div>
          </div>
          <div className="plan-progress-list">
            {(planDistribution || []).map(p => {
              const pct = Math.round((p.subscriber_count / (kpi.totalTenants || 1)) * 100);
              const color = colorMap[p.code] || '#6366F1';
              return (
                <div key={p.id} className="plan-progress-item">
                  <div className="plan-progress-header">
                    <span className="plan-progress-title">
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: color }}></span>
                      {p.name}
                    </span>
                    <span className="plan-progress-val">{p.subscriber_count} tenants ({pct}%)</span>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: `${pct}%`, background: color }}></div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)' }}>
                    <span>₱{p.price_monthly.toLocaleString()}/mo</span>
                    <span>MRR: ₱{Math.round(p.plan_mrr || 0).toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom: Recent Restaurants & Live Audit */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title"><i className="ri-store-2-line" style={{ color: 'var(--primary-light)' }}></i> Recently Provisioned Tenants</div>
              <div className="card-subtitle">Latest isolated restaurant databases</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('tenants')}>
              View All ({kpi.totalTenants})
            </button>
          </div>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Restaurant</th>
                  <th>Subdomain</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(recentTenants || []).map(t => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={t.logo_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=60'}
                          style={{ width: '34px', height: '34px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                          alt=""
                        />
                        <div>
                          <div style={{ fontWeight: 700, color: '#fff' }}>{t.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.city}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--primary-light)' }}>
                        {t.subdomain}.dine.ph
                      </code>
                    </td>
                    <td><span className="badge badge-plan">{t.plan_name}</span></td>
                    <td>
                      <span className={`badge badge-${t.status}`}>
                        <span className="badge-dot"></span> {t.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => onInspectTenant(t.id)}>
                        <i className="ri-eye-line"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title"><i className="ri-shield-keyhole-line" style={{ color: 'var(--amber)' }}></i> Real-Time Audit Feed</div>
              <div className="card-subtitle">Platform operations stream</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onNavigate('audit')}>Full Trail</button>
          </div>
          <div className="timeline">
            {(recentActivity || []).map((a, idx) => (
              <div key={idx} className="timeline-item">
                <div className="timeline-point"></div>
                <div className="timeline-content">
                  <div className="timeline-meta">
                    <span className="timeline-actor">{a.actor_name}</span>
                    <span className="timeline-time">{new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="timeline-desc">{a.details}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
