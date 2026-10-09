import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

export default function TenantPortalView({
  tenantId,
  tenantSlug,
  onExitPortal,
  onOpenStorefront,
  showToast
}) {
  const getInitialPortalTab = () => {
    const hash = window.location.hash.replace('#', '').trim();
    const validTabs = ['overview', 'orders', 'menu', 'staff', 'customers', 'reports', 'tables', 'subscription', 'settings'];
    if (validTabs.includes(hash)) return hash;
    const saved = localStorage.getItem(`dine_portal_tab_${tenantSlug}`);
    if (validTabs.includes(saved)) return saved;
    return 'overview';
  };

  // Navigation: overview | orders | menu | staff | customers | reports | tables | subscription | settings
  const [activeTab, setActiveTab] = useState(getInitialPortalTab);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    localStorage.setItem(`dine_portal_tab_${tenantSlug}`, tabId);
    if (window.location.pathname.startsWith('/portal')) {
      window.history.replaceState(null, '', `/portal/${tenantSlug}#${tabId}`);
    }
  };

  const [overview, setOverview] = useState(null);
  const [orders, setOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState('all');
  const [menuData, setMenuData] = useState({ categories: [], totalItems: 0 });
  const [customers, setCustomers] = useState([]);
  const [reports, setReports] = useState(null);
  const [tables, setTables] = useState([]);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [settingsForm, setSettingsForm] = useState({
    name: '',
    cuisine_type: '',
    primary_color: '#2A9D9A',
    secondary_color: '#263238',
    logo_url: '',
    banner_url: '',
    phone: '',
    address: '',
    city: '',
    email: ''
  });

  // Dynamic Theme Tokens that adapt to the restaurant's active color theme
  const primaryBrandColor = settingsForm?.primary_color || overview?.restaurant?.primary_color || '#2A9D9A';
  const secondaryBrandColor = settingsForm?.secondary_color || overview?.restaurant?.secondary_color || '#1E293B';

  const C = {
    white: '#FFFFFF',
    pink: '#F1F5F9',        // Clean slate-100 neutral (replaces pastel pink)
    pinkLight: '#F1F5F9',   // Clean slate-100 neutral (replaces pastel pink)
    pinkSoft: '#F8FAFC',    // Modern slate-50 page background (replaces pastel pink)
    bgSoft: '#F8FAFC',
    bgMuted: '#F1F5F9',
    cardBg: '#FFFFFF',
    teal: primaryBrandColor,
    tealDark: primaryBrandColor,
    tealLight: `${primaryBrandColor}18`,
    tealGlow: `${primaryBrandColor}33`,
    dark: secondaryBrandColor,
    slate: '#64748B',
    border: '#E2E8F0',
    borderDark: '#CBD5E1',
    grayBorder: '#E2E8F0',
    gold: '#F59E0B'
  };
  // Selected Category filter in Menu tab
  const [selectedMenuCat, setSelectedMenuCat] = useState('all');

  // Modals state
  const [isItemModalOpen, setIsItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    category_id: '',
    price: '',
    description: '',
    image_url: '',
    preparation_time: 15,
    badge: '',
    is_featured: false
  });

  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [catForm, setCatForm] = useState({ name: '', description: '', icon: 'ri-restaurant-line' });

  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [tableForm, setTableForm] = useState({ table_number: '', capacity: 4 });

  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  // Tenant Staff Authentication State
  const [staffUser, setStaffUser] = useState(() => {
    try {
      const saved = localStorage.getItem(`dine_tenant_staff_${tenantSlug}`);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [authMode, setAuthMode] = useState('pin'); // 'pin' | 'credentials'
  const [loginPin, setLoginPin] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Portal Login / Register Tab
  const [portalAuthTab, setPortalAuthTab] = useState('signin'); // 'signin' | 'register'
  const [portalRegType, setPortalRegType] = useState('staff'); // 'customer' | 'staff' | 'admin'
  const [portalRegName, setPortalRegName] = useState('');
  const [portalRegPhone, setPortalRegPhone] = useState('');
  const [portalRegEmail, setPortalRegEmail] = useState('');
  const [portalRegPin, setPortalRegPin] = useState('');
  const [portalRegPassword, setPortalRegPassword] = useState('');
  const [showPortalRegPassword, setShowPortalRegPassword] = useState(false);

  // Staff & Admin Team Management State
  const [staffList, setStaffList] = useState([]);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [showStaffFormPassword, setShowStaffFormPassword] = useState(false);
  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'staff', // 'admin' | 'manager' | 'staff' | 'kitchen' | 'cashier'
    password: '',
    status: 'active'
  });

  const handleStaffLogin = async (e) => {
    if (e) e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const payload = { email: loginEmail.trim(), password: loginPassword.trim() };
      const res = await api.tenantPortal.login(tenantId, payload);
      const user = res.data.user;
      localStorage.setItem(`dine_tenant_staff_${tenantSlug}`, JSON.stringify(user));
      localStorage.setItem(`dine_tenant_token_${tenantSlug}`, res.data.token);
      setStaffUser(user);
      showToast?.(`Authenticated as ${user.name}!`, 'success');
    } catch (err) {
      setLoginError(err.message || 'Authentication failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handlePortalRegister = async (e) => {
    if (e) e.preventDefault();
    setLoginError('');
    if (!portalRegName.trim()) {
      setLoginError('Please enter your full name');
      return;
    }
    if (!portalRegEmail.trim()) {
      setLoginError('Please enter your work email address');
      return;
    }
    if (!portalRegPassword.trim()) {
      setLoginError('Please enter an account password');
      return;
    }
    setIsLoggingIn(true);
    try {
      const res = await api.tenantPortal.register(tenantId, {
        name: portalRegName.trim(),
        phone: portalRegPhone.trim(),
        email: portalRegEmail.trim().toLowerCase(),
        role: portalRegType,
        password: portalRegPassword.trim()
      });
      const user = res.data.user;
      if (res.userType === 'customer') {
        localStorage.setItem(`dine_customer_${tenantSlug}`, JSON.stringify(user));
        showToast?.(`Registered customer ${user.name}! Redirecting to Storefront...`, 'success');
        setTimeout(() => {
          window.location.href = `/store/${tenantSlug}`;
        }, 300);
      } else {
        localStorage.setItem(`dine_tenant_staff_${tenantSlug}`, JSON.stringify(user));
        localStorage.setItem(`dine_tenant_token_${tenantSlug}`, res.data.token);
        setStaffUser(user);
        showToast?.(`Account created for ${user.name} (${user.role.toUpperCase()})!`, 'success');
      }
    } catch (err) {
      setLoginError(err.message || 'Registration failed');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleStaffSignOut = () => {
    localStorage.removeItem(`dine_tenant_staff_${tenantSlug}`);
    localStorage.removeItem(`dine_tenant_token_${tenantSlug}`);
    setStaffUser(null);
    setLoginPin('');
    showToast?.('Staff signed out', 'info');
  };

  const handleSaveStaff = async (e) => {
    if (e) e.preventDefault();
    try {
      if (!staffForm.name.trim()) {
        showToast?.('Please enter member full name', 'error');
        return;
      }
      if (!staffForm.email.trim()) {
        showToast?.('Please enter work email address', 'error');
        return;
      }
      if (!staffForm.password.trim()) {
        showToast?.('Please enter an account password', 'error');
        return;
      }
      const payload = {
        name: staffForm.name.trim(),
        email: staffForm.email.trim().toLowerCase(),
        phone: staffForm.phone ? staffForm.phone.trim() : null,
        role: staffForm.role,
        password: staffForm.password.trim(),
        status: staffForm.status
      };
      if (editingStaff) {
        await api.tenantPortal.updateStaff(tenantId, editingStaff.id, payload);
        showToast?.(`Team member ${staffForm.name} updated!`, 'success');
      } else {
        await api.tenantPortal.createStaff(tenantId, payload);
        showToast?.(`New team member ${staffForm.name} added (${staffForm.role.toUpperCase()})!`, 'success');
      }
      setIsStaffModalOpen(false);
      setEditingStaff(null);
      setStaffForm({
        name: '',
        email: '',
        phone: '',
        role: 'staff',
        password: 'password123',
        status: 'active'
      });
      const sRes = await api.tenantPortal.staff(tenantId);
      setStaffList(sRes.data?.all || []);
    } catch (err) {
      showToast?.(err.message, 'error');
    }
  };

  const handleDeleteStaff = async (member) => {
    if (member.isOwner) {
      alert('Platform Owner account cannot be deleted from restaurant staff list.');
      return;
    }
    if (!window.confirm(`Are you sure you want to remove ${member.name} from the restaurant staff list?`)) return;
    try {
      await api.tenantPortal.deleteStaff(tenantId, member.id);
      showToast?.(`Removed ${member.name} from restaurant staff`, 'info');
      const sRes = await api.tenantPortal.staff(tenantId);
      setStaffList(sRes.data?.all || []);
    } catch (err) {
      showToast?.(err.message, 'error');
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [overRes, ordersRes, menuRes, tablesRes] = await Promise.all([
        api.tenantPortal.overview(tenantId),
        api.tenantPortal.orders(tenantId),
        api.tenantPortal.menu(tenantId),
        api.tenantPortal.tables(tenantId)
      ]);

      setOverview(overRes.data);
      setOrders(ordersRes.data);
      setMenuData(menuRes.data);
      setTables(tablesRes.data);

      if (overRes.data?.restaurant) {
        const r = overRes.data.restaurant;
        setSettingsForm({
          name: r.name || '',
          cuisine_type: r.cuisine_type || '',
          primary_color: r.primary_color || '#2A9D9A',
          secondary_color: r.secondary_color || '#263238',
          logo_url: r.logo_url || '',
          banner_url: r.banner_url || '',
          phone: r.phone || '',
          address: r.address || '',
          city: r.city || ''
        });
      }

      // Also fetch staff, customers, reports, and subscription
      try {
        const [custRes, repRes, staffRes, subRes] = await Promise.all([
          api.tenantPortal.customers(tenantId),
          api.tenantPortal.reports(tenantId),
          api.tenantPortal.staff(tenantId),
          api.tenantPortal.subscription(tenantId)
        ]);
        setCustomers(custRes.data || []);
        setReports(repRes.data || null);
        setStaffList(staffRes.data?.all || []);
        setSubscriptionData(subRes.data || null);
      } catch (e) {
        // Fallback
      }
    } catch (err) {
      showToast?.(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tenantId) loadData();
  }, [tenantId]);

  // Periodic poll for orders (every 6 seconds)
  useEffect(() => {
    if (!tenantId) return;
    const interval = setInterval(async () => {
      try {
        const res = await api.tenantPortal.orders(tenantId);
        setOrders(res.data);
        const overRes = await api.tenantPortal.overview(tenantId);
        setOverview(overRes.data);
      } catch (e) {}
    }, 6000);
    return () => clearInterval(interval);
  }, [tenantId]);

  // Order status advancement
  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.tenantPortal.updateOrderStatus(tenantId, orderId, newStatus);
      showToast?.(`Order updated to '${newStatus.toUpperCase()}' in tenant database!`, 'success');
      const res = await api.tenantPortal.orders(tenantId);
      setOrders(res.data);
      const overRes = await api.tenantPortal.overview(tenantId);
      setOverview(overRes.data);
      const repRes = await api.tenantPortal.reports(tenantId);
      setReports(repRes.data);
    } catch (err) {
      showToast?.(err.message, 'error');
    }
  };

  // Add / Edit Item
  const handleSaveItem = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await api.tenantPortal.updateItem(tenantId, editingItem.id, itemForm);
        showToast?.('Menu item updated!');
      } else {
        await api.tenantPortal.createItem(tenantId, itemForm);
        showToast?.('Menu item added!');
      }
      setIsItemModalOpen(false);
      setEditingItem(null);
      const res = await api.tenantPortal.menu(tenantId);
      setMenuData(res.data);
    } catch (err) {
      showToast?.(err.message, 'error');
    }
  };

  const handleToggleStock = async (itemId) => {
    try {
      const res = await api.tenantPortal.toggleItemStock(tenantId, itemId);
      showToast?.(`Item stock status changed to ${res.is_available ? 'In Stock' : 'Sold Out'}`);
      const mRes = await api.tenantPortal.menu(tenantId);
      setMenuData(mRes.data);
    } catch (err) {
      showToast?.(err.message, 'error');
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this menu item from the restaurant database?')) return;
    try {
      await api.tenantPortal.deleteItem(tenantId, itemId);
      showToast?.('Menu item deleted from tenant DB');
      const res = await api.tenantPortal.menu(tenantId);
      setMenuData(res.data);
    } catch (err) {
      showToast?.(err.message, 'error');
    }
  };

  // Add / Delete Category
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      await api.tenantPortal.createCategory(tenantId, catForm);
      showToast?.(`Category "${catForm.name}" created!`, 'success');
      setIsCatModalOpen(false);
      setCatForm({ name: '', description: '', icon: 'ri-restaurant-line' });
      const res = await api.tenantPortal.menu(tenantId);
      setMenuData(res.data);
    } catch (err) {
      showToast?.(err.message, 'error');
    }
  };

  const handleDeleteCategory = async (catId, catName) => {
    if (!window.confirm(`Delete category "${catName}" and its items from this restaurant database?`)) return;
    try {
      await api.tenantPortal.deleteCategory(tenantId, catId);
      showToast?.(`Category "${catName}" deleted!`);
      const res = await api.tenantPortal.menu(tenantId);
      setMenuData(res.data);
      if (selectedMenuCat === catId) setSelectedMenuCat('all');
    } catch (err) {
      showToast?.(err.message, 'error');
    }
  };

  // Change Subscription Plan
  const handleChangePlan = async (planId, planName) => {
    if (!window.confirm(`Switch your restaurant SaaS subscription plan to "${planName}"?`)) return;
    try {
      await api.tenantPortal.changeSubscriptionPlan(tenantId, { plan_id: planId });
      showToast?.(`Subscription plan updated to "${planName}"!`, 'success');
      const subRes = await api.tenantPortal.subscription(tenantId);
      setSubscriptionData(subRes.data);
    } catch (err) {
      showToast?.(err.message, 'error');
    }
  };

  // Add Table
  const handleAddTable = async (e) => {
    e.preventDefault();
    try {
      await api.tenantPortal.createTable(tenantId, tableForm);
      showToast?.(`Table ${tableForm.table_number} added!`);
      setIsTableModalOpen(false);
      setTableForm({ table_number: '', capacity: 4 });
      const tRes = await api.tenantPortal.tables(tenantId);
      setTables(tRes.data);
    } catch (err) {
      showToast?.(err.message, 'error');
    }
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await api.tenantPortal.updateSettings(tenantId, settingsForm);
      showToast?.('Restaurant branding settings saved!', 'success');
      const overRes = await api.tenantPortal.overview(tenantId);
      setOverview(overRes.data);
    } catch (err) {
      showToast?.(err.message, 'error');
    }
  };

  const restaurant = overview?.restaurant || {};
  const metrics = overview?.metrics || {
    totalSales: 0,
    totalOrders: 0,
    pendingOrders: 0,
    preparingOrders: 0,
    readyOrders: 0,
    completedOrders: 0,
    tablesCount: 0,
    menuItemsCount: 0
  };

  // Filtered orders
  const filteredOrders = orders.filter(o => {
    if (orderFilter === 'all') return true;
    if (orderFilter === 'pending') return o.status === 'pending' || o.status === 'new';
    return o.status === orderFilter;
  });

  // Dynamically update browser tab title to restaurant name
  useEffect(() => {
    if (restaurant?.name) {
      document.title = `${restaurant.name} — Restaurant Portal`;
    } else if (tenantSlug) {
      document.title = `${tenantSlug.toUpperCase()} — Restaurant Portal`;
    }
  }, [restaurant?.name, tenantSlug]);

  if (loading && !overview) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: C.pinkLight }}>
        <div style={{ textAlign: 'center' }}>
          <img
            src="/dine/IMG_0162.jpeg"
            alt="DINE Admin"
            style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${C.teal}`, marginBottom: '16px' }}
          />
          <h3 style={{ margin: '0 0 6px 0', color: C.dark, fontWeight: 700 }}>Connecting to Tenant Portal...</h3>
          <p style={{ margin: 0, color: C.slate, fontSize: '13px' }}>Loading restaurant workspace...</p>
        </div>
      </div>
    );
  }

  // ─── UNIFIED SINGLE SIGN IN FORM (When not authenticated) ──────────────────
  if (!staffUser) {
    const ownerInfo = overview?.restaurant?.owner || {
      name: tenantSlug === 'brandobar' ? 'Dezznuts' : (tenantSlug === 'tokyo-ramen' ? 'Kenji Sato' : 'Restaurant Owner'),
      email: tenantSlug === 'brandobar' ? 'dezznuts@gmail.com' : (tenantSlug === 'tokyo-ramen' ? 'kenji@tokyoramen.ph' : `owner@${tenantSlug}.ph`)
    };

    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: C.pinkSoft,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
      }}>
        <div style={{
          width: '100%',
          maxWidth: '480px',
          backgroundColor: '#FFF',
          borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(38, 50, 56, 0.08)',
          border: `1px solid ${C.border}`,
          overflow: 'hidden'
        }}>
          {/* Header banner */}
          <div style={{
            background: `linear-gradient(135deg, ${C.tealDark} 0%, ${C.teal} 100%)`,
            padding: '30px 24px',
            color: '#FFF',
            textAlign: 'center',
            position: 'relative'
          }}>
            <img
              src={restaurant?.logo_url || '/dine/IMG_0162.jpeg'}
              alt={restaurant?.name || 'Restaurant'}
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '3px solid #FFF',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                marginBottom: '10px'
              }}
            />
            <h2 style={{ margin: '0 0 6px 0', fontSize: '22px', fontWeight: 800, letterSpacing: '-0.3px' }}>
              {restaurant?.name || 'Tenant Restaurant'}
            </h2>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 12px', borderRadius: '12px', fontSize: '11px', fontWeight: 700 }}>
              <i className="ri-shield-keyhole-line" />
              <span>SIGN IN TO RESTAURANT</span>
            </div>
          </div>

          <div style={{ padding: '28px' }}>
            {/* Auth Tab Selector */}
            <div style={{
              display: 'flex',
              backgroundColor: C.pinkLight,
              padding: '4px',
              borderRadius: '12px',
              marginBottom: '20px'
            }}>
              <button
                type="button"
                onClick={() => { setPortalAuthTab('signin'); setLoginError(''); }}
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: '9px',
                  border: 'none',
                  backgroundColor: portalAuthTab === 'signin' ? '#FFF' : 'transparent',
                  color: portalAuthTab === 'signin' ? C.tealDark : C.slate,
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: portalAuthTab === 'signin' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <i className="ri-login-box-line" /> Sign In
              </button>
              <button
                type="button"
                onClick={() => { setPortalAuthTab('register'); setLoginError(''); }}
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: '9px',
                  border: 'none',
                  backgroundColor: portalAuthTab === 'register' ? '#FFF' : 'transparent',
                  color: portalAuthTab === 'register' ? C.tealDark : C.slate,
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: portalAuthTab === 'register' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <i className="ri-user-add-line" /> Create Account
              </button>
            </div>

            {loginError && (
              <div style={{
                backgroundColor: '#FEE2E2',
                color: '#991B1B',
                padding: '10px 14px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <i className="ri-error-warning-fill" />
                <span>{loginError}</span>
              </div>
            )}

            {portalAuthTab === 'signin' ? (
              <form onSubmit={handleStaffLogin}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.slate, marginBottom: '6px' }}>
                    WORK EMAIL ADDRESS *
                  </label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    placeholder="e.g. staff@restaurant.com or owner@restaurant.com"
                    required
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: `1.5px solid ${C.border}`,
                      outline: 'none',
                      fontSize: '14px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.slate, marginBottom: '6px' }}>
                    PASSWORD *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      placeholder="Enter your account password"
                      required
                      style={{
                        width: '100%',
                        padding: '12px 42px 12px 14px',
                        borderRadius: '10px',
                        border: `1.5px solid ${C.border}`,
                        outline: 'none',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: showLoginPassword ? C.teal : C.slate,
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '16px'
                      }}
                      title={showLoginPassword ? 'Hide password' : 'Show password'}
                    >
                      <i className={showLoginPassword ? 'ri-eye-off-line' : 'ri-eye-line'} />
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoggingIn || !loginEmail.trim()}
                  style={{
                    width: '100%',
                    padding: '14px',
                    backgroundColor: C.teal,
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: (isLoggingIn || !loginEmail.trim()) ? 'not-allowed' : 'pointer',
                    boxShadow: `0 6px 20px ${C.tealGlow}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {isLoggingIn ? (
                    <>
                      <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <i className="ri-login-box-line" />
                      <span>Sign In</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              /* ─── CREATE ACCOUNT FORM ─── */
              <form onSubmit={handlePortalRegister}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.slate, marginBottom: '6px' }}>
                    I AM REGISTERING AS:
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                    {[
                      { id: 'customer', label: '👤 Diner / Cust' },
                      { id: 'staff', label: '🍳 Kitchen Staff' },
                      { id: 'admin', label: '👑 Admin / Mgr' }
                    ].map(type => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setPortalRegType(type.id)}
                        style={{
                          padding: '8px 4px',
                          borderRadius: '8px',
                          border: portalRegType === type.id ? `1.5px solid ${C.teal}` : `1px solid ${C.border}`,
                          backgroundColor: portalRegType === type.id ? C.tealLight : '#FFF',
                          color: portalRegType === type.id ? C.tealDark : C.dark,
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.slate, marginBottom: '4px' }}>
                    FULL NAME *
                  </label>
                  <input
                    type="text"
                    required
                    value={portalRegName}
                    onChange={e => setPortalRegName(e.target.value)}
                    placeholder="e.g. Maria Santos or Marco Rossi"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.slate, marginBottom: '4px' }}>
                    {portalRegType === 'customer' ? 'MOBILE NUMBER *' : 'EMAIL ADDRESS'}
                  </label>
                  <input
                    type={portalRegType === 'customer' ? 'tel' : 'email'}
                    required={portalRegType === 'customer' || portalRegType === 'admin'}
                    value={portalRegType === 'customer' ? portalRegPhone : portalRegEmail}
                    onChange={e => portalRegType === 'customer' ? setPortalRegPhone(e.target.value) : setPortalRegEmail(e.target.value)}
                    placeholder={portalRegType === 'customer' ? 'e.g. 0917 123 4567' : 'e.g. staff@restaurant.com'}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                {portalRegType === 'staff' && (
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.slate, marginBottom: '4px' }}>
                      4-DIGIT LOGIN PIN *
                    </label>
                    <input
                      type="text"
                      maxLength="6"
                      required
                      value={portalRegPin}
                      onChange={e => setPortalRegPin(e.target.value)}
                      placeholder="e.g. 5678"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1.5px solid ${C.teal}`, fontSize: '14px', fontWeight: 800, letterSpacing: '3px', textAlign: 'center', boxSizing: 'border-box' }}
                    />
                  </div>
                )}

                {portalRegType === 'admin' && (
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.slate, marginBottom: '4px' }}>
                      PASSWORD *
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showPortalRegPassword ? 'text' : 'password'}
                        required
                        value={portalRegPassword}
                        onChange={e => setPortalRegPassword(e.target.value)}
                        placeholder="Enter admin password"
                        style={{ width: '100%', padding: '10px 38px 10px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPortalRegPassword(!showPortalRegPassword)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: showPortalRegPassword ? C.teal : C.slate,
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: '15px'
                        }}
                        title={showPortalRegPassword ? 'Hide password' : 'Show password'}
                      >
                        <i className={showPortalRegPassword ? 'ri-eye-off-line' : 'ri-eye-line'} />
                      </button>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoggingIn || !portalRegName.trim()}
                  style={{
                    width: '100%',
                    padding: '13px',
                    backgroundColor: C.teal,
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: (isLoggingIn || !portalRegName.trim()) ? 'not-allowed' : 'pointer',
                    boxShadow: `0 6px 20px ${C.tealGlow}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {isLoggingIn ? (
                    <>
                      <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <i className="ri-user-add-line" />
                      <span>Create & Enter</span>
                    </>
                  )}
                </button>
              </form>
            )}

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${C.pinkLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
              <a href="/" style={{ color: C.slate, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="ri-arrow-left-line" /> SaaS Home
              </a>
              <a href={`/store/${tenantSlug}`} target="_blank" rel="noreferrer" style={{ color: C.tealDark, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Customer Storefront ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const tabMeta = {
    overview: { title: 'Overview & Performance', subtitle: 'Live sales volume, order metrics, and kitchen throughput' },
    orders: { title: 'Live Kitchen Orders', subtitle: 'Active dine-in and takeout tickets ready for preparation' },
    menu: { title: 'Menu Catalog & Pricing', subtitle: 'Dishes, beverages, categories, and item availability' },
    staff: { title: 'Team & Staff Governance', subtitle: 'Kitchen PIN access, role permissions, and roster' },
    customers: { title: 'Customer CRM & Diners', subtitle: 'Loyalty points, purchase history, and diner records' },
    reports: { title: 'Sales Analytics & Reports', subtitle: 'Revenue breakdowns, popular items, and metrics' },
    tables: { title: 'Tables & QR Codes', subtitle: 'Dine-in tables, seat capacities, and digital ordering codes' },
    subscription: { title: 'Subscription & Billing', subtitle: 'Manage your SaaS plan tier, resource quotas, features & invoice receipts' },
    settings: { title: 'Store Settings & Branding', subtitle: 'Cuisine profiles, brand colors, contact info, and theme' }
  };

  const currentTabMeta = tabMeta[activeTab] || { title: 'Restaurant Portal', subtitle: '' };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', backgroundColor: C.pinkSoft, color: C.dark, fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}>

      {/* ─── TENANT ADMIN SIDEBAR NAVIGATION ────────────────────────────── */}
      <aside style={{
        width: '260px',
        flexShrink: 0,
        backgroundColor: '#FFFFFF',
        borderRight: `1px solid ${C.border}`,
        display: 'flex',
        flexDirection: 'column',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 40,
        boxShadow: '2px 0 16px rgba(0,0,0,0.02)'
      }}>
        {/* Brand Area */}
        <div style={{ padding: '20px 18px 16px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <img
              src={restaurant.logo_url || '/dine/IMG_0162.jpeg'}
              alt={restaurant.name || 'DINE'}
              style={{ width: '44px', height: '44px', borderRadius: '12px', objectFit: 'cover', border: `2px solid ${C.teal}`, boxShadow: `0 2px 8px ${C.tealLight}` }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: C.dark, letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {restaurant.name || 'DINE Kitchen'}
              </h2>
              <span style={{
                display: 'inline-block',
                marginTop: '3px',
                fontSize: '10px',
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: '6px',
                backgroundColor: staffUser?.role === 'admin' ? '#FEF3C7' : C.tealLight,
                color: staffUser?.role === 'admin' ? '#92400E' : C.tealDark,
                border: staffUser?.role === 'admin' ? '1px solid #FDE68A' : 'none'
              }}>
                {staffUser?.role === 'admin' ? '👑 OWNER ADMIN' : '🍳 STAFF PORTAL'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: C.slate, backgroundColor: C.pinkLight, padding: '8px 10px', borderRadius: '8px' }}>
            <i className="ri-store-2-line" style={{ color: C.teal, fontSize: '14px' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: '10px', display: 'block', color: C.slate, fontWeight: 700, textTransform: 'uppercase' }}>Restaurant Mode</span>
              <span style={{ fontWeight: 700, color: C.dark, fontSize: '11px', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {overview?.restaurant?.cuisine_type || 'Active Operations'}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tab Links */}
        <div style={{ flex: 1, padding: '14px 10px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[
            { id: 'overview', label: 'Overview', icon: 'ri-dashboard-line' },
            { id: 'orders', label: 'Live Orders', icon: 'ri-restaurant-2-line', badge: metrics.pendingOrders + metrics.preparingOrders },
            { id: 'menu', label: 'Menu Catalog', icon: 'ri-book-open-line', badge: metrics.menuItemsCount },
            { id: 'staff', label: 'Team & Staff', icon: 'ri-team-line', badge: staffList.length },
            { id: 'customers', label: 'Customers', icon: 'ri-user-star-line', badge: customers.length },
            { id: 'reports', label: 'Reports & Analytics', icon: 'ri-bar-chart-2-line' },
            { id: 'tables', label: 'Tables & QR', icon: 'ri-qr-code-line', badge: tables.length },
            { id: 'subscription', label: 'Subscription & Plan', icon: 'ri-vip-crown-line', tag: subscriptionData?.subscription?.plan_name || 'Active' },
            { id: 'settings', label: 'Store Settings', icon: 'ri-settings-3-line' }
          ].map(tab => {
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: isTabActive ? C.teal : 'transparent',
                  color: isTabActive ? '#FFFFFF' : C.slate,
                  fontWeight: isTabActive ? 800 : 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  boxShadow: isTabActive ? `0 4px 14px ${C.tealGlow}` : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <i className={tab.icon} style={{ fontSize: '16px', color: isTabActive ? '#FFFFFF' : C.tealDark }} />
                  <span>{tab.label}</span>
                </div>
                {tab.tag && !tab.badge && (
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: '6px',
                    fontSize: '10px',
                    fontWeight: 800,
                    backgroundColor: isTabActive ? 'rgba(255,255,255,0.25)' : C.tealLight,
                    color: isTabActive ? '#FFFFFF' : C.tealDark,
                    whiteSpace: 'nowrap'
                  }}>
                    {tab.tag}
                  </span>
                )}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span style={{
                    padding: '2px 7px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 800,
                    backgroundColor: isTabActive ? 'rgba(255,255,255,0.25)' : C.pinkLight,
                    color: isTabActive ? '#FFFFFF' : C.dark
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div style={{ padding: '14px', borderTop: `1px solid ${C.border}`, backgroundColor: '#FAFAFA', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <a
            href={`/store/${tenantSlug}`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px 12px',
              borderRadius: '9px',
              backgroundColor: C.tealLight,
              color: C.tealDark,
              border: `1px solid ${C.teal}`,
              fontSize: '12px',
              fontWeight: 700,
              textDecoration: 'none'
            }}
          >
            <i className="ri-external-link-line" /> Open Web Storefront ↗
          </a>

          {staffUser && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              borderRadius: '8px',
              backgroundColor: staffUser.role === 'admin' ? '#FEF3C7' : C.pinkLight,
              border: staffUser.role === 'admin' ? '1px solid #FDE68A' : `1px solid ${C.border}`
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: staffUser.role === 'admin' ? '#F59E0B' : '#10B981', flexShrink: 0 }} />
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: C.dark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {staffUser.name || 'Staff'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleStaffSignOut}
                title="Sign out of portal"
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '13px', padding: 0 }}
              >
                <i className="ri-logout-box-r-line" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ─── MAIN PORTAL CONTENT WRAPPER ─────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>

        {/* Top Header Bar */}
        <header style={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${C.border}`,
          padding: '14px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: C.dark, letterSpacing: '-0.3px' }}>
              {currentTabMeta.title}
            </h1>
            <p style={{ margin: 0, fontSize: '12.5px', color: C.slate }}>
              {currentTabMeta.subtitle}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: C.slate, backgroundColor: C.pinkLight, padding: '6px 12px', borderRadius: '8px', border: `1px solid ${C.border}` }}>
              <i className="ri-time-line" style={{ color: C.teal }} />
              <strong style={{ color: C.dark }}>{currentTime}</strong>
            </div>
          </div>
        </header>

        {/* Suspension Warning Banner */}
        {restaurant.status === 'suspended' && (
          <div style={{
            backgroundColor: '#FEF2F2',
            borderBottom: '2px solid #EF4444',
            padding: '14px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            boxShadow: '0 4px 12px rgba(239, 68, 68, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#FEE2E2', color: '#DC2626', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                <i className="ri-error-warning-fill" />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#991B1B' }}>
                  ⚠️ Restaurant Storefront Suspended by Superadmin
                </div>
                <div style={{ fontSize: '12.5px', color: '#B91C1C', marginTop: '2px' }}>
                  Reason: <strong>{restaurant.suspended_reason || 'Account under administrative review or past due billing'}</strong>. Customer online ordering is currently blocked.
                </div>
              </div>
            </div>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#991B1B', backgroundColor: '#FEE2E2', padding: '6px 14px', borderRadius: '8px', border: '1px solid #FECACA', whiteSpace: 'nowrap' }}>
              Contact Superadmin to Reactivate
            </span>
          </div>
        )}

        {/* ─── MAIN TAB CONTENT ──────────────────────────────────────────── */}
        <main style={{ flex: 1, padding: '24px 28px 80px', maxWidth: '1440px', width: '100%', boxSizing: 'border-box' }}>

        {/* 1. OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div>
            {/* KPI Metric Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {[
                { title: "Today's Volume", value: `₱${(metrics.totalSales || 0).toFixed(0)}`, icon: 'ri-money-dollar-circle-line', color: C.teal, bg: C.tealLight },
                { title: 'Total Orders', value: metrics.totalOrders || 0, icon: 'ri-file-list-3-line', color: '#6366F1', bg: '#EEF2FF' },
                { title: 'Kitchen Queue', value: metrics.pendingOrders + metrics.preparingOrders, icon: 'ri-fire-line', color: '#F59E0B', bg: '#FEF3C7' },
                { title: 'Ready to Serve', value: metrics.readyOrders || 0, icon: 'ri-notification-3-line', color: '#10B981', bg: '#D1FAE5' },
                { title: 'Active Tables', value: `${tables.length} tables`, icon: 'ri-qr-code-line', color: '#EC4899', bg: '#FCE7F3' }
              ].map(stat => (
                <div key={stat.title} style={{ backgroundColor: '#FFF', borderRadius: '16px', padding: '18px', border: `1px solid ${C.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: C.slate, display: 'block', marginBottom: '4px' }}>{stat.title}</span>
                    <span style={{ fontSize: '24px', fontWeight: 800, color: C.dark }}>{stat.value}</span>
                  </div>
                  <div style={{ width: '46px', height: '46px', borderRadius: '14px', backgroundColor: stat.bg, color: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>
                    <i className={stat.icon} />
                  </div>
                </div>
              ))}
            </div>

            {/* Split Grid: Live Queue & Top Sellers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px' }}>

              {/* Live Kitchen Queue */}
              <div style={{ backgroundColor: '#FFF', borderRadius: '16px', border: `1px solid ${C.border}`, padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <i className="ri-fire-fill" style={{ color: '#F59E0B', fontSize: '18px' }} />
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: C.dark }}>Live Kitchen Queue</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTabChange('orders')}
                    style={{ border: 'none', background: 'none', color: C.tealDark, fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                  >
                    View All Orders ➔
                  </button>
                </div>

                {orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '36px 0', color: C.slate }}>
                    <i className="ri-check-double-line" style={{ fontSize: '36px', color: '#10B981', display: 'block', marginBottom: '8px' }} />
                    <p style={{ margin: 0, fontWeight: 700 }}>Kitchen queue is all caught up!</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled').slice(0, 5).map(o => (
                      <div key={o.id} style={{ padding: '14px', borderRadius: '12px', border: `1px solid ${C.border}`, backgroundColor: C.pinkLight, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 800, color: C.dark }}>Order #{o.order_number}</span>
                            <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '6px', backgroundColor: '#FFF', color: C.tealDark }}>
                              {o.table_number || 'Dine In'}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: C.slate }}>
                            Diner: <strong>{o.customer_name}</strong> • ₱{o.total} • Status: <strong>{o.status.toUpperCase()}</strong>
                          </div>
                        </div>

                        {/* Progression Action */}
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {(o.status === 'pending' || o.status === 'new') && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(o.id, 'confirmed')}
                              style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: C.teal, color: '#FFF', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Confirm ➔
                            </button>
                          )}
                          {o.status === 'confirmed' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(o.id, 'preparing')}
                              style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: '#F59E0B', color: '#FFF', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Start Cooking ➔
                            </button>
                          )}
                          {o.status === 'preparing' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(o.id, 'ready')}
                              style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: '#10B981', color: '#FFF', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Mark Ready ➔
                            </button>
                          )}
                          {o.status === 'ready' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(o.id, 'completed')}
                              style={{ padding: '6px 12px', borderRadius: '8px', backgroundColor: C.dark, color: '#FFF', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                            >
                              Complete ✔
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bestsellers Ranking */}
              <div style={{ backgroundColor: '#FFF', borderRadius: '16px', border: `1px solid ${C.border}`, padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <i className="ri-award-fill" style={{ color: C.teal, fontSize: '18px' }} />
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: C.dark }}>Top Dishes & Drinks</h3>
                </div>

                {(!reports?.topItems || reports.topItems.length === 0) ? (
                  <div style={{ textAlign: 'center', padding: '30px 16px', backgroundColor: C.pinkLight, borderRadius: '12px', border: `1px dashed ${C.borderDark}` }}>
                    <i className="ri-restaurant-line" style={{ fontSize: '28px', color: C.slate, display: 'block', marginBottom: '8px' }} />
                    <div style={{ fontSize: '13px', fontWeight: 700, color: C.dark, marginBottom: '4px' }}>No Sales Recorded Yet</div>
                    <span style={{ fontSize: '12px', color: C.slate, lineHeight: 1.4, display: 'block' }}>
                      Top selling dishes and drinks will automatically populate as customer orders are placed.
                    </span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {reports.topItems.map((item, idx) => (
                      <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '10px', backgroundColor: C.pinkLight }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: idx === 0 ? C.teal : '#FFF', color: idx === 0 ? '#FFF' : C.dark, fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {idx + 1}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: 700, color: C.dark }}>{item.name}</span>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: C.tealDark }}>{item.qty} {item.qty === 1 ? 'order' : 'orders'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. ORDERS MANAGEMENT TAB */}
        {activeTab === 'orders' && (
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {[
                  { id: 'all', label: 'All Orders' },
                  { id: 'pending', label: 'New / Pending' },
                  { id: 'confirmed', label: 'Confirmed' },
                  { id: 'preparing', label: 'Preparing' },
                  { id: 'ready', label: 'Ready' },
                  { id: 'completed', label: 'Completed' }
                ].map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setOrderFilter(f.id)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: orderFilter === f.id ? `1px solid ${C.teal}` : `1px solid ${C.border}`,
                      backgroundColor: orderFilter === f.id ? C.teal : '#FFF',
                      color: orderFilter === f.id ? '#FFF' : C.dark,
                      cursor: 'pointer'
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <span style={{ fontSize: '12px', color: C.slate, fontWeight: 600 }}>
                Showing {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
              </span>
            </div>

            {/* Orders Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '18px' }}>
              {filteredOrders.map(order => (
                <div key={order.id} style={{ backgroundColor: '#FFF', borderRadius: '16px', border: `1px solid ${C.border}`, padding: '18px', boxShadow: '0 4px 16px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: C.dark }}>
                            #{order.order_number}
                          </h4>
                          <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', backgroundColor: C.pinkLight, color: C.tealDark }}>
                            {order.table_number || 'Dine-In'}
                          </span>
                        </div>
                        <span style={{ fontSize: '12px', color: C.slate }}>
                          Diner: <strong>{order.customer_name}</strong> {order.customer_phone ? `(${order.customer_phone})` : ''}
                        </span>
                      </div>

                      <span style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: order.status === 'completed' ? '#D1FAE5' : (order.status === 'ready' ? '#FEF3C7' : C.tealLight),
                        color: order.status === 'completed' ? '#065F46' : (order.status === 'ready' ? '#92400E' : C.tealDark)
                      }}>
                        {order.status}
                      </span>
                    </div>

                    {/* Items List */}
                    <div style={{ backgroundColor: C.pinkSoft, borderRadius: '10px', padding: '10px', marginBottom: '12px', border: `1px solid ${C.border}` }}>
                      {(order.items || []).map((it, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '3px 0' }}>
                          <span><strong>{it.quantity}x</strong> {it.item_name} {it.instructions ? <span style={{ color: C.slate }}>({it.instructions})</span> : ''}</span>
                          <span style={{ fontWeight: 700 }}>₱{(it.subtotal || it.price * it.quantity).toFixed(0)}</span>
                        </div>
                      ))}
                      {order.notes && (
                        <div style={{ fontSize: '11px', color: '#92400E', backgroundColor: '#FEF3C7', padding: '4px 8px', borderRadius: '6px', marginTop: '6px' }}>
                          Note: {order.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer & Actions */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', paddingTop: '8px', borderTop: `1px solid ${C.pinkLight}` }}>
                      <span style={{ fontSize: '12px', color: C.slate }}>Payment: <strong>{order.payment_method}</strong></span>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: C.tealDark }}>₱{order.total}</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(order.id, 'confirmed')}
                        style={{ padding: '6px', borderRadius: '6px', border: 'none', backgroundColor: order.status === 'confirmed' ? C.teal : C.pinkLight, color: order.status === 'confirmed' ? '#FFF' : C.dark, fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(order.id, 'preparing')}
                        style={{ padding: '6px', borderRadius: '6px', border: 'none', backgroundColor: order.status === 'preparing' ? '#F59E0B' : C.pinkLight, color: order.status === 'preparing' ? '#FFF' : C.dark, fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Cooking
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(order.id, 'ready')}
                        style={{ padding: '6px', borderRadius: '6px', border: 'none', backgroundColor: order.status === 'ready' ? '#10B981' : C.pinkLight, color: order.status === 'ready' ? '#FFF' : C.dark, fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Ready
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateStatus(order.id, 'completed')}
                        style={{ padding: '6px', borderRadius: '6px', border: 'none', backgroundColor: order.status === 'completed' ? C.dark : C.pinkLight, color: order.status === 'completed' ? '#FFF' : C.dark, fontSize: '10px', fontWeight: 700, cursor: 'pointer' }}
                      >
                        Complete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. MENU MANAGEMENT TAB */}
        {activeTab === 'menu' && (
          <div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setSelectedMenuCat('all')}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 700,
                    border: selectedMenuCat === 'all' ? `1px solid ${C.teal}` : `1px solid ${C.border}`,
                    backgroundColor: selectedMenuCat === 'all' ? C.teal : '#FFF',
                    color: selectedMenuCat === 'all' ? '#FFF' : C.dark,
                    cursor: 'pointer'
                  }}
                >
                  All Categories ({menuData.categories.length})
                </button>
                {menuData.categories.map(cat => (
                  <div
                    key={cat.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      borderRadius: '8px',
                      overflow: 'hidden',
                      border: selectedMenuCat === cat.id ? `1px solid ${C.teal}` : `1px solid ${C.border}`,
                      backgroundColor: selectedMenuCat === cat.id ? C.teal : '#FFF'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedMenuCat(cat.id)}
                      style={{
                        padding: '7px 12px',
                        border: 'none',
                        background: 'transparent',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: selectedMenuCat === cat.id ? '#FFF' : C.dark,
                        cursor: 'pointer'
                      }}
                    >
                      {cat.name} ({cat.items?.length || 0})
                    </button>
                    <button
                      type="button"
                      title="Delete category"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(cat.id, cat.name);
                      }}
                      style={{
                        padding: '7px 8px 7px 0',
                        border: 'none',
                        background: 'transparent',
                        fontSize: '11px',
                        color: selectedMenuCat === cat.id ? 'rgba(255,255,255,0.7)' : C.slate,
                        cursor: 'pointer'
                      }}
                    >
                      <i className="ri-close-line" />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setCatForm({ name: '', description: '', icon: 'ri-restaurant-line' });
                    setIsCatModalOpen(true);
                  }}
                  style={{ backgroundColor: '#FFF', color: C.dark, border: `1px solid ${C.border}`, padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <i className="ri-folder-add-line" style={{ color: C.teal }} /> + Add Category
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setItemForm({
                      name: '',
                      category_id: menuData.categories[0]?.id || '',
                      price: '',
                      description: '',
                      image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80',
                      preparation_time: 15,
                      badge: '',
                      is_featured: false
                    });
                    setEditingItem(null);
                    setIsItemModalOpen(true);
                  }}
                  style={{ backgroundColor: C.teal, color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <i className="ri-add-line" /> + Add New Item
                </button>
              </div>
            </div>

            {/* Empty State when no categories exist */}
            {menuData.categories.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', backgroundColor: '#FFF', borderRadius: '16px', border: `1px dashed ${C.borderDark}` }}>
                <i className="ri-restaurant-line" style={{ fontSize: '42px', color: C.teal, display: 'block', marginBottom: '12px' }} />
                <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 800, color: C.dark }}>Your Menu Catalog is Empty</h3>
                <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: C.slate, maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto' }}>
                  Start by creating menu categories (e.g., Main Courses, Appetizers, Beverages, Desserts) and then add dishes and drinks.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setCatForm({ name: '', description: '', icon: 'ri-restaurant-line' });
                    setIsCatModalOpen(true);
                  }}
                  style={{ backgroundColor: C.teal, color: '#FFF', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                >
                  <i className="ri-folder-add-line" /> Create First Category
                </button>
              </div>
            ) : (
              /* Menu Items Grid */
              (() => {
                const filteredItems = menuData.categories
                  .flatMap(cat => (cat.items || []).map(item => ({ ...item, categoryName: cat.name })))
                  .filter(item => selectedMenuCat === 'all' || item.category_id === selectedMenuCat);

                if (filteredItems.length === 0) {
                  return (
                    <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: '#FFF', borderRadius: '16px', border: `1px dashed ${C.borderDark}` }}>
                      <i className="ri-cup-line" style={{ fontSize: '36px', color: C.slate, display: 'block', marginBottom: '10px' }} />
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 800, color: C.dark }}>No Items in This Category</h4>
                      <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: C.slate }}>
                        Add dishes, drinks, or combos to populate this section.
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setItemForm({
                            name: '',
                            category_id: selectedMenuCat !== 'all' ? selectedMenuCat : (menuData.categories[0]?.id || ''),
                            price: '',
                            description: '',
                            image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80',
                            preparation_time: 15,
                            badge: '',
                            is_featured: false
                          });
                          setEditingItem(null);
                          setIsItemModalOpen(true);
                        }}
                        style={{ backgroundColor: C.teal, color: '#FFF', border: 'none', padding: '9px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                      >
                        <i className="ri-add-line" /> Add Item to Menu
                      </button>
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
                    {filteredItems.map(item => (
                      <div key={item.id} style={{ backgroundColor: '#FFF', borderRadius: '14px', border: `1px solid ${C.border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 14px rgba(0,0,0,0.02)' }}>
                        <div style={{ position: 'relative', width: '100%', height: '140px', backgroundColor: C.pinkLight }}>
                          <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          <button
                            type="button"
                            onClick={() => handleToggleStock(item.id)}
                            style={{
                              position: 'absolute',
                              top: '10px',
                              right: '10px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 800,
                              border: 'none',
                              cursor: 'pointer',
                              backgroundColor: item.is_available ? '#10B981' : '#EF4444',
                              color: '#FFF'
                            }}
                          >
                            {item.is_available ? 'In Stock' : 'Sold Out'}
                          </button>
                          {item.badge && (
                            <span style={{ position: 'absolute', bottom: '10px', left: '10px', backgroundColor: C.dark, color: '#FFF', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 800 }}>
                              {item.badge}
                            </span>
                          )}
                        </div>

                        <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: 700, color: C.dark }}>{item.name}</h4>
                              <span style={{ fontSize: '15px', fontWeight: 800, color: C.tealDark }}>₱{item.price}</span>
                            </div>
                            <span style={{ fontSize: '11px', color: C.slate }}>{item.categoryName}</span>
                            <p style={{ margin: '6px 0 12px 0', fontSize: '12px', color: C.slate, lineHeight: 1.4 }}>{item.description}</p>
                          </div>

                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: `1px solid ${C.pinkLight}` }}>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingItem(item);
                                setItemForm({
                                  name: item.name,
                                  category_id: item.category_id,
                                  price: item.price,
                                  description: item.description,
                                  image_url: item.image_url,
                                  preparation_time: item.preparation_time,
                                  badge: item.badge || '',
                                  is_featured: !!item.is_featured
                                });
                                setIsItemModalOpen(true);
                              }}
                              style={{ border: 'none', background: 'none', color: C.tealDark, fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                            >
                              <i className="ri-edit-line" /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteItem(item.id)}
                              style={{ border: 'none', background: 'none', color: '#EF4444', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                            >
                              <i className="ri-delete-bin-line" /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()
            )}
          </div>
        )}

        {/* 3.5. TEAM & STAFF MANAGEMENT TAB */}
        {activeTab === 'staff' && (
          <div>
            {/* Header with Add Button */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 800, color: C.dark }}>
                  Restaurant Team & Staff
                </h3>
                <p style={{ margin: 0, fontSize: '13px', color: C.slate }}>
                  Create and manage Admins, Shift Managers, Kitchen Staff (4-Digit PINs), and Cashiers for <strong>{restaurant.name}</strong>.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingStaff(null);
                  setStaffForm({
                    name: '',
                    email: '',
                    phone: '',
                    role: 'staff',
                    auth_method: 'pin',
                    pin: '',
                    password: 'password123',
                    status: 'active'
                  });
                  setIsStaffModalOpen(true);
                }}
                style={{
                  backgroundColor: C.teal,
                  color: '#FFF',
                  border: 'none',
                  padding: '10px 18px',
                  borderRadius: '12px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: `0 4px 14px ${C.tealGlow}`
                }}
              >
                <i className="ri-user-add-line" style={{ fontSize: '16px' }} />
                <span>+ Add Team Member / Admin</span>
              </button>
            </div>

            {/* Quick Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
              <div style={{ backgroundColor: '#FFF', padding: '16px 20px', borderRadius: '16px', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '12px', color: C.slate, fontWeight: 600, display: 'block' }}>Total Staff</span>
                  <span style={{ fontSize: '22px', fontWeight: 800, color: C.dark }}>{staffList.length}</span>
                </div>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: C.tealLight, color: C.tealDark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  <i className="ri-team-line" />
                </div>
              </div>

              <div style={{ backgroundColor: '#FFF', padding: '16px 20px', borderRadius: '16px', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '12px', color: C.slate, fontWeight: 600, display: 'block' }}>Admins & Managers</span>
                  <span style={{ fontSize: '22px', fontWeight: 800, color: '#92400E' }}>
                    {staffList.filter(s => s.role === 'admin' || s.role === 'manager').length}
                  </span>
                </div>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#FEF3C7', color: '#92400E', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  <i className="ri-shield-user-line" />
                </div>
              </div>

              <div style={{ backgroundColor: '#FFF', padding: '16px 20px', borderRadius: '16px', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '12px', color: C.slate, fontWeight: 600, display: 'block' }}>Kitchen & Cashier PINs</span>
                  <span style={{ fontSize: '22px', fontWeight: 800, color: C.tealDark }}>
                    {staffList.filter(s => s.pin || s.role === 'staff' || s.role === 'kitchen' || s.role === 'cashier').length}
                  </span>
                </div>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: C.pinkLight, color: C.dark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  <i className="ri-key-2-line" />
                </div>
              </div>
            </div>

            {/* Staff List Cards & Table */}
            <div style={{ backgroundColor: '#FFF', borderRadius: '16px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
              <div style={{ padding: '18px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: C.dark }}>
                  Staff Directory ({staffList.length} Members)
                </h4>
                <span style={{ fontSize: '12px', color: C.slate }}>
                  Manage staff accounts and POS access PINs
                </span>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ backgroundColor: C.pinkSoft, borderBottom: `1.5px solid ${C.border}`, textAlign: 'left', color: C.slate, fontSize: '12px' }}>
                      <th style={{ padding: '12px 20px' }}>Member Name</th>
                      <th style={{ padding: '12px 16px' }}>Role</th>
                      <th style={{ padding: '12px 16px' }}>Login Credential</th>
                      <th style={{ padding: '12px 16px' }}>Contact</th>
                      <th style={{ padding: '12px 16px' }}>Status</th>
                      <th style={{ padding: '12px 20px', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffList.map((member, idx) => {
                      const isAdmin = member.role === 'admin' || member.role === 'manager';
                      return (
                        <tr key={member.id || idx} style={{ borderBottom: `1px solid ${C.pinkLight}` }}>
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                backgroundColor: isAdmin ? '#FEF3C7' : C.tealLight,
                                color: isAdmin ? '#92400E' : C.tealDark,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '14px'
                              }}>
                                {member.name ? member.name.charAt(0).toUpperCase() : 'S'}
                              </div>
                              <div>
                                <span style={{ fontWeight: 800, color: C.dark, display: 'block' }}>
                                  {member.name}
                                </span>
                                {member.isOwner && (
                                  <span style={{ fontSize: '10px', color: '#92400E', fontWeight: 800, textTransform: 'uppercase' }}>
                                    ★ Platform Owner
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              padding: '3px 10px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              backgroundColor: isAdmin ? '#FEF3C7' : (member.role === 'kitchen' ? '#FFEDD5' : C.tealLight),
                              color: isAdmin ? '#92400E' : (member.role === 'kitchen' ? '#C2410C' : C.tealDark),
                              border: isAdmin ? '1px solid #FDE68A' : 'none'
                            }}>
                              {member.role === 'admin' ? '👑 Admin' : (member.role === 'manager' ? '💼 Manager' : (member.role === 'kitchen' ? '🍳 Kitchen' : (member.role === 'cashier' ? '💳 Cashier' : '🍳 Staff')))}
                            </span>
                          </td>

                          <td style={{ padding: '14px 16px' }}>
                            <span style={{ fontSize: '12px', color: C.dark, fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <i className="ri-mail-line" style={{ color: C.teal }} /> {member.email || '—'}
                            </span>
                          </td>

                          <td style={{ padding: '14px 16px', fontSize: '12px', color: C.slate }}>
                            {member.phone || member.email || '—'}
                          </td>

                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontSize: '12px',
                              fontWeight: 700,
                              color: member.status === 'inactive' ? '#EF4444' : '#10B981'
                            }}>
                              <span style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                backgroundColor: member.status === 'inactive' ? '#EF4444' : '#10B981'
                              }} />
                              {member.status === 'inactive' ? 'Inactive' : 'Active'}
                            </span>
                          </td>

                          <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                            {member.isOwner ? (
                              <span style={{ fontSize: '11px', color: C.slate, fontStyle: 'italic' }}>Platform Owner</span>
                            ) : (
                              <div style={{ display: 'inline-flex', gap: '8px' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingStaff(member);
                                    setStaffForm({
                                      name: member.name || '',
                                      email: member.email || '',
                                      phone: member.phone || '',
                                      role: member.role || 'staff',
                                      password: member.password_hash || 'password123',
                                      status: member.status || 'active'
                                    });
                                    setIsStaffModalOpen(true);
                                  }}
                                  style={{
                                    border: `1px solid ${C.border}`,
                                    backgroundColor: '#FFF',
                                    color: C.tealDark,
                                    padding: '5px 10px',
                                    borderRadius: '8px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  <i className="ri-edit-line" /> Edit
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStaff(member)}
                                  style={{
                                    border: '1px solid #FEE2E2',
                                    backgroundColor: '#FEF2F2',
                                    color: '#EF4444',
                                    padding: '5px 10px',
                                    borderRadius: '8px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  <i className="ri-delete-bin-line" /> Remove
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 4. CUSTOMERS CRM TAB */}
        {activeTab === 'customers' && (
          <div style={{ backgroundColor: '#FFF', borderRadius: '16px', border: `1px solid ${C.border}`, padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 800, color: C.dark }}>Customer Directory</h3>
                <p style={{ margin: 0, fontSize: '13px', color: C.slate }}>Diners and guest loyalty records</p>
              </div>
            </div>

            {customers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '36px 16px', backgroundColor: C.pinkLight, borderRadius: '12px', border: `1px dashed ${C.borderDark}` }}>
                <i className="ri-user-smile-line" style={{ fontSize: '32px', color: C.slate, display: 'block', marginBottom: '8px' }} />
                <div style={{ fontSize: '14px', fontWeight: 700, color: C.dark, marginBottom: '4px' }}>No Diners Recorded Yet</div>
                <span style={{ fontSize: '12px', color: C.slate }}>
                  Customers will automatically appear here as they place orders online or at dine-in tables.
                </span>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: `2px solid ${C.border}`, textAlign: 'left', color: C.slate, fontSize: '12px' }}>
                      <th style={{ padding: '10px' }}>Customer Name</th>
                      <th style={{ padding: '10px' }}>Phone</th>
                      <th style={{ padding: '10px' }}>Total Visits</th>
                      <th style={{ padding: '10px' }}>Total Spent</th>
                      <th style={{ padding: '10px' }}>Last Order</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((cust, i) => (
                      <tr key={i} style={{ borderBottom: `1px solid ${C.pinkLight}` }}>
                        <td style={{ padding: '12px 10px', fontWeight: 700, color: C.dark }}>{cust.name}</td>
                        <td style={{ padding: '12px 10px', color: C.slate }}>{cust.phone || 'N/A'}</td>
                        <td style={{ padding: '12px 10px' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '10px', backgroundColor: C.pinkLight, fontWeight: 700 }}>
                            {cust.total_orders || 1} orders
                          </span>
                        </td>
                        <td style={{ padding: '12px 10px', fontWeight: 800, color: C.tealDark }}>₱{Number(cust.total_spent || 0).toFixed(0)}</td>
                        <td style={{ padding: '12px 10px', color: C.slate }}>{cust.last_order_at ? new Date(cust.last_order_at).toLocaleDateString() : 'Recent'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 5. REPORTS & ANALYTICS TAB */}
        {activeTab === 'reports' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Plan Perk Banner */}
            <div style={{
              padding: '14px 20px',
              borderRadius: '12px',
              backgroundColor: subscriptionData?.subscription?.has_advanced_analytics ? '#F0FDF4' : '#EFF6FF',
              border: `1px solid ${subscriptionData?.subscription?.has_advanced_analytics ? '#BBF7D0' : '#BFDBFE'}`,
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className={subscriptionData?.subscription?.has_advanced_analytics ? "ri-shield-star-fill" : "ri-vip-crown-line"} style={{ color: subscriptionData?.subscription?.has_advanced_analytics ? '#16A34A' : '#2563EB', fontSize: '20px' }} />
                <div>
                  <strong style={{ color: C.dark, fontSize: '13px', display: 'block' }}>
                    {subscriptionData?.subscription?.has_advanced_analytics
                      ? `⭐ Advanced Analytics Active (${subscriptionData?.subscription?.plan_name})`
                      : `Standard Sales Reports (${subscriptionData?.subscription?.plan_name || 'Starter'})`}
                  </strong>
                  <span style={{ fontSize: '12px', color: C.slate }}>
                    {subscriptionData?.subscription?.has_advanced_analytics
                      ? 'Full sales breakdown, payment distributions, and operational analytics enabled.'
                      : 'Upgrade to Growth Bistro or Pro to unlock exportable CSV sales reports and hourly throughput heatmaps.'}
                  </span>
                </div>
              </div>

              {!subscriptionData?.subscription?.has_advanced_analytics && (
                <button
                  type="button"
                  onClick={() => handleTabChange('subscription')}
                  style={{
                    backgroundColor: C.teal,
                    color: '#FFF',
                    border: 'none',
                    padding: '7px 14px',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Upgrade Plan ➔
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {/* Payment Methods Breakdown */}
              <div style={{ backgroundColor: '#FFF', borderRadius: '16px', border: `1px solid ${C.border}`, padding: '20px' }}>
                <h4 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: 800, color: C.dark }}>Payment Method Breakdown</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { method: 'GCash', count: reports?.paymentBreakdown?.GCash ?? 0, color: '#007DFE' },
                    { method: 'Maya', count: reports?.paymentBreakdown?.Maya ?? 0, color: '#00C853' },
                    { method: 'Cash on Dine', count: reports?.paymentBreakdown?.['Cash on Dine'] ?? 0, color: '#F59E0B' }
                  ].map(p => {
                    const totalP = (reports?.paymentBreakdown?.GCash ?? 0) + (reports?.paymentBreakdown?.Maya ?? 0) + (reports?.paymentBreakdown?.['Cash on Dine'] ?? 0) + (reports?.paymentBreakdown?.Other ?? 0);
                    const pct = totalP > 0 ? Math.round((p.count / totalP) * 100) : 0;
                    return (
                      <div key={p.method}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                          <span>{p.method}</span>
                          <span style={{ color: C.slate }}>{p.count} {p.count === 1 ? 'order' : 'orders'} ({pct}%)</span>
                        </div>
                        <div style={{ width: '100%', height: '8px', backgroundColor: C.pinkLight, borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', backgroundColor: p.color, transition: 'width 0.3s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Status Breakdown */}
              <div style={{ backgroundColor: '#FFF', borderRadius: '16px', border: `1px solid ${C.border}`, padding: '20px' }}>
                <h4 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: 800, color: C.dark }}>Order Status Distribution</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { label: 'Pending', count: reports?.statusBreakdown?.pending ?? metrics.pendingOrders ?? 0, color: '#6366F1' },
                    { label: 'Preparing in Kitchen', count: reports?.statusBreakdown?.preparing ?? metrics.preparingOrders ?? 0, color: '#F59E0B' },
                    { label: 'Ready for Serving', count: reports?.statusBreakdown?.ready ?? metrics.readyOrders ?? 0, color: '#10B981' },
                    { label: 'Completed', count: reports?.statusBreakdown?.completed ?? metrics.completedOrders ?? 0, color: C.dark }
                  ].map(s => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: '10px', backgroundColor: C.pinkLight }}>
                      <span style={{ fontSize: '13px', fontWeight: 700, color: C.dark }}>{s.label}</span>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: s.color }}>{s.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. TABLES & QR TAB */}
        {activeTab === 'tables' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 800, color: C.dark }}>Tables & QR Ordering</h3>
                <p style={{ margin: 0, fontSize: '13px', color: C.slate }}>Generate unique QR codes for dine-in tables and quick customer ordering.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsTableModalOpen(true)}
                style={{ backgroundColor: C.teal, color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
              >
                + Add Table
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
              {tables.map(table => (
                <div key={table.id} style={{ backgroundColor: '#FFF', borderRadius: '14px', border: `1px solid ${C.border}`, padding: '16px', textAlign: 'center' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: C.tealLight, color: C.tealDark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 10px' }}>
                    <i className="ri-qr-code-line" />
                  </div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '16px', fontWeight: 800, color: C.dark }}>{table.table_number}</h4>
                  <span style={{ fontSize: '12px', color: C.slate }}>Capacity: {table.capacity} Persons</span>
                  <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: `1px solid ${C.pinkLight}` }}>
                    <button
                      type="button"
                      onClick={() => onOpenStorefront?.(tenantSlug)}
                      style={{ border: 'none', background: 'none', color: C.tealDark, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      Test Table QR URL ➔
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6.5. SUBSCRIPTION & BILLING TAB */}
        {activeTab === 'subscription' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Active Subscription Hero Card */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: `1px solid ${C.border}`,
              padding: '24px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.02)'
            }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '54px',
                    height: '54px',
                    borderRadius: '14px',
                    backgroundColor: C.tealLight,
                    color: C.tealDark,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '26px'
                  }}>
                    <i className="ri-vip-crown-fill" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: C.dark }}>
                        {subscriptionData?.subscription?.plan_name || 'Active SaaS Plan'}
                      </h3>
                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontWeight: 800,
                        backgroundColor: '#DCFCE7',
                        color: '#15803D',
                        textTransform: 'uppercase'
                      }}>
                        {subscriptionData?.subscription?.subscription_status || 'Active'}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '13px', color: C.slate }}>
                      {subscriptionData?.subscription?.plan_description || 'Dedicated Restaurant Multi-Tenant Instance'}
                    </p>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '26px', fontWeight: 800, color: C.tealDark, letterSpacing: '-0.5px' }}>
                    ₱{subscriptionData?.subscription?.price_monthly?.toLocaleString() || '2,999'}
                    <span style={{ fontSize: '13px', fontWeight: 600, color: C.slate }}> / month</span>
                  </div>
                  <span style={{ fontSize: '12px', color: C.slate, display: 'block', marginTop: '2px' }}>
                    Billing Cycle: <strong style={{ color: C.dark, textTransform: 'capitalize' }}>{subscriptionData?.subscription?.billing_cycle || 'monthly'}</strong>
                  </span>
                </div>
              </div>

              {/* Renewal & Auto-Renew Bar */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 18px',
                borderRadius: '12px',
                backgroundColor: C.pinkLight,
                border: `1px solid ${C.border}`
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px' }}>
                  <i className="ri-calendar-check-line" style={{ color: C.teal, fontSize: '18px' }} />
                  <span>
                    Current Period Ends:{' '}
                    <strong style={{ color: C.dark }}>
                      {subscriptionData?.subscription?.current_period_end
                        ? new Date(subscriptionData.subscription.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                        : 'Active Subscription'}
                    </strong>
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: C.slate }}>
                  <i className="ri-checkbox-circle-fill" style={{ color: '#10B981' }} />
                  <span>Auto-renew is <strong>enabled</strong></span>
                </div>
              </div>
            </div>

            {/* Quotas & Resource Usage */}
            <div>
              <h4 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: 800, color: C.dark }}>Resource Usage & Plan Quotas</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                {/* Menu Items */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: `1px solid ${C.border}`, padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: C.slate }}>Menu Products Quota</span>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: C.dark }}>
                      {subscriptionData?.usage?.menuItemsCount ?? 0} / {subscriptionData?.usage?.maxProducts === -1 ? 'Unlimited' : (subscriptionData?.usage?.maxProducts ?? 150)}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: C.pinkLight, borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${subscriptionData?.usage?.maxProducts === -1 ? 15 : Math.min(100, Math.round(((subscriptionData?.usage?.menuItemsCount || 0) / (subscriptionData?.usage?.maxProducts || 150)) * 100))}%`,
                      height: '100%',
                      backgroundColor: C.teal,
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                {/* Staff Accounts */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: `1px solid ${C.border}`, padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: C.slate }}>Staff & Kitchen PINs</span>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: C.dark }}>
                      {subscriptionData?.usage?.staffCount ?? staffList.length} / {subscriptionData?.usage?.maxStaff === -1 ? 'Unlimited' : (subscriptionData?.usage?.maxStaff ?? 6)}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: C.pinkLight, borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(100, Math.round(((subscriptionData?.usage?.staffCount || staffList.length || 1) / (subscriptionData?.usage?.maxStaff || 6)) * 100))}%`,
                      height: '100%',
                      backgroundColor: '#3B82F6',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                {/* Monthly Orders */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: `1px solid ${C.border}`, padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: C.slate }}>Monthly Orders Quota</span>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: C.dark }}>
                      {subscriptionData?.usage?.ordersCount ?? 0} / {subscriptionData?.usage?.maxMonthlyOrders === -1 ? 'Unlimited' : (subscriptionData?.usage?.maxMonthlyOrders ?? 1200)}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: '8px', backgroundColor: C.pinkLight, borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${subscriptionData?.usage?.maxMonthlyOrders === -1 ? 10 : Math.min(100, Math.round(((subscriptionData?.usage?.ordersCount || 0) / (subscriptionData?.usage?.maxMonthlyOrders || 1200)) * 100))}%`,
                      height: '100%',
                      backgroundColor: '#F59E0B',
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>

                {/* Table QR Capacity */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '14px', border: `1px solid ${C.border}`, padding: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: C.slate }}>Tables Registered</span>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: C.dark }}>
                      {tables.length} Tables
                    </span>
                  </div>
                  <span style={{ fontSize: '11px', color: C.slate }}>Unlimited QR generation enabled</span>
                </div>
              </div>
            </div>

            {/* Available SaaS Plans Matrix */}
            <div>
              <div style={{ marginBottom: '14px' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 800, color: C.dark }}>Available SaaS Tiers & Upgrades</h4>
                <p style={{ margin: 0, fontSize: '13px', color: C.slate }}>Switch or upgrade your plan anytime to unlock extra quotas and advanced features.</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                {(subscriptionData?.availablePlans || [
                  { id: 1, name: 'Starter Cafe', code: 'starter', price_monthly: 1499, description: 'For small bistros and pop-ups', max_products: 40, max_staff: 2, max_monthly_orders: 300 },
                  { id: 2, name: 'Growth Bistro', code: 'growth', price_monthly: 2999, description: 'For fast-casual dining restaurants', max_products: 150, max_staff: 6, max_monthly_orders: 1200, is_popular: 1 },
                  { id: 3, name: 'Pro Restaurant', code: 'pro', price_monthly: 5499, description: 'Advanced operations with inventory', max_products: -1, max_staff: 15, max_monthly_orders: -1 },
                  { id: 4, name: 'Enterprise Franchise', code: 'enterprise', price_monthly: 12999, description: 'Multi-branch & dedicated SLA', max_products: -1, max_staff: 50, max_monthly_orders: -1 }
                ]).map(p => {
                  const isCurrent = subscriptionData?.subscription?.plan_id === p.id || (!subscriptionData?.subscription && p.code === 'growth');
                  return (
                    <div
                      key={p.id}
                      style={{
                        backgroundColor: '#FFFFFF',
                        borderRadius: '16px',
                        border: isCurrent ? `2px solid ${C.teal}` : `1px solid ${C.border}`,
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                        boxShadow: isCurrent ? `0 8px 24px ${C.tealLight}` : 'none'
                      }}
                    >
                      {p.is_popular === 1 && (
                        <span style={{
                          position: 'absolute',
                          top: '-10px',
                          right: '16px',
                          backgroundColor: C.teal,
                          color: '#FFFFFF',
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '10px',
                          textTransform: 'uppercase'
                        }}>
                          Most Popular
                        </span>
                      )}

                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 800, color: C.dark }}>{p.name}</h4>
                        <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: C.slate, minHeight: '32px' }}>{p.description}</p>
                        
                        <div style={{ fontSize: '22px', fontWeight: 800, color: C.dark, marginBottom: '14px' }}>
                          ₱{p.price_monthly?.toLocaleString()}
                          <span style={{ fontSize: '12px', fontWeight: 600, color: C.slate }}> / mo</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: C.slate, marginBottom: '18px', paddingTop: '12px', borderTop: `1px solid ${C.pinkLight}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <i className="ri-check-line" style={{ color: C.teal, fontWeight: 800 }} />
                            <span><strong>{p.max_products === -1 ? 'Unlimited' : `${p.max_products}`}</strong> Menu Items</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <i className="ri-check-line" style={{ color: C.teal, fontWeight: 800 }} />
                            <span><strong>{p.max_staff === -1 ? 'Unlimited' : `${p.max_staff}`}</strong> Staff Accounts</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <i className="ri-check-line" style={{ color: C.teal, fontWeight: 800 }} />
                            <span><strong>{p.max_monthly_orders === -1 ? 'Unlimited' : `${p.max_monthly_orders}`}</strong> Monthly Orders</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <i className="ri-check-line" style={{ color: C.teal, fontWeight: 800 }} />
                            <span>Dedicated High-Speed Database</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <i className="ri-check-line" style={{ color: C.teal, fontWeight: 800 }} />
                            <span>Instant QR Ordering</span>
                          </div>
                        </div>
                      </div>

                      {isCurrent ? (
                        <div style={{
                          textAlign: 'center',
                          padding: '10px',
                          borderRadius: '10px',
                          backgroundColor: C.tealLight,
                          color: C.tealDark,
                          fontWeight: 800,
                          fontSize: '13px'
                        }}>
                          ✔ Active Current Plan
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleChangePlan(p.id, p.name)}
                          style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '10px',
                            border: `1px solid ${C.teal}`,
                            backgroundColor: '#FFFFFF',
                            color: C.tealDark,
                            fontWeight: 800,
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.backgroundColor = C.teal;
                            e.currentTarget.style.color = '#FFFFFF';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.backgroundColor = '#FFFFFF';
                            e.currentTarget.style.color = C.tealDark;
                          }}
                        >
                          Switch to {p.name} ➔
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Invoices & Billing History */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: `1px solid ${C.border}`, padding: '20px' }}>
              <h4 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: 800, color: C.dark }}>Billing History & Invoices</h4>
              
              {(!subscriptionData?.invoices || subscriptionData.invoices.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '24px', color: C.slate, fontSize: '13px' }}>
                  No past invoices recorded yet.
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${C.border}`, color: C.slate, fontSize: '11px', textTransform: 'uppercase' }}>
                        <th style={{ padding: '8px 10px' }}>Invoice ID</th>
                        <th style={{ padding: '8px 10px' }}>Billing Period</th>
                        <th style={{ padding: '8px 10px' }}>Amount</th>
                        <th style={{ padding: '8px 10px' }}>Payment Method</th>
                        <th style={{ padding: '8px 10px' }}>Status</th>
                        <th style={{ padding: '8px 10px' }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscriptionData.invoices.map(inv => (
                        <tr key={inv.id} style={{ borderBottom: `1px solid ${C.pinkLight}` }}>
                          <td style={{ padding: '12px 10px', fontWeight: 700, color: C.dark, fontFamily: 'monospace' }}>{inv.invoice_number}</td>
                          <td style={{ padding: '12px 10px', color: C.slate }}>{inv.billing_period}</td>
                          <td style={{ padding: '12px 10px', fontWeight: 800, color: C.tealDark }}>₱{inv.amount?.toLocaleString()}</td>
                          <td style={{ padding: '12px 10px', color: C.slate }}>{inv.payment_method}</td>
                          <td style={{ padding: '12px 10px' }}>
                            <span style={{
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: 800,
                              backgroundColor: inv.status === 'paid' ? '#DCFCE7' : '#FEF3C7',
                              color: inv.status === 'paid' ? '#15803D' : '#92400E',
                              textTransform: 'uppercase'
                            }}>
                              {inv.status}
                            </span>
                          </td>
                          <td style={{ padding: '12px 10px', color: C.slate }}>{inv.paid_at ? new Date(inv.paid_at).toLocaleDateString() : new Date(inv.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 7. SETTINGS & BRANDING TAB */}
        {activeTab === 'settings' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(320px, 380px)', gap: '24px', alignItems: 'start' }}>
            {/* Left: Customization Controls Form */}
            <div style={{ backgroundColor: '#FFF', borderRadius: '16px', border: `1px solid ${C.border}`, padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '14px', borderBottom: `1px solid ${C.pinkLight}` }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: C.tealLight, color: C.tealDark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  <i className="ri-palette-line" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: C.dark }}>Brand Identity & Theme Customization</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: C.slate }}>Customize how your restaurant appears to customers on your storefront</p>
                </div>
              </div>

              <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* 1. COLOR THEME SECTION */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: C.dark, marginBottom: '8px' }}>
                    🎨 Primary Brand Color
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                    <input
                      type="color"
                      value={settingsForm.primary_color || '#2A9D9A'}
                      onChange={e => setSettingsForm({ ...settingsForm, primary_color: e.target.value })}
                      style={{ width: '48px', height: '44px', border: `1px solid ${C.border}`, borderRadius: '8px', cursor: 'pointer', padding: '2px', backgroundColor: '#FFF' }}
                    />
                    <input
                      type="text"
                      value={settingsForm.primary_color || '#2A9D9A'}
                      onChange={e => setSettingsForm({ ...settingsForm, primary_color: e.target.value })}
                      style={{ width: '130px', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', fontWeight: 700, fontFamily: 'monospace' }}
                    />
                    <div style={{ flex: 1, height: '40px', borderRadius: '8px', backgroundColor: settingsForm.primary_color || '#2A9D9A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFF', fontWeight: 800, fontSize: '12px', textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                      Brand Accent
                    </div>
                  </div>

                  {/* Curated Color Presets */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: C.slate, marginRight: '4px' }}>Curated Themes:</span>
                    {[
                      { name: 'Emerald Teal', hex: '#2A9D9A' },
                      { name: 'Spicy Orange', hex: '#F97316' },
                      { name: 'Crimson Bistro', hex: '#E11D48' },
                      { name: 'Espresso Amber', hex: '#D97706' },
                      { name: 'Royal Indigo', hex: '#6366F1' },
                      { name: 'Botanical Green', hex: '#10B981' },
                      { name: 'Minimalist Dark', hex: '#1E293B' }
                    ].map(preset => (
                      <button
                        key={preset.hex}
                        type="button"
                        onClick={() => setSettingsForm({ ...settingsForm, primary_color: preset.hex })}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: settingsForm.primary_color === preset.hex ? `2px solid ${C.dark}` : `1px solid ${C.border}`,
                          backgroundColor: '#FFF',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: preset.hex, display: 'inline-block' }} />
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. LOGO IMAGE & PRESETS */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: C.dark, marginBottom: '6px' }}>
                    🖼️ Restaurant Logo Image
                  </label>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                    <img
                      src={settingsForm.logo_url || '/dine/IMG_0162.jpeg'}
                      alt="Logo preview"
                      style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', border: `2px solid ${settingsForm.primary_color || C.teal}` }}
                    />
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/..."
                      value={settingsForm.logo_url}
                      onChange={e => setSettingsForm({ ...settingsForm, logo_url: e.target.value })}
                      style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Logo Presets */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: C.slate }}>Logo Presets:</span>
                    {[
                      { label: '🍜 Ramen / Asian', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=160&auto=format&fit=crop&q=80' },
                      { label: '☕ Cafe & Bakery', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=160&auto=format&fit=crop&q=80' },
                      { label: '🍔 Gourmet Burger', url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=160&auto=format&fit=crop&q=80' },
                      { label: '🍕 Italian / Pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=160&auto=format&fit=crop&q=80' }
                    ].map(p => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setSettingsForm({ ...settingsForm, logo_url: p.url })}
                        style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '6px', border: `1px solid ${C.border}`, backgroundColor: settingsForm.logo_url === p.url ? C.tealLight : '#FFF', color: C.dark, cursor: 'pointer' }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3. HERO BANNER IMAGE & PRESETS */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: C.dark, marginBottom: '6px' }}>
                    🌄 Storefront Header Banner Image
                  </label>
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/..."
                    value={settingsForm.banner_url}
                    onChange={e => setSettingsForm({ ...settingsForm, banner_url: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box', marginBottom: '8px' }}
                  />

                  {/* Banner Presets */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: C.slate }}>Banner Presets:</span>
                    {[
                      { label: 'Izakaya Interior', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80' },
                      { label: 'Warm Sunlit Cafe', url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&auto=format&fit=crop&q=80' },
                      { label: 'Lively Bistro Dining', url: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=1200&auto=format&fit=crop&q=80' },
                      { label: 'Modern Cocktail Bar', url: 'https://images.unsplash.com/photo-1572116469696-31de0f17cc34?w=1200&auto=format&fit=crop&q=80' }
                    ].map(b => (
                      <button
                        key={b.label}
                        type="button"
                        onClick={() => setSettingsForm({ ...settingsForm, banner_url: b.url })}
                        style={{ padding: '3px 8px', fontSize: '11px', borderRadius: '6px', border: `1px solid ${C.border}`, backgroundColor: settingsForm.banner_url === b.url ? C.tealLight : '#FFF', color: C.dark, cursor: 'pointer' }}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 4. RESTAURANT BASIC DETAILS */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', paddingTop: '10px', borderTop: `1px solid ${C.pinkLight}` }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.slate, marginBottom: '4px' }}>Restaurant Name</label>
                    <input
                      type="text"
                      required
                      value={settingsForm.name}
                      onChange={e => setSettingsForm({ ...settingsForm, name: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.slate, marginBottom: '4px' }}>Cuisine Style</label>
                    <input
                      type="text"
                      placeholder="e.g. Authentic Japanese Ramen"
                      value={settingsForm.cuisine_type}
                      onChange={e => setSettingsForm({ ...settingsForm, cuisine_type: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.slate, marginBottom: '4px' }}>Phone / Mobile</label>
                    <input
                      type="text"
                      value={settingsForm.phone}
                      onChange={e => setSettingsForm({ ...settingsForm, phone: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.slate, marginBottom: '4px' }}>City / Location</label>
                    <input
                      type="text"
                      value={settingsForm.city}
                      onChange={e => setSettingsForm({ ...settingsForm, city: e.target.value })}
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.slate, marginBottom: '4px' }}>Street Address</label>
                  <input
                    type="text"
                    placeholder="e.g. 123 Food Street, Bonifacio Global City"
                    value={settingsForm.address}
                    onChange={e => setSettingsForm({ ...settingsForm, address: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    backgroundColor: settingsForm.primary_color || C.teal,
                    color: '#FFF',
                    border: 'none',
                    padding: '13px 20px',
                    borderRadius: '10px',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
                  }}
                >
                  <i className="ri-save-line" /> Save Theme & Branding
                </button>
              </form>
            </div>

            {/* Right: Live Interactive Storefront Preview Card */}
            <div style={{ position: 'sticky', top: '20px' }}>
              <div style={{
                backgroundColor: '#FFF',
                borderRadius: '16px',
                border: `1px solid ${C.border}`,
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(0,0,0,0.06)'
              }}>
                <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.pinkLight }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#EF4444', display: 'inline-block' }} />
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#F59E0B', display: 'inline-block' }} />
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
                    <span style={{ fontSize: '11px', fontWeight: 800, color: C.slate, marginLeft: '6px' }}>Live Storefront Preview</span>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: C.tealDark, backgroundColor: '#FFF', padding: '2px 8px', borderRadius: '6px' }}>
                    {tenantSlug}.localhost
                  </span>
                </div>

                {/* Simulated Store Banner */}
                <div style={{
                  height: '120px',
                  backgroundColor: settingsForm.primary_color || C.teal,
                  backgroundImage: settingsForm.banner_url ? `url(${settingsForm.banner_url})` : 'none',
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.7))'
                  }} />
                  <div style={{ position: 'absolute', bottom: '-20px', left: '16px', display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
                    <img
                      src={settingsForm.logo_url || '/dine/IMG_0162.jpeg'}
                      alt="Logo"
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '14px',
                        objectFit: 'cover',
                        border: '3px solid #FFF',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                        backgroundColor: '#FFF'
                      }}
                    />
                  </div>
                </div>

                {/* Simulated Store Info */}
                <div style={{ padding: '28px 16px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: C.dark }}>
                        {settingsForm.name || 'Your Restaurant'}
                      </h4>
                      <span style={{ fontSize: '12px', color: C.slate, fontWeight: 600 }}>
                        {settingsForm.cuisine_type || 'Specialty Cuisine'} • {settingsForm.city || 'Metro Manila'}
                      </span>
                    </div>
                    <span style={{
                      padding: '3px 8px',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 800,
                      backgroundColor: settingsForm.primary_color ? `${settingsForm.primary_color}18` : C.tealLight,
                      color: settingsForm.primary_color || C.tealDark
                    }}>
                      OPEN NOW
                    </span>
                  </div>

                  {/* Simulated Category Tabs */}
                  <div style={{ display: 'flex', gap: '6px', margin: '14px 0 16px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {['All Menu', 'Signature Bowls', 'Drinks', 'Desserts'].map((tab, idx) => (
                      <span
                        key={tab}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          backgroundColor: idx === 0 ? (settingsForm.primary_color || C.teal) : C.pinkLight,
                          color: idx === 0 ? '#FFF' : C.dark,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {tab}
                      </span>
                    ))}
                  </div>

                  {/* Simulated Dish Card */}
                  <div style={{
                    padding: '10px',
                    borderRadius: '10px',
                    backgroundColor: C.pinkLight,
                    border: `1px solid ${C.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '14px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: settingsForm.primary_color || C.teal, fontSize: '18px' }}>
                        <i className="ri-restaurant-line" />
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 800, color: C.dark }}>Signature Specialty Dish</div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: settingsForm.primary_color || C.tealDark }}>₱280.00</div>
                      </div>
                    </div>
                    <button
                      type="button"
                      style={{
                        padding: '5px 10px',
                        borderRadius: '6px',
                        border: 'none',
                        backgroundColor: settingsForm.primary_color || C.teal,
                        color: '#FFF',
                        fontSize: '11px',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      + Add
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenStorefront?.(tenantSlug)}
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '10px',
                      border: `1px solid ${C.border}`,
                      backgroundColor: '#FFF',
                      color: C.dark,
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px'
                    }}
                  >
                    Open Live Customer Storefront ↗
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      </div>

      {/* ─── ADD/EDIT ITEM MODAL ─────────────────────────────────────────── */}
      {isItemModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '16px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: C.dark }}>{editingItem ? 'Edit Menu Item' : 'New Dish / Drink'}</h3>
              <button type="button" onClick={() => setIsItemModalOpen(false)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}>
                <i className="ri-close-line" />
              </button>
            </div>

            {menuData.categories.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <p style={{ color: C.slate, fontSize: '13px', marginBottom: '14px' }}>
                  You need to create at least one Category before adding items.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsItemModalOpen(false);
                    setCatForm({ name: '', description: '', icon: 'ri-restaurant-line' });
                    setIsCatModalOpen(true);
                  }}
                  style={{ backgroundColor: C.teal, color: '#FFF', border: 'none', padding: '10px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                >
                  + Create Category First
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveItem} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: C.slate, marginBottom: '4px' }}>Item Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Signature Beef Ramen, Iced Caramel Macchiato"
                    value={itemForm.name}
                    onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: C.slate, marginBottom: '4px' }}>Category *</label>
                    <select
                      value={itemForm.category_id}
                      required
                      onChange={e => setItemForm({ ...itemForm, category_id: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                    >
                      {menuData.categories.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: C.slate, marginBottom: '4px' }}>Price (₱) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      placeholder="0.00"
                      value={itemForm.price}
                      onChange={e => setItemForm({ ...itemForm, price: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: C.slate, marginBottom: '4px' }}>Description</label>
                  <textarea
                    rows="2"
                    placeholder="Describe ingredients, flavor profile, or serving size..."
                    value={itemForm.description}
                    onChange={e => setItemForm({ ...itemForm, description: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: C.slate, marginBottom: '4px' }}>Image URL</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    value={itemForm.image_url}
                    onChange={e => setItemForm({ ...itemForm, image_url: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                  />
                  {/* Preset Image Helpers */}
                  <div style={{ marginTop: '6px', display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '10px', color: C.slate }}>Presets:</span>
                    {[
                      { label: 'Ramen/Noodles', url: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=500&auto=format&fit=crop&q=80' },
                      { label: 'Rice Dish', url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80' },
                      { label: 'Coffee', url: 'https://images.unsplash.com/photo-1517256064527-09c73fc73e38?w=500&auto=format&fit=crop&q=80' },
                      { label: 'Dessert', url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=80' },
                      { label: 'Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&auto=format&fit=crop&q=80' }
                    ].map(preset => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setItemForm({ ...itemForm, image_url: preset.url })}
                        style={{ padding: '2px 6px', fontSize: '10px', borderRadius: '4px', border: `1px solid ${C.border}`, backgroundColor: itemForm.image_url === preset.url ? C.tealLight : '#FFF', color: C.dark, cursor: 'pointer' }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: C.slate, marginBottom: '4px' }}>Badge (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Bestseller, Chef Pick"
                      value={itemForm.badge}
                      onChange={e => setItemForm({ ...itemForm, badge: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: C.slate, marginBottom: '4px' }}>Prep Time (Mins)</label>
                    <input
                      type="number"
                      min="1"
                      value={itemForm.preparation_time}
                      onChange={e => setItemForm({ ...itemForm, preparation_time: e.target.value })}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  style={{ backgroundColor: C.teal, color: '#FFF', border: 'none', padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: 800, cursor: 'pointer', marginTop: '6px' }}
                >
                  {editingItem ? 'Update Menu Item' : 'Create Menu Item'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ─── ADD CATEGORY MODAL ─────────────────────────────────────────── */}
      {isCatModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '16px', width: '100%', maxWidth: '420px', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: C.dark }}>Create Menu Category</h3>
              <button type="button" onClick={() => setIsCatModalOpen(false)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}>
                <i className="ri-close-line" />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: C.slate, marginBottom: '4px' }}>Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Dishes, Hot Coffee, Desserts, Sides"
                  value={catForm.name}
                  onChange={e => setCatForm({ ...catForm, name: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: C.slate, marginBottom: '4px' }}>Short Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Handcrafted specialty beverages"
                  value={catForm.description}
                  onChange={e => setCatForm({ ...catForm, description: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                style={{ backgroundColor: C.teal, color: '#FFF', border: 'none', padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: 800, cursor: 'pointer', marginTop: '6px' }}
              >
                Create Category in DB
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD TABLE MODAL ────────────────────────────────────────────── */}
      {isTableModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '16px', width: '100%', maxWidth: '380px', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: C.dark }}>Add Restaurant Table</h3>
              <button type="button" onClick={() => setIsTableModalOpen(false)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}>
                <i className="ri-close-line" />
              </button>
            </div>

            <form onSubmit={handleAddTable} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: C.slate, marginBottom: '4px' }}>Table Number / Label</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Table 9, Patio 1, VIP 2"
                  value={tableForm.table_number}
                  onChange={e => setTableForm({ ...tableForm, table_number: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: C.slate, marginBottom: '4px' }}>Seating Capacity</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={tableForm.capacity}
                  onChange={e => setTableForm({ ...tableForm, capacity: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                style={{ backgroundColor: C.teal, color: '#FFF', border: 'none', padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: 800, cursor: 'pointer', marginTop: '6px' }}
              >
                Create Table in DB
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD / EDIT STAFF MEMBER MODAL ──────────────────────────────── */}
      {/* ─── ADD / EDIT STAFF MODAL (EMAIL & PASSWORD) ────────────────── */}
      {isStaffModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '20px', width: '100%', maxWidth: '460px', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: C.dark }}>
                  {editingStaff ? `Edit Team Member` : `Add Team Member / Admin`}
                </h3>
                <p style={{ margin: '3px 0 0 0', fontSize: '12px', color: C.slate }}>
                  Create work email and password credentials for team access
                </p>
              </div>
              <button type="button" onClick={() => setIsStaffModalOpen(false)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}>
                <i className="ri-close-line" />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: C.slate, marginBottom: '4px' }}>
                  FULL NAME *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marco Rossi or Chef Emily"
                  value={staffForm.name}
                  onChange={e => setStaffForm({ ...staffForm, name: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: C.slate, marginBottom: '4px' }}>
                  WORK EMAIL ADDRESS *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. kitchen@restaurant.com or manager@restaurant.com"
                  value={staffForm.email}
                  onChange={e => setStaffForm({ ...staffForm, email: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: C.slate, marginBottom: '4px' }}>
                  ACCOUNT PASSWORD *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showStaffFormPassword ? 'text' : 'password'}
                    required
                    placeholder="Set account password"
                    value={staffForm.password}
                    onChange={e => setStaffForm({ ...staffForm, password: e.target.value })}
                    style={{ width: '100%', padding: '10px 38px 10px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowStaffFormPassword(!showStaffFormPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: showStaffFormPassword ? C.teal : C.slate,
                      cursor: 'pointer',
                      padding: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '15px'
                    }}
                    title={showStaffFormPassword ? 'Hide password' : 'Show password'}
                  >
                    <i className={showStaffFormPassword ? 'ri-eye-off-line' : 'ri-eye-line'} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: C.slate, marginBottom: '4px' }}>
                    ASSIGNED ROLE
                  </label>
                  <select
                    value={staffForm.role}
                    onChange={e => setStaffForm({ ...staffForm, role: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                  >
                    <option value="admin">👑 Admin (Full Dashboard)</option>
                    <option value="manager">💼 Shift Manager</option>
                    <option value="kitchen">🍳 Kitchen / Chef</option>
                    <option value="cashier">💳 Cashier / POS</option>
                    <option value="staff">🍽️ Service Crew / Waiter</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: C.slate, marginBottom: '4px' }}>
                    STATUS
                  </label>
                  <select
                    value={staffForm.status}
                    onChange={e => setStaffForm({ ...staffForm, status: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: C.slate, marginBottom: '4px' }}>
                  MOBILE PHONE (OPTIONAL)
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +63 917 123 4567"
                  value={staffForm.phone}
                  onChange={e => setStaffForm({ ...staffForm, phone: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                style={{
                  backgroundColor: C.teal,
                  color: '#FFF',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  marginTop: '6px',
                  boxShadow: `0 4px 14px ${C.tealGlow}`
                }}
              >
                {editingStaff ? 'Update Team Member' : 'Save & Add Team Member'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
