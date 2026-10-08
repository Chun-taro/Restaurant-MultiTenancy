/**
 * Restaurant Tenants Management View
 */

const TenantsView = {
  tenants: [],
  plans: [],
  filters: {
    status: 'all',
    search: '',
    plan_id: 'all',
    viewMode: 'grid' // 'grid' | 'table'
  },
  currentDrawerTenant: null,

  async render(container) {
    container.innerHTML = `
      <div style="display:flex; justify-content:center; align-items:center; height:300px;">
        <i class="ri-loader-4-line ri-spin" style="font-size: 28px; color:var(--primary);"></i>
      </div>
    `;

    try {
      const [tenantsRes, plansRes] = await Promise.all([
        API.tenants.list(),
        API.plans.list()
      ]);
      this.tenants = tenantsRes.data;
      this.plans = plansRes.data;
      this.renderContent(container);
    } catch (err) {
      container.innerHTML = `
        <div class="card" style="text-align:center; padding: 40px;">
          <i class="ri-error-warning-line" style="font-size: 40px; color: var(--rose);"></i>
          <h3 style="margin-top: 12px; color: #fff;">Failed to load Tenants</h3>
          <p style="color: var(--text-muted); margin-bottom: 16px;">${err.message}</p>
          <button class="btn btn-primary" onclick="App.navigate('tenants')">Retry</button>
        </div>
      `;
    }
  },

  renderContent(container) {
    const totalCount = this.tenants.length;
    const activeCount = this.tenants.filter(t => t.status === 'active').length;
    const trialingCount = this.tenants.filter(t => t.status === 'trialing').length;
    const suspendedCount = this.tenants.filter(t => t.status === 'suspended').length;
    const pendingCount = this.tenants.filter(t => t.status === 'pending').length;

    // Filter items
    const filteredTenants = this.tenants.filter(t => {
      if (this.filters.status !== 'all' && t.status !== this.filters.status) return false;
      if (this.filters.plan_id !== 'all' && String(t.plan_id) !== String(this.filters.plan_id)) return false;
      if (this.filters.search) {
        const q = this.filters.search.toLowerCase();
        const match = t.name.toLowerCase().includes(q) ||
                      t.slug.toLowerCase().includes(q) ||
                      (t.owner_name && t.owner_name.toLowerCase().includes(q)) ||
                      (t.owner_email && t.owner_email.toLowerCase().includes(q)) ||
                      (t.city && t.city.toLowerCase().includes(q));
        if (!match) return false;
      }
      return true;
    });

    container.innerHTML = `
      <!-- Toolbar Header -->
      <div class="toolbar-container">
        <!-- Status Pills -->
        <div class="filters-bar">
          <button class="filter-pill ${this.filters.status === 'all' ? 'active' : ''}" onclick="TenantsView.setStatusFilter('all')">
            All Tenants <span class="filter-pill-count">${totalCount}</span>
          </button>
          <button class="filter-pill ${this.filters.status === 'active' ? 'active' : ''}" onclick="TenantsView.setStatusFilter('active')">
            <span style="width:6px; height:6px; border-radius:50%; background:#10B981;"></span> Active <span class="filter-pill-count">${activeCount}</span>
          </button>
          <button class="filter-pill ${this.filters.status === 'trialing' ? 'active' : ''}" onclick="TenantsView.setStatusFilter('trialing')">
            <span style="width:6px; height:6px; border-radius:50%; background:#3B82F6;"></span> Trialing <span class="filter-pill-count">${trialingCount}</span>
          </button>
          <button class="filter-pill ${this.filters.status === 'suspended' ? 'active' : ''}" onclick="TenantsView.setStatusFilter('suspended')">
            <span style="width:6px; height:6px; border-radius:50%; background:#F43F5E;"></span> Suspended <span class="filter-pill-count">${suspendedCount}</span>
          </button>
          <button class="filter-pill ${this.filters.status === 'pending' ? 'active' : ''}" onclick="TenantsView.setStatusFilter('pending')">
            <span style="width:6px; height:6px; border-radius:50%; background:#F59E0B;"></span> Pending <span class="filter-pill-count">${pendingCount}</span>
          </button>
        </div>

        <!-- Right Side: View Mode & Provision Button -->
        <div style="display:flex; align-items:center; gap: 12px;">
          <!-- Plan Filter Select -->
          <select class="form-control form-select" style="width: 160px; padding: 7px 12px;" onchange="TenantsView.setPlanFilter(this.value)">
            <option value="all">All Plans</option>
            ${this.plans.map(p => `<option value="${p.id}" ${this.filters.plan_id === String(p.id) ? 'selected' : ''}>${p.name}</option>`).join('')}
          </select>

          <!-- Grid vs Table view toggle -->
          <div style="display:flex; background:rgba(255,255,255,0.04); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:2px;">
            <button class="btn btn-sm ${this.filters.viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}" style="padding: 6px 10px;" onclick="TenantsView.setViewMode('grid')">
              <i class="ri-grid-fill"></i>
            </button>
            <button class="btn btn-sm ${this.filters.viewMode === 'table' ? 'btn-primary' : 'btn-secondary'}" style="padding: 6px 10px;" onclick="TenantsView.setViewMode('table')">
              <i class="ri-table-line"></i>
            </button>
          </div>

          <button class="btn btn-primary" onclick="TenantsView.openProvisionModal()">
            <i class="ri-add-line"></i> Provision Restaurant
          </button>
        </div>
      </div>

      <!-- Live Search & Info -->
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 20px;">
        <div style="position:relative; width: 340px;">
          <i class="ri-search-line" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--text-muted);"></i>
          <input 
            type="text" 
            placeholder="Search by restaurant, slug, owner, or city..." 
            class="form-control" 
            style="padding-left: 36px; padding-top: 8px; padding-bottom: 8px;"
            value="${this.filters.search}"
            oninput="TenantsView.setSearch(this.value)"
          />
        </div>
        <div style="font-size:12px; color:var(--text-muted);">
          Showing <span style="color:#fff; font-weight:700;">${filteredTenants.length}</span> of ${totalCount} restaurant tenants
        </div>
      </div>

      <!-- Tenant Content (Grid or Table) -->
      ${filteredTenants.length === 0 ? `
        <div class="card" style="text-align:center; padding: 60px 20px;">
          <i class="ri-restaurant-line" style="font-size: 48px; color: var(--text-muted); opacity: 0.6;"></i>
          <h3 style="color:#fff; margin-top: 14px;">No matching restaurant tenants</h3>
          <p style="color:var(--text-muted); margin-top: 4px; font-size:13px;">Try clearing filters or search criteria, or provision a new restaurant.</p>
          <button class="btn btn-primary" style="margin-top: 18px;" onclick="TenantsView.openProvisionModal()">Provision Restaurant</button>
        </div>
      ` : this.filters.viewMode === 'grid' ? `
        <div class="tenants-grid">
          ${filteredTenants.map(t => this.renderTenantCard(t)).join('')}
        </div>
      ` : `
        <div class="card" style="padding:0; overflow:hidden;">
          <div class="table-wrapper" style="border:none;">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Restaurant</th>
                  <th>Tenant Domain</th>
                  <th>Owner</th>
                  <th>Plan & Billing</th>
                  <th>Volume / Orders</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${filteredTenants.map(t => this.renderTenantTableRow(t)).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `}
    `;
  },

  renderTenantCard(t) {
    const formattedVolume = `₱${Math.round(t.total_volume || 0).toLocaleString()}`;
    const brandColor = t.primary_color || '#6366F1';

    return `
      <div class="tenant-card" style="border-top: 3px solid ${brandColor};">
        <div>
          <div class="tenant-card-header">
            <img src="${t.logo_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100'}" class="tenant-logo" />
            <div class="tenant-title-info">
              <div class="tenant-name" title="${t.name}">${t.name}</div>
              <div class="tenant-subdomain">
                <i class="ri-global-line"></i> ${t.subdomain}.restosaas.ph
              </div>
              <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">
                ${t.cuisine_type || 'Dining'} · ${t.city || 'Philippines'}
              </div>
            </div>
            <span class="badge badge-${t.status}">
              <span class="badge-dot"></span> ${t.status.toUpperCase()}
            </span>
          </div>

          <!-- Owner info & Domain pill -->
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: 14px; font-size:12px;">
            <div style="display:flex; align-items:center; gap:6px; color:var(--text-secondary);">
              <i class="ri-user-smile-line" style="color:var(--primary-light);"></i>
              <span style="font-weight:600; color:#fff;">${t.owner_name || 'Owner'}</span>
            </div>
            ${t.custom_domain ? `
              <span style="font-size:11px; font-family:var(--font-mono); color:var(--emerald); background:rgba(16,185,129,0.1); padding:2px 6px; border-radius:var(--radius-sm);">
                <i class="ri-check-line"></i> ${t.custom_domain}
              </span>
            ` : `
              <span style="font-size:11px; color:var(--text-muted);">Standard Domain</span>
            `}
          </div>

          <!-- Metrics box -->
          <div class="tenant-metrics-row">
            <div class="tenant-metric-item">
              <span class="tenant-metric-label">Gross Sales</span>
              <span class="tenant-metric-val">${formattedVolume}</span>
            </div>
            <div class="tenant-metric-item">
              <span class="tenant-metric-label">Orders</span>
              <span class="tenant-metric-val">${(t.orders_count || 0).toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div class="tenant-card-footer">
          <div style="display:flex; align-items:center; gap:8px;">
            <span class="badge badge-plan">${t.plan_name || 'Starter'}</span>
            <span style="font-size:11px; color:var(--text-muted); text-transform:capitalize;">${t.billing_cycle || 'monthly'}</span>
          </div>

          <div style="display:flex; gap:6px;">
            <button class="btn btn-secondary btn-sm" onclick="TenantsView.impersonate(${t.id})" title="Impersonate Tenant Owner">
              <i class="ri-login-box-line" style="color:var(--emerald);"></i>
            </button>
            <button class="btn btn-secondary btn-sm" onclick="TenantsView.openDrawer(${t.id})" title="Manage Tenant Dossier">
              <i class="ri-settings-4-line"></i> Manage
            </button>
          </div>
        </div>
      </div>
    `;
  },

  renderTenantTableRow(t) {
    const formattedVolume = `₱${Math.round(t.total_volume || 0).toLocaleString()}`;
    return `
      <tr>
        <td>
          <div style="display:flex; align-items:center; gap:12px;">
            <img src="${t.logo_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=60'}" style="width:38px; height:38px; border-radius:var(--radius-md); object-fit:cover;" />
            <div>
              <div style="font-weight:700; color:#fff; font-size:14px;">${t.name}</div>
              <div style="font-size:11.5px; color:var(--text-muted);">${t.cuisine_type || 'Dining'} · ${t.city || 'Metro Manila'}</div>
            </div>
          </div>
        </td>
        <td>
          <div style="display:flex; flex-direction:column; gap:2px;">
            <code style="font-family:var(--font-mono); font-size:12px; color:var(--primary-light);">${t.subdomain}.restosaas.ph</code>
            ${t.custom_domain ? `<span style="font-size:11px; color:var(--emerald);"><i class="ri-checkbox-circle-line"></i> ${t.custom_domain}</span>` : ''}
          </div>
        </td>
        <td>
          <div>
            <div style="font-weight:600; color:#fff; font-size:13px;">${t.owner_name || 'N/A'}</div>
            <div style="font-size:11px; color:var(--text-muted);">${t.owner_email || 'N/A'}</div>
          </div>
        </td>
        <td>
          <div>
            <span class="badge badge-plan">${t.plan_name || 'Standard'}</span>
            <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">₱${t.price_monthly ? t.price_monthly.toLocaleString() : '0'}/mo (${t.billing_cycle || 'monthly'})</div>
          </div>
        </td>
        <td>
          <div>
            <div style="font-weight:700; color:#fff;">${formattedVolume}</div>
            <div style="font-size:11px; color:var(--text-muted);">${(t.orders_count || 0).toLocaleString()} orders</div>
          </div>
        </td>
        <td>
          <span class="badge badge-${t.status}">
            <span class="badge-dot"></span> ${t.status.toUpperCase()}
          </span>
        </td>
        <td>
          <div style="display:flex; gap:6px;">
            <button class="btn btn-secondary btn-sm" onclick="TenantsView.impersonate(${t.id})" title="Impersonate Owner">
              <i class="ri-login-box-line" style="color:var(--emerald);"></i>
            </button>
            <button class="btn btn-secondary btn-sm" onclick="TenantsView.openDrawer(${t.id})" title="Inspect Dossier">
              <i class="ri-settings-4-line"></i> Manage
            </button>
          </div>
        </td>
      </tr>
    `;
  },

  setStatusFilter(status) {
    this.filters.status = status;
    this.renderContent(document.getElementById('main-content-view'));
  },

  setPlanFilter(planId) {
    this.filters.plan_id = planId;
    this.renderContent(document.getElementById('main-content-view'));
  },

  setSearch(q) {
    this.filters.search = q;
    this.renderContent(document.getElementById('main-content-view'));
  },

  setViewMode(mode) {
    this.filters.viewMode = mode;
    this.renderContent(document.getElementById('main-content-view'));
  },

  // Impersonate Tenant Owner
  async impersonate(tenantId) {
    try {
      const res = await API.tenants.impersonate(tenantId);
      Toast.show(`Superadmin Impersonation active: Logged in as ${res.data.ownerEmail}`, 'success', 5000);
      
      // Show impersonation alert banner modal
      alert(`⚡ SUPERADMIN IMPERSONATION SESSION\n\nRestaurant: ${res.data.restaurantName}\nTenant Slug: ${res.data.slug}\nOwner: ${res.data.ownerEmail}\n\nTarget Storefront: ${res.data.storefrontUrl}\nTarget Dashboard: ${res.data.dashboardUrl}\n\n(In full production, this securely redirects to the isolated tenant session cookie)`);
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  },

  // Slide-out Drawer for Tenant Inspection & Controls
  async openDrawer(tenantId) {
    const drawerOverlay = document.getElementById('tenant-drawer-overlay');
    const drawerBody = document.getElementById('drawer-content-body');
    const drawerTitle = document.getElementById('drawer-restaurant-name');

    drawerBody.innerHTML = `
      <div style="display:flex; justify-content:center; align-items:center; height:240px;">
        <i class="ri-loader-4-line ri-spin" style="font-size: 28px; color:var(--primary);"></i>
      </div>
    `;
    drawerOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';

    try {
      const res = await API.tenants.get(tenantId);
      const tenant = res.data;
      this.currentDrawerTenant = tenant;
      drawerTitle.textContent = tenant.name;

      drawerBody.innerHTML = `
        <!-- Hero Header -->
        <div class="dossier-hero">
          <img src="${tenant.logo_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=100'}" class="dossier-logo" />
          <div style="flex:1;">
            <div style="display:flex; align-items:center; gap:8px;">
              <h3 style="color:#fff; font-size:18px;">${tenant.name}</h3>
              <span class="badge badge-${tenant.status}"><span class="badge-dot"></span> ${tenant.status.toUpperCase()}</span>
            </div>
            <div class="dossier-quick-links">
              <a href="#" class="dossier-url-pill" onclick="alert('Storefront link: https://${tenant.subdomain}.restosaas.ph')">
                <i class="ri-external-link-line"></i> https://${tenant.subdomain}.restosaas.ph
              </a>
              ${tenant.custom_domain ? `
                <a href="#" class="dossier-url-pill" style="color:var(--emerald); background:rgba(16,185,129,0.1);">
                  <i class="ri-checkbox-circle-line"></i> https://${tenant.custom_domain}
                </a>
              ` : ''}
            </div>
          </div>
        </div>

        <!-- Tenant Action Buttons Toolbar -->
        <div style="display:flex; gap:10px; margin-bottom:24px;">
          <button class="btn btn-emerald btn-sm" style="flex:1;" onclick="TenantsView.impersonate(${tenant.id})">
            <i class="ri-login-box-line"></i> Enter Dashboard
          </button>
          ${tenant.status === 'suspended' ? `
            <button class="btn btn-secondary btn-sm" style="flex:1;" onclick="TenantsView.toggleTenantStatus(${tenant.id}, 'active')">
              <i class="ri-play-circle-line" style="color:var(--emerald);"></i> Reactivate
            </button>
          ` : `
            <button class="btn btn-danger btn-sm" style="flex:1;" onclick="TenantsView.toggleTenantStatus(${tenant.id}, 'suspended')">
              <i class="ri-pause-circle-line"></i> Suspend
            </button>
          `}
          <button class="btn btn-danger btn-sm" onclick="TenantsView.deleteTenant(${tenant.id})">
            <i class="ri-delete-bin-line"></i>
          </button>
        </div>

        <!-- Tenant Details Section -->
        <div class="card" style="margin-bottom:20px;">
          <h4 style="color:#fff; font-size:14px; margin-bottom:14px; display:flex; align-items:center; gap:6px;">
            <i class="ri-store-3-line" style="color:var(--primary-light);"></i> Business & Branding Info
          </h4>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; font-size:12.5px;">
            <div>
              <span style="color:var(--text-muted); display:block;">Cuisine Type</span>
              <strong style="color:#fff;">${tenant.cuisine_type || 'General'}</strong>
            </div>
            <div>
              <span style="color:var(--text-muted); display:block;">City & Location</span>
              <strong style="color:#fff;">${tenant.city || 'Metro Manila'}</strong>
            </div>
            <div>
              <span style="color:var(--text-muted); display:block;">Address</span>
              <span style="color:var(--text-secondary);">${tenant.address || 'N/A'}</span>
            </div>
            <div>
              <span style="color:var(--text-muted); display:block;">Brand Color</span>
              <div style="display:flex; align-items:center; gap:6px; margin-top:2px;">
                <span style="width:14px; height:14px; border-radius:50%; background:${tenant.primary_color || '#6366F1'}; border:1px solid #fff;"></span>
                <code style="font-family:var(--font-mono); color:#fff;">${tenant.primary_color || '#6366F1'}</code>
              </div>
            </div>
          </div>
        </div>

        <!-- Tenant Owner Credentials -->
        <div class="card" style="margin-bottom:20px;">
          <h4 style="color:#fff; font-size:14px; margin-bottom:14px; display:flex; align-items:center; gap:6px;">
            <i class="ri-user-star-line" style="color:var(--emerald);"></i> Restaurant Owner Profile
          </h4>
          <div style="display:flex; align-items:center; gap:12px; margin-bottom:12px;">
            <img src="${tenant.owner_avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=owner'}" style="width:42px; height:42px; border-radius:50%; background:#1E293B;" />
            <div>
              <div style="font-weight:700; color:#fff; font-size:14px;">${tenant.owner_name}</div>
              <div style="font-size:12px; color:var(--text-muted);">${tenant.owner_email}</div>
            </div>
          </div>
          <div style="font-size:12px; color:var(--text-secondary);">
            Phone: <strong style="color:#fff;">${tenant.owner_phone || 'None provided'}</strong>
          </div>
        </div>

        <!-- Subscription & Tier Management -->
        <div class="card" style="margin-bottom:20px;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:14px;">
            <h4 style="color:#fff; font-size:14px; display:flex; align-items:center; gap:6px;">
              <i class="ri-vip-diamond-line" style="color:var(--primary-light);"></i> Subscription Tier
            </h4>
            <span class="badge badge-plan">${tenant.plan_name}</span>
          </div>

          <div style="display:flex; flex-direction:column; gap:12px;">
            <div style="display:flex; justify-content:space-between; font-size:12.5px;">
              <span style="color:var(--text-muted);">Billing Cycle:</span>
              <strong style="color:#fff; text-transform:capitalize;">${tenant.billing_cycle || 'monthly'}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:12.5px;">
              <span style="color:var(--text-muted);">Current Period End:</span>
              <strong style="color:#fff;">${tenant.current_period_end ? new Date(tenant.current_period_end).toLocaleDateString() : 'N/A'}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:12.5px;">
              <span style="color:var(--text-muted);">Max Products Allowed:</span>
              <strong style="color:#fff;">${tenant.max_products === -1 ? 'Unlimited' : tenant.max_products}</strong>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:12.5px;">
              <span style="color:var(--text-muted);">Max Staff Accounts:</span>
              <strong style="color:#fff;">${tenant.max_staff}</strong>
            </div>
          </div>

          <div style="margin-top:16px; padding-top:14px; border-top:1px solid var(--border-subtle); display:flex; gap:8px;">
            <select id="drawer-change-plan-select" class="form-control form-select" style="font-size:12.5px;">
              ${this.plans.map(p => `
                <option value="${p.id}" ${p.id === tenant.plan_id ? 'selected' : ''}>
                  ${p.name} (₱${p.price_monthly.toLocaleString()}/mo)
                </option>
              `).join('')}
            </select>
            <button class="btn btn-primary btn-sm" onclick="TenantsView.changePlanFromDrawer(${tenant.id})">
              Upgrade / Downgrade
            </button>
          </div>
        </div>

        <!-- Invoices List for this Restaurant -->
        <div class="card">
          <h4 style="color:#fff; font-size:14px; margin-bottom:14px; display:flex; align-items:center; gap:6px;">
            <i class="ri-file-text-line" style="color:var(--cyan);"></i> Tenant Invoices (${tenant.invoices ? tenant.invoices.length : 0})
          </h4>
          ${tenant.invoices && tenant.invoices.length ? `
            <div class="table-wrapper">
              <table class="data-table" style="font-size:12px;">
                <thead>
                  <tr>
                    <th>Invoice #</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  ${tenant.invoices.map(inv => `
                    <tr>
                      <td><code style="font-family:var(--font-mono); color:var(--primary-light);">${inv.invoice_number}</code></td>
                      <td><strong>₱${inv.amount.toLocaleString()}</strong></td>
                      <td>
                        <span class="badge badge-${inv.status === 'paid' ? 'active' : (inv.status === 'pending' ? 'pending' : 'suspended')}">
                          ${inv.status.toUpperCase()}
                        </span>
                      </td>
                      <td style="color:var(--text-muted);">${new Date(inv.created_at).toLocaleDateString()}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          ` : `
            <p style="font-size:12px; color:var(--text-muted);">No billing invoices recorded yet.</p>
          `}
        </div>
      `;
    } catch (err) {
      drawerBody.innerHTML = `<p style="color:var(--rose);">Error loading tenant: ${err.message}</p>`;
    }
  },

  async toggleTenantStatus(tenantId, newStatus) {
    let reason = '';
    if (newStatus === 'suspended') {
      reason = prompt('Please enter reason for suspension (optional):', 'Administrative review or past due billing');
      if (reason === null) return; // User cancelled
    }

    try {
      await API.tenants.updateStatus(tenantId, newStatus, reason);
      Toast.show(`Tenant status updated to ${newStatus}`, 'success');
      // Refresh views
      this.openDrawer(tenantId);
      const res = await API.tenants.list();
      this.tenants = res.data;
      this.renderContent(document.getElementById('main-content-view'));
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  },

  async changePlanFromDrawer(tenantId) {
    const select = document.getElementById('drawer-change-plan-select');
    const newPlanId = Number(select.value);

    try {
      await API.tenants.updatePlan(tenantId, newPlanId, 'monthly');
      Toast.show('Subscription plan migrated successfully!', 'success');
      this.openDrawer(tenantId);
      const res = await API.tenants.list();
      this.tenants = res.data;
      this.renderContent(document.getElementById('main-content-view'));
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  },

  async deleteTenant(tenantId) {
    if (!confirm('Are you sure you want to permanently delete this restaurant tenant and all isolated data? This cannot be undone.')) {
      return;
    }

    try {
      await API.tenants.delete(tenantId);
      Toast.show('Tenant deleted successfully', 'success');
      document.getElementById('tenant-drawer-overlay').classList.remove('open');
      document.body.style.overflow = '';
      const res = await API.tenants.list();
      this.tenants = res.data;
      this.renderContent(document.getElementById('main-content-view'));
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  },

  // Provision New Tenant Modal Wizard
  openProvisionModal() {
    Modal.open('provision-modal');
  },

  async submitProvisionForm(e) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = `<i class="ri-loader-4-line ri-spin"></i> Provisioning Tenant...`;

    const data = {
      name: form.restaurant_name.value,
      slug: form.subdomain.value,
      subdomain: form.subdomain.value,
      custom_domain: form.custom_domain.value || null,
      cuisine_type: form.cuisine_type.value,
      primary_color: form.primary_color.value,
      city: form.city.value,
      address: form.address.value,
      owner_name: form.owner_name.value,
      owner_email: form.owner_email.value,
      owner_password: form.owner_password.value || 'password123',
      phone: form.owner_phone.value,
      plan_id: Number(form.plan_id.value),
      billing_cycle: form.billing_cycle.value,
      status: form.initial_status.value
    };

    try {
      const res = await API.tenants.create(data);
      Toast.show(`Tenant '${res.data.name}' provisioned successfully!`, 'success');
      Modal.close('provision-modal');
      form.reset();

      // Refresh data
      const refreshRes = await API.tenants.list();
      this.tenants = refreshRes.data;
      this.renderContent(document.getElementById('main-content-view'));
    } catch (err) {
      Toast.show(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = `<i class="ri-rocket-line"></i> Complete Provisioning`;
    }
  }
};

window.TenantsView = TenantsView;
