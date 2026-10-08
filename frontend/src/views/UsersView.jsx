import React, { useState } from 'react';

export default function UsersView({ users = [], onOpenCreateUser, onToggleStatus }) {
  const [roleFilter, setRoleFilter] = useState('all');

  const superadmins = users.filter(u => u.role === 'superadmin');
  const owners = users.filter(u => u.role === 'restaurant_owner');

  const filtered = roleFilter === 'all' ? users : users.filter(u => u.role === roleFilter);

  return (
    <div>
      <div className="toolbar-container">
        <div>
          <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 700 }}>Identity & Access Governance</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '12.5px' }}>
            Manage platform super administrators, security credentials, and restaurant owners
          </p>
        </div>

        <button className="btn btn-primary" onClick={onOpenCreateUser}>
          <i className="ri-user-add-line"></i> Add Super Admin
        </button>
      </div>

      {/* KPI stats */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
        <div className="kpi-card" style={{ '--card-accent': '#6366F1' }}>
          <div className="kpi-top">
            <span className="kpi-label">Super Administrators</span>
            <div className="kpi-icon"><i className="ri-shield-user-fill"></i></div>
          </div>
          <div className="kpi-value">{superadmins.length}</div>
          <div className="kpi-footer"><span className="trend-subtext">Root platform access</span></div>
        </div>

        <div className="kpi-card" style={{ '--card-accent': '#10B981' }}>
          <div className="kpi-top">
            <span className="kpi-label">Restaurant Owners</span>
            <div className="kpi-icon"><i className="ri-restaurant-line"></i></div>
          </div>
          <div className="kpi-value">{owners.length}</div>
          <div className="kpi-footer"><span className="trend-subtext">Tenant administrators</span></div>
        </div>

        <div className="kpi-card" style={{ '--card-accent': '#8B5CF6' }}>
          <div className="kpi-top">
            <span className="kpi-label">Total System Accounts</span>
            <div className="kpi-icon"><i className="ri-team-line"></i></div>
          </div>
          <div className="kpi-value">{users.length}</div>
          <div className="kpi-footer"><span className="trend-subtext">Active credentials</span></div>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="toolbar-container" style={{ marginBottom: '18px' }}>
          <div className="filters-bar">
            <button className={`filter-pill ${roleFilter === 'all' ? 'active' : ''}`} onClick={() => setRoleFilter('all')}>
              All Users ({users.length})
            </button>
            <button className={`filter-pill ${roleFilter === 'superadmin' ? 'active' : ''}`} onClick={() => setRoleFilter('superadmin')}>
              <i className="ri-shield-star-line"></i> Superadmins ({superadmins.length})
            </button>
            <button className={`filter-pill ${roleFilter === 'restaurant_owner' ? 'active' : ''}`} onClick={() => setRoleFilter('restaurant_owner')}>
              <i className="ri-store-2-line"></i> Restaurant Owners ({owners.length})
            </button>
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>User Identity</th>
                <th>Role & Permissions</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`}
                        style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1E293B' }}
                        alt=""
                      />
                      <div>
                        <strong style={{ color: '#fff', fontSize: '13.5px' }}>{u.name}</strong>
                        <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {u.role === 'superadmin' ? (
                      <span className="badge" style={{ background: 'rgba(99,102,241,0.18)', color: 'var(--primary-light)', border: '1px solid rgba(99,102,241,0.35)' }}>
                        <i className="ri-shield-check-fill"></i> SUPERADMIN
                      </span>
                    ) : (
                      <span className="badge" style={{ background: 'rgba(16,185,129,0.14)', color: 'var(--emerald)', border: '1px solid rgba(16,185,129,0.3)' }}>
                        <i className="ri-store-line"></i> OWNER
                      </span>
                    )}
                  </td>
                  <td>
                    <span className={`badge badge-${u.status}`}>
                      <span className="badge-dot"></span> {u.status.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onToggleStatus(u.id, u.status === 'active' ? 'disabled' : 'active')}
                    >
                      {u.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
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
