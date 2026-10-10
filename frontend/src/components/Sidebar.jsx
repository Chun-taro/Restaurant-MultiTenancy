import React, { useState, useEffect } from 'react';

export default function Sidebar({
  currentRoute,
  onNavigate,
  onGoToLanding,
  onSignOut,
  tenantCount = 0,
  tenants = [],
  adminUser,
  isMobileOpen = false,
  onCloseMobile
}) {
  const [selectedTenantSlug, setSelectedTenantSlug] = useState('');

  useEffect(() => {
    if (tenants && tenants.length > 0) {
      // Keep existing selection if valid, else pick first tenant
      const exists = tenants.some(t => t.slug === selectedTenantSlug);
      if (!exists) {
        setSelectedTenantSlug(tenants[0].slug);
      }
    }
  }, [tenants, selectedTenantSlug]);

  const navItems = [
    { section: 'Hospitality & Brands' },
    { id: 'dashboard', label: 'Dashboard', icon: 'ri-dashboard-3-line' },
    { id: 'tenants', label: 'Restaurants / Tenants', icon: 'ri-restaurant-2-line', badge: tenantCount },
    { section: 'Subscriptions & Billing' },
    { id: 'plans', label: 'Subscription Plans', icon: 'ri-vip-diamond-line' },
    { id: 'billing', label: 'Billing & Invoices', icon: 'ri-bank-card-line' },
    { section: 'Governance & Core' },
    { id: 'users', label: 'Identity & Access', icon: 'ri-shield-user-line' },
    { id: 'audit', label: 'Audit Logs', icon: 'ri-history-line' },
    { id: 'settings', label: 'System Settings', icon: 'ri-settings-4-line' }
  ];

  const displayName = adminUser?.name || 'Super Admin';
  const displayRole = adminUser?.role === 'superadmin' ? 'Super Admin' : (adminUser?.role || 'Administrator');
  const displayAvatar = adminUser?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName)}`;

  const handleNavClick = (routeId) => {
    onNavigate(routeId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div 
        className={`sidebar-backdrop ${isMobileOpen ? 'active' : ''}`}
        onClick={onCloseMobile}
        aria-hidden="true"
      />

      <aside className={`sidebar ${isMobileOpen ? 'is-mobile-open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-icon">
            <i className="ri-store-3-fill"></i>
          </div>
          <div className="brand-info">
            <div className="brand-name">
              RestoSaaS <span className="brand-badge">CORE</span>
            </div>
            <div className="brand-subtitle">Restaurant SaaS Console</div>
          </div>

          <button 
            type="button" 
            className="sidebar-close-btn" 
            onClick={onCloseMobile}
            title="Close sidebar"
            aria-label="Close menu"
          >
            <i className="ri-close-line"></i>
          </button>
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
                  handleNavClick(item.id);
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

        {/* Dynamic Tenant Live Launcher */}
        {tenants && tenants.length > 0 && (
          <div style={{
            marginTop: '20px',
            paddingTop: '14px',
            borderTop: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div className="nav-section-title" style={{ padding: '0 4px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Live Environments</span>
              <span style={{ fontSize: '10px', color: 'var(--primary-light)', fontWeight: 600 }}>{tenants.length} Active</span>
            </div>

            <div style={{ padding: '0 4px' }}>
              <select
                className="form-control form-select"
                style={{
                  fontSize: '11.5px',
                  padding: '6px 8px',
                  background: 'rgba(255,255,255,0.04)',
                  borderColor: 'var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  color: '#fff',
                  width: '100%',
                  marginBottom: '8px'
                }}
                value={selectedTenantSlug}
                onChange={(e) => setSelectedTenantSlug(e.target.value)}
              >
                {tenants.map(t => (
                  <option key={t.id || t.slug} value={t.slug} style={{ background: '#111827', color: '#fff' }}>
                    {t.name} ({t.slug})
                  </option>
                ))}
              </select>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                <a
                  href={`/store/${selectedTenantSlug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-xs"
                  style={{
                    fontSize: '11px',
                    padding: '6px 6px',
                    justifyContent: 'center',
                    textDecoration: 'none'
                  }}
                  title={`Open Customer Storefront for ${selectedTenantSlug}`}
                >
                  <i className="ri-store-2-line" style={{ color: 'var(--primary-light)' }}></i> Store ↗
                </a>
                <a
                  href={`/portal/${selectedTenantSlug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-xs"
                  style={{
                    fontSize: '11px',
                    padding: '6px 6px',
                    justifyContent: 'center',
                    textDecoration: 'none'
                  }}
                  title={`Open Restaurant Portal for ${selectedTenantSlug}`}
                >
                  <i className="ri-dashboard-2-line" style={{ color: '#10B981' }}></i> Portal ↗
                </a>
              </div>
            </div>
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="admin-mini-profile" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <img
              src={displayAvatar}
              alt={displayName}
              className="admin-avatar"
            />
            <div className="admin-meta">
              <div className="admin-name">{displayName}</div>
              <div className="admin-role">{displayRole}</div>
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
    </>
  );
}
