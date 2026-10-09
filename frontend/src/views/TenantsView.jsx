import React, { useState } from 'react';

export default function TenantsView({
  tenants = [],
  plans = [],
  onOpenProvision,
  onInspectTenant,
  onImpersonate,
  onOpenStorefront,
  searchQuery,
  onSearchChange
}) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  const totalCount = tenants.length;
  const activeCount = tenants.filter(t => t.status === 'active').length;
  const trialingCount = tenants.filter(t => t.status === 'trialing').length;
  const suspendedCount = tenants.filter(t => t.status === 'suspended').length;
  const pendingCount = tenants.filter(t => t.status === 'pending').length;

  const filteredTenants = tenants.filter(t => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    if (planFilter !== 'all' && String(t.plan_id) !== String(planFilter)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = t.name.toLowerCase().includes(q) ||
                    t.slug.toLowerCase().includes(q) ||
                    (t.owner_name && t.owner_name.toLowerCase().includes(q)) ||
                    (t.owner_email && t.owner_email.toLowerCase().includes(q)) ||
                    (t.city && t.city.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  return (
    <div>
      {/* Toolbar Container */}
      <div className="toolbar-container">
        {/* Status Filter Pills */}
        <div className="filters-bar">
          <button
            className={`filter-pill ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            All Tenants <span className="filter-pill-count">{totalCount}</span>
          </button>
          <button
            className={`filter-pill ${statusFilter === 'active' ? 'active' : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }}></span>
            Active <span className="filter-pill-count">{activeCount}</span>
          </button>
          <button
            className={`filter-pill ${statusFilter === 'trialing' ? 'active' : ''}`}
            onClick={() => setStatusFilter('trialing')}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#3B82F6' }}></span>
            Trialing <span className="filter-pill-count">{trialingCount}</span>
          </button>
          <button
            className={`filter-pill ${statusFilter === 'suspended' ? 'active' : ''}`}
            onClick={() => setStatusFilter('suspended')}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F43F5E' }}></span>
            Suspended <span className="filter-pill-count">{suspendedCount}</span>
          </button>
          <button
            className={`filter-pill ${statusFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setStatusFilter('pending')}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F59E0B' }}></span>
            Pending <span className="filter-pill-count">{pendingCount}</span>
          </button>
        </div>

        {/* Right Action Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select
            className="form-control form-select"
            style={{ width: '160px', padding: '7px 12px' }}
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
          >
            <option value="all">All Plans</option>
            {plans.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          {/* Grid vs Table View Mode */}
          <div style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '2px'
          }}>
            <button
              className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 10px' }}
              onClick={() => setViewMode('grid')}
            >
              <i className="ri-grid-fill"></i>
            </button>
            <button
              className={`btn btn-sm ${viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '6px 10px' }}
              onClick={() => setViewMode('table')}
            >
              <i className="ri-table-line"></i>
            </button>
          </div>

          <button className="btn btn-primary" onClick={onOpenProvision}>
            <i className="ri-add-line"></i> Provision Restaurant
          </button>
        </div>
      </div>

      {/* Info bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ position: 'relative', width: '340px' }}>
          <i className="ri-search-line" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
          <input
            type="text"
            placeholder="Search by restaurant, slug, owner, or city..."
            className="form-control"
            style={{ paddingLeft: '36px', paddingTop: '8px', paddingBottom: '8px' }}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Showing <span style={{ color: '#fff', fontWeight: 700 }}>{filteredTenants.length}</span> of {totalCount} restaurant tenants
        </div>
      </div>

      {/* Content */}
      {filteredTenants.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <i className="ri-restaurant-line" style={{ fontSize: '48px', color: 'var(--text-muted)', opacity: 0.6 }}></i>
          <h3 style={{ color: '#fff', marginTop: '14px' }}>No matching restaurant tenants</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px', fontSize: '13px' }}>Try clearing filters or search criteria, or provision a new restaurant.</p>
          <button className="btn btn-primary" style={{ marginTop: '18px' }} onClick={onOpenProvision}>
            Provision Restaurant
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="tenants-grid">
          {filteredTenants.map(t => (
            <div key={t.id} className="tenant-card" style={{ borderTop: `3px solid ${t.primary_color || '#6366F1'}` }}>
              <div>
                <div className="tenant-card-header">
                  <img
                    src={t.logo_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100'}
                    className="tenant-logo"
                    alt={t.name}
                  />
                  <div className="tenant-title-info">
                    <div className="tenant-name" title={t.name}>{t.name}</div>
                    <a
                      href={`http://${t.subdomain}.localhost:5173`}
                      target="_blank"
                      rel="noreferrer"
                      className="tenant-subdomain"
                      style={{ textDecoration: 'none', color: '#38BDF8', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <i className="ri-global-line"></i> {t.subdomain}.localhost:5173
                    </a>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <span>{t.cuisine_type || 'Dining'} · {t.city}</span>
                      <span style={{ color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '1px 5px', borderRadius: '3px', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                        <i className="ri-shield-check-line"></i> {t.slug}
                      </span>
                    </div>
                  </div>
                  <span className={`badge badge-${t.status}`}>
                    <span className="badge-dot"></span> {t.status.toUpperCase()}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', fontSize: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                    <i className="ri-user-smile-line" style={{ color: 'var(--primary-light)' }}></i>
                    <span style={{ fontWeight: 600, color: '#fff' }}>{t.owner_name}</span>
                  </div>
                  {t.custom_domain ? (
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--emerald)', background: 'rgba(16,185,129,0.1)', padding: '2px 6px', borderRadius: 'var(--radius-sm)' }}>
                      <i className="ri-check-line"></i> {t.custom_domain}
                    </span>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Standard Subdomain</span>
                  )}
                </div>

                <div className="tenant-metrics-row">
                  <div className="tenant-metric-item">
                    <span className="tenant-metric-label">Gross Sales</span>
                    <span className="tenant-metric-val">₱{Math.round(t.total_volume || 0).toLocaleString()}</span>
                  </div>
                  <div className="tenant-metric-item">
                    <span className="tenant-metric-label">Orders</span>
                    <span className="tenant-metric-val">{(t.orders_count || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="tenant-card-footer">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="badge badge-plan">{t.plan_name}</span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{t.billing_cycle}</span>
                </div>

                <div style={{ display: 'flex', gap: '6px' }}>
                  <a
                    href={`/store/${t.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                    title="Open Customer Storefront in New Tab"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                  >
                    <i className="ri-store-2-line" style={{ color: 'var(--brand-primary)' }}></i>
                  </a>
                  <a
                    href={`/portal/${t.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-secondary btn-sm"
                    title="Open Tenant Kitchen Portal in New Tab"
                    style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                  >
                    <i className="ri-login-box-line" style={{ color: 'var(--emerald)' }}></i>
                  </a>
                  <button className="btn btn-secondary btn-sm" onClick={() => onInspectTenant(t.id)} title="Manage Tenant">
                    <i className="ri-settings-4-line"></i> Manage
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Restaurant</th>
                  <th>Tenant Subdomain</th>
                  <th>Owner</th>
                  <th>Plan & Billing</th>
                  <th>Volume / Orders</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTenants.map(t => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={t.logo_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=60'}
                          style={{ width: '38px', height: '38px', borderRadius: 'var(--radius-md)', objectFit: 'cover' }}
                          alt=""
                        />
                        <div>
                          <div style={{ fontWeight: 700, color: '#fff', fontSize: '14px' }}>{t.name}</div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{t.cuisine_type || 'Dining'} · {t.city}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <a
                        href={`http://${t.subdomain}.localhost:5173`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#38BDF8', textDecoration: 'none', display: 'block' }}
                      >
                        {t.subdomain}.localhost:5173
                      </a>
                      <span style={{ fontSize: '10px', color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '1px 5px', borderRadius: '3px', fontFamily: 'var(--font-mono)' }}>
                        <i className="ri-shield-check-line"></i> {t.slug}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: '#fff' }}>{t.owner_name}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{t.owner_email}</div>
                    </td>
                    <td>
                      <span className="badge badge-plan">{t.plan_name}</span>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        ₱{t.price_monthly ? t.price_monthly.toLocaleString() : '0'}/mo ({t.billing_cycle})
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 700, color: '#fff' }}>₱{Math.round(t.total_volume || 0).toLocaleString()}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{(t.orders_count || 0).toLocaleString()} orders</div>
                    </td>
                    <td>
                      <span className={`badge badge-${t.status}`}>
                        <span className="badge-dot"></span> {t.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <a
                          href={`/store/${t.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          title="Open Customer Storefront in New Tab"
                          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                        >
                          <i className="ri-store-2-line" style={{ color: 'var(--brand-primary)' }}></i>
                        </a>
                        <a
                          href={`/portal/${t.slug}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          title="Open Tenant Kitchen Portal in New Tab"
                          style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                        >
                          <i className="ri-login-box-line" style={{ color: 'var(--emerald)' }}></i>
                        </a>
                        <button className="btn btn-secondary btn-sm" onClick={() => onInspectTenant(t.id)} title="Manage Tenant">
                          <i className="ri-settings-4-line"></i> Manage
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
