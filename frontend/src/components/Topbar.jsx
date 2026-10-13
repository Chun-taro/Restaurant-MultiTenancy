import React, { useState, useEffect, useRef } from 'react';
import { THEMES, applyTheme, getStoredTheme } from '../utils/theme';

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
  onToggleMobileSidebar,
  onNavigate,
  onThemeChange
}) {
  const meta = routeTitles[currentRoute] || { title: 'Super Admin', subtitle: '' };
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const themeRef = useRef(null);
  const [currentThemeId, setCurrentThemeId] = useState(() => getStoredTheme().themeId || 'teal-pink');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (themeRef.current && !themeRef.current.contains(event.target)) {
        setIsThemeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTheme = (theme) => {
    setCurrentThemeId(theme.id);
    const stored = getStoredTheme();
    const primary = theme.isCustom ? stored.customPrimary : theme.primary;
    const accent = theme.isCustom ? stored.customAccent : theme.accent;
    applyTheme(theme.id, primary, accent);
    if (onThemeChange) {
      onThemeChange(theme.id, primary, accent);
    }
    setIsThemeOpen(false);
  };

  const activeThemeObj = THEMES.find(t => t.id === currentThemeId) || THEMES[0];
  const storedTheme = getStoredTheme();
  const displayPrimary = activeThemeObj.isCustom ? storedTheme.customPrimary : activeThemeObj.primary;
  const displayAccent = activeThemeObj.isCustom ? storedTheme.customAccent : activeThemeObj.accent;

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
        {/* Quick Theme Switcher Dropdown */}
        <div className="theme-dropdown-container" ref={themeRef}>
          <button
            type="button"
            className="topbar-theme-btn"
            onClick={() => setIsThemeOpen(prev => !prev)}
            title="Switch Superadmin Color Theme"
          >
            <i className="ri-palette-line" style={{ color: 'var(--primary-light)', fontSize: '15px' }}></i>
            <div className="topbar-theme-dots">
              <span className="topbar-theme-dot" style={{ background: displayPrimary }}></span>
              <span className="topbar-theme-dot" style={{ background: displayAccent }}></span>
            </div>
            <span style={{ fontSize: '12px' }}>{activeThemeObj.name.split(' ')[0]}</span>
            <i className="ri-arrow-down-s-line" style={{ fontSize: '12px', opacity: 0.7 }}></i>
          </button>

          {isThemeOpen && (
            <div className="theme-dropdown-menu">
              <div className="theme-dropdown-header">
                <span>Color Themes</span>
                <span style={{ fontSize: '10px', color: 'var(--primary-light)', textTransform: 'none', fontWeight: 600 }}>Live Preview</span>
              </div>

              {THEMES.map(t => {
                const isSelected = t.id === currentThemeId;
                const pColor = t.isCustom ? storedTheme.customPrimary : t.primary;
                const aColor = t.isCustom ? storedTheme.customAccent : t.accent;
                return (
                  <button
                    key={t.id}
                    type="button"
                    className={`theme-dropdown-item ${isSelected ? 'active' : ''}`}
                    onClick={() => handleSelectTheme(t)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: pColor, display: 'inline-block' }}></span>
                        <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: aColor, display: 'inline-block', marginLeft: '-4px', border: '1px solid #15171B' }}></span>
                      </div>
                      <span style={{ color: isSelected ? '#fff' : 'inherit' }}>{t.name}</span>
                    </div>
                    {isSelected && <i className="ri-check-line" style={{ color: 'var(--primary-light)', fontSize: '14px' }}></i>}
                  </button>
                );
              })}

              <div className="theme-dropdown-footer">
                <button
                  type="button"
                  className="theme-dropdown-footer-btn"
                  onClick={() => {
                    setIsThemeOpen(false);
                    if (onNavigate) onNavigate('settings');
                  }}
                >
                  <i className="ri-settings-3-line"></i> Customize Colors in Settings
                </button>
              </div>
            </div>
          )}
        </div>

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
