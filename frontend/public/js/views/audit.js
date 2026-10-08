/**
 * Audit Logs Trail View
 */

const AuditView = {
  logs: [],
  actionFilter: 'all',

  async render(container) {
    container.innerHTML = `
      <div style="display:flex; justify-content:center; align-items:center; height:300px;">
        <i class="ri-loader-4-line ri-spin" style="font-size: 28px; color:var(--primary);"></i>
      </div>
    `;

    try {
      const res = await API.audit.list();
      this.logs = res.data;
      this.renderContent(container);
    } catch (err) {
      container.innerHTML = `<p style="color:var(--rose);">Error: ${err.message}</p>`;
    }
  },

  renderContent(container) {
    const filtered = this.actionFilter === 'all'
      ? this.logs
      : this.logs.filter(l => l.action === this.actionFilter);

    container.innerHTML = `
      <div class="toolbar-container">
        <div>
          <h2 style="color:#fff; font-size:18px; font-weight:700;">System Security & Audit Log</h2>
          <p style="color:var(--text-muted); font-size:12.5px;">Immutable administrative activity logs across all restaurant tenants</p>
        </div>

        <button class="btn btn-secondary btn-sm" onclick="AuditView.render(document.getElementById('main-content-view'))">
          <i class="ri-refresh-line"></i> Refresh Trail
        </button>
      </div>

      <div class="card">
        <div class="table-wrapper">
          <table class="data-table">
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
              ${filtered.map(l => `
                <tr>
                  <td style="font-family:var(--font-mono); font-size:11.5px; color:var(--text-muted); white-space:nowrap;">
                    ${new Date(l.created_at).toLocaleString()}
                  </td>
                  <td><strong style="color:#fff;">${l.actor_name}</strong></td>
                  <td>
                    <span class="badge" style="background:rgba(255,255,255,0.06); color:var(--text-secondary);">
                      ${l.actor_role}
                    </span>
                  </td>
                  <td>
                    <span class="badge" style="background:rgba(99,102,241,0.15); color:var(--primary-light); font-family:var(--font-mono); font-size:11px;">
                      ${l.action}
                    </span>
                  </td>
                  <td style="color:var(--text-main); font-size:13px;">${l.details}</td>
                  <td><code style="font-family:var(--font-mono); font-size:11px; color:var(--text-muted);">${l.ip_address || '127.0.0.1'}</code></td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }
};

window.AuditView = AuditView;
