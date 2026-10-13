import React, { useState } from 'react';

export default function ProvisionModal({ isOpen, onClose, onSubmit, plans = [] }) {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    subdomain: '',
    custom_domain: '',
    cuisine_type: '',
    city: 'Metro Manila',
    primary_color: '#00C4CC',
    owner_name: '',
    owner_email: '',
    owner_password: 'Welcome2026!',
    owner_phone: '',
    plan_id: plans[1] ? plans[1].id : (plans[0] ? plans[0].id : ''),
    billing_cycle: 'monthly',
    status: 'active'
  });

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  if (!isOpen) return null;

  const handleNameChange = (e) => {
    const val = e.target.value;
    const autoSlug = val.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    setFormData(prev => ({
      ...prev,
      name: val,
      slug: autoSlug,
      subdomain: autoSlug
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`modal-overlay ${isOpen ? 'open' : ''}`} onClick={(e) => {
      if (e.target.classList.contains('modal-overlay')) onClose();
    }}>
      <div className="modal-container" style={{ maxWidth: '720px' }}>
        <div className="modal-header">
          <div>
            <h3 className="modal-title">
              <i className="ri-rocket-line" style={{ color: 'var(--primary-light)' }}></i> Provision New Restaurant Tenant
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Allocates MongoDB tenant documents, owner authentication, and storefront routing
            </p>
          </div>
          <button className="modal-close" onClick={onClose}><i className="ri-close-line"></i></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ maxHeight: '70vh' }}>
            {/* Step 1: Restaurant Info */}
            <h4 style={{ color: '#fff', fontSize: '14px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>1</span>
              Restaurant Brand & Domain
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Restaurant Brand Name *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Barrio Fiesta Bistro"
                  required
                  value={formData.name}
                  onChange={handleNameChange}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Subdomain Slug *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={formData.subdomain}
                  onChange={(e) => setFormData(prev => ({ ...prev, subdomain: e.target.value, slug: e.target.value }))}
                />
                <div className="form-hint">
                  Storefront: <code style={{ color: 'var(--primary-light)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>https://{formData.subdomain || 'your-restaurant'}.dine.ph</code>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Cuisine Type</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Filipino, Italian"
                  value={formData.cuisine_type}
                  onChange={(e) => setFormData(prev => ({ ...prev, cuisine_type: e.target.value }))}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">City / Region</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.city}
                  onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Primary Brand Color</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="color"
                    className="form-control"
                    style={{ width: '42px', height: '38px', padding: '2px', cursor: 'pointer' }}
                    value={formData.primary_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                  />
                  <input
                    type="text"
                    className="form-control"
                    style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '12px' }}
                    value={formData.primary_color}
                    onChange={(e) => setFormData(prev => ({ ...prev, primary_color: e.target.value }))}
                  />
                </div>
                <div style={{ display: 'flex', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                  {[
                    { name: 'Aqua Teal', hex: '#00C4CC' },
                    { name: 'Neon Pink', hex: '#FF2A85' },
                    { name: 'Emerald', hex: '#10B981' },
                    { name: 'Orange', hex: '#E05A2B' },
                    { name: 'Violet', hex: '#8B5CF6' }
                  ].map(c => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, primary_color: c.hex }))}
                      style={{
                        padding: '2px 8px',
                        borderRadius: '4px',
                        border: formData.primary_color === c.hex ? '1px solid #fff' : '1px solid var(--border-subtle)',
                        background: 'rgba(255,255,255,0.06)',
                        color: '#fff',
                        fontSize: '11px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: c.hex }}></span>
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 2: Owner Credentials */}
            <h4 style={{ color: '#fff', fontSize: '14px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--emerald)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>2</span>
              Restaurant Owner Identity
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Owner Full Name *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  placeholder="e.g. Roberto Gonzales"
                  value={formData.owner_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, owner_name: e.target.value }))}
                />
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Owner Email *</label>
                <input
                  type="email"
                  className="form-control"
                  required
                  placeholder="roberto@barriofiesta.ph"
                  value={formData.owner_email}
                  onChange={(e) => setFormData(prev => ({ ...prev, owner_email: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Temporary Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    style={{ paddingRight: '40px' }}
                    value={formData.owner_password}
                    onChange={(e) => setFormData(prev => ({ ...prev, owner_password: e.target.value }))}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: showPassword ? 'var(--primary-light)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '15px'
                    }}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <i className={showPassword ? 'ri-eye-off-line' : 'ri-eye-line'}></i>
                  </button>
                </div>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Phone Contact</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="+63 917 123 4567"
                  value={formData.owner_phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, owner_phone: e.target.value }))}
                />
              </div>
            </div>

            {/* Step 3: Subscription & Billing */}
            <h4 style={{ color: '#fff', fontSize: '14px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'var(--amber)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px' }}>3</span>
              Subscription & Plan Assignment
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: '16px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Plan Tier</label>
                <select
                  className="form-control form-select"
                  value={formData.plan_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, plan_id: e.target.value }))}
                >
                  {plans.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (₱{p.price_monthly.toLocaleString()}/mo)</option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Billing Cycle</label>
                <select
                  className="form-control form-select"
                  value={formData.billing_cycle}
                  onChange={(e) => setFormData(prev => ({ ...prev, billing_cycle: e.target.value }))}
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly (Annual)</option>
                </select>
              </div>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Initial Status</label>
                <select
                  className="form-control form-select"
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="active">Active</option>
                  <option value="trialing">14-Day Trial</option>
                </select>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <i className="ri-loader-4-line ri-spin"></i> : <i className="ri-rocket-line"></i>}
              Complete Provisioning
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
