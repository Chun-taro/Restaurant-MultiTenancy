import React, { useState } from 'react';

export default function PlansView({ plans = [], onOpenCreatePlan, onOpenEditPlan, onTogglePlan }) {
  const [billingCycle, setBillingCycle] = useState('monthly');

  return (
    <div>
      <div className="toolbar-container">
        <div>
          <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 700 }}>SaaS Subscription Tiers & Pricing</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '12.5px' }}>
            Configure platform monetization, feature gating, limits, and commission rates
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-pill)',
            padding: '3px'
          }}>
            <button
              className={`btn btn-sm ${billingCycle === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 'var(--radius-pill)', padding: '5px 14px' }}
              onClick={() => setBillingCycle('monthly')}
            >
              Monthly
            </button>
            <button
              className={`btn btn-sm ${billingCycle === 'yearly' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 'var(--radius-pill)', padding: '5px 14px' }}
              onClick={() => setBillingCycle('yearly')}
            >
              Annual <span style={{ fontSize: '10px', color: '#34D399', fontWeight: 700 }}>(2 Mo Free)</span>
            </button>
          </div>

          <button className="btn btn-primary" onClick={onOpenCreatePlan}>
            <i className="ri-add-line"></i> Create New Plan
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="plans-grid">
        {plans.map(p => {
          const isYearly = billingCycle === 'yearly';
          const price = isYearly ? p.price_yearly : p.price_monthly;
          const formattedPrice = `₱${Math.round(price).toLocaleString()}`;
          const periodText = isYearly ? '/year' : '/month';

          return (
            <div key={p.id} className={`pricing-card ${p.is_popular ? 'popular' : ''}`}>
              {p.is_popular && <div className="popular-badge">Most Popular</div>}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="pricing-plan-name">{p.name}</div>
                <span className={`badge ${p.is_active ? 'badge-active' : 'badge-suspended'}`}>
                  {p.is_active ? 'Active' : 'Archived'}
                </span>
              </div>
              <div className="pricing-plan-desc">{p.description || 'Standard plan tier'}</div>

              <div className="pricing-price-wrap">
                <div className="pricing-amount">{formattedPrice}</div>
                <div className="pricing-period">{periodText}</div>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                marginBottom: '20px',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px'
              }}>
                <span style={{ color: 'var(--text-muted)' }}>Subscribers:</span>
                <strong style={{ color: '#fff' }}>{p.active_subscribers || 0} active restaurants</strong>
              </div>

              <ul className="pricing-features-list">
                <li className="pricing-feature-item included">
                  <i className="ri-check-line"></i>
                  <span>{p.max_products === -1 ? 'Unlimited' : p.max_products} menu items</span>
                </li>
                <li className="pricing-feature-item included">
                  <i className="ri-check-line"></i>
                  <span>{p.max_staff} staff accounts</span>
                </li>
                <li className="pricing-feature-item included">
                  <i className="ri-check-line"></i>
                  <span>{p.transaction_fee_percent}% platform fee</span>
                </li>
                <li className={`pricing-feature-item ${p.has_qr_ordering ? 'included' : 'excluded'}`}>
                  <i className={p.has_qr_ordering ? 'ri-check-line' : 'ri-close-line'}></i>
                  <span>QR Table Ordering</span>
                </li>
                <li className={`pricing-feature-item ${p.has_online_payment ? 'included' : 'excluded'}`}>
                  <i className={p.has_online_payment ? 'ri-check-line' : 'ri-close-line'}></i>
                  <span>Online Payments (Maya/Cards)</span>
                </li>
                <li className={`pricing-feature-item ${p.has_custom_domain ? 'included' : 'excluded'}`}>
                  <i className={p.has_custom_domain ? 'ri-check-line' : 'ri-close-line'}></i>
                  <span>Custom Domains (.ph/.com)</span>
                </li>
                <li className={`pricing-feature-item ${p.has_advanced_analytics ? 'included' : 'excluded'}`}>
                  <i className={p.has_advanced_analytics ? 'ri-check-line' : 'ri-close-line'}></i>
                  <span>Advanced Analytics</span>
                </li>
                <li className={`pricing-feature-item ${p.has_inventory ? 'included' : 'excluded'}`}>
                  <i className={p.has_inventory ? 'ri-check-line' : 'ri-close-line'}></i>
                  <span>Inventory Tracking</span>
                </li>
              </ul>

              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => onOpenEditPlan(p)}>
                  <i className="ri-edit-line"></i> Edit Plan
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => onTogglePlan(p.id)} title={p.is_active ? 'Archive' : 'Activate'}>
                  <i className={p.is_active ? 'ri-archive-line' : 'ri-check-line'}></i>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison Matrix */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title"><i className="ri-list-check-2" style={{ color: 'var(--primary-light)' }}></i> Feature Limits & Entitlement Matrix</div>
            <div className="card-subtitle">Granular comparison across MongoDB subscription tiers</div>
          </div>
        </div>
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Feature / Entitlement</th>
                {plans.map(p => <th key={p.id} style={{ textAlign: 'center' }}>{p.name}</th>)}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Menu Products Limit</strong></td>
                {plans.map(p => <td key={p.id} style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{p.max_products === -1 ? 'Unlimited' : p.max_products} items</td>)}
              </tr>
              <tr>
                <td><strong>Staff Accounts Limit</strong></td>
                {plans.map(p => <td key={p.id} style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}>{p.max_staff} logins</td>)}
              </tr>
              <tr>
                <td><strong>Platform Fee %</strong></td>
                {plans.map(p => <td key={p.id} style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--emerald)' }}>{p.transaction_fee_percent}%</td>)}
              </tr>
              <tr>
                <td><strong>QR Table Ordering</strong></td>
                {plans.map(p => (
                  <td key={p.id} style={{ textAlign: 'center' }}>
                    {p.has_qr_ordering ? <i className="ri-checkbox-circle-fill" style={{ color: 'var(--emerald)', fontSize: '18px' }}></i> : <i className="ri-close-circle-line" style={{ color: 'var(--text-muted)', fontSize: '18px' }}></i>}
                  </td>
                ))}
              </tr>
              <tr>
                <td><strong>Online Gateway (Maya)</strong></td>
                {plans.map(p => (
                  <td key={p.id} style={{ textAlign: 'center' }}>
                    {p.has_online_payment ? <i className="ri-checkbox-circle-fill" style={{ color: 'var(--emerald)', fontSize: '18px' }}></i> : <i className="ri-close-circle-line" style={{ color: 'var(--text-muted)', fontSize: '18px' }}></i>}
                  </td>
                ))}
              </tr>
              <tr>
                <td><strong>Custom Domain Support</strong></td>
                {plans.map(p => (
                  <td key={p.id} style={{ textAlign: 'center' }}>
                    {p.has_custom_domain ? <i className="ri-checkbox-circle-fill" style={{ color: 'var(--emerald)', fontSize: '18px' }}></i> : <i className="ri-close-circle-line" style={{ color: 'var(--text-muted)', fontSize: '18px' }}></i>}
                  </td>
                ))}
              </tr>
              <tr>
                <td><strong>Advanced Analytics</strong></td>
                {plans.map(p => (
                  <td key={p.id} style={{ textAlign: 'center' }}>
                    {p.has_advanced_analytics ? <i className="ri-checkbox-circle-fill" style={{ color: 'var(--emerald)', fontSize: '18px' }}></i> : <i className="ri-close-circle-line" style={{ color: 'var(--text-muted)', fontSize: '18px' }}></i>}
                  </td>
                ))}
              </tr>
              <tr>
                <td><strong>Inventory Tracking</strong></td>
                {plans.map(p => (
                  <td key={p.id} style={{ textAlign: 'center' }}>
                    {p.has_inventory ? <i className="ri-checkbox-circle-fill" style={{ color: 'var(--emerald)', fontSize: '18px' }}></i> : <i className="ri-close-circle-line" style={{ color: 'var(--text-muted)', fontSize: '18px' }}></i>}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
