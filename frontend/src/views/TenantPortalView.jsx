import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

// DINE Design Palette & Color Tokens
const C = {
  white: '#FFFFFF',
  pink: '#F6DCE7',
  pinkLight: '#FBEAF0',
  pinkSoft: '#FFF5F8',
  teal: '#2A9D9A',
  tealDark: '#176B68',
  tealLight: '#E6F7F6',
  dark: '#263238',
  slate: '#64748b',
  border: '#F0D4E0',
  grayBorder: '#E2E8F0',
  gold: '#F59E0B'
};

export default function TenantPortalView({
  tenantId,
  tenantSlug,
  onExitPortal,
  onOpenStorefront,
  showToast
}) {
  // Navigation: overview | orders | menu | customers | reports | tables | settings
  const [activeTab, setActiveTab] = useState('overview');

  const [overview, setOverview] = useState(null);
  const [orders, setOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState('all');
  const [menuData, setMenuData] = useState({ categories: [], totalItems: 0 });
  const [customers, setCustomers] = useState([]);
  const [reports, setReports] = useState(null);
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const [settingsForm, setSettingsForm] = useState({
    name: '',
    cuisine_type: '',
    primary_color: '#2A9D9A',
    secondary_color: '#263238',
    logo_url: '',
    banner_url: '',
    phone: '',
    address: '',
    city: ''
  });

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
  const [loginEmail, setLoginEmail] = useState(`staff@${tenantSlug || 'restaurant'}.com`);
  const [loginPassword, setLoginPassword] = useState('staff123');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleStaffLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    try {
      const payload = authMode === 'pin' ? { pin: loginPin } : { email: loginEmail, password: loginPassword };
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

  const handleStaffSignOut = () => {
    localStorage.removeItem(`dine_tenant_staff_${tenantSlug}`);
    localStorage.removeItem(`dine_tenant_token_${tenantSlug}`);
    setStaffUser(null);
    setLoginPin('');
    showToast?.('Staff signed out', 'info');
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

      // Also try fetching customers and reports
      try {
        const [custRes, repRes] = await Promise.all([
          api.tenantPortal.customers(tenantId),
          api.tenantPortal.reports(tenantId)
        ]);
        setCustomers(custRes.data || []);
        setReports(repRes.data || null);
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

  // Reseed DINE catalog
  const handleReseedDine = async () => {
    if (!window.confirm('Reset this restaurant menu & starter orders to the authentic DINE 10-category catalog?')) return;
    try {
      await api.tenantPortal.seedDine(tenantId);
      showToast?.('Seeded authentic DINE catalog into tenant DB!', 'success');
      loadData();
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
          <p style={{ margin: 0, color: C.slate, fontSize: '13px' }}>Loading isolated database {`tenant_${tenantSlug}.db`}...</p>
        </div>
      </div>
    );
  }

  // ─── TENANT STAFF LOGIN FORM (When not authenticated) ───────────────────────
  if (!staffUser) {
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
          maxWidth: '460px',
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
              <span>KITCHEN & STAFF LOGIN</span>
            </div>
            <div style={{ marginTop: '8px', fontSize: '11px', opacity: 0.9, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <i className="ri-database-2-line" />
              <span>Isolated Database: tenant_{tenantSlug}.db</span>
            </div>
          </div>

          <div style={{ padding: '28px' }}>
            {/* Mode Switcher: PIN vs Manager Credentials */}
            <div style={{
              display: 'flex',
              backgroundColor: C.pinkLight,
              padding: '4px',
              borderRadius: '12px',
              marginBottom: '20px'
            }}>
              <button
                type="button"
                onClick={() => { setAuthMode('pin'); setLoginError(''); }}
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: '10px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: authMode === 'pin' ? C.teal : 'transparent',
                  color: authMode === 'pin' ? '#FFF' : C.dark,
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <i className="ri-keypad-line" /> Quick Staff PIN
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('credentials'); setLoginError(''); }}
                style={{
                  flex: 1,
                  padding: '9px',
                  borderRadius: '10px',
                  border: 'none',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  backgroundColor: authMode === 'credentials' ? C.teal : 'transparent',
                  color: authMode === 'credentials' ? '#FFF' : C.dark,
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <i className="ri-mail-lock-line" /> Manager Email
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

            <form onSubmit={handleStaffLogin}>
              {authMode === 'pin' ? (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.slate, marginBottom: '8px', textAlign: 'center' }}>
                    ENTER 4-DIGIT STAFF PIN (DEFAULT: 1234)
                  </label>
                  <input
                    type="password"
                    maxLength={6}
                    value={loginPin}
                    onChange={e => setLoginPin(e.target.value)}
                    placeholder="••••"
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '14px',
                      fontSize: '28px',
                      textAlign: 'center',
                      letterSpacing: '10px',
                      fontWeight: 800,
                      borderRadius: '14px',
                      border: `2px solid ${C.border}`,
                      outline: 'none',
                      color: C.dark,
                      backgroundColor: C.pinkSoft,
                      marginBottom: '14px',
                      boxSizing: 'border-box'
                    }}
                  />

                  {/* Quick Keypad */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '14px' }}>
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(key => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          if (key === 'C') setLoginPin('');
                          else if (key === '⌫') setLoginPin(prev => prev.slice(0, -1));
                          else if (loginPin.length < 6) setLoginPin(prev => prev + key);
                        }}
                        style={{
                          padding: '12px',
                          borderRadius: '10px',
                          border: `1px solid ${C.grayBorder}`,
                          backgroundColor: '#FFF',
                          fontSize: '16px',
                          fontWeight: 700,
                          color: C.dark,
                          cursor: 'pointer',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        {key}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
                    <button
                      type="button"
                      onClick={() => setLoginPin('1234')}
                      style={{
                        backgroundColor: C.pinkLight,
                        color: C.tealDark,
                        border: `1px dashed ${C.teal}`,
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ⚡ One-Click Fill Demo PIN: 1234
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.slate, marginBottom: '6px' }}>
                      MANAGER EMAIL
                    </label>
                    <input
                      type="email"
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      placeholder="staff@restaurant.com"
                      required
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
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.slate, marginBottom: '6px' }}>
                      PASSWORD
                    </label>
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      placeholder="Enter password"
                      required
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
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '18px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginEmail(`staff@${tenantSlug || 'brandobar'}.com`);
                        setLoginPassword('staff123');
                      }}
                      style={{
                        backgroundColor: C.pinkLight,
                        color: C.tealDark,
                        border: `1px dashed ${C.teal}`,
                        padding: '6px 14px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      ⚡ One-Click Fill Demo Credentials
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoggingIn || (authMode === 'pin' && !loginPin)}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: C.teal,
                  color: '#FFF',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: (isLoggingIn || (authMode === 'pin' && !loginPin)) ? 'not-allowed' : 'pointer',
                  opacity: (authMode === 'pin' && !loginPin) ? 0.6 : 1,
                  boxShadow: '0 6px 20px rgba(42,157,154,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                {isLoggingIn ? (
                  <>
                    <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite' }} />
                    <span>Verifying Staff Credentials...</span>
                  </>
                ) : (
                  <>
                    <i className="ri-login-box-line" />
                    <span>Unlock Kitchen & Staff Portal</span>
                  </>
                )}
              </button>
            </form>

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: `1px solid ${C.pinkLight}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px' }}>
              <a href="/" style={{ color: C.slate, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <i className="ri-arrow-left-line" /> SaaS Home
              </a>
              <a href={`/store/${tenantSlug}`} target="_blank" rel="noreferrer" style={{ color: C.tealDark, fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
                View Customer Store ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: C.pinkSoft, color: C.dark, fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}>

      {/* ─── TOP ADMIN NAVBAR ────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${C.border}`,
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
      }}>
        <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>

          {/* Left: Brand & DB Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img
              src={restaurant.logo_url || '/dine/IMG_0162.jpeg'}
              alt={restaurant.name || 'DINE'}
              style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${C.teal}`, boxShadow: '0 2px 8px rgba(42,157,154,0.2)' }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: C.dark, letterSpacing: '-0.3px' }}>
                  {restaurant.name || 'DINE Kitchen'}
                </h2>
                <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '8px', backgroundColor: C.tealLight, color: C.tealDark }}>
                  STAFF PORTAL
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: C.slate, marginTop: '3px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <i className="ri-database-2-fill" style={{ color: C.teal }} />
                  <strong>DB:</strong> {overview?.database?.name || `tenant_${tenantSlug}.db`}
                </span>
                <span>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <i className="ri-time-line" style={{ color: C.teal }} /> {currentTime}
                </span>
                <span>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <i className="ri-links-line" style={{ color: C.teal }} /> {restaurant.subdomain}.localhost:5173
                </span>
              </div>
            </div>
          </div>

          {/* Right: Quick Action Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {/* Authenticated Staff User Pill */}
            {staffUser && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: C.pinkLight,
                border: `1px solid ${C.border}`,
                padding: '6px 12px',
                borderRadius: '10px'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
                <span style={{ fontSize: '12px', fontWeight: 700, color: C.dark }}>
                  {staffUser.name || 'Staff'}
                </span>
                <span style={{ fontSize: '10px', color: C.tealDark, fontWeight: 800, textTransform: 'uppercase', backgroundColor: '#FFF', padding: '1px 6px', borderRadius: '6px' }}>
                  {staffUser.role || 'kitchen'}
                </span>
                <button
                  type="button"
                  onClick={handleStaffSignOut}
                  title="Sign out staff"
                  style={{
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                    color: '#EF4444',
                    fontSize: '14px',
                    marginLeft: '4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <i className="ri-logout-box-r-line" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleReseedDine}
              style={{
                backgroundColor: C.pinkLight,
                color: C.dark,
                border: `1px solid ${C.border}`,
                padding: '7px 12px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              title="Populate authentic DINE menu catalog"
            >
              <i className="ri-magic-line" style={{ color: C.teal }} /> Seed DINE Catalog
            </button>

            <a
              href={`/store/${tenantSlug}`}
              target="_blank"
              rel="noreferrer"
              style={{
                backgroundColor: C.tealLight,
                color: C.tealDark,
                border: `1px solid ${C.teal}`,
                padding: '7px 14px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none'
              }}
            >
              <i className="ri-external-link-line" /> Open Web Storefront ↗
            </a>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '0 24px', display: 'flex', gap: '4px', borderTop: `1px solid ${C.pinkLight}` }}>
          {[
            { id: 'overview', label: 'Overview', icon: 'ri-dashboard-line' },
            { id: 'orders', label: 'Live Orders', icon: 'ri-restaurant-2-line', badge: metrics.pendingOrders + metrics.preparingOrders },
            { id: 'menu', label: 'Menu Catalog', icon: 'ri-book-open-line', badge: metrics.menuItemsCount },
            { id: 'customers', label: 'Customers', icon: 'ri-user-star-line', badge: customers.length },
            { id: 'reports', label: 'Reports & Analytics', icon: 'ri-bar-chart-2-line' },
            { id: 'tables', label: 'Tables & QR', icon: 'ri-qr-code-line', badge: tables.length },
            { id: 'settings', label: 'Store Settings', icon: 'ri-settings-3-line' }
          ].map(tab => {
            const isTabActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: '12px 18px',
                  border: 'none',
                  borderBottom: isTabActive ? `3px solid ${C.teal}` : '3px solid transparent',
                  backgroundColor: 'transparent',
                  color: isTabActive ? C.tealDark : C.slate,
                  fontWeight: isTabActive ? 800 : 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <i className={tab.icon} style={{ fontSize: '15px' }} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span style={{
                    padding: '2px 7px',
                    borderRadius: '10px',
                    fontSize: '11px',
                    fontWeight: 800,
                    backgroundColor: isTabActive ? C.tealLight : C.pinkLight,
                    color: isTabActive ? C.tealDark : C.dark
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      {/* ─── MAIN TAB CONTENT ────────────────────────────────────────────── */}
      <main style={{ maxWidth: '1320px', margin: '0 auto', padding: '24px 24px 80px' }}>

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
                    onClick={() => setActiveTab('orders')}
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

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(reports?.topItems?.length > 0 ? reports.topItems : [
                    { name: 'Cheesy Carbonara', qty: 24 },
                    { name: "Fika's Houseblend", qty: 21 },
                    { name: 'Matcha Oat Latte', qty: 19 },
                    { name: 'Lumpiasilog', qty: 16 },
                    { name: 'Mango Float', qty: 14 }
                  ]).map((item, idx) => (
                    <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: '10px', backgroundColor: C.pinkLight }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: idx === 0 ? C.teal : '#FFF', color: idx === 0 ? '#FFF' : C.dark, fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {idx + 1}
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: C.dark }}>{item.name}</span>
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: C.tealDark }}>{item.qty} orders</span>
                    </div>
                  ))}
                </div>
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
                Showing {filteredOrders.length} orders from {`tenant_${tenantSlug}.db`}
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
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
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
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedMenuCat(cat.id)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: selectedMenuCat === cat.id ? `1px solid ${C.teal}` : `1px solid ${C.border}`,
                      backgroundColor: selectedMenuCat === cat.id ? C.teal : '#FFF',
                      color: selectedMenuCat === cat.id ? '#FFF' : C.dark,
                      cursor: 'pointer'
                    }}
                  >
                    {cat.name} ({cat.items?.length || 0})
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
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
                  <i className="ri-add-line" /> Add New Item
                </button>
              </div>
            </div>

            {/* Menu Items List */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
              {menuData.categories.flatMap(cat => (cat.items || []).map(item => ({ ...item, categoryName: cat.name })))
                .filter(item => selectedMenuCat === 'all' || item.category_id === selectedMenuCat)
                .map(item => (
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
          </div>
        )}

        {/* 4. CUSTOMERS CRM TAB */}
        {activeTab === 'customers' && (
          <div style={{ backgroundColor: '#FFF', borderRadius: '16px', border: `1px solid ${C.border}`, padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: 800, color: C.dark }}>Customer Directory</h3>
                <p style={{ margin: 0, fontSize: '13px', color: C.slate }}>Diners recorded in {`tenant_${tenantSlug}.db`}</p>
              </div>
            </div>

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
                  {(customers.length > 0 ? customers : [
                    { name: 'Alex Santos', phone: '+63 917 555 101', total_orders: 5, total_spent: 1840, last_order_at: 'Just now' },
                    { name: 'Maria Cruz', phone: '+63 918 555 102', total_orders: 3, total_spent: 1250, last_order_at: '2 hours ago' },
                    { name: 'James Reyes', phone: '+63 919 555 103', total_orders: 4, total_spent: 1620, last_order_at: 'Today' },
                    { name: 'Sophie Lim', phone: '+63 920 555 104', total_orders: 2, total_spent: 780, last_order_at: 'Yesterday' }
                  ]).map((cust, i) => (
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
          </div>
        )}

        {/* 5. REPORTS & ANALYTICS TAB */}
        {activeTab === 'reports' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {/* Payment Methods Breakdown */}
              <div style={{ backgroundColor: '#FFF', borderRadius: '16px', border: `1px solid ${C.border}`, padding: '20px' }}>
                <h4 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: 800, color: C.dark }}>Payment Method Breakdown</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { method: 'GCash', count: reports?.paymentBreakdown?.GCash || 4, color: '#007DFE' },
                    { method: 'Maya', count: reports?.paymentBreakdown?.Maya || 2, color: '#00C853' },
                    { method: 'Cash on Dine', count: reports?.paymentBreakdown?.['Cash on Dine'] || 3, color: '#F59E0B' }
                  ].map(p => (
                    <div key={p.method}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                        <span>{p.method}</span>
                        <span>{p.count} orders</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', backgroundColor: C.pinkLight, borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.min(100, p.count * 20)}%`, height: '100%', backgroundColor: p.color }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Status Breakdown */}
              <div style={{ backgroundColor: '#FFF', borderRadius: '16px', border: `1px solid ${C.border}`, padding: '20px' }}>
                <h4 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: 800, color: C.dark }}>Order Status Distribution</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {[
                    { label: 'Pending', count: reports?.statusBreakdown?.pending || metrics.pendingOrders, color: '#6366F1' },
                    { label: 'Preparing in Kitchen', count: reports?.statusBreakdown?.preparing || metrics.preparingOrders, color: '#F59E0B' },
                    { label: 'Ready for Serving', count: reports?.statusBreakdown?.ready || metrics.readyOrders, color: '#10B981' },
                    { label: 'Completed', count: reports?.statusBreakdown?.completed || metrics.completedOrders, color: C.dark }
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
                <p style={{ margin: 0, fontSize: '13px', color: C.slate }}>Each table links directly to your isolated restaurant catalog.</p>
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

        {/* 7. SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div style={{ backgroundColor: '#FFF', borderRadius: '16px', border: `1px solid ${C.border}`, padding: '24px', maxWidth: '680px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '18px', fontWeight: 800, color: C.dark }}>Restaurant Profile & Branding</h3>
            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.slate, marginBottom: '4px' }}>Restaurant Name</label>
                <input
                  type="text"
                  value={settingsForm.name}
                  onChange={e => setSettingsForm({ ...settingsForm, name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.slate, marginBottom: '4px' }}>Cuisine Style</label>
                <input
                  type="text"
                  value={settingsForm.cuisine_type}
                  onChange={e => setSettingsForm({ ...settingsForm, cuisine_type: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
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
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: C.slate, marginBottom: '4px' }}>Logo Image URL</label>
                <input
                  type="text"
                  value={settingsForm.logo_url}
                  onChange={e => setSettingsForm({ ...settingsForm, logo_url: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                style={{ backgroundColor: C.teal, color: '#FFF', border: 'none', padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: 800, cursor: 'pointer', marginTop: '10px' }}
              >
                Save Settings
              </button>
            </form>
          </div>
        )}
      </main>

      {/* ─── ADD/EDIT ITEM MODAL ─────────────────────────────────────────── */}
      {isItemModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div style={{ backgroundColor: '#FFF', borderRadius: '16px', width: '100%', maxWidth: '480px', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: C.dark }}>{editingItem ? 'Edit Item' : 'New Dish / Drink'}</h3>
              <button type="button" onClick={() => setIsItemModalOpen(false)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}>
                <i className="ri-close-line" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: C.slate, marginBottom: '4px' }}>Name</label>
                <input
                  type="text"
                  required
                  value={itemForm.name}
                  onChange={e => setItemForm({ ...itemForm, name: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: C.slate, marginBottom: '4px' }}>Category</label>
                  <select
                    value={itemForm.category_id}
                    onChange={e => setItemForm({ ...itemForm, category_id: e.target.value })}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                  >
                    {menuData.categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: C.slate, marginBottom: '4px' }}>Price (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
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
                  value={itemForm.description}
                  onChange={e => setItemForm({ ...itemForm, description: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: C.slate, marginBottom: '4px' }}>Image URL</label>
                <input
                  type="text"
                  value={itemForm.image_url}
                  onChange={e => setItemForm({ ...itemForm, image_url: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: C.slate, marginBottom: '4px' }}>Badge (Optional, e.g. Bestseller, Popular)</label>
                <input
                  type="text"
                  value={itemForm.badge}
                  onChange={e => setItemForm({ ...itemForm, badge: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <button
                type="submit"
                style={{ backgroundColor: C.teal, color: '#FFF', border: 'none', padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: 800, cursor: 'pointer', marginTop: '6px' }}
              >
                Save Menu Item
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
    </div>
  );
}
