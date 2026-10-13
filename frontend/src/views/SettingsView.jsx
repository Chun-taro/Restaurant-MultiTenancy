import React, { useState, useEffect } from 'react';
import { THEMES, applyTheme, getStoredTheme } from '../utils/theme';

export default function SettingsView({ settings = {}, onSave, adminUser, onOpenProfile, onNavigateToUsers }) {
  const initialTheme = getStoredTheme();
  const [formData, setFormData] = useState({
    platform_name: 'Dine Platform Suite',
    platform_support_email: 'support@dine.com',
    default_currency: 'PHP',
    trial_days_default: '14',
    payment_gateway_mode: 'sandbox',
    webhook_signing_secret: 'whsec_9934f828a1d77a0c8b21e8e4a9918b82',
    allow_self_signup: true,
    maintenance_mode: false,
    superadmin_theme: initialTheme.themeId || 'teal-pink',
    theme_primary_color: initialTheme.customPrimary || '#00C4CC',
    theme_accent_color: initialTheme.customAccent || '#FF2A85'
  });

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setFormData(prev => ({
        ...prev,
        platform_name: settings.platform_name ? settings.platform_name.value : 'Dine Platform Suite',
        platform_support_email: settings.platform_support_email ? settings.platform_support_email.value : 'support@dine.com',
        default_currency: settings.default_currency ? settings.default_currency.value : 'PHP',
        trial_days_default: settings.trial_days_default ? settings.trial_days_default.value : '14',
        payment_gateway_mode: settings.payment_gateway_mode ? settings.payment_gateway_mode.value : 'sandbox',
        webhook_signing_secret: settings.webhook_signing_secret ? settings.webhook_signing_secret.value : '',
        allow_self_signup: settings.allow_self_signup ? settings.allow_self_signup.value === 'true' : true,
        maintenance_mode: settings.maintenance_mode ? settings.maintenance_mode.value === 'true' : false,
        superadmin_theme: settings.superadmin_theme ? settings.superadmin_theme.value : (prev.superadmin_theme || 'teal-pink'),
        theme_primary_color: settings.theme_primary_color ? settings.theme_primary_color.value : (prev.theme_primary_color || '#00C4CC'),
        theme_accent_color: settings.theme_accent_color ? settings.theme_accent_color.value : (prev.theme_accent_color || '#FF2A85')
      }));

      // Apply initial loaded theme
      if (settings.superadmin_theme?.value) {
        applyTheme(
          settings.superadmin_theme.value,
          settings.theme_primary_color?.value || '#00C4CC',
          settings.theme_accent_color?.value || '#FF2A85'
        );
      }
    }
  }, [settings]);

  const handleSelectTheme = (themeId) => {
    const selected = THEMES.find(t => t.id === themeId);
    let newPrimary = formData.theme_primary_color;
    let newAccent = formData.theme_accent_color;
    if (selected && !selected.isCustom) {
      newPrimary = selected.primary;
      newAccent = selected.accent;
    }
    setFormData(prev => ({
      ...prev,
      superadmin_theme: themeId,
      theme_primary_color: newPrimary,
      theme_accent_color: newAccent
    }));
    applyTheme(themeId, newPrimary, newAccent);
  };

  const handleCustomPrimaryChange = (color) => {
    setFormData(prev => ({
      ...prev,
      superadmin_theme: 'custom',
      theme_primary_color: color
    }));
    applyTheme('custom', color, formData.theme_accent_color);
  };

  const handleCustomAccentChange = (color) => {
    setFormData(prev => ({
      ...prev,
      superadmin_theme: 'custom',
      theme_accent_color: color
    }));
    applyTheme('custom', formData.theme_primary_color, color);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="toolbar-container">
        <div>
          <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 700 }}>Superadmin Profile & System Configuration</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '12.5px' }}>
            Configure platform defaults, brand theme, and manage your personal Superadmin credentials
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {onNavigateToUsers && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onNavigateToUsers}
              title="Go to Identity & Access to manage Superadmins and Owners"
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                color: '#FFFFFF',
                fontWeight: 600,
                opacity: 1,
                visibility: 'visible'
              }}
            >
              <i className="ri-shield-user-line" style={{ color: 'var(--primary-light)' }}></i> Manage Users in Identity & Access
            </button>
          )}
          <button type="button" className="btn btn-primary" onClick={onOpenProfile}>
            <i className="ri-user-settings-line"></i> Edit Profile & Password
          </button>
        </div>
      </div>

      {/* ─── ACTIVE SUPERADMIN PROFILE OVERVIEW CARD ──────────────────── */}
      {adminUser && (
        <div className="card" style={{ background: 'var(--bg-card)', borderColor: 'var(--border-card)' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img
                src={adminUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${adminUser.name}`}
                alt="Superadmin"
                style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border-subtle)', background: '#1A2232' }}
              />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <h3 style={{ margin: 0, color: '#FFF', fontSize: '17px', fontWeight: 700 }}>
                    {adminUser.name}
                  </h3>
                  <span className="badge" style={{ background: 'var(--primary-glow)', color: 'var(--primary-light)', border: '1px solid var(--primary-border)', fontSize: '11px' }}>
                    <i className="ri-shield-star-fill"></i> ACTIVE SUPERADMIN
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  <span><i className="ri-mail-line" style={{ marginRight: '5px', color: 'var(--primary-light)' }}></i>{adminUser.email}</span>
                  <span><i className="ri-phone-line" style={{ marginRight: '5px', color: 'var(--emerald)' }}></i>{adminUser.phone || 'No phone set'}</span>
                  <span><i className="ri-key-2-line" style={{ marginRight: '5px', color: 'var(--amber)' }}></i>Password Protected</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onOpenProfile}
              style={{ padding: '8px 18px', fontWeight: 700 }}
            >
              <i className="ri-edit-2-line"></i> Customize Profile & Password
            </button>
          </div>
        </div>
      )}

      {/* ─── PLATFORM SYSTEM SETTINGS FORM ───────────────────────────── */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* ─── COLOR THEME & BRAND APPEARANCE ───────────────────────────── */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div className="card-title">
                <i className="ri-palette-line" style={{ color: 'var(--primary-light)' }}></i> Superadmin Color Theme & Appearance
              </div>
              <p className="card-subtitle">
                Select a curated color theme or customize your own primary and accent palette for the Dine Superadmin console.
              </p>
            </div>
            <span className="badge" style={{ background: 'var(--primary-glow)', color: 'var(--primary-light)', border: '1px solid var(--primary-border)' }}>
              <i className="ri-flashlight-line"></i> LIVE PREVIEW ACTIVE
            </span>
          </div>

          {/* Theme Preset Cards Grid */}
          <div className="theme-selector-grid">
            {THEMES.map(theme => {
              const isActive = formData.superadmin_theme === theme.id;
              return (
                <div
                  key={theme.id}
                  className={`theme-card-option ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectTheme(theme.id)}
                >
                  <div className="theme-card-top">
                    <div className="theme-swatches">
                      <div className="theme-swatch-circles">
                        <div
                          className="theme-swatch-circle"
                          style={{
                            background: theme.isCustom ? formData.theme_primary_color : theme.primary
                          }}
                        />
                        <div
                          className="theme-swatch-circle"
                          style={{
                            background: theme.isCustom ? formData.theme_accent_color : theme.accent
                          }}
                        />
                      </div>
                      <div
                        className="theme-swatch-gradient-bar"
                        style={{
                          background: theme.isCustom
                            ? `linear-gradient(135deg, ${formData.theme_primary_color} 0%, ${formData.theme_accent_color} 100%)`
                            : theme.gradient
                        }}
                      />
                    </div>
                    {isActive ? (
                      <div className="theme-active-check">
                        <i className="ri-check-line"></i>
                      </div>
                    ) : (
                      <div className="theme-inactive-radio"></div>
                    )}
                  </div>

                  <div className="theme-card-info">
                    <h4>
                      {theme.name}
                      {theme.isSignature && (
                        <span className="theme-signature-badge">Dine Signature</span>
                      )}
                    </h4>
                    <div className="theme-card-tagline">{theme.tagline}</div>
                    <p className="theme-card-desc">{theme.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Custom Dual-Color Picker Controls */}
          {formData.superadmin_theme === 'custom' && (
            <div className="custom-theme-controls">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <strong style={{ color: '#fff', fontSize: '13.5px' }}>
                  <i className="ri-sound-module-line" style={{ color: 'var(--primary-light)', marginRight: '6px' }}></i>
                  Custom Color Palette Tuning
                </strong>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                  Hex values auto-calculate light, dark, and glowing gradients
                </span>
              </div>

              <div className="custom-picker-grid">
                <div className="color-picker-box">
                  <input
                    type="color"
                    className="native-color-picker"
                    value={formData.theme_primary_color}
                    onChange={(e) => handleCustomPrimaryChange(e.target.value)}
                  />
                  <div className="color-input-meta">
                    <label>Primary Brand Color</label>
                    <input
                      type="text"
                      className="color-hex-input"
                      value={formData.theme_primary_color}
                      onChange={(e) => handleCustomPrimaryChange(e.target.value)}
                    />
                    <div className="quick-chips-row">
                      {['#00C4CC', '#0D9488', '#E05A2B', '#10B981', '#8B5CF6', '#0284C7'].map(c => (
                        <div
                          key={c}
                          className="quick-color-chip"
                          style={{ background: c }}
                          onClick={() => handleCustomPrimaryChange(c)}
                          title={`Set Primary: ${c}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="color-picker-box">
                  <input
                    type="color"
                    className="native-color-picker"
                    value={formData.theme_accent_color}
                    onChange={(e) => handleCustomAccentChange(e.target.value)}
                  />
                  <div className="color-input-meta">
                    <label>Accent / Secondary Color</label>
                    <input
                      type="text"
                      className="color-hex-input"
                      value={formData.theme_accent_color}
                      onChange={(e) => handleCustomAccentChange(e.target.value)}
                    />
                    <div className="quick-chips-row">
                      {['#FF2A85', '#EC4899', '#F43F5E', '#F59E0B', '#06B6D4', '#34D399'].map(c => (
                        <div
                          key={c}
                          className="quick-color-chip"
                          style={{ background: c }}
                          onClick={() => handleCustomAccentChange(c)}
                          title={`Set Accent: ${c}`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Interactive Live Preview Box */}
          <div className="theme-live-preview-box">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="ri-eye-line" style={{ color: 'var(--primary-light)' }}></i>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>Live Console Theme Preview</span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                Active Theme: <strong style={{ color: 'var(--primary-light)' }}>{THEMES.find(t => t.id === formData.superadmin_theme)?.name || 'Custom'}</strong>
              </span>
            </div>

            <div className="preview-grid">
              <div className="preview-widget">
                <span className="preview-widget-label">Brand & Logo</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div className="brand-icon" style={{ width: '30px', height: '30px', fontSize: '16px' }}>
                    <i className="ri-store-3-fill"></i>
                  </div>
                  <div>
                    <strong style={{ color: '#fff', fontSize: '13px' }}>Dine</strong>{' '}
                    <span className="brand-badge" style={{ fontSize: '9px' }}>CORE</span>
                  </div>
                </div>
              </div>

              <div className="preview-widget">
                <span className="preview-widget-label">Primary Actions</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="button" className="btn btn-primary btn-sm" style={{ pointerEvents: 'none' }}>
                    <i className="ri-add-line"></i> Provision
                  </button>
                  <button type="button" className="btn btn-secondary btn-sm" style={{ pointerEvents: 'none' }}>
                    Cancel
                  </button>
                </div>
              </div>

              <div className="preview-widget">
                <span className="preview-widget-label">Active Navigation</span>
                <div className="nav-item active" style={{ padding: '6px 10px', fontSize: '12px', pointerEvents: 'none' }}>
                  <i className="ri-dashboard-3-line"></i> Dashboard
                </div>
              </div>

              <div className="preview-widget">
                <span className="preview-widget-label">Status & Accent</span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span className="badge" style={{ background: 'var(--primary-glow)', color: 'var(--primary-light)', border: '1px solid var(--primary-border)' }}>
                    Primary
                  </span>
                  <span className="badge" style={{ background: 'var(--accent-glow)', color: 'var(--accent-light)', border: '1px solid var(--accent-border)' }}>
                    Accent
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: '18px' }}>
            <i className="ri-building-4-line" style={{ color: 'var(--primary-light)' }}></i> General Platform Identity
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Platform Name</label>
              <input
                type="text"
                className="form-control"
                value={formData.platform_name}
                onChange={(e) => setFormData(p => ({ ...p, platform_name: e.target.value }))}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Support Email</label>
              <input
                type="email"
                className="form-control"
                value={formData.platform_support_email}
                onChange={(e) => setFormData(p => ({ ...p, platform_support_email: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: '18px' }}>
            <i className="ri-money-dollar-box-line" style={{ color: 'var(--emerald)' }}></i> Currency & Trials
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Base Currency</label>
              <select
                className="form-control form-select"
                value={formData.default_currency}
                onChange={(e) => setFormData(p => ({ ...p, default_currency: e.target.value }))}
              >
                <option value="PHP">PHP - Philippine Peso (₱)</option>
                <option value="USD">USD - US Dollar ($)</option>
                <option value="SGD">SGD - Singapore Dollar (S$)</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Default Free Trial Duration (Days)</label>
              <input
                type="number"
                className="form-control"
                value={formData.trial_days_default}
                onChange={(e) => setFormData(p => ({ ...p, trial_days_default: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: '18px' }}>
            <i className="ri-secure-payment-line" style={{ color: 'var(--amber)' }}></i> Payment Gateway Settings
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Operational Mode</label>
              <select
                className="form-control form-select"
                value={formData.payment_gateway_mode}
                onChange={(e) => setFormData(p => ({ ...p, payment_gateway_mode: e.target.value }))}
              >
                <option value="sandbox">Sandbox (Testing)</option>
                <option value="production">Production (Live)</option>
              </select>
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label">Webhook HMAC Signing Key</label>
              <input
                type="text"
                className="form-control"
                style={{ fontFamily: 'var(--font-mono)' }}
                value={formData.webhook_signing_secret}
                onChange={(e) => setFormData(p => ({ ...p, webhook_signing_secret: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title" style={{ marginBottom: '18px' }}>
            <i className="ri-tools-line" style={{ color: 'var(--rose)' }}></i> System Operations
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <strong style={{ color: '#fff', fontSize: '14px' }}>Allow Public Restaurant Registration</strong>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>If disabled, tenants must be provisioned by Superadmins.</p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={formData.allow_self_signup}
                  onChange={(e) => setFormData(p => ({ ...p, allow_self_signup: e.target.checked }))}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
              <div>
                <strong style={{ color: '#fff', fontSize: '14px' }}>Maintenance Mode</strong>
                <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Temporarily show maintenance overlay on customer storefronts.</p>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={formData.maintenance_mode}
                  onChange={(e) => setFormData(p => ({ ...p, maintenance_mode: e.target.checked }))}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div>
          <button type="submit" className="btn btn-primary" style={{ padding: '12px 24px' }}>
            <i className="ri-save-line"></i> Save Platform Settings
          </button>
        </div>
      </form>
    </div>
  );
}
