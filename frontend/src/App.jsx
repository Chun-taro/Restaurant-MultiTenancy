import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import Toast from './components/Toast';
import Drawer from './components/Drawer';
import ProvisionModal from './components/ProvisionModal';
import PlanModal from './components/PlanModal';
import UserModal from './components/UserModal';
import ProfileModal from './components/ProfileModal';

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
import ConfirmModal from './components/ConfirmModal';
import { applyTheme } from './utils/theme';

import { api } from './services/api';

export default function App() {
  // Top-level page state: 'landing' | 'login' | 'admin' | 'tenant_portal' | 'storefront'
  const [appMode, setAppMode] = useState('landing');
  const [activeTenantId, setActiveTenantId] = useState(null);
  const [activeTenantSlug, setActiveTenantSlug] = useState('brandobar');
  const [customerTable, setCustomerTable] = useState('T-01');

  const getInitialAdminRoute = () => {
    const hash = window.location.hash.replace('#', '').trim();
    const validRoutes = ['dashboard', 'tenants', 'plans', 'billing', 'users', 'audit', 'settings'];
    if (validRoutes.includes(hash)) return hash;
    const stored = localStorage.getItem('restosaas_admin_route');
    if (validRoutes.includes(stored)) return stored;
    return 'dashboard';
  };

  const [currentRoute, setCurrentRoute] = useState(getInitialAdminRoute);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState([]);
  const [adminUser, setAdminUser] = useState(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const handleNavigateAdmin = (route) => {
    setCurrentRoute(route);
    setIsMobileSidebarOpen(false);
    localStorage.setItem('restosaas_admin_route', route);
    if (window.location.pathname === '/admin' || window.location.pathname.startsWith('/admin')) {
      window.history.replaceState(null, '', `/admin#${route}`);
    }
  };

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
  const [editUser, setEditUser] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [drawerTenant, setDrawerTenant] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Custom Confirmation & Alert Modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'danger',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isAlert: false,
    onConfirm: null
  });

  const showConfirm = ({
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    type = 'danger',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isAlert = false,
    onConfirm
  }) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      type,
      confirmText,
      cancelText,
      isAlert,
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
        if (onConfirm) onConfirm();
      }
    });
  };

  // Helper to resolve route directly from browser URL
  const resolveRouteFromUrl = () => {
    const hostname = window.location.hostname;
    let detectedSubdomain = null;

    // Check if hostname is an IP address (IPv4 or IPv6)
    const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname === '::1' || hostname === '0.0.0.0';

    // Cloud hosting platform domains where the primary subdomain is the app service name (e.g. dine-2wv3.onrender.com), NOT a restaurant
    const cloudPlatforms = [
      'onrender.com',
      'render.com',
      'vercel.app',
      'netlify.app',
      'railway.app',
      'up.railway.app',
      'fly.dev',
      'github.io',
      'pages.dev',
      'herokuapp.com',
      'supabase.co'
    ];
    const isCloudPlatform = cloudPlatforms.some(platform => hostname.endsWith(platform));

    if (!isIpAddress && !isCloudPlatform) {
      const hostParts = hostname.split('.');
      // 1. <subdomain>.localhost (e.g. brandobar.localhost:5173)
      if (hostParts.length === 2 && hostParts[1] === 'localhost') {
        const sub = hostParts[0].toLowerCase();
        if (sub !== 'localhost' && sub !== 'www') {
          detectedSubdomain = sub;
        }
      }
      // 2. <subdomain>.domain.com (e.g. brandobar.restosaas.com)
      else if (hostParts.length > 2 && hostParts[0] !== 'www') {
        detectedSubdomain = hostParts[0].toLowerCase();
      }
    } else if (isCloudPlatform) {
      const hostParts = hostname.split('.');
      // On cloud platforms (e.g. *.onrender.com), a tenant subdomain would require >= 4 parts (e.g. brandobar.myapp.onrender.com)
      if (hostParts.length >= 4 && hostParts[0] !== 'www') {
        detectedSubdomain = hostParts[0].toLowerCase();
      }
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
      const hash = window.location.hash.replace('#', '').trim();
      const validRoutes = ['dashboard', 'tenants', 'plans', 'billing', 'users', 'audit', 'settings'];
      if (validRoutes.includes(hash)) {
        setCurrentRoute(hash);
        localStorage.setItem('restosaas_admin_route', hash);
      }
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

    // 6. Direct slug path: /:slug (e.g. /brandobar, /tokyo-ramen)
    const singleSegmentMatch = pathname.match(/^\/([a-zA-Z0-9_-]+)\/?$/);
    if (singleSegmentMatch) {
      const seg = singleSegmentMatch[1].toLowerCase();
      const systemRoutes = ['admin', 'portal', 'store', 'api', 'uploads', 'login'];
      if (!systemRoutes.includes(seg)) {
        return { mode: 'storefront', slug: seg, table: queryTable };
      }
    }

    // 7. Public Landing page: http://localhost:5173/
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

    // Listen to browser Back/Forward and Hash navigation
    const handleUrlChange = () => {
      const current = resolveRouteFromUrl();
      setAppMode(current.mode);
      if (current.slug) setActiveTenantSlug(current.slug);
      if (current.table) setCustomerTable(current.table);
      
      const hash = window.location.hash.replace('#', '').trim();
      const validRoutes = ['dashboard', 'tenants', 'plans', 'billing', 'users', 'audit', 'settings'];
      if (validRoutes.includes(hash)) {
        setCurrentRoute(hash);
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    window.addEventListener('hashchange', handleUrlChange);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      window.removeEventListener('hashchange', handleUrlChange);
    };
  }, []);

  // Set Super Admin title when in super admin or landing mode
  useEffect(() => {
    if (appMode === 'admin' || appMode === 'landing' || appMode === 'login') {
      document.title = 'Dine — Multi-Tenant Restaurant Management Platform';
    }
  }, [appMode]);

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

  // Load initial plans, tenants, users, and settings
  useEffect(() => {
    api.plans.list().then(r => setPlans(r.data)).catch(() => {});
    api.tenants.list().then(r => setTenants(r.data)).catch(() => {});
    api.users.list().then(r => setUsers(r.data)).catch(() => {});
    api.settings.get().then(r => {
      setSettings(r.data);
      if (r.data?.superadmin_theme?.value) {
        applyTheme(
          r.data.superadmin_theme.value,
          r.data.theme_primary_color?.value || '#00C4CC',
          r.data.theme_accent_color?.value || '#FF2A85'
        );
      }
    }).catch(() => {});
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

  // Update current Superadmin Profile (Name, Email, Password, Phone, Avatar)
  const handleUpdateProfile = async (profilePayload) => {
    try {
      const res = await api.users.updateProfile(profilePayload);
      const updatedUser = res.data;
      setAdminUser(updatedUser);
      localStorage.setItem('restosaas_admin_user', JSON.stringify(updatedUser));
      showToast('Superadmin profile & credentials updated!');
      const uRes = await api.users.list();
      setUsers(uRes.data);
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
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

  const handleDeleteTenant = (tenantId) => {
    showConfirm({
      title: 'Delete Restaurant Tenant',
      message: 'Permanently delete this restaurant tenant and all of its isolated cloud data? This action cannot be undone.',
      type: 'danger',
      confirmText: 'Delete Tenant',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await api.tenants.delete(tenantId);
          showToast('Tenant deleted successfully');
          setIsDrawerOpen(false);
          const res = await api.tenants.list();
          setTenants(res.data);
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    });
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

  // Create or update Super Admin / User
  const handleUserSubmit = async (formData, editId) => {
    try {
      if (editId) {
        await api.users.update(editId, { ...formData, admin_name: adminUser?.name });
        showToast('User account updated successfully');
        if (adminUser && adminUser.id === editId) {
          const updatedSelf = { ...adminUser, ...formData };
          delete updatedSelf.password;
          setAdminUser(updatedSelf);
          localStorage.setItem('restosaas_admin_user', JSON.stringify(updatedSelf));
        }
      } else {
        await api.users.create({ ...formData, admin_name: adminUser?.name });
        showToast(`Super Admin '${formData.name}' created successfully!`);

        // If created while unauthenticated (from main landing page or login), auto-sign in
        if (!adminUser && formData.email && formData.password) {
          try {
            const loginRes = await api.auth.login({ email: formData.email, password: formData.password });
            if (loginRes.data?.user && loginRes.data?.token) {
              localStorage.setItem('restosaas_admin_token', loginRes.data.token);
              localStorage.setItem('restosaas_admin_user', JSON.stringify(loginRes.data.user));
              setAdminUser(loginRes.data.user);
              navigateTo('/admin');
              showToast(`Logged in as Super Admin: ${loginRes.data.user.name}`);
            }
          } catch (loginErr) {
            navigateTo('/admin');
          }
        }
      }
      try {
        const res = await api.users.list();
        setUsers(res.data);
      } catch (listErr) {}
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const handleDeleteUser = (userId, userName) => {
    showConfirm({
      title: 'Delete User Account',
      message: `Permanently delete account for '${userName || 'this user'}'? They will lose all access immediately.`,
      type: 'danger',
      confirmText: 'Delete User',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await api.users.delete(userId);
          showToast(`User '${userName}' deleted successfully.`);
          const res = await api.users.list();
          setUsers(res.data);
        } catch (err) {
          showToast(err.message, 'error');
        }
      }
    });
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

  const handleThemeChange = async (themeId, customPrimary, customAccent) => {
    applyTheme(themeId, customPrimary, customAccent);
    try {
      await api.settings.update({
        superadmin_theme: themeId,
        theme_primary_color: customPrimary,
        theme_accent_color: customAccent
      });
      const tName = themeId === 'teal-pink' ? 'Teal & Pink Mix' : (themeId.charAt(0).toUpperCase() + themeId.slice(1));
      showToast(`Color theme set to ${tName}!`);
    } catch (err) {
      // Local theme already saved in localStorage and applied
    }
  };

  const handleSaveSettings = async (settingsPayload) => {
    try {
      await api.settings.update(settingsPayload);
      if (settingsPayload.superadmin_theme) {
        applyTheme(
          settingsPayload.superadmin_theme,
          settingsPayload.theme_primary_color,
          settingsPayload.theme_accent_color
        );
      }
      showToast('Settings & color theme saved successfully!');
      const res = await api.settings.get();
      setSettings(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const [isProvisioningDemo, setIsProvisioningDemo] = useState(false);

  const handleQuickProvisionDemo = async () => {
    try {
      setIsProvisioningDemo(true);
      const res = await api.tenants.seedDemo();
      showToast(res.message || 'Demo restaurant "Brando Bar & Grill" provisioned successfully!', 'success');
      const tRes = await api.tenants.list();
      setTenants(tRes.data);
    } catch (err) {
      showToast(err.message || 'Failed to provision demo restaurant', 'error');
    } finally {
      setIsProvisioningDemo(false);
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
          tenants={tenants}
          onOpenTenantPortal={(slug) => window.open(`/portal/${slug}`, '_blank')}
          onOpenStorefront={(slug) => window.open(`/store/${slug}`, '_blank')}
          onQuickProvisionDemo={handleQuickProvisionDemo}
          isProvisioningDemo={isProvisioningDemo}
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
        onNavigate={handleNavigateAdmin}
        onGoToLanding={() => navigateTo('/')}
        onSignOut={handleSignOut}
        tenantCount={tenants.length}
        tenants={tenants}
        adminUser={adminUser}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      <div className="main-wrapper">
        <Topbar
          currentRoute={currentRoute}
          searchQuery={searchQuery}
          onSearchChange={(q) => {
            setSearchQuery(q);
            if (currentRoute !== 'tenants' && q) handleNavigateAdmin('tenants');
          }}
          onOpenProvision={() => setIsProvisionOpen(true)}
          onGoToLanding={() => navigateTo('/')}
          onSignOut={handleSignOut}
          adminUser={adminUser}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
          onNavigate={handleNavigateAdmin}
          onThemeChange={handleThemeChange}
        />

        <main className="content-area">
          {currentRoute === 'dashboard' && (
            <DashboardView
              stats={stats}
              onNavigate={handleNavigateAdmin}
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
              showToast={showToast}
            />
          )}

          {currentRoute === 'users' && (
            <UsersView
              users={users}
              onOpenCreateUser={() => { setEditUser(null); setIsUserModalOpen(true); }}
              onOpenEditUser={(u) => { setEditUser(u); setIsUserModalOpen(true); }}
              onDeleteUser={handleDeleteUser}
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
              adminUser={adminUser}
              onOpenProfile={() => setIsProfileModalOpen(true)}
              onNavigateToUsers={() => {
                setCurrentRoute('users');
                navigateTo('/admin/users');
              }}
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
        onClose={() => { setIsUserModalOpen(false); setEditUser(null); }}
        onSubmit={handleUserSubmit}
        editUser={editUser}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={adminUser}
        onUpdateProfile={handleUpdateProfile}
      />

      {/* Toasts */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Custom Confirmation / Alert Modal */}
      <ConfirmModal
        {...confirmModal}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
