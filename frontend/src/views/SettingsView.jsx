import React, { useState, useEffect } from 'react';

export default function SettingsView({ settings = {}, onSave }) {
  const [formData, setFormData] = useState({
    platform_name: 'RestoSaaS Platform Suite',
    platform_support_email: 'support@restosaas.com',
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
        platform_name: settings.platform_name ? settings.platform_name.value : 'RestoSaaS',
        platform_support_email: settings.platform_support_email ? settings.platform_support_email.value : 'support@restosaas.com',
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
    <div>
      <div className="toolbar-container">
        <div>
          <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 700 }}>System Configuration & Engine Settings</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '12.5px' }}>
            Multi-tenant defaults, Maya/GCash integration mode, currencies, and system switches
          </p>
        </div>
      </div>

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
