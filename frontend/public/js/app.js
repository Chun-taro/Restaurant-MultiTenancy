/**
 * RestoSaaS Superadmin Core Application Driver
 */

const App = {
  currentRoute: 'dashboard',

  routes: {
    dashboard: DashboardView,
    tenants: TenantsView,
    plans: PlansView,
    billing: BillingView,
    users: UsersView,
    audit: AuditView,
    settings: SettingsView
  },

  titles: {
    dashboard: { title: 'Executive Overview', subtitle: 'Platform-wide multi-tenant intelligence and revenue metrics' },
    tenants: { title: 'Restaurant Tenants', subtitle: 'Manage isolated multi-tenant stores, domains, and subscriptions' },
    plans: { title: 'Subscription Plans', subtitle: 'Platform billing tiers, feature gates, and pricing matrix' },
    billing: { title: 'Billing & Invoices', subtitle: 'Subscription receivables, payment records, and financial status' },
    users: { title: 'Identity & Access', subtitle: 'Superadmin credentials, tenant owners, and role authorization' },
    audit: { title: 'Security & Audit Trail', subtitle: 'Real-time administrative operations and audit logs' },
    settings: { title: 'System Settings', subtitle: 'Platform configurations, payments mode, and maintenance' }
  },

  init() {
    Modal.initListeners();

    // Setup nav click handlers
    document.querySelectorAll('[data-nav]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const route = item.getAttribute('data-nav');
        this.navigate(route);
      });
    });

    // Topbar search filter
    const topSearch = document.getElementById('topbar-global-search');
    if (topSearch) {
      topSearch.addEventListener('input', (e) => {
        const val = e.target.value.trim();
        if (this.currentRoute !== 'tenants' && val.length > 0) {
          this.navigate('tenants');
          setTimeout(() => {
            TenantsView.setSearch(val);
          }, 100);
        } else if (this.currentRoute === 'tenants') {
          TenantsView.setSearch(val);
        }
      });
    }

    // Auto-slugify in provision modal
    const restNameInput = document.getElementById('prov-rest-name');
    const subdomainInput = document.getElementById('prov-subdomain');
    const slugPreview = document.getElementById('prov-slug-preview');

    if (restNameInput && subdomainInput) {
      restNameInput.addEventListener('input', () => {
        const slug = restNameInput.value
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        subdomainInput.value = slug;
        if (slugPreview) slugPreview.textContent = slug || 'your-restaurant';
      });

      subdomainInput.addEventListener('input', () => {
        if (slugPreview) slugPreview.textContent = subdomainInput.value || 'your-restaurant';
      });
    }

    // Load initial route
    this.navigate('dashboard');
  },

  navigate(route) {
    if (!this.routes[route]) route = 'dashboard';
    this.currentRoute = route;

    // Update active nav classes
    document.querySelectorAll('[data-nav]').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-nav') === route);
    });

    // Update Topbar header titles
    const meta = this.titles[route] || { title: 'Super Admin', subtitle: '' };
    const titleEl = document.getElementById('page-header-title');
    const subEl = document.getElementById('page-header-subtitle');
    if (titleEl) titleEl.textContent = meta.title;
    if (subEl) subEl.textContent = meta.subtitle;

    // Render View
    const container = document.getElementById('main-content-view');
    if (container && this.routes[route]) {
      this.routes[route].render(container);
    }
  }
};

window.App = App;

// Bootstrap when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
