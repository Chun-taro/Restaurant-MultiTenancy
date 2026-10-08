import React from 'react';

export default function AuditView({ logs = [], onRefresh }) {
  return (
    <div>
      <div className="toolbar-container">
        <div>
          <h2 style={{ color: '#fff', fontSize: '18px', fontWeight: 700 }}>Security & Audit Trail</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '12.5px' }}>
            MongoDB audit records tracking all administrative actions across restaurants
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={onRefresh}>
          <i className="ri-refresh-line"></i> Refresh Trail
        </button>
      </div>

      <div className="card">
        <div className="table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Actor</th>
                <th>Role</th>
                <th>Action</th>
                <th>Details</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '11.5px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(l.created_at).toLocaleString()}
                  </td>
                  <td><strong style={{ color: '#fff' }}>{l.actor_name}</strong></td>
                  <td>
                    <span className="badge" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)' }}>
                      {l.actor_role}
                    </span>
                  </td>
                  <td>
                    <span className="badge" style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--primary-light)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
                      {l.action}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-main)', fontSize: '13px' }}>{l.details}</td>
                  <td><code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>{l.ip_address || '127.0.0.1'}</code></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
