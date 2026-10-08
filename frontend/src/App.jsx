import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Toast from './components/Toast';
import Drawer from './components/Drawer';
import ProvisionModal from './components/ProvisionModal';
import PlanModal from './components/PlanModal';
import UserModal from './components/UserModal';

import LandingPageView from './views/LandingPageView';
import LoginView from './views/LoginView';
import DashboardView from './views/DashboardView';
import TenantsView from './views/TenantsView';
import PlansView from './views/PlansView';
import BillingView from './views/BillingView';
import UsersView from './views/UsersView';
import AuditView from './views/AuditView';
import SettingsView from './views/SettingsView';
import TenantPortalView from './views/TenantPortalView';
import CustomerStorefrontView from './views/CustomerStorefrontView';

import { api } from './services/api';

export default function App() {
  // Top-level page state: 'landing' | 'login' | 'admin' | 'tenant_portal' | 'storefront'
  const [appMode, setAppMode] = useState('landing');
  const [activeTenantId, setActiveTenantId] = useState(null);
  const [activeTenantSlug, setActiveTenantSlug] = useState('brandobar');
  const [customerTable, setCustomerTable] = useState('T-01');

  const [currentRoute, setCurrentRoute] = useState('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState([]);
  const [adminUser, setAdminUser] = useState(null);

  // Data states
  const [stats, setStats] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [plans, setPlans] = useState([]);
  const [billingData, setBillingData] = useState(null);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [settings, setSettings] = useState({});

  // Modals & Drawer states
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editPlan, setEditPlan] = useState(null);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [drawerTenant, setDrawerTenant] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Helper to resolve route directly from browser URL
  const resolveRouteFromUrl = () => {
    const hostname = window.location.hostname;
    const hostParts = hostname.split('.');
    let detectedSubdomain = null;
    if (hostParts.length > 1 && hostParts[0] !== 'localhost' && hostParts[0] !== 'www' && hostParts[0] !== '127') {
      detectedSubdomain = hostParts[0].toLowerCase();
    }

    const pathname = window.location.pathname;
    const searchParams = new URLSearchParams(window.location.search);
    const queryStore = searchParams.get('store');
    const queryPortal = searchParams.get('portal');
    const queryTenant = searchParams.get('tenant');
    const queryTable = searchParams.get('table') || 'Table 1';

    // 1. Subdomain is admin: admin.localhost:5173
    if (detectedSubdomain === 'admin') {
      return { mode: 'admin', slug: null, table: null };
    }

    // 2. Subdomain is a restaurant: brandobar.localhost:5173
    if (detectedSubdomain) {
      if (pathname.startsWith('/portal') || queryPortal) {
        return { mode: 'tenant_portal', slug: detectedSubdomain, table: null };
      }
      return { mode: 'storefront', slug: detectedSubdomain, table: queryTable };
    }

    // 3. Dedicated /admin URL path: http://localhost:5173/admin
    if (pathname === '/admin' || pathname.startsWith('/admin')) {
      return { mode: 'admin', slug: null, table: null };
    }

    // 4. Dedicated /portal/:slug path: http://localhost:5173/portal/brandobar
    const portalMatch = pathname.match(/^\/portal\/([a-zA-Z0-9_-]+)/);
    if (portalMatch) {
      return { mode: 'tenant_portal', slug: portalMatch[1], table: null };
    }
    if (queryPortal) {
      return { mode: 'tenant_portal', slug: queryPortal, table: null };
    }

    // 5. Dedicated /store/:slug path: http://localhost:5173/store/brandobar
    const storeMatch = pathname.match(/^\/store\/([a-zA-Z0-9_-]+)/);
    if (storeMatch) {
      return { mode: 'storefront', slug: storeMatch[1], table: queryTable };
    }
    if (queryStore || queryTenant) {
      return { mode: 'storefront', slug: queryStore || queryTenant, table: queryTable };
    }

    // 6. Public Landing page: http://localhost:5173/
    return { mode: 'landing', slug: null, table: null };
  };

  // Check saved session and parse initial URL route
  useEffect(() => {
    const savedUser = localStorage.getItem('restosaas_admin_user');
    const token = localStorage.getItem('restosaas_admin_token');
    if (savedUser && token) {
      try {
        setAdminUser(JSON.parse(savedUser));
      } catch (e) {}
    }

    const initial = resolveRouteFromUrl();
    setAppMode(initial.mode);
    if (initial.slug) setActiveTenantSlug(initial.slug);
    if (initial.table) setCustomerTable(initial.table);

    // Listen to browser Back/Forward navigation
    const handlePopState = () => {
      const current = resolveRouteFromUrl();
      setAppMode(current.mode);
      if (current.slug) setActiveTenantSlug(current.slug);
      if (current.table) setCustomerTable(current.table);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (path) => {
    window.history.pushState({}, '', path);
    const target = resolveRouteFromUrl();
    setAppMode(target.mode);
    if (target.slug) setActiveTenantSlug(target.slug);
    if (target.table) setCustomerTable(target.table);
  };

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Load data for current admin route
  const loadRouteData = async () => {
    if (appMode !== 'admin') return;
    try {
      if (currentRoute === 'dashboard') {
        const res = await api.dashboard.getStats();
        setStats(res.data);
      } else if (currentRoute === 'tenants') {
        const [tRes, pRes] = await Promise.all([api.tenants.list(), api.plans.list()]);
        setTenants(tRes.data);
        setPlans(pRes.data);
      } else if (currentRoute === 'plans') {
        const res = await api.plans.list();
        setPlans(res.data);
      } else if (currentRoute === 'billing') {
        const res = await api.billing.invoices();
        setBillingData(res.data);
      } else if (currentRoute === 'users') {
        const res = await api.users.list();
        setUsers(res.data);
      } else if (currentRoute === 'audit') {
        const res = await api.audit.list();
        setAuditLogs(res.data);
      } else if (currentRoute === 'settings') {
        const res = await api.settings.get();
        setSettings(res.data);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  useEffect(() => {
    loadRouteData();
  }, [currentRoute, appMode]);

  // Load initial plans and tenants
  useEffect(() => {
    api.plans.list().then(r => setPlans(r.data)).catch(() => {});
    api.tenants.list().then(r => setTenants(r.data)).catch(() => {});
  }, []);

  // Handlers
  const handleLoginSuccess = (user) => {
    setAdminUser(user);
    navigateTo('/admin');
    setCurrentRoute('dashboard');
    showToast(`Welcome back, ${user.name}!`);
  };

  const handleSignOut = () => {
    localStorage.removeItem('restosaas_admin_token');
    localStorage.removeItem('restosaas_admin_user');
    setAdminUser(null);
    navigateTo('/admin');
    showToast('Signed out successfully', 'info');
  };

  const handleInspectTenant = async (id) => {
    try {
      const res = await api.tenants.get(id);
      setDrawerTenant(res.data);
      setIsDrawerOpen(true);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleStatusChange = async (tenantId, newStatus) => {
    let reason = '';
    if (newStatus === 'suspended') {
      reason = prompt('Enter suspension reason:', 'Past due billing or review');
      if (reason === null) return;
    }
    try {
      await api.tenants.updateStatus(tenantId, newStatus, reason);
      showToast(`Status updated to ${newStatus}`);
      handleInspectTenant(tenantId);
      const res = await api.tenants.list();
      setTenants(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleImpersonate = async (tenantId) => {
    try {
      const res = await api.tenants.impersonate(tenantId);
      const slug = res.data.slug || 'brandobar';
      window.open(`/portal/${slug}`, '_blank');
      showToast(`Opened Tenant Portal for ${res.data.restaurantName} in new tab`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleOpenStorefront = (slug, table = 'Table 1') => {
    const targetSlug = slug || activeTenantSlug || 'brandobar';
    window.open(`/store/${targetSlug}?table=${encodeURIComponent(table)}`, '_blank');
  };

  const handleDeleteTenant = async (tenantId) => {
    if (!confirm('Permanently delete this restaurant tenant? This cannot be undone.')) return;
    try {
      await api.tenants.delete(tenantId);
      showToast('Tenant deleted successfully');
      setIsDrawerOpen(false);
      const res = await api.tenants.list();
      setTenants(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleProvisionSubmit = async (formData) => {
    const res = await api.tenants.create(formData);
    showToast(`Tenant '${res.data.name}' provisioned!`);
    const r = await api.tenants.list();
    setTenants(r.data);
    if (currentRoute === 'dashboard') {
      const s = await api.dashboard.getStats();
      setStats(s.data);
    }
  };

  const handlePlanSubmit = async (formData, editId) => {
    try {
      if (editId) {
        await api.plans.update(editId, formData);
        showToast('Plan updated successfully');
      } else {
        await api.plans.create(formData);
        showToast('Plan created successfully');
      }
      const r = await api.plans.list();
      setPlans(r.data);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleTogglePlan = async (planId) => {
    try {
      await api.plans.toggle(planId);
      showToast('Plan status updated');
      const r = await api.plans.list();
      setPlans(r.data);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleMarkPaid = async (invId) => {
    try {
      await api.billing.updateStatus(invId, 'paid');
      showToast('Invoice marked as Paid');
      const res = await api.billing.invoices();
      setBillingData(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateUser = async (formData) => {
    try {
      await api.users.create(formData);
      showToast('Super Admin created successfully');
      const res = await api.users.list();
      setUsers(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleToggleUserStatus = async (userId, newStatus) => {
    try {
      await api.users.toggleStatus(userId, newStatus);
      showToast(`User status set to ${newStatus}`);
      const res = await api.users.list();
      setUsers(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleSaveSettings = async (settingsPayload) => {
    try {
      await api.settings.update(settingsPayload);
      showToast('Settings saved successfully!');
      const res = await api.settings.get();
      setSettings(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // 1. PUBLIC LANDING PAGE (http://localhost:5173/)
  if (appMode === 'landing') {
    return (
      <>
        <LandingPageView
          onGoToLogin={() => navigateTo('/admin')}
          onGoToConsole={() => navigateTo('/admin')}
          isAuthenticated={!!adminUser}
          onOpenTenantPortal={() => window.open('/portal/brandobar', '_blank')}
          onOpenStorefront={(slug) => window.open('/store/' + (slug || 'brandobar'), '_blank')}
        />
        <Toast toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  // 2. TENANT PORTAL MODE (http://localhost:5173/portal/:slug)
  if (appMode === 'tenant_portal') {
    return (
      <>
        <TenantPortalView
          tenantId={activeTenantSlug || 'brandobar'}
          tenantSlug={activeTenantSlug || 'brandobar'}
          onOpenStorefront={(slug) => window.open('/store/' + (slug || activeTenantSlug || 'brandobar'), '_blank')}
          showToast={showToast}
        />
        <Toast toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  // 3. CUSTOMER STOREFRONT & PWA MODE (http://localhost:5173/store/:slug)
  if (appMode === 'storefront') {
    return (
      <>
        <CustomerStorefrontView
          slug={activeTenantSlug || 'brandobar'}
          initialTable={customerTable || 'Table 1'}
          showToast={showToast}
        />
        <Toast toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  // 4. SUPER ADMIN CONSOLE - LOGIN (http://localhost:5173/admin)
  if (!adminUser) {
    return (
      <>
        <LoginView
          onLoginSuccess={handleLoginSuccess}
          onBackToLanding={() => navigateTo('/')}
        />
        <Toast toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  // 5. SUPER ADMIN DASHBOARD CONSOLE (http://localhost:5173/admin)
  return (
    <div id="app">
      <Sidebar
        currentRoute={currentRoute}
        onNavigate={setCurrentRoute}
        onGoToLanding={() => navigateTo('/')}
        onSignOut={handleSignOut}
        tenantCount={tenants.length}
      />

      <div className="main-wrapper">
        <Topbar
          currentRoute={currentRoute}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            if (currentRoute !== 'tenants' && q) setCurrentRoute('tenants');
          }}
          onOpenProvision={() => setIsProvisionOpen(true)}
          onGoToLanding={() => navigateTo('/')}
          onSignOut={handleSignOut}
        />

        <main className="content-area">
          {currentRoute === 'dashboard' && (
            <DashboardView
              stats={stats}
              onNavigate={setCurrentRoute}
              onOpenProvision={() => setIsProvisionOpen(true)}
              onInspectTenant={handleInspectTenant}
            />
          )}

          {currentRoute === 'tenants' && (
            <TenantsView
              tenants={tenants}
              plans={plans}
              onOpenProvision={() => setIsProvisionOpen(true)}
              onInspectTenant={handleInspectTenant}
              onImpersonate={handleImpersonate}
              onOpenStorefront={handleOpenStorefront}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />
          )}

          {currentRoute === 'plans' && (
            <PlansView
              plans={plans}
              onOpenCreatePlan={() => { setEditPlan(null); setIsPlanModalOpen(true); }}
              onOpenEditPlan={(p) => { setEditPlan(p); setIsPlanModalOpen(true); }}
              onTogglePlan={handleTogglePlan}
            />
          )}

          {currentRoute === 'billing' && (
            <BillingView
              billingData={billingData}
              onMarkPaid={handleMarkPaid}
            />
          )}

          {currentRoute === 'users' && (
            <UsersView
              users={users}
              onOpenCreateUser={() => setIsUserModalOpen(true)}
              onToggleStatus={handleToggleUserStatus}
            />
          )}

          {currentRoute === 'audit' && (
            <AuditView
              logs={auditLogs}
              onRefresh={loadRouteData}
            />
          )}

          {currentRoute === 'settings' && (
            <SettingsView
              settings={settings}
              onSave={handleSaveSettings}
            />
          )}
        </main>
      </div>

      {/* Slide-out Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        tenant={drawerTenant}
        onStatusChange={handleStatusChange}
        onImpersonate={handleImpersonate}
        onOpenStorefront={handleOpenStorefront}
        onDelete={handleDeleteTenant}
      />

      {/* Modals */}
      <ProvisionModal
        isOpen={isProvisionOpen}
        onClose={() => setIsProvisionOpen(false)}
        onSubmit={handleProvisionSubmit}
        plans={plans}
      />

      <PlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        onSubmit={handlePlanSubmit}
        editPlan={editPlan}
      />

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        onSubmit={handleCreateUser}
      />

      {/* Toasts */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
