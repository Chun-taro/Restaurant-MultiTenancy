import React, { useState, useEffect } from 'react';

export default function SettingsView({ settings = {}, onSave, adminUser, onOpenProfile, onOpenCreateSuperadmin }) {
  const [formData, setFormData] = useState({
    platform_name: 'Dine Platform Suite',
    platform_support_email: 'support@dine.com',
    default_currency: 'PHP',
    trial_days_default: '14',
    payment_gateway_mode: 'sandbox',
    webhook_signing_secret: 'whsec_9934f828a1d77a0c8b21e8e4a9918b82',
    allow_self_signup: true,
    maintenance_mode: false
  });

  useEffect(() => {
    if (settings && Object.keys(settings).length > 0) {
      setFormData({
        platform_name: settings.platform_name ? settings.platform_name.value : 'Dine Platform Suite',
        platform_support_email: settings.platform_support_email ? settings.platform_support_email.value : 'support@dine.com',
        default_currency: settings.default_currency ? settings.default_currency.value : 'PHP',
        trial_days_default: settings.trial_days_default ? settings.trial_days_default.value : '14',
        payment_gateway_mode: settings.payment_gateway_mode ? settings.payment_gateway_mode.value : 'sandbox',
        webhook_signing_secret: settings.webhook_signing_secret ? settings.webhook_signing_secret.value : '',
        allow_self_signup: settings.allow_self_signup ? settings.allow_self_signup.value === 'true' : true,
        maintenance_mode: settings.maintenance_mode ? settings.maintenance_mode.value === 'true' : false
      });
    }
  }, [settings]);

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
            Customize your Superadmin identity credentials, add administrators, and configure platform defaults
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button type="button" className="btn btn-secondary" onClick={onOpenCreateSuperadmin}>
            <i className="ri-user-add-line"></i> Add Super Admin
          </button>
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
                  <span className="badge" style={{ background: 'rgba(224,90,43,0.12)', color: 'var(--primary-light)', border: '1px solid rgba(224,90,43,0.25)', fontSize: '11px' }}>
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
