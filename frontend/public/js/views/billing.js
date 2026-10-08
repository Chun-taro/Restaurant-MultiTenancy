/**
 * Billing & Invoices Management View
 */

const BillingView = {
  invoicesData: null,
  statusFilter: 'all',
  searchQuery: '',

  async render(container) {
    container.innerHTML = `
      <div style="display:flex; justify-content:center; align-items:center; height:300px;">
        <i class="ri-loader-4-line ri-spin" style="font-size: 28px; color:var(--primary);"></i>
      </div>
    `;

    try {
      const res = await API.billing.invoices();
      this.invoicesData = res.data;
      this.renderContent(container);
    } catch (err) {
      container.innerHTML = `
        <div class="card" style="text-align:center; padding: 40px;">
          <i class="ri-error-warning-line" style="font-size: 40px; color: var(--rose);"></i>
          <h3 style="margin-top: 12px; color: #fff;">Failed to load Billing Ledger</h3>
          <p style="color: var(--text-muted); margin-bottom: 16px;">${err.message}</p>
          <button class="btn btn-primary" onclick="App.navigate('billing')">Retry</button>
        </div>
      `;
    }
  },

  renderContent(container) {
    const { invoices, stats } = this.invoicesData;

    const filtered = invoices.filter(inv => {
      if (this.statusFilter !== 'all' && inv.status !== this.statusFilter) return false;
      if (this.searchQuery) {
        const q = this.searchQuery.toLowerCase();
        if (!inv.invoice_number.toLowerCase().includes(q) &&
            !inv.restaurant_name.toLowerCase().includes(q)) return false;
      }
      return true;
    });

    container.innerHTML = `
      <!-- Financial Summary Cards -->
      <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 28px;">
        <div class="kpi-card" style="--card-accent: #10B981; --kpi-icon-bg: rgba(16, 185, 129, 0.12); --kpi-icon-color: #34D399;">
          <div class="kpi-top">
            <span class="kpi-label">Total Subscriptions Collected</span>
            <div class="kpi-icon"><i class="ri-bank-card-line"></i></div>
          </div>
          <div class="kpi-value">₱${Math.round(stats.totalCollected).toLocaleString()}</div>
          <div class="kpi-footer">
            <span class="kpi-trend trend-up"><i class="ri-check-double-line"></i> Settled</span>
            <span class="trend-subtext">Maya & Card settlements</span>
          </div>
        </div>

        <div class="kpi-card" style="--card-accent: #F59E0B; --kpi-icon-bg: rgba(245, 158, 11, 0.12); --kpi-icon-color: #FBBF24;">
          <div class="kpi-top">
            <span class="kpi-label">Pending / Uncollected</span>
            <div class="kpi-icon"><i class="ri-time-line"></i></div>
          </div>
          <div class="kpi-value">₱${Math.round(stats.totalPending).toLocaleString()}</div>
          <div class="kpi-footer">
            <span class="trend-subtext">Due within 14 days or trial conversion</span>
          </div>
        </div>

        <div class="kpi-card" style="--card-accent: #F43F5E; --kpi-icon-bg: rgba(244, 63, 94, 0.12); --kpi-icon-color: #FB7185;">
          <div class="kpi-top">
            <span class="kpi-label">Past Due & Failed Invoices</span>
            <div class="kpi-icon"><i class="ri-alert-line"></i></div>
          </div>
          <div class="kpi-value">${stats.failedCount}</div>
          <div class="kpi-footer">
            <span class="trend-subtext">Requires tenant notification or suspension</span>
          </div>
        </div>
      </div>

      <!-- Filters & Invoices Table -->
      <div class="card">
        <div class="toolbar-container" style="margin-bottom: 20px;">
          <div class="filters-bar">
            <button class="filter-pill ${this.statusFilter === 'all' ? 'active' : ''}" onclick="BillingView.setStatusFilter('all')">
              All Invoices (${invoices.length})
            </button>
            <button class="filter-pill ${this.statusFilter === 'paid' ? 'active' : ''}" onclick="BillingView.setStatusFilter('paid')">
              <span style="width:6px; height:6px; border-radius:50%; background:#10B981;"></span> Paid
            </button>
            <button class="filter-pill ${this.statusFilter === 'pending' ? 'active' : ''}" onclick="BillingView.setStatusFilter('pending')">
              <span style="width:6px; height:6px; border-radius:50%; background:#F59E0B;"></span> Pending
            </button>
            <button class="filter-pill ${this.statusFilter === 'failed' ? 'active' : ''}" onclick="BillingView.setStatusFilter('failed')">
              <span style="width:6px; height:6px; border-radius:50%; background:#F43F5E;"></span> Failed
            </button>
          </div>

          <div style="position:relative; width: 280px;">
            <i class="ri-search-line" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:var(--text-muted);"></i>
            <input 
              type="text" 
              placeholder="Search invoice or restaurant..." 
              class="form-control" 
              style="padding-left: 36px; padding-top: 7px; padding-bottom: 7px;"
              value="${this.searchQuery}"
              oninput="BillingView.setSearch(this.value)"
            />
          </div>
        </div>

        <div class="table-wrapper">
          <table class="data-table">
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
              ${filtered.map(inv => `
                <tr>
                  <td><code style="font-family:var(--font-mono); color:var(--primary-light); font-weight:700;">${inv.invoice_number}</code></td>
                  <td>
                    <strong style="color:#fff;">${inv.restaurant_name}</strong>
                    <div style="font-size:11px; color:var(--text-muted);">${inv.restaurant_slug}.restosaas.ph</div>
                  </td>
                  <td><span class="badge badge-plan">${inv.plan_name}</span></td>
                  <td style="font-size:12.5px; color:var(--text-secondary);">${inv.billing_period}</td>
                  <td><strong style="color:#fff; font-size:14px;">₱${inv.amount.toLocaleString()}</strong></td>
                  <td>
                    <span class="badge badge-${inv.status === 'paid' ? 'active' : (inv.status === 'pending' ? 'pending' : 'suspended')}">
                      <span class="badge-dot"></span> ${inv.status.toUpperCase()}
                    </span>
                  </td>
                  <td style="font-size:12px; color:var(--text-muted);">
                    ${inv.paid_at ? new Date(inv.paid_at).toLocaleDateString() : `Due ${new Date(inv.due_date).toLocaleDateString()}`}
                  </td>
                  <td>
                    ${inv.status !== 'paid' ? `
                      <button class="btn btn-emerald btn-sm" onclick="BillingView.markPaid(${inv.id})">
                        <i class="ri-check-line"></i> Mark Paid
                      </button>
                    ` : `
                      <button class="btn btn-secondary btn-sm" onclick="alert('Viewing receipt for ${inv.invoice_number}')">
                        <i class="ri-file-download-line"></i> Receipt
                      </button>
                    `}
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  setStatusFilter(status) {
    this.statusFilter = status;
    this.renderContent(document.getElementById('main-content-view'));
  },

  setSearch(q) {
    this.searchQuery = q;
    this.renderContent(document.getElementById('main-content-view'));
  },

  async markPaid(invId) {
    try {
      await API.billing.updateStatus(invId, 'paid');
      Toast.show('Invoice marked as Paid', 'success');
      const res = await API.billing.invoices();
      this.invoicesData = res.data;
      this.renderContent(document.getElementById('main-content-view'));
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  }
};

window.BillingView = BillingView;
