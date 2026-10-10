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
  onOpenProfile,
  onToggleMobileSidebar
}) {
  const meta = routeTitles[currentRoute] || { title: 'Super Admin', subtitle: '' };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={onToggleMobileSidebar}
          aria-label="Toggle navigation menu"
          title="Open Menu"
        >
          <i className="ri-menu-2-line"></i>
        </button>

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
            className="topbar-profile-btn"
            onClick={onOpenProfile}
            title="Customize Superadmin Profile & Credentials"
          >
            <img
              src={adminUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${adminUser.name}`}
              alt=""
              className="topbar-profile-avatar"
            />
            <div className="topbar-profile-meta">
              <div className="topbar-profile-name">
                {adminUser.name}
              </div>
              <div className="topbar-profile-role">
                SUPERADMIN
              </div>
            </div>
            <i className="ri-settings-4-line topbar-profile-icon" />
          </button>
        )}

        <button
          className="btn btn-secondary btn-sm topbar-action-btn"
          onClick={onGoToLanding}
          title="View Public Landing Page"
        >
          <i className="ri-external-link-line"></i>
          <span className="topbar-btn-text">Landing Page</span>
        </button>

        <button 
          className="btn btn-primary btn-sm topbar-action-btn" 
          onClick={onOpenProvision}
          title="Provision New Tenant"
        >
          <i className="ri-add-line"></i>
          <span className="topbar-btn-text">Provision Tenant</span>
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
