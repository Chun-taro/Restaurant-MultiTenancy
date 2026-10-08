import React, { useState, useEffect } from 'react';
import { api } from '../services/api';

// DINE Color Tokens & Theme Constants
const DINE_THEME = {
  pink: '#F6DCE7',
  pinkLight: '#FBEAF0',
  pinkSoft: '#FFF5F8',
  teal: '#2A9D9A',
  tealDark: '#176B68',
  tealLight: '#E6F7F6',
  dark: '#263238',
  slate: '#64748B',
  border: '#F0D4E0',
  white: '#FFFFFF',
  gold: '#F59E0B'
};

const SUGAR_LEVELS = ['0%', '25%', '50%', '75%', '100%'];

const ADDON_OPTIONS = [
  { id: 'extra_rice', name: 'Extra Garlic Rice', price: 25, type: 'food' },
  { id: 'fried_egg', name: 'Sunny-Side Egg', price: 20, type: 'food' },
  { id: 'extra_cheese', name: 'Melted Cheese Sauce', price: 25, type: 'food' },
  { id: 'extra_shot', name: 'Extra Espresso Shot', price: 30, type: 'drink' },
  { id: 'oat_milk', name: 'Upgrade to Oat Milk', price: 25, type: 'drink' }
];

const ARRIVAL_TIMES = ['ASAP', '15 min', '30 min', '45 min', '1 hour'];

export default function CustomerStorefrontView({
  slug = 'brandobar',
  initialTable = 'Table 1',
  onBackToAdmin,
  showToast
}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeSection, setActiveSection] = useState('all'); // 'all' | 'food' | 'drinks'
  const [searchQuery, setSearchQuery] = useState('');

  // Dining Mode & Arrival Time
  const [diningMode, setDiningMode] = useState('dine_in'); // 'dine_in' | 'takeaway'
  const [selectedTable, setSelectedTable] = useState(initialTable || 'Table 1');
  const [selectedArrival, setSelectedArrival] = useState('ASAP');

  // Product Customizer Modal
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalSize, setModalSize] = useState('Regular');
  const [modalSugar, setModalSugar] = useState('100%');
  const [modalAddons, setModalAddons] = useState([]);
  const [modalNotes, setModalNotes] = useState('');
  const [modalQty, setModalQty] = useState(1);

  // Cart State: Array of cart items
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Customer Checkout Details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('GCash'); // 'GCash' | 'Maya' | 'Cash on Dine'
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Unified Single Sign-In & Registration State
  const [customerUser, setCustomerUser] = useState(() => {
    try {
      const saved = localStorage.getItem(`dine_customer_${slug}`);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState('signin'); // 'signin' | 'register'
  const [authIdentifier, setAuthIdentifier] = useState('0917 555 101');
  const [authPassword, setAuthPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Sync customer details to checkout when customerUser updates
  useEffect(() => {
    if (customerUser) {
      if (customerUser.name && !customerName) setCustomerName(customerUser.name);
      if (customerUser.phone && !customerPhone) setCustomerPhone(customerUser.phone);
    }
  }, [customerUser]);

  const handleRegisterAccount = async (e) => {
    if (e) e.preventDefault();
    setAuthError('');
    if (!regName.trim()) {
      setAuthError('Please enter your full name');
      return;
    }
    if (!regPhone.trim() && !regEmail.trim()) {
      setAuthError('Please enter your mobile phone number or email address');
      return;
    }
    setAuthLoading(true);
    try {
      const res = await api.storefront.register(slug, {
        name: regName.trim(),
        phone: regPhone.trim(),
        email: regEmail.trim(),
        role: 'customer'
      });
      const data = res.data;
      const cust = data.user || data.customer;
      setCustomerUser(cust);
      localStorage.setItem(`dine_customer_${slug}`, JSON.stringify(cust));
      if (cust.name) setCustomerName(cust.name);
      if (cust.phone) setCustomerPhone(cust.phone);
      showToast?.(`Account created! Welcome to ${restaurant?.name || 'our restaurant'}, ${cust.name}! 🎉`, 'success');
      setIsAuthModalOpen(false);
      setRegName('');
      setRegPhone('');
      setRegEmail('');
    } catch (err) {
      setAuthError(err.message || 'Account registration failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleUnifiedLogin = async (e) => {
    if (e) e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    try {
      const res = await api.storefront.customerLogin(slug, {
        identifier: authIdentifier,
        password: authPassword
      });

      const data = res.data;
      const userType = res.userType || data.user?.role;

      // 1. If Admin / Owner or Staff logged in -> Redirect to Tenant Portal!
      if (userType === 'admin' || userType === 'staff' || data.user?.role === 'admin' || data.user?.role === 'staff' || data.user?.role === 'owner') {
        localStorage.setItem(`dine_tenant_staff_${slug}`, JSON.stringify(data.user));
        localStorage.setItem(`dine_tenant_token_${slug}`, data.token);
        showToast?.(`Signed in as ${data.user.name} (${(userType || 'STAFF').toUpperCase()})! Redirecting to Portal...`, 'success');
        setIsAuthModalOpen(false);
        setTimeout(() => {
          window.location.href = `/portal/${slug}`;
        }, 300);
        return;
      }

      // 2. Customer logged in -> Update customer profile & auto-fill checkout
      const cust = data.customer || data.user;
      setCustomerUser(cust);
      localStorage.setItem(`dine_customer_${slug}`, JSON.stringify(cust));
      if (cust.name) setCustomerName(cust.name);
      if (cust.phone) setCustomerPhone(cust.phone);
      if (data.past_orders?.length > 0) {
        setOrderHistory(data.past_orders);
      }
      showToast?.(`Welcome back, ${cust.name}!`, 'success');
      setIsAuthModalOpen(false);
    } catch (err) {
      setAuthError(err.message || 'Sign in failed');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCustomerLogout = () => {
    localStorage.removeItem(`dine_customer_${slug}`);
    setCustomerUser(null);
    showToast?.('Signed out', 'info');
  };

  // Active Live Order Tracking
  const [activeOrder, setActiveOrder] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Load Storefront Data from Tenant's Isolated DB
  const loadStorefront = async () => {
    try {
      setLoading(true);
      const res = await api.storefront.get(slug);
      setData(res.data);
      if (res.data.tables?.length > 0 && !initialTable) {
        setSelectedTable(res.data.tables[0].table_number);
      }
    } catch (err) {
      showToast?.(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStorefront();
  }, [slug]);

  // Real-time Order Tracking Polling
  useEffect(() => {
    if (!activeOrder?.order_number) return;
    const interval = setInterval(async () => {
      try {
        const res = await api.storefront.trackOrder(slug, activeOrder.order_number);
        if (res.data) {
          setActiveOrder(prev => ({ ...prev, ...res.data }));
        }
      } catch (e) {
        // Silently retry
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [activeOrder?.order_number, slug]);

  const restaurant = data?.restaurant;
  const categories = data?.categories || [];

  // Update browser tab title dynamically with restaurant name
  useEffect(() => {
    if (restaurant?.name) {
      document.title = `${restaurant.name} — Online Menu & Ordering`;
    } else if (slug) {
      document.title = `${slug.toUpperCase()} — Online Menu & Ordering`;
    }
  }, [restaurant?.name, slug]);

  // Flatten items for filtering
  const allItems = categories.flatMap(c => (c.items || []).map(it => ({ ...it, categoryName: c.name })));

  // Filter items by section, category, and search query
  const filteredItems = allItems.filter(item => {
    const isDrink = ['Coffee', 'Matcha', 'Hojicha', 'Milk Series', 'Soda Pop'].includes(item.categoryName);
    if (activeSection === 'food' && isDrink) return false;
    if (activeSection === 'drinks' && !isDrink) return false;
    if (activeCategory !== 'All' && item.categoryName !== activeCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = (item.description || '').toLowerCase().includes(q);
      const matchCat = item.categoryName.toLowerCase().includes(q);
      if (!matchName && !matchDesc && !matchCat) return false;
    }
    return true;
  });

  // Calculate Product Modal Price
  const getProductModalPrice = () => {
    if (!selectedProduct) return 0;
    let base = selectedProduct.price;
    if (modalSize === 'Large (16oz)') base += 30;
    const addonsTotal = modalAddons.reduce((sum, addId) => {
      const opt = ADDON_OPTIONS.find(o => o.id === addId);
      return sum + (opt ? opt.price : 0);
    }, 0);
    return (base + addonsTotal) * modalQty;
  };

  // Open Product Customizer Modal
  const openProductModal = (product) => {
    setSelectedProduct(product);
    setModalSize('Regular');
    setModalSugar('100%');
    setModalAddons([]);
    setModalNotes('');
    setModalQty(1);
  };

  // Add Configured Item to Cart
  const handleAddToCart = () => {
    if (!selectedProduct) return;
    const isDrink = ['Coffee', 'Matcha', 'Hojicha', 'Milk Series', 'Soda Pop'].includes(selectedProduct.categoryName);

    const cartItem = {
      cartItemId: `${selectedProduct.id}-${modalSize}-${modalSugar}-${modalAddons.sort().join('-')}-${Date.now()}`,
      id: selectedProduct.id,
      name: selectedProduct.name,
      basePrice: selectedProduct.price,
      price: selectedProduct.price + (modalSize === 'Large (16oz)' ? 30 : 0) + modalAddons.reduce((s, id) => s + (ADDON_OPTIONS.find(o => o.id === id)?.price || 0), 0),
      size: modalSize,
      sugar: isDrink ? modalSugar : null,
      addons: modalAddons.map(id => ADDON_OPTIONS.find(o => o.id === id)?.name).filter(Boolean),
      instructions: modalNotes.trim(),
      quantity: modalQty,
      img: selectedProduct.image_url,
      categoryName: selectedProduct.categoryName
    };

    setCart(prev => [...prev, cartItem]);
    setSelectedProduct(null);
    showToast?.(`Added "${cartItem.name}" to cart`, 'info');
  };

  // Update Cart Item Quantity
  const updateCartItemQty = (cartItemId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.cartItemId === cartItemId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  // Remove Item from Cart
  const removeCartItem = (cartItemId) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  // Cart Calculations
  const cartSubtotal = cart.reduce((sum, it) => sum + (it.price * it.quantity), 0);
  const cartItemCount = cart.reduce((sum, it) => sum + it.quantity, 0);

  // Submit Order to Tenant's Isolated SQLite Database
  const handleCheckout = async () => {
    if (!customerName.trim()) {
      showToast?.('Please enter your name to complete the order', 'warning');
      return;
    }
    if (cart.length === 0) {
      showToast?.('Your cart is empty', 'warning');
      return;
    }

    try {
      setIsPlacingOrder(true);
      const payload = {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        order_type: diningMode,
        table_number: diningMode === 'dine_in' ? selectedTable : 'Takeaway',
        payment_method: paymentMethod.toLowerCase().replace(/\s+/g, '_'),
        notes: `Arrival: ${selectedArrival}. ${cart.map(it => it.instructions ? `[${it.name}: ${it.instructions}]` : '').filter(Boolean).join(' ')}`.trim(),
        items: cart.map(it => ({
          id: it.id,
          quantity: it.quantity,
          instructions: [
            it.size !== 'Regular' ? it.size : '',
            it.sugar ? `${it.sugar} sugar` : '',
            it.addons.length ? it.addons.join(', ') : '',
            it.instructions
          ].filter(Boolean).join(' | ')
        }))
      };

      const res = await api.storefront.placeOrder(slug, payload);
      const createdOrder = res.data;

      // Add arrival metadata for tracking UI
      const enrichedOrder = {
        ...createdOrder,
        arrivalTime: selectedArrival,
        tableNo: diningMode === 'dine_in' ? selectedTable : 'Takeaway',
        placedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setActiveOrder(enrichedOrder);
      setOrderHistory(prev => [enrichedOrder, ...prev]);
      setCart([]);
      setIsCartOpen(false);
      showToast?.(`Order #${createdOrder.order_number} confirmed! Saved into ${createdOrder.database_file || 'tenant DB'}`, 'success');
    } catch (err) {
      showToast?.(err.message || 'Failed to place order', 'error');
    } finally {
      setIsPlacingOrder(false);
    }
  };

  // Map Order Status to 5-Step Stage
  const getTrackingStepIndex = (status) => {
    const s = (status || '').toLowerCase();
    if (s === 'completed') return 5;
    if (s === 'ready') return 4;
    if (s === 'preparing') return 3;
    if (s === 'confirmed') return 2;
    return 1; // 'pending' or 'received' or 'new'
  };

  const TRACKING_STEPS = [
    { label: 'Order Received', icon: 'ri-file-list-3-line', desc: 'Sent to restaurant kitchen' },
    { label: 'Confirmed', icon: 'ri-checkbox-circle-line', desc: 'Accepted by staff' },
    { label: 'Preparing', icon: 'ri-fire-line', desc: 'Chefs crafting your meal' },
    { label: 'Ready for Dine-In', icon: 'ri-notification-3-line', desc: 'Fresh at your table' },
    { label: 'Completed', icon: 'ri-check-double-line', desc: 'Enjoy your meal!' }
  ];

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: DINE_THEME.pinkLight }}>
        <div style={{ textAlign: 'center' }}>
          <img
            src="/dine/IMG_0162.jpeg"
            alt="DINE"
            style={{ width: '88px', height: '88px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${DINE_THEME.teal}`, boxShadow: '0 8px 24px rgba(42,157,154,0.25)', marginBottom: '16px', animation: 'spin 4s linear infinite' }}
          />
          <h3 style={{ margin: '0 0 6px 0', color: DINE_THEME.dark, fontWeight: 700, fontSize: '20px' }}>Loading {restaurant?.name || 'DINE Storefront'}...</h3>
          <p style={{ margin: 0, color: DINE_THEME.slate, fontSize: '13px' }}>Connecting to isolated tenant database ({`tenant_${slug}.db`})...</p>
        </div>
      </div>
    );
  }

  const currentStep = getTrackingStepIndex(activeOrder?.status);

  return (
    <div style={{ minHeight: '100vh', backgroundColor: DINE_THEME.pinkSoft, color: DINE_THEME.dark, fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif" }}>

      {/* ─── TOP WEB APP BAR ────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.94)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${DINE_THEME.border}`,
        boxShadow: '0 4px 20px rgba(38, 50, 56, 0.04)'
      }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>

          {/* Logo & Brand Identity */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ position: 'relative' }}>
              <img
                src={restaurant?.logo_url || '/dine/IMG_0162.jpeg'}
                alt={restaurant?.name || 'DINE'}
                style={{ width: '46px', height: '46px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${DINE_THEME.teal}`, boxShadow: '0 4px 12px rgba(42,157,154,0.18)' }}
              />
              <span style={{ position: 'absolute', bottom: -2, right: -2, width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10B981', border: '2px solid #FFF' }} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: DINE_THEME.dark, letterSpacing: '-0.3px' }}>
                  {restaurant?.name || 'DINE'}
                </h1>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', backgroundColor: DINE_THEME.tealLight, color: DINE_THEME.tealDark }}>
                  Open Now
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: DINE_THEME.slate, marginTop: '2px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <i className="ri-map-pin-line" style={{ color: DINE_THEME.teal }} /> {restaurant?.city || 'Bonifacio Global City'}
                </span>
                <span>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <i className="ri-database-2-line" style={{ color: DINE_THEME.teal }} /> {`tenant_${slug}.db`}
                </span>
              </div>
            </div>
          </div>

          {/* Dining Mode & Table Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ display: 'flex', backgroundColor: DINE_THEME.pinkLight, borderRadius: '12px', padding: '3px', border: `1px solid ${DINE_THEME.border}` }}>
              <button
                type="button"
                onClick={() => setDiningMode('dine_in')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9px',
                  fontSize: '12px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: diningMode === 'dine_in' ? DINE_THEME.teal : 'transparent',
                  color: diningMode === 'dine_in' ? '#FFF' : DINE_THEME.dark,
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <i className="ri-restaurant-line" /> Dine-In
              </button>
              <button
                type="button"
                onClick={() => setDiningMode('takeaway')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9px',
                  fontSize: '12px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: diningMode === 'takeaway' ? DINE_THEME.teal : 'transparent',
                  color: diningMode === 'takeaway' ? '#FFF' : DINE_THEME.dark,
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <i className="ri-takeaway-line" /> Takeout
              </button>
            </div>

            {diningMode === 'dine_in' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#FFF', padding: '5px 12px', borderRadius: '10px', border: `1px solid ${DINE_THEME.border}`, fontSize: '13px', fontWeight: 600 }}>
                <i className="ri-qr-code-line" style={{ color: DINE_THEME.teal }} />
                <span>Table:</span>
                <select
                  value={selectedTable}
                  onChange={e => setSelectedTable(e.target.value)}
                  style={{ border: 'none', outline: 'none', fontWeight: 700, color: DINE_THEME.tealDark, backgroundColor: 'transparent', cursor: 'pointer' }}
                >
                  {(data?.tables?.length > 0 ? data.tables : [{ table_number: 'Table 1' }, { table_number: 'Table 2' }, { table_number: 'Table 3' }, { table_number: 'Table 4' }, { table_number: 'Table 5' }, { table_number: 'Table 6' }, { table_number: 'VIP Table' }]).map(t => (
                    <option key={t.table_number} value={t.table_number}>{t.table_number}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Quick Actions (Admin switcher, Order Tracking Pill, Cart Trigger) */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {activeOrder && (
              <button
                type="button"
                onClick={() => setIsHistoryOpen(true)}
                style={{
                  backgroundColor: '#FEF3C7',
                  color: '#92400E',
                  border: '1px solid #FDE68A',
                  padding: '7px 14px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                <span>Live Order #{activeOrder.order_number}</span>
              </button>
            )}

            {/* Customer / Account Button */}
            {customerUser ? (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                style={{
                  backgroundColor: DINE_THEME.pinkLight,
                  color: DINE_THEME.dark,
                  border: `1px solid ${DINE_THEME.border}`,
                  padding: '7px 14px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
                title="View profile & loyalty stamps"
              >
                <i className="ri-user-smile-line" style={{ color: DINE_THEME.teal, fontSize: '15px' }} />
                <span>{customerUser.name}</span>
                <span style={{
                  fontSize: '10px',
                  backgroundColor: DINE_THEME.teal,
                  color: '#FFF',
                  padding: '2px 6px',
                  borderRadius: '8px',
                  fontWeight: 800
                }}>
                  ⭐ {customerUser.loyalty_points || 0} pts
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                style={{
                  backgroundColor: '#FFF',
                  color: DINE_THEME.tealDark,
                  border: `1.5px solid ${DINE_THEME.teal}`,
                  padding: '7px 14px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 0.2s ease'
                }}
              >
                <i className="ri-user-3-line" style={{ color: DINE_THEME.teal }} />
                <span>Sign In</span>
              </button>
            )}

            {/* Cart Button */}
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              style={{
                backgroundColor: DINE_THEME.teal,
                color: '#FFF',
                border: 'none',
                padding: '8px 18px',
                borderRadius: '12px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(42,157,154,0.3)',
                transition: 'transform 0.15s ease'
              }}
            >
              <i className="ri-shopping-bag-3-fill" style={{ fontSize: '16px' }} />
              <span>Cart</span>
              {cartItemCount > 0 && (
                <span style={{
                  backgroundColor: '#FFF',
                  color: DINE_THEME.tealDark,
                  borderRadius: '10px',
                  padding: '1px 7px',
                  fontSize: '11px',
                  fontWeight: 800
                }}>
                  {cartItemCount} • ₱{cartSubtotal.toFixed(0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ─── HERO & ARRIVAL TIME ANNOUNCEMENT ────────────────────────────── */}
      <div style={{
        background: `linear-gradient(135deg, ${DINE_THEME.pink} 0%, #FFFFFF 100%)`,
        borderBottom: `1px solid ${DINE_THEME.border}`,
        padding: '24px 20px 20px'
      }}>
        <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: '#FFF', padding: '4px 12px', borderRadius: '20px', border: `1px solid ${DINE_THEME.border}`, fontSize: '11px', fontWeight: 700, color: DINE_THEME.tealDark, marginBottom: '8px' }}>
                <i className="ri-sparkling-fill" style={{ color: DINE_THEME.teal }} />
                <span>AUTHENTIC DINE WEB ORDERING</span>
              </div>
              <h2 style={{ margin: '0 0 6px 0', fontSize: '26px', fontWeight: 800, color: DINE_THEME.dark, letterSpacing: '-0.5px' }}>
                Crave It? Tap, Customize & Dine.
              </h2>
              <p style={{ margin: 0, fontSize: '14px', color: DINE_THEME.slate, maxWidth: '580px' }}>
                Handcrafted Rice Meals, Pasta, Fresh Noodles, Specialty Coffee & Matcha brewed fresh. Direct isolated database dispatch.
              </p>
            </div>

            {/* Arrival Time Selector Pills */}
            <div style={{ backgroundColor: '#FFF', padding: '12px 16px', borderRadius: '16px', border: `1px solid ${DINE_THEME.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 700, color: DINE_THEME.dark, marginBottom: '8px' }}>
                <i className="ri-time-line" style={{ color: DINE_THEME.teal }} />
                <span>Estimated Arrival / Dine-In Time:</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {ARRIVAL_TIMES.map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedArrival(t)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: selectedArrival === t ? `1px solid ${DINE_THEME.teal}` : `1px solid ${DINE_THEME.border}`,
                      backgroundColor: selectedArrival === t ? DINE_THEME.tealLight : '#FFF',
                      color: selectedArrival === t ? DINE_THEME.tealDark : DINE_THEME.slate,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── LIVE ORDER TRACKER BANNER (If Active Order) ───────────────── */}
      {activeOrder && (
        <div style={{
          backgroundColor: '#FFF',
          borderBottom: `2px solid ${DINE_THEME.teal}`,
          padding: '16px 20px',
          boxShadow: '0 4px 20px rgba(42,157,154,0.08)'
        }}>
          <div style={{ maxWidth: '1240px', margin: '0 auto' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: DINE_THEME.tealLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: DINE_THEME.tealDark, fontSize: '20px' }}>
                  <i className={TRACKING_STEPS[currentStep - 1]?.icon || 'ri-file-list-3-line'} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: DINE_THEME.dark }}>
                      Order #{activeOrder.order_number}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', padding: '2px 8px', borderRadius: '6px', backgroundColor: currentStep === 5 ? '#D1FAE5' : DINE_THEME.tealLight, color: currentStep === 5 ? '#065F46' : DINE_THEME.tealDark }}>
                      {activeOrder.status}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '12px', color: DINE_THEME.slate }}>
                    {TRACKING_STEPS[currentStep - 1]?.desc} • Assigned to {activeOrder.table_number || activeOrder.tableNo || selectedTable} • Estimated: {activeOrder.arrivalTime || selectedArrival}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsHistoryOpen(true)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '8px',
                    backgroundColor: DINE_THEME.pinkLight,
                    color: DINE_THEME.dark,
                    border: `1px solid ${DINE_THEME.border}`,
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  View Details & Receipt
                </button>
              </div>
            </div>

            {/* Stepper Progress Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
              <div style={{ position: 'absolute', top: '16px', left: '20px', right: '20px', height: '3px', backgroundColor: '#E2E8F0', zIndex: 1 }} />
              <div style={{
                position: 'absolute',
                top: '16px',
                left: '20px',
                width: `${Math.min(100, ((currentStep - 1) / 4) * 100)}%`,
                height: '3px',
                backgroundColor: DINE_THEME.teal,
                zIndex: 2,
                transition: 'width 0.4s ease'
              }} />

              {TRACKING_STEPS.map((step, idx) => {
                const stepNum = idx + 1;
                const isPassed = stepNum <= currentStep;
                const isCurrent = stepNum === currentStep;

                return (
                  <div key={step.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 3, textAlign: 'center' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: isPassed ? DINE_THEME.teal : '#FFF',
                      border: `2px solid ${isPassed ? DINE_THEME.teal : '#CBD5E1'}`,
                      color: isPassed ? '#FFF' : DINE_THEME.slate,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      boxShadow: isCurrent ? '0 0 0 4px rgba(42,157,154,0.2)' : 'none',
                      transition: 'all 0.2s ease'
                    }}>
                      <i className={step.icon} />
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: isCurrent ? 800 : 600, color: isCurrent ? DINE_THEME.tealDark : (isPassed ? DINE_THEME.dark : DINE_THEME.slate), marginTop: '6px' }}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ─── MAIN CONTENT CONTAINER ────────────────────────────────────── */}
      <main style={{ maxWidth: '1240px', margin: '0 auto', padding: '24px 20px 80px' }}>

        {/* Section Filters, Category Navigation & Live Search Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginBottom: '20px' }}>

          {/* Quick Food vs Drinks Toggle */}
          <div style={{ display: 'flex', backgroundColor: '#FFF', padding: '4px', borderRadius: '12px', border: `1px solid ${DINE_THEME.border}` }}>
            <button
              type="button"
              onClick={() => { setActiveSection('all'); setActiveCategory('All'); }}
              style={{
                padding: '7px 16px',
                borderRadius: '9px',
                fontSize: '13px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeSection === 'all' ? DINE_THEME.teal : 'transparent',
                color: activeSection === 'all' ? '#FFF' : DINE_THEME.dark
              }}
            >
              All Menu
            </button>
            <button
              type="button"
              onClick={() => { setActiveSection('food'); setActiveCategory('All'); }}
              style={{
                padding: '7px 16px',
                borderRadius: '9px',
                fontSize: '13px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeSection === 'food' ? DINE_THEME.teal : 'transparent',
                color: activeSection === 'food' ? '#FFF' : DINE_THEME.dark
              }}
            >
              🍳 Meals & Snacks
            </button>
            <button
              type="button"
              onClick={() => { setActiveSection('drinks'); setActiveCategory('All'); }}
              style={{
                padding: '7px 16px',
                borderRadius: '9px',
                fontSize: '13px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: activeSection === 'drinks' ? DINE_THEME.teal : 'transparent',
                color: activeSection === 'drinks' ? '#FFF' : DINE_THEME.dark
              }}
            >
              ☕ Coffee & Drinks
            </button>
          </div>

          {/* Search Box */}
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#FFF', borderRadius: '12px', border: `1px solid ${DINE_THEME.border}`, padding: '7px 14px', width: '320px', maxWidth: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <i className="ri-search-line" style={{ color: DINE_THEME.slate, marginRight: '8px', fontSize: '16px' }} />
            <input
              type="text"
              placeholder="Search carbonara, matcha, latte, sisig..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px', color: DINE_THEME.dark, backgroundColor: 'transparent' }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: DINE_THEME.slate, padding: 0 }}
              >
                <i className="ri-close-circle-fill" />
              </button>
            )}
          </div>
        </div>

        {/* 10 Category Pills Carousel */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          marginBottom: '24px',
          scrollbarWidth: 'none'
        }}>
          {['All', ...categories.map(c => c.name)].map(catName => {
            const isCatActive = activeCategory === catName;
            return (
              <button
                key={catName}
                type="button"
                onClick={() => setActiveCategory(catName)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '24px',
                  fontSize: '13px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border: isCatActive ? `1px solid ${DINE_THEME.teal}` : `1px solid ${DINE_THEME.border}`,
                  backgroundColor: isCatActive ? DINE_THEME.teal : '#FFF',
                  color: isCatActive ? '#FFF' : DINE_THEME.dark,
                  boxShadow: isCatActive ? '0 4px 12px rgba(42,157,154,0.25)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {catName}
              </button>
            );
          })}
        </div>

        {/* ─── RESPONSIVE MENU CARDS GRID ─────────────────────────────────── */}
        {filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#FFF', borderRadius: '16px', border: `1px solid ${DINE_THEME.border}` }}>
            <i className="ri-search-2-line" style={{ fontSize: '42px', color: DINE_THEME.slate, display: 'block', marginBottom: '10px' }} />
            <h4 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 700, color: DINE_THEME.dark }}>No dishes found</h4>
            <p style={{ margin: 0, color: DINE_THEME.slate, fontSize: '14px' }}>Try searching for a different item or switch category filters.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
            gap: '20px'
          }}>
            {filteredItems.map(item => (
              <div
                key={item.id}
                style={{
                  backgroundColor: '#FFF',
                  borderRadius: '16px',
                  border: `1px solid ${DINE_THEME.border}`,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 4px 16px rgba(38, 50, 56, 0.04)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  cursor: 'pointer'
                }}
                onClick={() => openProductModal(item)}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px)';
                  e.currentTarget.style.boxShadow = '0 12px 28px rgba(42, 157, 154, 0.12)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 16px rgba(38, 50, 56, 0.04)';
                }}
              >
                {/* Food Photo Container */}
                <div style={{ position: 'relative', width: '100%', height: '175px', backgroundColor: DINE_THEME.pinkLight }}>
                  <img
                    src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80'}
                    alt={item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                  />
                  {item.badge && (
                    <span style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      backgroundColor: item.badge === 'Bestseller' ? DINE_THEME.teal : '#E11D48',
                      color: '#FFF',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '8px',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}>
                      {item.badge}
                    </span>
                  )}
                  <span style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    backgroundColor: 'rgba(38, 50, 56, 0.85)',
                    backdropFilter: 'blur(4px)',
                    color: '#FFF',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '6px'
                  }}>
                    {item.categoryName}
                  </span>
                </div>

                {/* Card Details */}
                <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 700, color: DINE_THEME.dark, lineHeight: 1.3 }}>
                      {item.name}
                    </h3>
                    <p style={{
                      margin: '0 0 14px 0',
                      fontSize: '12px',
                      color: DINE_THEME.slate,
                      lineHeight: 1.45,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {item.description || 'Prepared fresh with high quality ingredients.'}
                    </p>
                  </div>

                  {/* Price & Action */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '10px', borderTop: `1px solid ${DINE_THEME.pinkLight}` }}>
                    <div>
                      <span style={{ fontSize: '11px', color: DINE_THEME.slate, display: 'block', fontWeight: 600 }}>Price</span>
                      <span style={{ fontSize: '18px', fontWeight: 800, color: DINE_THEME.dark }}>
                        ₱{item.price.toFixed(0)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openProductModal(item);
                      }}
                      style={{
                        backgroundColor: DINE_THEME.tealLight,
                        color: DINE_THEME.tealDark,
                        border: `1px solid ${DINE_THEME.teal}`,
                        padding: '6px 14px',
                        borderRadius: '10px',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <i className="ri-add-line" style={{ fontWeight: 800 }} /> Customize
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* ─── PRODUCT CUSTOMIZER MODAL ────────────────────────────────────── */}
      {selectedProduct && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#FFF',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '520px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 24px 60px rgba(0,0,0,0.25)',
            display: 'flex',
            flexDirection: 'column'
          }}>
            {/* Modal Image Header */}
            <div style={{ position: 'relative', width: '100%', height: '220px', backgroundColor: DINE_THEME.pinkLight }}>
              <img
                src={selectedProduct.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80'}
                alt={selectedProduct.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                style={{
                  position: 'absolute',
                  top: '14px',
                  right: '14px',
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  color: DINE_THEME.dark,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
              >
                <i className="ri-close-line" />
              </button>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <div>
                  <h3 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 800, color: DINE_THEME.dark }}>
                    {selectedProduct.name}
                  </h3>
                  <span style={{ fontSize: '12px', fontWeight: 700, color: DINE_THEME.tealDark, backgroundColor: DINE_THEME.tealLight, padding: '2px 8px', borderRadius: '6px' }}>
                    {selectedProduct.categoryName}
                  </span>
                </div>
                <span style={{ fontSize: '20px', fontWeight: 800, color: DINE_THEME.tealDark }}>
                  ₱{selectedProduct.price}
                </span>
              </div>

              <p style={{ margin: '0 0 18px 0', fontSize: '13px', color: DINE_THEME.slate, lineHeight: 1.45 }}>
                {selectedProduct.description}
              </p>

              {/* Size Options */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: DINE_THEME.dark, marginBottom: '8px' }}>
                  Select Size
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {['Regular', 'Large (16oz)'].map(sz => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setModalSize(sz)}
                      style={{
                        padding: '10px',
                        borderRadius: '12px',
                        border: modalSize === sz ? `2px solid ${DINE_THEME.teal}` : `1px solid ${DINE_THEME.border}`,
                        backgroundColor: modalSize === sz ? DINE_THEME.tealLight : '#FFF',
                        color: modalSize === sz ? DINE_THEME.tealDark : DINE_THEME.dark,
                        fontWeight: 700,
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                    >
                      <span>{sz}</span>
                      <span>{sz === 'Regular' ? 'Base' : '+₱30'}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sugar Level (for Drinks) */}
              {['Coffee', 'Matcha', 'Hojicha', 'Milk Series', 'Soda Pop'].includes(selectedProduct.categoryName) && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: DINE_THEME.dark, marginBottom: '8px' }}>
                    Sweetness / Sugar Level
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {SUGAR_LEVELS.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setModalSugar(s)}
                        style={{
                          flex: 1,
                          padding: '8px 4px',
                          borderRadius: '8px',
                          border: modalSugar === s ? `2px solid ${DINE_THEME.teal}` : `1px solid ${DINE_THEME.border}`,
                          backgroundColor: modalSugar === s ? DINE_THEME.tealLight : '#FFF',
                          color: modalSugar === s ? DINE_THEME.tealDark : DINE_THEME.dark,
                          fontWeight: 700,
                          fontSize: '12px',
                          cursor: 'pointer',
                          textAlign: 'center'
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Add-on Choices */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: DINE_THEME.dark, marginBottom: '8px' }}>
                  Customize & Add-ons
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {ADDON_OPTIONS.map(addon => {
                    const isChecked = modalAddons.includes(addon.id);
                    return (
                      <label
                        key={addon.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          backgroundColor: isChecked ? DINE_THEME.pinkLight : '#F8FAFC',
                          border: `1px solid ${isChecked ? DINE_THEME.teal : DINE_THEME.border}`,
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setModalAddons(prev => isChecked ? prev.filter(x => x !== addon.id) : [...prev, addon.id]);
                            }}
                            style={{ accentColor: DINE_THEME.teal, cursor: 'pointer' }}
                          />
                          <span style={{ fontSize: '13px', fontWeight: 600, color: DINE_THEME.dark }}>
                            {addon.name}
                          </span>
                        </div>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: DINE_THEME.tealDark }}>
                          +₱{addon.price}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Special Instructions Note */}
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 700, color: DINE_THEME.dark, marginBottom: '6px' }}>
                  Kitchen Notes / Dietary Requests
                </label>
                <input
                  type="text"
                  placeholder="e.g. less sauce, no spicy, sauce on the side..."
                  value={modalNotes}
                  onChange={e => setModalNotes(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    border: `1px solid ${DINE_THEME.border}`,
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Quantity Stepper & Add to Order Bar */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingTop: '12px', borderTop: `1px solid ${DINE_THEME.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', backgroundColor: DINE_THEME.pinkLight, borderRadius: '12px', border: `1px solid ${DINE_THEME.border}` }}>
                  <button
                    type="button"
                    onClick={() => setModalQty(q => Math.max(1, q - 1))}
                    style={{ width: '36px', height: '36px', border: 'none', background: 'none', fontSize: '18px', fontWeight: 800, color: DINE_THEME.dark, cursor: 'pointer' }}
                  >
                    -
                  </button>
                  <span style={{ width: '32px', textAlign: 'center', fontSize: '15px', fontWeight: 800 }}>
                    {modalQty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setModalQty(q => q + 1)}
                    style={{ width: '36px', height: '36px', border: 'none', background: 'none', fontSize: '18px', fontWeight: 800, color: DINE_THEME.dark, cursor: 'pointer' }}
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  style={{
                    flex: 1,
                    backgroundColor: DINE_THEME.teal,
                    color: '#FFF',
                    border: 'none',
                    padding: '12px 20px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: '0 6px 16px rgba(42,157,154,0.35)'
                  }}
                >
                  <span>Add to Order</span>
                  <span>₱{getProductModalPrice().toFixed(0)}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── CART & CHECKOUT DRAWER ───────────────────────────────────────── */}
      {isCartOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          justifyContent: 'flex-end',
          zIndex: 100
        }}>
          <div style={{
            backgroundColor: '#FFF',
            width: '100%',
            maxWidth: '460px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-8px 0 30px rgba(0,0,0,0.15)'
          }}>
            {/* Cart Header */}
            <div style={{
              padding: '18px 20px',
              borderBottom: `1px solid ${DINE_THEME.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: DINE_THEME.pinkLight
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="ri-shopping-bag-3-fill" style={{ fontSize: '20px', color: DINE_THEME.teal }} />
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: DINE_THEME.dark }}>
                  Your Order Basket ({cartItemCount})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: DINE_THEME.dark }}
              >
                <i className="ri-close-line" />
              </button>
            </div>

            {/* Cart Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: DINE_THEME.slate }}>
                  <i className="ri-shopping-basket-line" style={{ fontSize: '48px', color: DINE_THEME.border, display: 'block', marginBottom: '10px' }} />
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '15px', color: DINE_THEME.dark }}>Your basket is empty</p>
                  <p style={{ margin: '4px 0 0', fontSize: '13px' }}>Tap any delicious dish or drink to start ordering.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {cart.map(item => (
                    <div
                      key={item.cartItemId}
                      style={{
                        padding: '12px',
                        borderRadius: '12px',
                        border: `1px solid ${DINE_THEME.border}`,
                        backgroundColor: '#FFF',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ margin: '0 0 2px 0', fontSize: '14px', fontWeight: 700, color: DINE_THEME.dark }}>
                            {item.name}
                          </h4>
                          <div style={{ fontSize: '11px', color: DINE_THEME.slate }}>
                            {item.size} {item.sugar ? `• ${item.sugar} sugar` : ''}
                          </div>
                          {item.addons?.length > 0 && (
                            <div style={{ fontSize: '11px', color: DINE_THEME.tealDark, fontWeight: 600 }}>
                              + {item.addons.join(', ')}
                            </div>
                          )}
                          {item.instructions && (
                            <div style={{ fontSize: '11px', color: '#94A3B8', fontStyle: 'italic', marginTop: '2px' }}>
                              Note: {item.instructions}
                            </div>
                          )}
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: 800, color: DINE_THEME.dark }}>
                          ₱{(item.price * item.quantity).toFixed(0)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                        <button
                          type="button"
                          onClick={() => removeCartItem(item.cartItemId)}
                          style={{ border: 'none', background: 'none', color: '#EF4444', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                        >
                          <i className="ri-delete-bin-line" /> Remove
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', backgroundColor: DINE_THEME.pinkLight, borderRadius: '8px', border: `1px solid ${DINE_THEME.border}` }}>
                          <button
                            type="button"
                            onClick={() => updateCartItemQty(item.cartItemId, -1)}
                            style={{ width: '28px', height: '28px', border: 'none', background: 'none', fontWeight: 800, cursor: 'pointer' }}
                          >
                            -
                          </button>
                          <span style={{ width: '24px', textAlign: 'center', fontSize: '13px', fontWeight: 700 }}>
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartItemQty(item.cartItemId, 1)}
                            style={{ width: '28px', height: '28px', border: 'none', background: 'none', fontWeight: 800, cursor: 'pointer' }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Customer Information Form */}
                  <div style={{ marginTop: '14px', paddingTop: '16px', borderTop: `1px solid ${DINE_THEME.border}` }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 800, color: DINE_THEME.dark }}>
                      Diner Details
                    </h4>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: DINE_THEME.slate, marginBottom: '4px' }}>
                          Your Name (Required)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Alex Santos"
                          value={customerName}
                          onChange={e => setCustomerName(e.target.value)}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${DINE_THEME.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: DINE_THEME.slate, marginBottom: '4px' }}>
                          Mobile Number (Optional, for SMS update)
                        </label>
                        <input
                          type="tel"
                          placeholder="e.g. 0917 123 4567"
                          value={customerPhone}
                          onChange={e => setCustomerPhone(e.target.value)}
                          style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${DINE_THEME.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div style={{ marginTop: '10px' }}>
                    <h4 style={{ margin: '0 0 8px 0', fontSize: '13px', fontWeight: 800, color: DINE_THEME.dark }}>
                      Payment Method
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                      {[
                        { id: 'GCash', label: 'GCash', icon: 'ri-wallet-3-line', color: '#007DFE' },
                        { id: 'Maya', label: 'Maya', icon: 'ri-bank-card-line', color: '#00C853' },
                        { id: 'Cash on Dine', label: 'Cash', icon: 'ri-money-dollar-circle-line', color: '#F59E0B' }
                      ].map(pay => (
                        <button
                          key={pay.id}
                          type="button"
                          onClick={() => setPaymentMethod(pay.id)}
                          style={{
                            padding: '10px 4px',
                            borderRadius: '10px',
                            border: paymentMethod === pay.id ? `2px solid ${pay.color}` : `1px solid ${DINE_THEME.border}`,
                            backgroundColor: paymentMethod === pay.id ? `${pay.color}15` : '#FFF',
                            color: paymentMethod === pay.id ? pay.color : DINE_THEME.dark,
                            fontWeight: 700,
                            fontSize: '11px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <i className={pay.icon} style={{ fontSize: '16px' }} />
                          <span>{pay.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Cart Footer / Checkout Action */}
            {cart.length > 0 && (
              <div style={{
                padding: '16px 20px',
                borderTop: `1px solid ${DINE_THEME.border}`,
                backgroundColor: '#FFF'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: DINE_THEME.slate, marginBottom: '4px' }}>
                  <span>Subtotal</span>
                  <span>₱{cartSubtotal.toFixed(0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: DINE_THEME.slate, marginBottom: '8px' }}>
                  <span>VAT & Service (Included)</span>
                  <span>₱0.00</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 800, color: DINE_THEME.dark, marginBottom: '14px' }}>
                  <span>Total Amount</span>
                  <span style={{ color: DINE_THEME.tealDark }}>₱{cartSubtotal.toFixed(0)}</span>
                </div>

                <button
                  type="button"
                  disabled={isPlacingOrder}
                  onClick={handleCheckout}
                  style={{
                    width: '100%',
                    backgroundColor: isPlacingOrder ? DINE_THEME.slate : DINE_THEME.teal,
                    color: '#FFF',
                    border: 'none',
                    padding: '14px',
                    borderRadius: '12px',
                    fontSize: '15px',
                    fontWeight: 800,
                    cursor: isPlacingOrder ? 'not-allowed' : 'pointer',
                    boxShadow: '0 6px 18px rgba(42,157,154,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {isPlacingOrder ? (
                    <>
                      <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Writing to {restaurant?.name || 'Tenant'} DB...</span>
                    </>
                  ) : (
                    <>
                      <i className="ri-check-line" style={{ fontWeight: 800 }} />
                      <span>Place Order • ₱{cartSubtotal.toFixed(0)}</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── ORDER DETAILS & HISTORY MODAL ────────────────────────────────── */}
      {isHistoryOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#FFF',
            borderRadius: '20px',
            width: '100%',
            maxWidth: '540px',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <img
                  src={restaurant?.logo_url || '/dine/IMG_0162.jpeg'}
                  alt="DINE"
                  style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover' }}
                />
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: DINE_THEME.dark }}>
                    {restaurant?.name || 'DINE'} Order Tracker
                  </h3>
                  <span style={{ fontSize: '11px', color: DINE_THEME.slate }}>
                    Database: {activeOrder?.database_file || `tenant_${slug}.db`}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsHistoryOpen(false)}
                style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer', color: DINE_THEME.dark }}
              >
                <i className="ri-close-line" />
              </button>
            </div>

            {/* Active Order Summary Card */}
            {activeOrder && (
              <div style={{
                backgroundColor: DINE_THEME.pinkLight,
                borderRadius: '14px',
                padding: '16px',
                border: `1px solid ${DINE_THEME.border}`,
                marginBottom: '16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 800, color: DINE_THEME.dark }}>
                    Order #{activeOrder.order_number}
                  </span>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: currentStep === 5 ? '#10B981' : DINE_THEME.teal,
                    color: '#FFF'
                  }}>
                    {activeOrder.status}
                  </span>
                </div>

                <div style={{ fontSize: '12px', color: DINE_THEME.slate, marginBottom: '12px' }}>
                  Diner: <strong>{activeOrder.customer_name}</strong> • Table: <strong>{activeOrder.table_number || selectedTable}</strong> • Method: <strong>{activeOrder.payment_method}</strong>
                </div>

                <div style={{ backgroundColor: '#FFF', borderRadius: '10px', padding: '10px 12px', border: `1px solid ${DINE_THEME.border}` }}>
                  {(activeOrder.items || []).map((it, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', padding: '4px 0', borderBottom: idx < activeOrder.items.length - 1 ? '1px dashed #F1F5F9' : 'none' }}>
                      <span>{it.quantity}x {it.item_name} {it.instructions ? `(${it.instructions})` : ''}</span>
                      <span style={{ fontWeight: 700 }}>₱{(it.subtotal || it.price * it.quantity).toFixed(0)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 800, paddingTop: '8px', marginTop: '6px', borderTop: '1px solid #E2E8F0' }}>
                    <span>Total Bill</span>
                    <span style={{ color: DINE_THEME.tealDark }}>₱{Number(activeOrder.total).toFixed(0)}</span>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setIsHistoryOpen(false);
                  showToast?.('Ready to order more delicious dishes!', 'info');
                }}
                style={{
                  flex: 1,
                  backgroundColor: DINE_THEME.teal,
                  color: '#FFF',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Order More Items
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── CUSTOMER / DINER AUTH & ACCOUNT MODAL ──────────────────────── */}
      {isAuthModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(38, 50, 56, 0.65)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: '#FFF',
            borderRadius: '24px',
            width: '100%',
            maxWidth: '480px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.25)',
            border: `1px solid ${DINE_THEME.border}`,
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              background: `linear-gradient(135deg, ${DINE_THEME.pinkLight} 0%, #FFF 100%)`,
              padding: '24px 24px 16px',
              borderBottom: `1px solid ${DINE_THEME.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img
                  src={restaurant?.logo_url || '/dine/IMG_0162.jpeg'}
                  alt="DINE"
                  style={{ width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${DINE_THEME.teal}` }}
                />
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: DINE_THEME.dark }}>
                    {customerUser ? `Hello, ${customerUser.name}!` : 'Diner Account Sign In'}
                  </h3>
                  <span style={{ fontSize: '11px', color: DINE_THEME.slate }}>
                    {restaurant?.name || 'Restaurant'} • Isolated DB ({`tenant_${slug}.db`})
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAuthModalOpen(false)}
                style={{
                  border: 'none',
                  background: DINE_THEME.pinkLight,
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  fontSize: '18px',
                  cursor: 'pointer',
                  color: DINE_THEME.dark,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <i className="ri-close-line" />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {customerUser ? (
                /* ─── LOGGED IN CUSTOMER DASHBOARD ─── */
                <div>
                  {/* Loyalty Stamp Card (from DINE Mobile Prototype) */}
                  <div style={{
                    background: `linear-gradient(135deg, ${DINE_THEME.tealDark} 0%, ${DINE_THEME.teal} 100%)`,
                    borderRadius: '16px',
                    padding: '20px',
                    color: '#FFF',
                    marginBottom: '20px',
                    boxShadow: '0 8px 24px rgba(42,157,154,0.25)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', opacity: 0.9 }}>
                        DINE Loyalty Passport
                      </span>
                      <span style={{ backgroundColor: 'rgba(255,255,255,0.25)', padding: '2px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 800 }}>
                        ⭐ {customerUser.loyalty_points || 50} Points
                      </span>
                    </div>

                    <h4 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: 800 }}>
                      Collect 10 Stamps for a Free Special Drink!
                    </h4>

                    {/* Stamp Circles */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(stampNo => {
                        const isStamped = stampNo <= ((customerUser.total_orders || 1) % 10 || 4);
                        return (
                          <div
                            key={stampNo}
                            style={{
                              aspectRatio: '1',
                              borderRadius: '50%',
                              backgroundColor: isStamped ? '#FFF' : 'rgba(255,255,255,0.2)',
                              color: isStamped ? DINE_THEME.tealDark : 'rgba(255,255,255,0.6)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: isStamped ? '16px' : '11px',
                              fontWeight: 800,
                              boxShadow: isStamped ? '0 2px 8px rgba(0,0,0,0.15)' : 'none'
                            }}
                          >
                            {isStamped ? <i className="ri-cup-fill" /> : stampNo}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Customer Info Card */}
                  <div style={{
                    backgroundColor: DINE_THEME.pinkLight,
                    borderRadius: '14px',
                    padding: '16px',
                    border: `1px solid ${DINE_THEME.border}`,
                    marginBottom: '20px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', color: DINE_THEME.slate, fontWeight: 600 }}>Diner Name:</span>
                      <strong style={{ fontSize: '13px', color: DINE_THEME.dark }}>{customerUser.name}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', color: DINE_THEME.slate, fontWeight: 600 }}>Mobile Number:</span>
                      <strong style={{ fontSize: '13px', color: DINE_THEME.dark }}>{customerUser.phone || 'Not set'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: DINE_THEME.slate, fontWeight: 600 }}>Total Orders at {restaurant?.name}:</span>
                      <strong style={{ fontSize: '13px', color: DINE_THEME.tealDark }}>{customerUser.total_orders || 0} orders</strong>
                    </div>
                  </div>

                  {/* Past Orders Preview */}
                  {orderHistory.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 800, color: DINE_THEME.dark }}>
                        Past Orders in this Restaurant:
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {orderHistory.slice(0, 3).map(ord => (
                          <div
                            key={ord.id || ord.order_number}
                            style={{
                              padding: '10px 14px',
                              borderRadius: '10px',
                              backgroundColor: '#FFF',
                              border: `1px solid ${DINE_THEME.border}`,
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '12px'
                            }}
                          >
                            <div>
                              <strong style={{ color: DINE_THEME.dark }}>Order #{ord.order_number}</strong>
                              <span style={{ display: 'block', fontSize: '11px', color: DINE_THEME.slate }}>
                                {new Date(ord.created_at || Date.now()).toLocaleDateString()}
                              </span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <strong style={{ color: DINE_THEME.tealDark, display: 'block' }}>₱{(ord.total || 0).toFixed(0)}</strong>
                              <span style={{
                                fontSize: '10px',
                                textTransform: 'uppercase',
                                fontWeight: 800,
                                color: ord.status === 'completed' ? '#10B981' : '#F59E0B'
                              }}>
                                {ord.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setIsAuthModalOpen(false)}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: '10px',
                        border: 'none',
                        backgroundColor: DINE_THEME.teal,
                        color: '#FFF',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      Continue Dining
                    </button>
                    <button
                      type="button"
                      onClick={handleCustomerLogout}
                      style={{
                        padding: '12px 18px',
                        borderRadius: '10px',
                        border: `1px solid #FCA5A5`,
                        backgroundColor: '#FEF2F2',
                        color: '#DC2626',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Auth Modal Tab Selector */}
                  <div style={{
                    display: 'flex',
                    backgroundColor: DINE_THEME.pinkLight,
                    padding: '4px',
                    borderRadius: '12px',
                    marginBottom: '20px'
                  }}>
                    <button
                      type="button"
                      onClick={() => { setAuthModalTab('signin'); setAuthError(''); }}
                      style={{
                        flex: 1,
                        padding: '9px',
                        borderRadius: '9px',
                        border: 'none',
                        backgroundColor: authModalTab === 'signin' ? '#FFF' : 'transparent',
                        color: authModalTab === 'signin' ? DINE_THEME.tealDark : DINE_THEME.slate,
                        fontWeight: 800,
                        fontSize: '13px',
                        cursor: 'pointer',
                        boxShadow: authModalTab === 'signin' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
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
                      onClick={() => { setAuthModalTab('register'); setAuthError(''); }}
                      style={{
                        flex: 1,
                        padding: '9px',
                        borderRadius: '9px',
                        border: 'none',
                        backgroundColor: authModalTab === 'register' ? '#FFF' : 'transparent',
                        color: authModalTab === 'register' ? DINE_THEME.tealDark : DINE_THEME.slate,
                        fontWeight: 800,
                        fontSize: '13px',
                        cursor: 'pointer',
                        boxShadow: authModalTab === 'register' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
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

                  {authError && (
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
                      <span>{authError}</span>
                    </div>
                  )}

                  {authModalTab === 'signin' ? (
                    /* ─── UNIFIED SINGLE SIGN IN FORM ─── */
                    <form onSubmit={handleUnifiedLogin}>
                      <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: 800, color: DINE_THEME.dark }}>
                          Sign In to {restaurant?.name || 'Restaurant'}
                        </h4>
                        <p style={{ margin: 0, fontSize: '12px', color: DINE_THEME.slate, lineHeight: 1.5 }}>
                          Single login for Customers, Staff, and Owners.
                        </p>
                      </div>

                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: DINE_THEME.slate, marginBottom: '6px' }}>
                          EMAIL, MOBILE NUMBER, OR STAFF PIN
                        </label>
                        <input
                          type="text"
                          value={authIdentifier}
                          onChange={e => setAuthIdentifier(e.target.value)}
                          placeholder="e.g. 0917 555 101 or owner@restaurant.com or 1234"
                          required
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            borderRadius: '10px',
                            border: `1.5px solid ${DINE_THEME.border}`,
                            outline: 'none',
                            fontSize: '14px',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: DINE_THEME.slate, marginBottom: '6px' }}>
                          PASSWORD (REQUIRED ONLY FOR OWNER / ADMIN)
                        </label>
                        <input
                          type="password"
                          value={authPassword}
                          onChange={e => setAuthPassword(e.target.value)}
                          placeholder="Enter password (if logging in as Owner/Admin)"
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            borderRadius: '10px',
                            border: `1.5px solid ${DINE_THEME.border}`,
                            outline: 'none',
                            fontSize: '14px',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      {/* 3 Quick Demo Buttons */}
                      <div style={{ marginBottom: '18px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: DINE_THEME.slate, display: 'block', marginBottom: '8px', textAlign: 'center' }}>
                          Quick One-Click Demo Logins:
                        </span>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setAuthIdentifier(slug === 'brandobar' ? 'dezznuts@gmail.com' : (slug === 'tokyo-ramen' ? 'kenji@tokyoramen.ph' : 'arthur@gmail.com'));
                              setAuthPassword('password123');
                            }}
                            style={{
                              backgroundColor: '#FEF3C7',
                              color: '#92400E',
                              border: '1px solid #FDE68A',
                              padding: '7px 4px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            👑 Owner
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setAuthIdentifier('1234');
                              setAuthPassword('');
                            }}
                            style={{
                              backgroundColor: DINE_THEME.tealLight,
                              color: DINE_THEME.tealDark,
                              border: `1px solid ${DINE_THEME.teal}`,
                              padding: '7px 4px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            🍳 Staff PIN
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setAuthIdentifier('0917 555 101');
                              setAuthPassword('');
                            }}
                            style={{
                              backgroundColor: DINE_THEME.pinkLight,
                              color: DINE_THEME.dark,
                              border: `1px solid ${DINE_THEME.border}`,
                              padding: '7px 4px',
                              borderRadius: '8px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            👤 Customer
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={authLoading || !authIdentifier.trim()}
                        style={{
                          width: '100%',
                          padding: '14px',
                          backgroundColor: DINE_THEME.teal,
                          color: '#FFF',
                          border: 'none',
                          borderRadius: '12px',
                          fontSize: '14px',
                          fontWeight: 800,
                          cursor: (authLoading || !authIdentifier.trim()) ? 'not-allowed' : 'pointer',
                          boxShadow: '0 6px 20px rgba(42,157,154,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        {authLoading ? (
                          <>
                            <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite' }} />
                            <span>Verifying Account...</span>
                          </>
                        ) : (
                          <>
                            <i className="ri-login-box-line" />
                            <span>Sign In</span>
                          </>
                        )}
                      </button>

                      <div style={{ marginTop: '16px', textAlign: 'center', display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '12px' }}>
                        <button
                          type="button"
                          onClick={() => { setAuthModalTab('register'); setAuthError(''); }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: DINE_THEME.tealDark,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          New Diner? Create Account ➔
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* ─── CREATE ACCOUNT FORM ─── */
                    <form onSubmit={handleRegisterAccount}>
                      <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: 800, color: DINE_THEME.dark }}>
                          Create Your Diner Account
                        </h4>
                        <p style={{ margin: 0, fontSize: '12px', color: DINE_THEME.slate, lineHeight: 1.5 }}>
                          Save your favorite orders, collect loyalty stamps & fast checkout!
                        </p>
                      </div>

                      <div style={{
                        backgroundColor: '#FEF3C7',
                        border: '1px solid #FDE68A',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '12px',
                        color: '#92400E',
                        fontWeight: 700
                      }}>
                        <i className="ri-gift-line" style={{ fontSize: '16px' }} />
                        <span>🎁 Welcome Bonus: 50 Starter Loyalty Points upon joining!</span>
                      </div>

                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: DINE_THEME.slate, marginBottom: '6px' }}>
                          FULL NAME *
                        </label>
                        <input
                          type="text"
                          required
                          value={regName}
                          onChange={e => setRegName(e.target.value)}
                          placeholder="e.g. Maria Santos"
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            borderRadius: '10px',
                            border: `1.5px solid ${DINE_THEME.border}`,
                            outline: 'none',
                            fontSize: '14px',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: DINE_THEME.slate, marginBottom: '6px' }}>
                          MOBILE NUMBER *
                        </label>
                        <input
                          type="tel"
                          required
                          value={regPhone}
                          onChange={e => setRegPhone(e.target.value)}
                          placeholder="e.g. 0917 123 4567"
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            borderRadius: '10px',
                            border: `1.5px solid ${DINE_THEME.border}`,
                            outline: 'none',
                            fontSize: '14px',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: '18px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: DINE_THEME.slate, marginBottom: '6px' }}>
                          EMAIL ADDRESS (OPTIONAL)
                        </label>
                        <input
                          type="email"
                          value={regEmail}
                          onChange={e => setRegEmail(e.target.value)}
                          placeholder="e.g. maria@gmail.com"
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            borderRadius: '10px',
                            border: `1.5px solid ${DINE_THEME.border}`,
                            outline: 'none',
                            fontSize: '14px',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={authLoading || !regName.trim() || !regPhone.trim()}
                        style={{
                          width: '100%',
                          padding: '14px',
                          backgroundColor: DINE_THEME.teal,
                          color: '#FFF',
                          border: 'none',
                          borderRadius: '12px',
                          fontSize: '14px',
                          fontWeight: 800,
                          cursor: (authLoading || !regName.trim() || !regPhone.trim()) ? 'not-allowed' : 'pointer',
                          boxShadow: '0 6px 20px rgba(42,157,154,0.3)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        {authLoading ? (
                          <>
                            <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite' }} />
                            <span>Creating Account...</span>
                          </>
                        ) : (
                          <>
                            <i className="ri-check-line" />
                            <span>Create Account & Start Ordering</span>
                          </>
                        )}
                      </button>

                      <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '12px' }}>
                        <button
                          type="button"
                          onClick={() => { setAuthModalTab('signin'); setAuthError(''); }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: DINE_THEME.tealDark,
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          Already have an account? Sign In ➔
                        </button>
                      </div>
                    </form>
                  )}

                  <div style={{ marginTop: '14px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setIsAuthModalOpen(false)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: DINE_THEME.slate,
                        fontSize: '12px',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Continue as Guest Diner
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MOBILE BOTTOM BAR (Small Screens) ───────────────────────────── */}
      {cartItemCount > 0 && (
        <div style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#FFF',
          borderTop: `1px solid ${DINE_THEME.border}`,
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 35,
          boxShadow: '0 -4px 16px rgba(0,0,0,0.06)'
        }}>
          <div>
            <span style={{ fontSize: '11px', color: DINE_THEME.slate, display: 'block' }}>Basket Total</span>
            <span style={{ fontSize: '18px', fontWeight: 800, color: DINE_THEME.tealDark }}>
              ₱{cartSubtotal.toFixed(0)}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsCartOpen(true)}
            style={{
              backgroundColor: DINE_THEME.teal,
              color: '#FFF',
              border: 'none',
              padding: '10px 22px',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>View Cart ({cartItemCount})</span>
            <i className="ri-arrow-right-line" />
          </button>
        </div>
      )}
    </div>
  );
}
