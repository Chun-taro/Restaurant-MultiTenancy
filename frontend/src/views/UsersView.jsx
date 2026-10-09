import React, { useState } from 'react';

export default function UsersView({
  users = [],
  onOpenCreateUser,
  onOpenEditUser,
  onDeleteUser,
  onToggleStatus
}) {
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const superadmins = users.filter(u => u.role === 'superadmin');
  const owners = users.filter(u => u.role === 'restaurant_owner');

  const filtered = users.filter(u => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchName = (u.name || '').toLowerCase().includes(q);
      const matchEmail = (u.email || '').toLowerCase().includes(q);
      const matchPhone = (u.phone || '').toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchPhone) return false;
    }
    return true;
  });

  return (
    <div>
      <div className="toolbar-container">
        <div>
          <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 700 }}>Identity & Superadmin Governance</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '12.5px' }}>
            Manage platform super administrators, security credentials, and restaurant tenant owners
          </p>
        </div>

        <button className="btn btn-primary" onClick={onOpenCreateUser}>
          <i className="ri-user-add-line"></i> Add Super Admin
        </button>
      </div>

      {/* KPI stats */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: '24px' }}>
        <div className="kpi-card" style={{ '--card-accent': '#FF5A1F' }}>
          <div className="kpi-top">
            <span className="kpi-label">Super Administrators</span>
            <div className="kpi-icon"><i className="ri-shield-user-fill"></i></div>
          </div>
          <div className="kpi-value">{superadmins.length}</div>
          <div className="trend-subtext">Root platform access & credentials</div>
        </div>

        <div className="kpi-card" style={{ '--card-accent': '#10B981' }}>
          <div className="kpi-top">
            <span className="kpi-label">Restaurant Owners</span>
            <div className="kpi-icon"><i className="ri-restaurant-line"></i></div>
          </div>
          <div className="kpi-value">{owners.length}</div>
          <div className="trend-subtext">Tenant administrators</div>
        </div>

        <div className="kpi-card" style={{ '--card-accent': '#0EA5E9' }}>
          <div className="kpi-top">
            <span className="kpi-label">Total System Accounts</span>
            <div className="kpi-icon"><i className="ri-team-line"></i></div>
          </div>
          <div className="kpi-value">{users.length}</div>
          <div className="kpi-footer"><span className="trend-subtext">Active credentials</span></div>
        </div>
      </div>

      {/* Table & Controls */}
      <div className="card">
        <div className="toolbar-container" style={{ marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
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

          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: 'var(--bg-card)', borderRadius: '10px', border: '1px solid var(--border)', padding: '6px 12px', width: '280px' }}>
            <i className="ri-search-line" style={{ color: 'var(--text-muted)', marginRight: '8px' }}></i>
            <input
              type="text"
              placeholder="Search by name, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ background: 'transparent', border: 'none', outline: 'none', color: '#FFF', fontSize: '12.5px', width: '100%' }}
            />
            {searchTerm && (
              <button type="button" onClick={() => setSearchTerm('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0 }}>
                <i className="ri-close-circle-fill"></i>
              </button>
            )}
          </div>
        </div>

        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>User Identity</th>
                <th>Role & Permissions</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No users matching criteria
                  </td>
                </tr>
              ) : (
                filtered.map(u => {
                  const isDevAccount = (u.email || '').toLowerCase() === 'restosaasdev@gmail.com';
                  return (
                    <tr key={u.id} style={isDevAccount ? { background: 'rgba(99, 102, 241, 0.05)' } : {}}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={u.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.name}`}
                            style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#1E293B', border: isDevAccount ? '2px solid #8B5CF6' : '1px solid var(--border)', objectFit: 'cover' }}
                            alt=""
                          />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <strong style={{ color: '#fff', fontSize: '13.5px' }}>{u.name}</strong>
                              {isDevAccount && (
                                <span title="Root Developer Account" style={{ color: '#A78BFA', fontSize: '13px' }}>
                                  <i className="ri-shield-star-fill"></i>
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '11.5px', color: isDevAccount ? '#C4B5FD' : 'var(--text-muted)', fontFamily: isDevAccount ? 'var(--font-mono)' : 'inherit' }}>
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {isDevAccount ? (
                          <span className="badge" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(168,85,247,0.25))', color: '#C4B5FD', border: '1px solid rgba(168,85,247,0.5)', fontWeight: 700 }}>
                            <i className="ri-lock-star-fill"></i> SYSTEM DEV (PROTECTED)
                          </span>
                        ) : u.role === 'superadmin' ? (
                          <span className="badge" style={{ background: 'rgba(255,90,31,0.18)', color: 'var(--primary-light)', border: '1px solid rgba(255,90,31,0.35)' }}>
                            <i className="ri-shield-check-fill"></i> SUPERADMIN
                          </span>
                        ) : (
                          <span className="badge" style={{ background: 'rgba(16,185,129,0.14)', color: 'var(--emerald)', border: '1px solid rgba(16,185,129,0.3)' }}>
                            <i className="ri-store-line"></i> OWNER
                          </span>
                        )}
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {u.phone || '—'}
                      </td>
                      <td>
                        <span className={`badge badge-${u.status}`}>
                          <span className="badge-dot"></span> {u.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {isDevAccount ? (
                          <span style={{ fontSize: '11.5px', color: '#A78BFA', background: 'rgba(139,92,246,0.12)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(139,92,246,0.25)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                            <i className="ri-lock-2-line"></i> Dev Protected
                          </span>
                        ) : (
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => onOpenEditUser(u)}
                              title="Edit user details and credentials"
                            >
                              <i className="ri-edit-line"></i> Edit
                            </button>

                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => onToggleStatus(u.id, u.status === 'active' ? 'disabled' : 'active')}
                              title={u.status === 'active' ? 'Disable account' : 'Enable account'}
                            >
                              {u.status === 'active' ? 'Disable' : 'Enable'}
                            </button>

                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => onDeleteUser(u.id, u.name)}
                              title="Delete account"
                              style={{ padding: '4px 8px' }}
                            >
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
