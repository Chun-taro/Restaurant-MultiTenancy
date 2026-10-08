import React from 'react';

export default function Sidebar({ currentRoute, onNavigate, onGoToLanding, onSignOut, tenantCount = 0, onOpenTenantPortal, onOpenStorefront }) {
  const navItems = [
    { section: 'Platform Intelligence' },
    { id: 'dashboard', label: 'Dashboard', icon: 'ri-dashboard-3-line' },
    { id: 'tenants', label: 'Restaurants / Tenants', icon: 'ri-restaurant-2-line', badge: tenantCount },
    { section: 'Monetization & Billing' },
    { id: 'plans', label: 'Subscription Plans', icon: 'ri-vip-diamond-line' },
    { id: 'billing', label: 'Billing & Invoices', icon: 'ri-bank-card-line' },
    { section: 'Governance & System' },
    { id: 'users', label: 'Identity & Access', icon: 'ri-shield-user-line' },
    { id: 'audit', label: 'Audit Logs', icon: 'ri-history-line' },
    { id: 'settings', label: 'System Settings', icon: 'ri-settings-4-line' }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-icon">
          <i className="ri-store-3-fill"></i>
        </div>
        <div className="brand-info">
          <div className="brand-name">
            RestoSaaS <span className="brand-badge">CORE</span>
          </div>
          <div className="brand-subtitle">Super Admin Console</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item, idx) => {
          if (item.section) {
            return (
              <div key={idx} className="nav-section-title">
                {item.section}
              </div>
            );
          }
          const isActive = currentRoute === item.id;
          return (
            <a
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(item.id);
              }}
            >
              <i className={item.icon}></i>
              <span>{item.label}</span>
              {item.badge != null && (
                <span className="nav-badge active-badge">{item.badge}</span>
              )}
            </a>
          );
        })}

        {/* Separated External Links for Testing in New Tabs */}
        <div style={{ marginTop: '20px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div className="nav-section-title" style={{ padding: '0 12px', marginBottom: '4px' }}>
            Live Tenant Environments (New Tabs)
          </div>
          <a
            href="/store/brandobar"
            target="_blank"
            rel="noreferrer"
            className="nav-item"
            style={{ fontSize: '12px', padding: '6px 12px', color: 'var(--text-secondary)' }}
            title="Opens Customer Ordering Storefront in a separate tab"
          >
            <i className="ri-external-link-line" style={{ color: 'var(--primary-light)' }}></i>
            <span>Customer Storefront ↗</span>
          </a>
          <a
            href="/portal/brandobar"
            target="_blank"
            rel="noreferrer"
            className="nav-item"
            style={{ fontSize: '12px', padding: '6px 12px', color: 'var(--text-secondary)' }}
            title="Opens Restaurant Kitchen Portal in a separate tab"
          >
            <i className="ri-external-link-line" style={{ color: '#10B981' }}></i>
            <span>Tenant Portal ↗</span>
          </a>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="admin-mini-profile" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              alt="Super Admin"
              className="admin-avatar"
            />
            <div className="admin-meta">
              <div className="admin-name">Alexandre Vance</div>
              <div className="admin-role">Super Admin</div>
            </div>
          </div>

          <button
            title="Sign Out"
            style={{
              background: 'rgba(244, 63, 94, 0.12)',
              border: '1px solid rgba(244, 63, 94, 0.25)',
              color: '#FB7185',
              padding: '6px 8px',
              borderRadius: 'var(--radius-sm)',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onClick={onSignOut}
          >
            <i className="ri-logout-box-r-line"></i>
          </button>
        </div>
      </div>
    </aside>
  );
}
