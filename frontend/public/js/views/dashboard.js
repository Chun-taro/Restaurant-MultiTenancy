/**
 * Superadmin Dashboard View
 */

const DashboardView = {
  statsData: null,
  activeChartTab: 'mrr',

  async render(container) {
    container.innerHTML = `
      <div style="display:flex; justify-content:center; align-items:center; height:300px;">
        <div style="display:flex; align-items:center; gap:12px; color:var(--text-muted);">
          <i class="ri-loader-4-line ri-spin" style="font-size: 28px; color:var(--primary);"></i>
          <span>Loading platform intelligence...</span>
        </div>
      </div>
    `;

    try {
      const res = await API.dashboard.getStats();
      this.statsData = res.data;
      this.renderContent(container);
    } catch (err) {
      container.innerHTML = `
        <div class="card" style="text-align:center; padding: 40px;">
          <i class="ri-error-warning-line" style="font-size: 40px; color: var(--rose);"></i>
          <h3 style="margin-top: 12px; color: #fff;">Failed to load Dashboard data</h3>
          <p style="color: var(--text-muted); margin-bottom: 16px;">${err.message}</p>
          <button class="btn btn-primary" onclick="App.navigate('dashboard')">Retry</button>
        </div>
      `;
    }
  },

  renderContent(container) {
    const { kpi, planDistribution, recentActivity, recentTenants, revenueTrend } = this.statsData;

    const formattedMrr = `₱${Math.round(kpi.mrr).toLocaleString('en-US')}`;
    const formattedArr = `₱${Math.round(kpi.arr).toLocaleString('en-US')}`;
    const formattedGmv = `₱${Math.round(kpi.totalPlatformGmv).toLocaleString('en-US')}`;

    container.innerHTML = `
      <!-- Top KPI Stat Cards -->
      <div class="kpi-grid">
        <!-- KPI 1: MRR -->
        <div class="kpi-card" style="--card-accent: #6366F1; --kpi-icon-bg: rgba(99, 102, 241, 0.12); --kpi-icon-color: #818CF8;">
          <div class="kpi-top">
            <span class="kpi-label">Monthly Recurring Revenue</span>
            <div class="kpi-icon"><i class="ri-money-dollar-circle-line"></i></div>
          </div>
          <div class="kpi-value">${formattedMrr}</div>
          <div class="kpi-footer">
            <span class="kpi-trend trend-up"><i class="ri-arrow-up-line"></i> +18.4%</span>
            <span class="trend-subtext">ARR run-rate: ${formattedArr}</span>
          </div>
        </div>

        <!-- KPI 2: Active Tenants -->
        <div class="kpi-card" style="--card-accent: #10B981; --kpi-icon-bg: rgba(16, 185, 129, 0.12); --kpi-icon-color: #34D399;">
          <div class="kpi-top">
            <span class="kpi-label">Active Restaurant Tenants</span>
            <div class="kpi-icon"><i class="ri-restaurant-2-line"></i></div>
          </div>
          <div class="kpi-value">${kpi.activeTenants} <span style="font-size:16px; font-weight:500; color:var(--text-muted)">/ ${kpi.totalTenants}</span></div>
          <div class="kpi-footer">
            <span class="kpi-trend trend-up"><i class="ri-time-line"></i> ${kpi.trialingTenants} Trialing</span>
            <span class="trend-subtext">· ${kpi.suspendedTenants} Suspended</span>
          </div>
        </div>

        <!-- KPI 3: Platform Gross Volume -->
        <div class="kpi-card" style="--card-accent: #F59E0B; --kpi-icon-bg: rgba(245, 158, 11, 0.12); --kpi-icon-color: #FBBF24;">
          <div class="kpi-top">
            <span class="kpi-label">Platform Gross Volume (GMV)</span>
            <div class="kpi-icon"><i class="ri-shopping-bag-3-line"></i></div>
          </div>
          <div class="kpi-value">${formattedGmv}</div>
          <div class="kpi-footer">
            <span class="kpi-trend trend-up"><i class="ri-file-list-3-line"></i> ${kpi.totalPlatformOrders.toLocaleString()}</span>
            <span class="trend-subtext">Total storefront orders</span>
          </div>
        </div>

        <!-- KPI 4: Total Users -->
        <div class="kpi-card" style="--card-accent: #8B5CF6; --kpi-icon-bg: rgba(139, 92, 246, 0.12); --kpi-icon-color: #A78BFA;">
          <div class="kpi-top">
            <span class="kpi-label">Platform Identity Users</span>
            <div class="kpi-icon"><i class="ri-user-shared-line"></i></div>
          </div>
          <div class="kpi-value">${kpi.totalUsers}</div>
          <div class="kpi-footer">
            <span class="kpi-trend trend-up"><i class="ri-shield-user-line"></i> 2 Superadmins</span>
            <span class="trend-subtext">· ${kpi.totalTenants} Owners</span>
          </div>
        </div>
      </div>

      <!-- Quick Action Alert Banner -->
      <div style="background: linear-gradient(90deg, rgba(99, 102, 241, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: var(--radius-lg); padding: 18px 24px; margin-bottom: 28px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px;">
        <div style="display:flex; align-items:center; gap: 14px;">
          <div style="width: 42px; height: 42px; border-radius: 50%; background: var(--primary); display:flex; align-items:center; justify-content:center; color:#fff; font-size:20px; box-shadow: 0 4px 12px var(--primary-glow);">
            <i class="ri-rocket-2-fill"></i>
          </div>
          <div>
            <h4 style="color:#fff; font-size:15px; font-weight:700;">Multi-Tenant SaaS Engine Active</h4>
            <p style="color:var(--text-secondary); font-size:12.5px;">Each restaurant receives isolated tenant branding, menu database isolation, and dedicated subdomain routing.</p>
          </div>
        </div>
        <div style="display:flex; gap: 10px;">
          <button class="btn btn-secondary btn-sm" onclick="App.navigate('plans')">
            <i class="ri-price-tag-3-line"></i> Manage Plans
          </button>
          <button class="btn btn-primary btn-sm" onclick="TenantsView.openProvisionModal()">
            <i class="ri-add-line"></i> Provision New Restaurant
          </button>
        </div>
      </div>

      <!-- Middle: Charts & Plan Distribution -->
      <div class="charts-grid">
        <!-- Revenue Trajectory Chart -->
        <div class="card">
          <div class="chart-header">
            <div>
              <div class="card-title"><i class="ri-line-chart-line" style="color:var(--primary-light);"></i> SaaS Revenue Trajectory</div>
              <div class="card-subtitle">Monthly Recurring Revenue growth over the last 6 months</div>
            </div>
            <div class="chart-filters">
              <button class="chart-tab-btn ${this.activeChartTab === 'mrr' ? 'active' : ''}" onclick="DashboardView.switchChart('mrr')">MRR (₱)</button>
              <button class="chart-tab-btn ${this.activeChartTab === 'gmv' ? 'active' : ''}" onclick="DashboardView.switchChart('gmv')">GMV Volume</button>
            </div>
          </div>
          <div id="mrr-chart-container" style="width: 100%; height: 220px;"></div>
        </div>

        <!-- Plan Subscription Distribution -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title"><i class="ri-pie-chart-line" style="color:var(--emerald);"></i> Subscription Distribution</div>
              <div class="card-subtitle">Active restaurant allocation by tier</div>
            </div>
          </div>
          <div class="plan-progress-list">
            ${planDistribution.map(p => {
              const maxSubs = Math.max(...planDistribution.map(x => x.subscriber_count)) || 1;
              const pct = Math.round((p.subscriber_count / (kpi.totalTenants || 1)) * 100);
              const colorMap = {
                starter: '#3B82F6',
                growth: '#6366F1',
                pro: '#10B981',
                enterprise: '#8B5CF6'
              };
              const color = colorMap[p.code] || '#6366F1';
              return `
                <div class="plan-progress-item">
                  <div class="plan-progress-header">
                    <span class="plan-progress-title">
                      <span style="width:8px; height:8px; border-radius:50%; background:${color};"></span>
                      ${p.name}
                    </span>
                    <span class="plan-progress-val">${p.subscriber_count} tenants (${pct}%)</span>
                  </div>
                  <div class="progress-track">
                    <div class="progress-fill" style="width: ${pct}%; background: ${color};"></div>
                  </div>
                  <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text-muted);">
                    <span>₱${p.price_monthly.toLocaleString()}/mo</span>
                    <span>MRR: ₱${Math.round(p.plan_mrr || 0).toLocaleString()}</span>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- Bottom: Recent Tenants & Live Audit Logs -->
      <div style="display:grid; grid-template-columns: 1.5fr 1fr; gap:24px;">
        <!-- Recent Restaurants -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title"><i class="ri-store-2-line" style="color:var(--primary-light);"></i> Recently Onboarded Restaurants</div>
              <div class="card-subtitle">Latest provisioned multi-tenant accounts</div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="App.navigate('tenants')">View All (${kpi.totalTenants})</button>
          </div>
          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Restaurant</th>
                  <th>Subdomain</th>
                  <th>Plan</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                ${recentTenants.map(t => `
                  <tr>
                    <td>
                      <div style="display:flex; align-items:center; gap:10px;">
                        <img src="${t.logo_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=60'}" style="width:34px; height:34px; border-radius:var(--radius-sm); object-fit:cover;" />
                        <div>
                          <div style="font-weight:700; color:#fff;">${t.name}</div>
                          <div style="font-size:11px; color:var(--text-muted);">${t.city || 'Philippines'}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <code style="font-family:var(--font-mono); font-size:11.5px; color:var(--primary-light);">${t.subdomain}.restosaas.ph</code>
                    </td>
                    <td><span class="badge badge-plan">${t.plan_name || 'Standard'}</span></td>
                    <td>
                      <span class="badge badge-${t.status}">
                        <span class="badge-dot"></span> ${t.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <button class="btn btn-secondary btn-sm" onclick="TenantsView.openDrawer(${t.id})" title="Inspect Tenant">
                        <i class="ri-eye-line"></i>
                      </button>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Live Audit Trail -->
        <div class="card">
          <div class="card-header">
            <div>
              <div class="card-title"><i class="ri-shield-keyhole-line" style="color:var(--amber);"></i> Live Security & Activity</div>
              <div class="card-subtitle">Real-time audit log stream</div>
            </div>
            <button class="btn btn-secondary btn-sm" onclick="App.navigate('audit')">Full Log</button>
          </div>
          <div class="timeline">
            ${recentActivity.map(a => `
              <div class="timeline-item">
                <div class="timeline-point"></div>
                <div class="timeline-content">
                  <div class="timeline-meta">
                    <span class="timeline-actor">${a.actor_name}</span>
                    <span class="timeline-time">${new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div class="timeline-desc">${a.details}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    // Render SVG chart
    this.drawChart();
  },

  switchChart(tab) {
    this.activeChartTab = tab;
    // Re-render chart filters
    document.querySelectorAll('.chart-tab-btn').forEach(b => {
      b.classList.toggle('active', b.textContent.toLowerCase().includes(tab));
    });
    this.drawChart();
  },

  drawChart() {
    if (!this.statsData || !this.statsData.revenueTrend) return;
    const isMrr = this.activeChartTab === 'mrr';
    const chartData = this.statsData.revenueTrend.map(d => ({
      label: d.month,
      value: isMrr ? d.mrr : d.gmv
    }));

    Charts.renderLineChart('mrr-chart-container', chartData, { height: 210 });
  }
};

window.DashboardView = DashboardView;
