/**
 * Platform System Settings View
 */

const SettingsView = {
  settings: {},

  async render(container) {
    container.innerHTML = `
      <div style="display:flex; justify-content:center; align-items:center; height:300px;">
        <i class="ri-loader-4-line ri-spin" style="font-size: 28px; color:var(--primary);"></i>
      </div>
    `;

    try {
      const res = await API.settings.get();
      this.settings = res.data;
      this.renderContent(container);
    } catch (err) {
      container.innerHTML = `<p style="color:var(--rose);">Error: ${err.message}</p>`;
    }
  },

  renderContent(container) {
    const s = this.settings;

    container.innerHTML = `
      <div class="toolbar-container">
        <div>
          <h2 style="color:#fff; font-size:18px; font-weight:700;">Platform Configuration & Engine Settings</h2>
          <p style="color:var(--text-muted); font-size:12.5px;">Global defaults, multi-tenant rules, payment mode, and system parameters</p>
        </div>
      </div>

      <form id="settings-form" onsubmit="SettingsView.saveSettings(event)" style="display:flex; flex-direction:column; gap:24px;">
        <!-- General Identity -->
        <div class="card">
          <div class="card-title" style="margin-bottom:18px;">
            <i class="ri-building-4-line" style="color:var(--primary-light);"></i> General Platform Identity
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
            <div class="form-group" style="margin:0;">
              <label class="form-label">Platform Name</label>
              <input type="text" name="platform_name" class="form-control" value="${s.platform_name ? s.platform_name.value : 'RestoSaaS'}" />
              <div class="form-hint">Displayed across tenant billing statements and system notifications</div>
            </div>
            <div class="form-group" style="margin:0;">
              <label class="form-label">Master Support Email</label>
              <input type="email" name="platform_support_email" class="form-control" value="${s.platform_support_email ? s.platform_support_email.value : 'support@restosaas.com'}" />
              <div class="form-hint">Recipient for escalated tenant tickets and provisioning inquiries</div>
            </div>
          </div>
        </div>

        <!-- Localization & Billing Currency -->
        <div class="card">
          <div class="card-title" style="margin-bottom:18px;">
            <i class="ri-money-dollar-box-line" style="color:var(--emerald);"></i> Currency & Billing Engine
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
            <div class="form-group" style="margin:0;">
              <label class="form-label">Platform Base Currency</label>
              <select name="default_currency" class="form-control form-select">
                <option value="PHP" ${s.default_currency && s.default_currency.value === 'PHP' ? 'selected' : ''}>PHP - Philippine Peso (₱)</option>
                <option value="USD" ${s.default_currency && s.default_currency.value === 'USD' ? 'selected' : ''}>USD - United States Dollar ($)</option>
                <option value="SGD" ${s.default_currency && s.default_currency.value === 'SGD' ? 'selected' : ''}>SGD - Singapore Dollar (S$)</option>
              </select>
            </div>
            <div class="form-group" style="margin:0;">
              <label class="form-label">Default Free Trial Duration (Days)</label>
              <input type="number" name="trial_days_default" class="form-control" value="${s.trial_days_default ? s.trial_days_default.value : '14'}" />
              <div class="form-hint">Number of trial days granted when restaurants register</div>
            </div>
          </div>
        </div>

        <!-- Payment Gateway Integration -->
        <div class="card">
          <div class="card-title" style="margin-bottom:18px;">
            <i class="ri-secure-payment-line" style="color:var(--amber);"></i> Payment Gateway & Webhooks (Section 8 Architecture)
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
            <div class="form-group" style="margin:0;">
              <label class="form-label">Payment Gateway Mode</label>
              <select name="payment_gateway_mode" class="form-control form-select">
                <option value="sandbox" ${s.payment_gateway_mode && s.payment_gateway_mode.value === 'sandbox' ? 'selected' : ''}>Sandbox (Test payments)</option>
                <option value="production" ${s.payment_gateway_mode && s.payment_gateway_mode.value === 'production' ? 'selected' : ''}>Production (Live Maya / Card transactions)</option>
              </select>
            </div>
            <div class="form-group" style="margin:0;">
              <label class="form-label">Webhook Verification HMAC Key</label>
              <input type="text" name="webhook_signing_secret" class="form-control" style="font-family:var(--font-mono);" value="${s.webhook_signing_secret ? s.webhook_signing_secret.value : ''}" />
            </div>
          </div>
        </div>

        <!-- System Controls -->
        <div class="card">
          <div class="card-title" style="margin-bottom:18px;">
            <i class="ri-tools-line" style="color:var(--rose);"></i> System Operations
          </div>
          <div style="display:flex; flex-direction:column; gap:16px;">
            <div style="display:flex; align-items:center; justify-content:space-between;">
              <div>
                <strong style="color:#fff; font-size:14px;">Allow Restaurant Public Self-Registration</strong>
                <p style="color:var(--text-muted); font-size:12px;">If disabled, new restaurants can only be created by Super Admins through the provisioning wizard.</p>
              </div>
              <label class="switch">
                <input type="checkbox" name="allow_self_signup" ${s.allow_self_signup && s.allow_self_signup.value === 'true' ? 'checked' : ''}>
                <span class="slider"></span>
              </label>
            </div>

            <div style="display:flex; align-items:center; justify-content:space-between; padding-top:16px; border-top:1px solid var(--border-subtle);">
              <div>
                <strong style="color:#fff; font-size:14px;">Platform Maintenance Mode</strong>
                <p style="color:var(--text-muted); font-size:12px;">Temporarily display maintenance screen across customer storefronts.</p>
              </div>
              <label class="switch">
                <input type="checkbox" name="maintenance_mode" ${s.maintenance_mode && s.maintenance_mode.value === 'true' ? 'checked' : ''}>
                <span class="slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div>
          <button type="submit" class="btn btn-primary" style="padding:12px 24px;">
            <i class="ri-save-line"></i> Save Platform Settings
          </button>
        </div>
      </form>
    `;
  },

  async saveSettings(e) {
    e.preventDefault();
    const form = e.target;

    const payload = {
      platform_name: form.platform_name.value,
      platform_support_email: form.platform_support_email.value,
      default_currency: form.default_currency.value,
      trial_days_default: form.trial_days_default.value,
      payment_gateway_mode: form.payment_gateway_mode.value,
      webhook_signing_secret: form.webhook_signing_secret.value,
      allow_self_signup: form.allow_self_signup.checked ? 'true' : 'false',
      maintenance_mode: form.maintenance_mode.checked ? 'true' : 'false'
    };

    try {
      await API.settings.update(payload);
      Toast.show('Platform settings saved successfully!', 'success');
      this.render(document.getElementById('main-content-view'));
    } catch (err) {
      Toast.show(err.message, 'error');
    }
  }
};

window.SettingsView = SettingsView;
