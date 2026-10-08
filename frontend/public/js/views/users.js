/**
 * Users & Access Control Management View
 */

const UsersView = {
  users: [],
  roleFilter: 'all',

  async render(container) {
    container.innerHTML = `
      <div style="display:flex; justify-content:center; align-items:center; height:300px;">
        <i class="ri-loader-4-line ri-spin" style="font-size: 28px; color:var(--primary);"></i>
      </div>
    `;

    try {
      const res = await API.users.list();
      this.users = res.data;
      this.renderContent(container);
    } catch (err) {
      container.innerHTML = `
        <div class="card" style="text-align:center; padding: 40px;">
          <i class="ri-error-warning-line" style="font-size: 40px; color: var(--rose);"></i>
          <h3 style="margin-top: 12px; color: #fff;">Failed to load Users</h3>
          <p style="color: var(--text-muted); margin-bottom: 16px;">${err.message}</p>
          <button class="btn btn-primary" onclick="App.navigate('users')">Retry</button>
        </div>
      `;
    }
  },

  renderContent(container) {
    const superadmins = this.users.filter(u => u.role === 'superadmin');
    const owners = this.users.filter(u => u.role === 'restaurant_owner');

    const filtered = this.roleFilter === 'all' 
      ? this.users 
      : this.users.filter(u => u.role === this.roleFilter);

    container.innerHTML = `
      <!-- Toolbar Header -->
      <div class="toolbar-container">
        <div>
          <h2 style="color:#fff; font-size:18px; font-weight:700;">Platform Identity & Access Control</h2>
          <p style="color:var(--text-muted); font-size:12.5px;">Manage platform super administrators, security credentials, and tenant owners</p>
        </div>

        <div style="display:flex; gap:10px;">
          <button class="btn btn-primary" onclick="UsersView.openCreateUserModal()">
            <i class="ri-user-add-line"></i> Add Super Admin
          </button>
        </div>
      </div>

      <!-- Quick Metrics Grid -->
      <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 24px;">
        <div class="kpi-card" style="--card-accent: #6366F1;">
          <div class="kpi-top">
            <span class="kpi-label">Super Administrators</span>
            <div class="kpi-icon"><i class="ri-shield-user-fill"></i></div>
          </div>
          <div class="kpi-value">${superadmins.length}</div>
          <div class="kpi-footer"><span class="trend-subtext">Root platform access</span></div>
        </div>

        <div class="kpi-card" style="--card-accent: #10B981;">
          <div class="kpi-top">
            <span class="kpi-label">Restaurant Owners</span>
            <div class="kpi-icon"><i class="ri-restaurant-line"></i></div>
          </div>
          <div class="kpi-value">${owners.length}</div>
          <div class="kpi-footer"><span class="trend-subtext">Tenant administrators</span></div>
        </div>

        <div class="kpi-card" style="--card-accent: #8B5CF6;">
          <div class="kpi-top">
            <span class="kpi-label">Total System Accounts</span>
            <div class="kpi-icon"><i class="ri-team-line"></i></div>
          </div>
          <div class="kpi-value">${this.users.length}</div>
          <div class="kpi-footer"><span class="trend-subtext">Active credentials</span></div>
        </div>
      </div>

      <!-- Users Table Card -->
      <div class="card">
        <div class="toolbar-container" style="margin-bottom:18px;">
          <div class="filters-bar">
            <button class="filter-pill ${this.roleFilter === 'all' ? 'active' : ''}" onclick="UsersView.setRoleFilter('all')">
              All Users (${this.users.length})
            </button>
            <button class="filter-pill ${this.roleFilter === 'superadmin' ? 'active' : ''}" onclick="UsersView.setRoleFilter('superadmin')">
              <i class="ri-shield-star-line"></i> Superadmins (${superadmins.length})
            </button>
            <button class="filter-pill ${this.roleFilter === 'restaurant_owner' ? 'active' : ''}" onclick="UsersView.setRoleFilter('restaurant_owner')">
              <i class="ri-store-2-line"></i> Restaurant Owners (${owners.length})
            </button>
          </div>
        </div>

        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>User Identity</th>
                <th>Role & Permissions</th>
                <th>Assigned Tenant</th>
                <th>Status</th>
                <th>Created / Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${filtered.map(u => `
                <tr>
                  <td>
                    <div style="display:flex; align-items:center; gap:12px;">
                      <img src="${u.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + u.name}" style="width:36px; height:36px; border-radius:50%; background:#1E293B;" />
                      <div>
                        <strong style="color:#fff; font-size:13.5px;">${u.name}</strong>
                        <div style="font-size:11.5px; color:var(--text-muted);">${u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    ${u.role === 'superadmin' ? `
                      <span class="badge" style="background:rgba(99,102,241,0.18); color:var(--primary-light); border:1px solid rgba(99,102,241,0.35);">
                        <i class="ri-shield-check-fill"></i> SUPERADMIN
                      </span>
                    ` : `
                      <span class="badge" style="background:rgba(16,185,129,0.14); color:var(--emerald); border:1px solid rgba(16,185,129,0.3);">
                        <i class="ri-store-line"></i> OWNER
                      </span>
                    `}
                  </td>
                  <td>
                    ${u.restaurant_name ? `
                      <div style="font-weight:600; color:#fff; font-size:13px;">${u.restaurant_name}</div>
                    ` : `
                      <span style="color:var(--text-muted); font-size:12px;">Global Platform</span>
                    `}
                  </td>
                  <td>
                    <span class="badge badge-${u.status}">
                      <span class="badge-dot"></span> ${u.status.toUpperCase()}
                    </span>
                  </td>
                  <td style="font-size:12px; color:var(--text-muted);">
                    ${new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td>
                    <button class="btn btn-secondary btn-sm" onclick="UsersView.toggleStatus(${u.id}, '${u.status === 'active' ? 'disabled' : 'active'}')">
                      ${u.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  setRoleFilter(role) {
    this.roleFilter = role;
    this.renderContent(document.getElementById('main-content-view'));
  },

  async toggleStatus(userId, newStatus) {
    try {
      await API.users.toggleStatus(userId, newStatus);
      Toast.show(`User account set to ${newStatus}`, 'success');
      const res = await API.users.list();
      this.users = res.data;
      this.renderContent(document.getElementById('main-content-view'));
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  },

  openCreateUserModal() {
    Modal.open('user-modal');
  },

  async submitUserForm(e) {
    e.preventDefault();
    const form = e.target;

    const data = {
      name: form.name.value,
      email: form.email.value,
      password: form.password.value,
      role: form.role.value,
      phone: form.phone.value
    };

    try {
      await API.users.create(data);
      Toast.show('Super Admin user created successfully', 'success');
      Modal.close('user-modal');
      form.reset();
      const res = await API.users.list();
      this.users = res.data;
      this.renderContent(document.getElementById('main-content-view'));
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  }
};

window.UsersView = UsersView;
