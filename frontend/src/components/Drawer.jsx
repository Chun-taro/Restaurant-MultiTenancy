import React from 'react';

export default function Drawer({ isOpen, onClose, tenant, onStatusChange, onPlanChange, onImpersonate, onDelete, onOpenStorefront }) {
  if (!isOpen || !tenant) return null;

  return (
    <div className={`drawer-overlay ${isOpen ? 'open' : ''}`} onClick={(e) => {
      if (e.target.classList.contains('drawer-overlay')) onClose();
    }}>
      <div className="drawer-container">
        <div className="drawer-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <i className="ri-store-3-line" style={{ fontSize: '20px', color: 'var(--primary-light)' }}></i>
            <h3 style={{ color: '#fff', fontSize: '17px', fontWeight: 700 }}>{tenant.name}</h3>
          </div>
          <button className="modal-close" onClick={onClose}>
            <i className="ri-close-line"></i>
          </button>
        </div>

        <div className="drawer-body">
          {/* Hero Header */}
          <div className="dossier-hero">
            <img
              src={tenant.logo_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100'}
              className="dossier-logo"
              alt="Logo"
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ color: '#fff', fontSize: '18px' }}>{tenant.name}</h3>
                <span className={`badge badge-${tenant.status}`}>
                  <span className="badge-dot"></span> {tenant.status.toUpperCase()}
                </span>
              </div>
              <div className="dossier-quick-links">
                <a href="#" className="dossier-url-pill" onClick={(e) => { e.preventDefault(); onOpenStorefront?.(tenant.slug); }}>
                  <i className="ri-external-link-line"></i> https://{tenant.subdomain}.restosaas.ph
                </a>
                {tenant.custom_domain && (
                  <a href="#" className="dossier-url-pill" style={{ color: 'var(--emerald)', background: 'rgba(16,185,129,0.1)' }}>
                    <i className="ri-checkbox-circle-line"></i> https://{tenant.custom_domain}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions Toolbar */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
            <button className="btn btn-emerald btn-sm" style={{ flex: 1 }} onClick={() => onImpersonate(tenant.id)}>
              <i className="ri-dashboard-2-line"></i> Tenant Portal
            </button>
            <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => onOpenStorefront?.(tenant.slug)}>
              <i className="ri-store-2-line"></i> QR Storefront
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
            {tenant.status === 'suspended' ? (
              <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => onStatusChange(tenant.id, 'active')}>
                <i className="ri-play-circle-line" style={{ color: 'var(--emerald)' }}></i> Reactivate
              </button>
            ) : (
              <button className="btn btn-danger btn-sm" style={{ flex: 1 }} onClick={() => onStatusChange(tenant.id, 'suspended')}>
                <i className="ri-pause-circle-line"></i> Suspend
              </button>
            )}
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(tenant.id)}>
              <i className="ri-delete-bin-line"></i>
            </button>
          </div>

          {/* Suspension Alert if Suspended */}
          {tenant.status === 'suspended' && (
            <div style={{
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}>
              <i className="ri-error-warning-fill" style={{ color: '#EF4444', fontSize: '18px', marginTop: '1px' }} />
              <div>
                <strong style={{ color: '#FCA5A5', fontSize: '13px', display: 'block' }}>Storefront Suspended</strong>
                <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: '12px' }}>
                  Reason: {tenant.suspended_reason || 'Administrative review or past due billing'}
                </p>
              </div>
            </div>
          )}

          {/* Business Info Card */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#fff', fontSize: '14px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="ri-store-3-line" style={{ color: 'var(--primary-light)' }}></i> Business Details
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', fontSize: '12.5px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Cuisine Type</span>
                <strong style={{ color: '#fff' }}>{tenant.cuisine_type || 'General'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>City</span>
                <strong style={{ color: '#fff' }}>{tenant.city || 'Metro Manila'}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Address</span>
                <span style={{ color: 'var(--text-secondary)' }}>{tenant.address || 'N/A'}</span>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block' }}>Brand Color</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                  <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: tenant.primary_color || '#6366F1', border: '1px solid #fff' }}></span>
                  <code style={{ fontFamily: 'var(--font-mono)', color: '#fff' }}>{tenant.primary_color || '#6366F1'}</code>
                </div>
              </div>
            </div>
          </div>

          {/* Isolated Tenant Database & Multi-Tenant Routing Card */}
          <div className="card" style={{ marginBottom: '20px', borderLeft: '3px solid #10B981' }}>
            <h4 style={{ color: '#fff', fontSize: '14px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="ri-database-2-line" style={{ color: '#10B981' }}></i> Dedicated SQLite Database
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px' }}>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                  Isolated Database File
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                  <code style={{ fontFamily: 'var(--font-mono)', color: '#34D399', background: 'rgba(16, 185, 129, 0.1)', padding: '3px 8px', borderRadius: '4px', fontSize: '12px' }}>
                    tenant_{tenant.slug}.db
                  </code>
                  <span style={{ fontSize: '10px', background: 'rgba(16, 185, 129, 0.2)', color: '#10B981', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                    ISOLATED
                  </span>
                </div>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                  Tenant Subdomain URL
                </span>
                <a
                  href={`http://${tenant.subdomain}.localhost:5173`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: '#38BDF8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '3px', fontWeight: 600 }}
                >
                  <i className="ri-global-line"></i> http://{tenant.subdomain}.localhost:5173
                </a>
              </div>

              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '11px', textTransform: 'uppercase', fontWeight: 600 }}>
                  Direct Path URLs
                </span>
                <div style={{ display: 'flex', gap: '10px', marginTop: '4px', flexWrap: 'wrap' }}>
                  <a
                    href={`http://localhost:5173/store/${tenant.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#A5B4FC', textDecoration: 'none', fontSize: '11.5px', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: '4px' }}
                  >
                    <i className="ri-store-2-line"></i> /store/{tenant.slug}
                  </a>
                  <a
                    href={`http://localhost:5173/portal/${tenant.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: '#FCD34D', textDecoration: 'none', fontSize: '11.5px', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: '4px' }}
                  >
                    <i className="ri-dashboard-2-line"></i> /portal/{tenant.slug}
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Owner Identity */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <h4 style={{ color: '#fff', fontSize: '14px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="ri-user-star-line" style={{ color: 'var(--emerald)' }}></i> Owner Profile
            </h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <img
                src={tenant.owner_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${tenant.owner_name}`}
                style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#1E293B' }}
                alt="Owner"
              />
              <div>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: '14px' }}>{tenant.owner_name}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{tenant.owner_email}</div>
                {tenant.owner_phone && (
                  <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Tel: {tenant.owner_phone}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Subscription Info */}
          <div className="card" style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <h4 style={{ color: '#fff', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <i className="ri-vip-diamond-line" style={{ color: 'var(--primary-light)' }}></i> Subscription Tier
              </h4>
              <span className="badge badge-plan">{tenant.plan_name}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Billing Cycle:</span>
                <strong style={{ color: '#fff', textTransform: 'capitalize' }}>{tenant.billing_cycle || 'monthly'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Max Products:</span>
                <strong style={{ color: '#fff' }}>{tenant.max_products === -1 ? 'Unlimited' : tenant.max_products}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Max Staff:</span>
                <strong style={{ color: '#fff' }}>{tenant.max_staff}</strong>
              </div>
            </div>
          </div>

          {/* Invoices */}
          <div className="card">
            <h4 style={{ color: '#fff', fontSize: '14px', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="ri-file-text-line" style={{ color: 'var(--cyan)' }}></i> Invoices ({tenant.invoices ? tenant.invoices.length : 0})
            </h4>
            {tenant.invoices && tenant.invoices.length > 0 ? (
              <div className="table-wrapper">
                <table className="data-table" style={{ fontSize: '12px' }}>
                  <thead>
                    <tr>
                      <th>Invoice #</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenant.invoices.map((inv) => (
                      <tr key={inv.id}>
                        <td><code style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary-light)' }}>{inv.invoice_number}</code></td>
                        <td><strong>₱{inv.amount.toLocaleString()}</strong></td>
                        <td>
                          <span className={`badge badge-${inv.status === 'paid' ? 'active' : 'suspended'}`}>
                            {inv.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No invoices generated yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
