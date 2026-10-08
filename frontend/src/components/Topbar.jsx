import React from 'react';

const routeTitles = {
  dashboard: { title: 'Executive Overview', subtitle: 'Platform-wide multi-tenant intelligence and revenue metrics' },
  tenants: { title: 'Restaurant Tenants', subtitle: 'Manage isolated multi-tenant stores, domains, and subscriptions' },
  plans: { title: 'Subscription Plans', subtitle: 'Platform billing tiers, feature gates, and pricing matrix' },
  billing: { title: 'Billing & Invoices', subtitle: 'Subscription receivables, payment records, and financial status' },
  users: { title: 'Identity & Access', subtitle: 'Superadmin credentials, tenant owners, and role authorization' },
  audit: { title: 'Security & Audit Trail', subtitle: 'Real-time administrative operations and audit logs' },
  settings: { title: 'System Settings', subtitle: 'Platform configurations, payments mode, and maintenance' }
};

export default function Topbar({ currentRoute, searchQuery, onSearchChange, onOpenProvision, onGoToLanding, onSignOut }) {
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
        <div className="system-status-pill">
          <span className="pulse-dot"></span>
          <span>SQLite Engine Online</span>
        </div>

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
