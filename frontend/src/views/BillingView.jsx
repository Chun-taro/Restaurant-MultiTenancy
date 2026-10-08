import React, { useState } from 'react';

export default function BillingView({ billingData, onMarkPaid }) {
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  if (!billingData) return null;

  const { invoices = [], stats = {} } = billingData;

  const filtered = invoices.filter(inv => {
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!inv.invoice_number.toLowerCase().includes(q) &&
          !inv.restaurant_name.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div>
      {/* Financial Summary */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '28px' }}>
        <div className="kpi-card" style={{ '--card-accent': '#10B981', '--kpi-icon-bg': 'rgba(16, 185, 129, 0.12)', '--kpi-icon-color': '#34D399' }}>
          <div className="kpi-top">
            <span className="kpi-label">Subscriptions Collected</span>
            <div className="kpi-icon"><i className="ri-bank-card-line"></i></div>
          </div>
          <div className="kpi-value">₱{Math.round(stats.totalCollected || 0).toLocaleString()}</div>
          <div className="kpi-footer">
            <span className="kpi-trend trend-up"><i className="ri-check-double-line"></i> Settled</span>
            <span className="trend-subtext">Maya & Card settlements</span>
          </div>
        </div>

        <div className="kpi-card" style={{ '--card-accent': '#F59E0B', '--kpi-icon-bg': 'rgba(245, 158, 11, 0.12)', '--kpi-icon-color': '#FBBF24' }}>
          <div className="kpi-top">
            <span className="kpi-label">Pending Receivables</span>
            <div className="kpi-icon"><i className="ri-time-line"></i></div>
          </div>
          <div className="kpi-value">₱{Math.round(stats.totalPending || 0).toLocaleString()}</div>
          <div className="kpi-footer">
            <span className="trend-subtext">Due within 14 days</span>
          </div>
        </div>

        <div className="kpi-card" style={{ '--card-accent': '#F43F5E', '--kpi-icon-bg': 'rgba(244, 63, 94, 0.12)', '--kpi-icon-color': '#FB7185' }}>
          <div className="kpi-top">
            <span className="kpi-label">Past Due & Failed</span>
            <div className="kpi-icon"><i className="ri-alert-line"></i></div>
          </div>
          <div className="kpi-value">{stats.failedCount || 0}</div>
          <div className="kpi-footer">
            <span className="trend-subtext">Requires tenant review</span>
          </div>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="card">
        <div className="toolbar-container" style={{ marginBottom: '20px' }}>
          <div className="filters-bar">
            <button className={`filter-pill ${statusFilter === 'all' ? 'active' : ''}`} onClick={() => setStatusFilter('all')}>
              All Invoices ({invoices.length})
            </button>
            <button className={`filter-pill ${statusFilter === 'paid' ? 'active' : ''}`} onClick={() => setStatusFilter('paid')}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }}></span> Paid
            </button>
            <button className={`filter-pill ${statusFilter === 'pending' ? 'active' : ''}`} onClick={() => setStatusFilter('pending')}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F59E0B' }}></span> Pending
            </button>
            <button className={`filter-pill ${statusFilter === 'failed' ? 'active' : ''}`} onClick={() => setStatusFilter('failed')}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#F43F5E' }}></span> Failed
            </button>
          </div>

          <div style={{ position: 'relative', width: '280px' }}>
            <i className="ri-search-line" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}></i>
            <input
              type="text"
              placeholder="Search invoice or restaurant..."
              className="form-control"
              style={{ paddingLeft: '36px', paddingTop: '7px', paddingBottom: '7px' }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Restaurant Tenant</th>
                <th>Plan Tier</th>
                <th>Billing Period</th>
                <th>Amount</th>
                <th>Payment Status</th>
                <th>Date Paid / Due</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inv => (
                <tr key={inv.id}>
                  <td><code style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary-light)', fontWeight: 700 }}>{inv.invoice_number}</code></td>
                  <td>
                    <strong style={{ color: '#fff' }}>{inv.restaurant_name}</strong>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{inv.restaurant_slug}.restosaas.ph</div>
                  </td>
                  <td><span className="badge badge-plan">{inv.plan_name}</span></td>
                  <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>{inv.billing_period}</td>
                  <td><strong style={{ color: '#fff', fontSize: '14px' }}>₱{inv.amount.toLocaleString()}</strong></td>
                  <td>
                    <span className={`badge badge-${inv.status === 'paid' ? 'active' : (inv.status === 'pending' ? 'pending' : 'suspended')}`}>
                      <span className="badge-dot"></span> {inv.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {inv.paid_at ? new Date(inv.paid_at).toLocaleDateString() : `Due ${new Date(inv.due_date).toLocaleDateString()}`}
                  </td>
                  <td>
                    {inv.status !== 'paid' ? (
                      <button className="btn btn-emerald btn-sm" onClick={() => onMarkPaid(inv.id)}>
                        <i className="ri-check-line"></i> Mark Paid
                      </button>
                    ) : (
                      <button className="btn btn-secondary btn-sm" onClick={() => alert(`Receipt view for ${inv.invoice_number}`)}>
                        <i className="ri-file-download-line"></i> Receipt
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
