import React from 'react';

const routeTitles = {
  dashboard: { title: 'Executive Overview', subtitle: 'Platform-wide multi-tenant intelligence and revenue metrics' },
  tenants: { title: 'Restaurant Tenants', subtitle: 'Manage isolated multi-tenant stores, domains, and subscriptions' },
  plans: { title: 'Subscription Plans', subtitle: 'Platform billing tiers, feature gates, and pricing matrix' },
  billing: { title: 'Billing & Invoices', subtitle: 'Subscription receivables, payment records, and financial status' },
  users: { title: 'Identity & Access', subtitle: 'Superadmin credentials, tenant owners, and role authorization' },
  audit: { title: 'Security & Audit Trail', subtitle: 'Real-time administrative operations and audit logs' },
  settings: { title: 'System Settings', subtitle: 'Platform configurations, superadmin credentials, and maintenance' }
};

export default function Topbar({
  currentRoute,
  searchQuery,
  onSearchChange,
  onOpenProvision,
  onGoToLanding,
  onSignOut,
  adminUser,
  onOpenProfile
}) {
  const meta = routeTitles[currentRoute] || { title: 'Super Admin', subtitle: '' };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="page-title-group">
          <h1 id="page-header-title">{meta.title}</h1>
          <p id="page-header-subtitle">{meta.subtitle}</p>
        </div>
      </div>

      <div className="topbar-search">
        <i className="ri-search-2-line"></i>
        <input
          type="text"
          placeholder="Quick search tenants, owners, or slugs..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="topbar-right">
        {/* Superadmin Profile Badge */}
        {adminUser && (
          <button
            type="button"
            onClick={onOpenProfile}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '9px',
              padding: '4px 12px 4px 6px',
              borderRadius: '24px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
              color: '#FFF',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 90, 31, 0.12)';
              e.currentTarget.style.borderColor = 'rgba(255, 90, 31, 0.3)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
            title="Customize Superadmin Profile & Credentials"
          >
            <img
              src={adminUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${adminUser.name}`}
              alt=""
              style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', background: '#1E293B', border: '1px solid var(--primary-light)' }}
            />
            <div style={{ textAlign: 'left', lineHeight: 1.1 }}>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#FFF' }}>
                {adminUser.name}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--primary-light)', fontWeight: 600 }}>
                SUPERADMIN
              </div>
            </div>
            <i className="ri-settings-4-line" style={{ fontSize: '13px', color: 'var(--text-muted)', marginLeft: '2px' }} />
          </button>
        )}

        <button
          className="btn btn-secondary btn-sm"
          onClick={onGoToLanding}
          title="View Public Landing Page"
        >
          <i className="ri-external-link-line"></i> Landing Page
        </button>

        <button className="btn btn-primary btn-sm" onClick={onOpenProvision}>
          <i className="ri-add-line"></i> Provision Tenant
        </button>

        <button
          className="btn btn-danger btn-sm"
          onClick={onSignOut}
          title="Sign Out"
        >
          <i className="ri-logout-box-r-line"></i>
        </button>
      </div>
    </header>
  );
}
