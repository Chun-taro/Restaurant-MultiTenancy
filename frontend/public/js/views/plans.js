/**
 * Subscription Plans Management View
 */

const PlansView = {
  plans: [],
  billingCycle: 'monthly', // 'monthly' | 'yearly'

  async render(container) {
    container.innerHTML = `
      <div style="display:flex; justify-content:center; align-items:center; height:300px;">
        <i class="ri-loader-4-line ri-spin" style="font-size: 28px; color:var(--primary);"></i>
      </div>
    `;

    try {
      const res = await API.plans.list();
      this.plans = res.data;
      this.renderContent(container);
    } catch (err) {
      container.innerHTML = `
        <div class="card" style="text-align:center; padding: 40px;">
          <i class="ri-error-warning-line" style="font-size: 40px; color: var(--rose);"></i>
          <h3 style="margin-top: 12px; color: #fff;">Failed to load Subscription Plans</h3>
          <p style="color: var(--text-muted); margin-bottom: 16px;">${err.message}</p>
          <button class="btn btn-primary" onclick="App.navigate('plans')">Retry</button>
        </div>
      `;
    }
  },

  renderContent(container) {
    container.innerHTML = `
      <!-- Toolbar Header -->
      <div class="toolbar-container">
        <div>
          <h2 style="color:#fff; font-size:18px; font-weight:700;">SaaS Subscription Tiers & Pricing</h2>
          <p style="color:var(--text-muted); font-size:12.5px;">Configure platform monetization, feature gating, limits, and commission rates</p>
        </div>

        <div style="display:flex; align-items:center; gap: 16px;">
          <!-- Billing Cycle Switcher -->
          <div style="display:flex; align-items:center; background:rgba(255,255,255,0.04); border:1px solid var(--border-subtle); border-radius:var(--radius-pill); padding:3px;">
            <button class="btn btn-sm ${this.billingCycle === 'monthly' ? 'btn-primary' : 'btn-secondary'}" style="border-radius:var(--radius-pill); padding:5px 14px;" onclick="PlansView.setCycle('monthly')">
              Monthly
            </button>
            <button class="btn btn-sm ${this.billingCycle === 'yearly' ? 'btn-primary' : 'btn-secondary'}" style="border-radius:var(--radius-pill); padding:5px 14px;" onclick="PlansView.setCycle('yearly')">
              Annual <span style="font-size:10px; color:#34D399; font-weight:700;">(2 Mo Free)</span>
            </button>
          </div>

          <button class="btn btn-primary" onclick="PlansView.openCreatePlanModal()">
            <i class="ri-add-line"></i> Create New Plan
          </button>
        </div>
      </div>

      <!-- Pricing Plans Grid -->
      <div class="plans-grid">
        ${this.plans.map(p => this.renderPlanCard(p)).join('')}
      </div>

      <!-- Feature Comparison Matrix -->
      <div class="card">
        <div class="card-header">
          <div>
            <div class="card-title"><i class="ri-list-check-2" style="color:var(--primary-light);"></i> Feature Availability & Limits Matrix</div>
            <div class="card-subtitle">Granular comparison across current subscription tiers</div>
          </div>
        </div>
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Feature / Entitlement</th>
                ${this.plans.map(p => `<th style="text-align:center;">${p.name}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Menu Products Limit</strong></td>
                ${this.plans.map(p => `<td style="text-align:center; font-family:var(--font-mono);">${p.max_products === -1 ? 'Unlimited' : p.max_products} items</td>`).join('')}
              </tr>
              <tr>
                <td><strong>Staff Accounts Limit</strong></td>
                ${this.plans.map(p => `<td style="text-align:center; font-family:var(--font-mono);">${p.max_staff} logins</td>`).join('')}
              </tr>
              <tr>
                <td><strong>Transaction Commission Fee</strong></td>
                ${this.plans.map(p => `<td style="text-align:center; font-family:var(--font-mono); color:var(--emerald);">${p.transaction_fee_percent}%</td>`).join('')}
              </tr>
              <tr>
                <td><strong>QR Table Ordering</strong></td>
                ${this.plans.map(p => `<td style="text-align:center;">${p.has_qr_ordering ? '<i class="ri-checkbox-circle-fill" style="color:var(--emerald); font-size:18px;"></i>' : '<i class="ri-close-circle-line" style="color:var(--text-muted); font-size:18px;"></i>'}</td>`).join('')}
              </tr>
              <tr>
                <td><strong>Online Gateway (Maya / GCash)</strong></td>
                ${this.plans.map(p => `<td style="text-align:center;">${p.has_online_payment ? '<i class="ri-checkbox-circle-fill" style="color:var(--emerald); font-size:18px;"></i>' : '<i class="ri-close-circle-line" style="color:var(--text-muted); font-size:18px;"></i>'}</td>`).join('')}
              </tr>
              <tr>
                <td><strong>Custom Domain Support (.ph / .com)</strong></td>
                ${this.plans.map(p => `<td style="text-align:center;">${p.has_custom_domain ? '<i class="ri-checkbox-circle-fill" style="color:var(--emerald); font-size:18px;"></i>' : '<i class="ri-close-circle-line" style="color:var(--text-muted); font-size:18px;"></i>'}</td>`).join('')}
              </tr>
              <tr>
                <td><strong>Advanced Analytics & Sales Export</strong></td>
                ${this.plans.map(p => `<td style="text-align:center;">${p.has_advanced_analytics ? '<i class="ri-checkbox-circle-fill" style="color:var(--emerald); font-size:18px;"></i>' : '<i class="ri-close-circle-line" style="color:var(--text-muted); font-size:18px;"></i>'}</td>`).join('')}
              </tr>
              <tr>
                <td><strong>Raw Ingredient Inventory Control</strong></td>
                ${this.plans.map(p => `<td style="text-align:center;">${p.has_inventory ? '<i class="ri-checkbox-circle-fill" style="color:var(--emerald); font-size:18px;"></i>' : '<i class="ri-close-circle-line" style="color:var(--text-muted); font-size:18px;"></i>'}</td>`).join('')}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    `;
  },

  renderPlanCard(p) {
    const isYearly = this.billingCycle === 'yearly';
    const price = isYearly ? p.price_yearly : p.price_monthly;
    const formattedPrice = `₱${Math.round(price).toLocaleString()}`;
    const periodText = isYearly ? '/year' : '/month';

    return `
      <div class="pricing-card ${p.is_popular ? 'popular' : ''}">
        ${p.is_popular ? `<div class="popular-badge">Most Popular</div>` : ''}

        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div class="pricing-plan-name">${p.name}</div>
          <span class="badge ${p.is_active ? 'badge-active' : 'badge-suspended'}">
            ${p.is_active ? 'Active' : 'Archived'}
          </span>
        </div>
        <div class="pricing-plan-desc">${p.description || 'Standard plan tier'}</div>

        <div class="pricing-price-wrap">
          <div class="pricing-amount">${formattedPrice}</div>
          <div class="pricing-period">${periodText}</div>
        </div>

        <!-- Subscriber stats pill -->
        <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:10px 14px; margin-bottom:20px; display:flex; justify-content:space-between; font-size:12px;">
          <span style="color:var(--text-muted);">Subscribers:</span>
          <strong style="color:#fff;">${p.active_subscribers || 0} active restaurants</strong>
        </div>

        <!-- Features list -->
        <ul class="pricing-features-list">
          <li class="pricing-feature-item included">
            <i class="ri-check-line"></i>
            <span>${p.max_products === -1 ? 'Unlimited' : p.max_products} menu items</span>
          </li>
          <li class="pricing-feature-item included">
            <i class="ri-check-line"></i>
            <span>${p.max_staff} staff accounts</span>
          </li>
          <li class="pricing-feature-item included">
            <i class="ri-check-line"></i>
            <span>${p.transaction_fee_percent}% platform fee</span>
          </li>
          <li class="pricing-feature-item ${p.has_qr_ordering ? 'included' : 'excluded'}">
            <i class="${p.has_qr_ordering ? 'ri-check-line' : 'ri-close-line'}"></i>
            <span>QR Table Ordering</span>
          </li>
          <li class="pricing-feature-item ${p.has_online_payment ? 'included' : 'excluded'}">
            <i class="${p.has_online_payment ? 'ri-check-line' : 'ri-close-line'}"></i>
            <span>Integrated Maya / GCash</span>
          </li>
          <li class="pricing-feature-item ${p.has_custom_domain ? 'included' : 'excluded'}">
            <i class="${p.has_custom_domain ? 'ri-check-line' : 'ri-close-line'}"></i>
            <span>Custom Domain (.ph/.com)</span>
          </li>
          <li class="pricing-feature-item ${p.has_advanced_analytics ? 'included' : 'excluded'}">
            <i class="${p.has_advanced_analytics ? 'ri-check-line' : 'ri-close-line'}"></i>
            <span>Advanced Sales Analytics</span>
          </li>
          <li class="pricing-feature-item ${p.has_inventory ? 'included' : 'excluded'}">
            <i class="${p.has_inventory ? 'ri-check-line' : 'ri-close-line'}"></i>
            <span>Raw Ingredient Inventory</span>
          </li>
        </ul>

        <!-- Action buttons -->
        <div style="display:flex; gap:8px; margin-top:auto;">
          <button class="btn btn-secondary btn-sm" style="flex:1;" onclick="PlansView.openEditPlanModal(${p.id})">
            <i class="ri-edit-line"></i> Edit Plan
          </button>
          <button class="btn btn-secondary btn-sm" onclick="PlansView.togglePlanStatus(${p.id})" title="${p.is_active ? 'Archive Plan' : 'Activate Plan'}">
            <i class="${p.is_active ? 'ri-archive-line' : 'ri-check-line'}"></i>
          </button>
        </div>
      </div>
    `;
  },

  setCycle(cycle) {
    this.billingCycle = cycle;
    this.renderContent(document.getElementById('main-content-view'));
  },

  async togglePlanStatus(planId) {
    try {
      await API.plans.toggle(planId);
      Toast.show('Plan status updated', 'success');
      const res = await API.plans.list();
      this.plans = res.data;
      this.renderContent(document.getElementById('main-content-view'));
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  },

  openCreatePlanModal() {
    const form = document.getElementById('plan-form');
    form.reset();
    form.plan_id.value = '';
    document.getElementById('plan-modal-title').textContent = 'Create New Subscription Plan';
    Modal.open('plan-modal');
  },

  openEditPlanModal(planId) {
    const p = this.plans.find(x => x.id === planId);
    if (!p) return;

    const form = document.getElementById('plan-form');
    form.plan_id.value = p.id;
    form.name.value = p.name;
    form.code.value = p.code;
    form.code.readOnly = true; // don't mutate code for existing
    form.description.value = p.description || '';
    form.price_monthly.value = p.price_monthly;
    form.price_yearly.value = p.price_yearly;
    form.max_products.value = p.max_products;
    form.max_staff.value = p.max_staff;
    form.transaction_fee_percent.value = p.transaction_fee_percent;
    form.has_qr_ordering.checked = !!p.has_qr_ordering;
    form.has_online_payment.checked = !!p.has_online_payment;
    form.has_custom_domain.checked = !!p.has_custom_domain;
    form.has_advanced_analytics.checked = !!p.has_advanced_analytics;
    form.has_inventory.checked = !!p.has_inventory;
    form.is_popular.checked = !!p.is_popular;

    document.getElementById('plan-modal-title').textContent = `Edit Plan: ${p.name}`;
    Modal.open('plan-modal');
  },

  async submitPlanForm(e) {
    e.preventDefault();
    const form = e.target;
    const planId = form.plan_id.value;

    const data = {
      name: form.name.value,
      code: form.code.value,
      description: form.description.value,
      price_monthly: Number(form.price_monthly.value),
      price_yearly: Number(form.price_yearly.value),
      max_products: Number(form.max_products.value),
      max_staff: Number(form.max_staff.value),
      transaction_fee_percent: Number(form.transaction_fee_percent.value),
      has_qr_ordering: form.has_qr_ordering.checked ? 1 : 0,
      has_online_payment: form.has_online_payment.checked ? 1 : 0,
      has_custom_domain: form.has_custom_domain.checked ? 1 : 0,
      has_advanced_analytics: form.has_advanced_analytics.checked ? 1 : 0,
      has_inventory: form.has_inventory.checked ? 1 : 0,
      is_popular: form.is_popular.checked ? 1 : 0
    };

    try {
      if (planId) {
        await API.plans.update(planId, data);
        Toast.show('Plan updated successfully', 'success');
      } else {
        await API.plans.create(data);
        Toast.show('Plan created successfully', 'success');
      }
      Modal.close('plan-modal');
      const res = await API.plans.list();
      this.plans = res.data;
      this.renderContent(document.getElementById('main-content-view'));
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  }
};

window.PlansView = PlansView;
