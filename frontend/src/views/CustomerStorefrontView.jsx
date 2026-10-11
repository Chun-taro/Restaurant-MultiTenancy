import React, { useState, useEffect, useRef, useMemo } from 'react';
import { api } from '../services/api';

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

  // Available Add-ons from Tenant Database or Fallback Defaults
  const availableAddons = useMemo(() => {
    if (data?.addons && Array.isArray(data.addons) && data.addons.length > 0) {
      return data.addons;
    }
    return ADDON_OPTIONS;
  }, [data?.addons]);

  // Dynamic Storefront Theme Tokens based on restaurant customized branding
  const themeConfig = useMemo(() => {
    let conf = {};
    if (data?.restaurant?.theme_config) {
      try {
        conf = typeof data.restaurant.theme_config === 'string'
          ? JSON.parse(data.restaurant.theme_config)
          : data.restaurant.theme_config;
      } catch (e) {
        console.warn('Failed to parse storefront theme_config', e);
      }
    }
    const preset = conf.preset || 'emerald_clean';
    const bgStyle = conf.bg_style || conf.bgStyle || (['tokyo_midnight', 'obsidian_luxury', 'cyber_neon'].includes(preset) ? 'midnight_dark' : 'slate_clean');
    return {
      preset,
      primary_color: conf.primary_color || conf.primary || data?.restaurant?.primary_color || '#2A9D9A',
      secondary_color: conf.secondary_color || conf.secondary || data?.restaurant?.secondary_color || '#1E293B',
      accent_color: conf.accent_color || conf.accent || '#F59E0B',
      bg_style: bgStyle,
      font_family: conf.font_family || conf.font || 'Plus Jakarta Sans',
      border_radius: conf.border_radius || conf.radius || 'smooth',
      hero_style: conf.hero_style || conf.hero || 'cinematic',
      card_density: conf.card_density || 'grid_spacious'
    };
  }, [data?.restaurant]);

  const primaryBrand = themeConfig.primary_color;
  const secondaryBrand = themeConfig.secondary_color;
  const accentBrand = themeConfig.accent_color;
  const isDarkMode = themeConfig.bg_style === 'midnight_dark' ||
    themeConfig.bgStyle === 'midnight_dark' ||
    ['tokyo_midnight', 'obsidian_luxury', 'cyber_neon'].includes(themeConfig.preset);

  // Compute background & contrast palette
  const themePalette = useMemo(() => {
    switch (themeConfig.bg_style) {
      case 'midnight_dark':
        return {
          bg: '#0B0F19',
          card: '#161F30',
          cardSoft: '#1F293D',
          text: '#F8FAFC',
          mutedText: '#94A3B8',
          border: '#2A364F',
          navBg: 'rgba(11, 15, 25, 0.96)'
        };
      case 'warm_cream':
        return {
          bg: '#FAF7F2',
          card: '#FFFFFF',
          cardSoft: '#F4EFE6',
          text: '#292524',
          mutedText: '#78716C',
          border: '#E7E5E4',
          navBg: 'rgba(250, 247, 242, 0.94)'
        };
      case 'matcha_soft':
        return {
          bg: '#F0FDF4',
          card: '#FFFFFF',
          cardSoft: '#DCFCE7',
          text: '#064E3B',
          mutedText: '#047857',
          border: '#DCFCE7',
          navBg: 'rgba(240, 253, 244, 0.94)'
        };
      case 'rose_blush':
        return {
          bg: '#FFF1F2',
          card: '#FFFFFF',
          cardSoft: '#FFE4E6',
          text: '#4C0519',
          mutedText: '#9F1239',
          border: '#FFE4E6',
          navBg: 'rgba(255, 241, 242, 0.94)'
        };
      case 'pure_white':
        return {
          bg: '#FFFFFF',
          card: '#FAFAFA',
          cardSoft: '#F4F4F5',
          text: '#09090B',
          mutedText: '#71717A',
          border: '#E4E4E7',
          navBg: 'rgba(255, 255, 255, 0.96)'
        };
      case 'slate_clean':
      default:
        return {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          cardSoft: '#F1F5F9',
          text: '#1E293B',
          mutedText: '#64748B',
          border: '#E2E8F0',
          navBg: 'rgba(255, 255, 255, 0.94)'
        };
    }
  }, [themeConfig.bg_style]);

  // Corner Shape Tokens
  const radius = themeConfig.border_radius === 'sharp' ? '6px' : themeConfig.border_radius === 'rounded' ? '24px' : '16px';
  const pillRadius = themeConfig.border_radius === 'sharp' ? '6px' : themeConfig.border_radius === 'rounded' ? '28px' : '14px';
  const fontFamilyStr = `'${themeConfig.font_family}', -apple-system, BlinkMacSystemFont, sans-serif`;

  const DINE_THEME = {
    pink: themePalette.cardSoft,
    pinkLight: themePalette.cardSoft,
    pinkSoft: themePalette.bg,
    bgSoft: themePalette.bg,
    bgMuted: themePalette.cardSoft,
    cardBg: themePalette.card,
    teal: primaryBrand,
    tealDark: primaryBrand,
    tealLight: `${primaryBrand}18`,
    tealGlow: `${primaryBrand}33`,
    dark: isDarkMode ? themePalette.text : secondaryBrand,
    slate: themePalette.mutedText,
    border: themePalette.border,
    borderDark: themePalette.border,
    white: themePalette.card,
    gold: accentBrand,
    radius,
    pillRadius,
    fontFamily: fontFamilyStr,
    navBg: themePalette.navBg,
    isDark: isDarkMode
  };

  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Dining Mode & Arrival Time
  const [diningMode, setDiningMode] = useState('dine_in'); // 'dine_in' | 'takeaway'
  const [selectedTable, setSelectedTable] = useState(initialTable || 'Table 1');
  const [selectedArrival, setSelectedArrival] = useState('ASAP');
  const [includeUtensils, setIncludeUtensils] = useState(true);
  const [takeoutNotes, setTakeoutNotes] = useState('');

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
  const [authIdentifier, setAuthIdentifier] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [showAuthPassword, setShowAuthPassword] = useState(false);
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  // Customer Account Dropdown Menu State
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const customerDropdownRef = useRef(null);

  // Close customer dropdown on outside clicks
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target)) {
        setIsCustomerDropdownOpen(false);
      }
    };
    if (isCustomerDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isCustomerDropdownOpen]);

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
    if (!regPassword.trim()) {
      setAuthError('Please create an account password');
      return;
    }
    setAuthLoading(true);
    try {
      const res = await api.storefront.register(slug, {
        name: regName.trim(),
        phone: regPhone.trim(),
        email: regEmail.trim(),
        password: regPassword.trim(),
        role: 'customer'
      });
      const data = res.data;
      const cust = data.user || data.customer;
      setCustomerUser(cust);
      localStorage.setItem(`dine_customer_${slug}`, JSON.stringify(cust));
      if (cust.name) setCustomerName(cust.name);
      if (cust.phone) setCustomerPhone(cust.phone);
      showToast?.(`Account created! Welcome to ${restaurant?.name || 'our restaurant'}, ${cust.name}!`, 'success');
      setIsAuthModalOpen(false);
      setRegName('');
      setRegPhone('');
      setRegEmail('');
      setRegPassword('');
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
    localStorage.removeItem(`dine_order_history_${slug}`);
    localStorage.removeItem(`dine_active_order_${slug}`);
    setCustomerUser(null);
    setOrderHistory([]);
    setActiveOrder(null);
    showToast?.('Signed out', 'info');
  };

  // Active Live Order Tracking
  const [activeOrder, setActiveOrder] = useState(() => {
    try {
      const saved = localStorage.getItem(`dine_active_order_${slug}`);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [orderHistory, setOrderHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(`dine_order_history_${slug}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [suspendedData, setSuspendedData] = useState(null);
  const [notFound, setNotFound] = useState(false);

  // Completed Order Celebration & Next Order Confirmation Modal
  const [isOrderCompletedModalOpen, setIsOrderCompletedModalOpen] = useState(false);
  const [completedOrderConfirmedId, setCompletedOrderConfirmedId] = useState(null);

  // Load Storefront Data from Tenant's Isolated DB
  const loadStorefront = async () => {
    try {
      setLoading(true);
      setSuspendedData(null);
      setNotFound(false);
      const res = await api.storefront.get(slug);
      setData(res.data);
      if (res.data.tables?.length > 0 && !initialTable) {
        setSelectedTable(res.data.tables[0].table_number);
      }
    } catch (err) {
      if (err.data?.suspended || err.status === 403) {
        setSuspendedData(err.data || {
          suspended: true,
          error: err.message,
          reason: 'This restaurant storefront is currently suspended.',
          restaurant: { name: slug }
        });
      } else if (err.status === 404 || err.message?.toLowerCase().includes('not found')) {
        setNotFound(true);
      } else {
        showToast?.(err.message, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStorefront();
  }, [slug]);

  // Load customer order history on mount or when customer profile changes
  useEffect(() => {
    const fetchCustomerHistory = async () => {
      const phone = customerUser?.phone || customerPhone;
      const name = customerUser?.name || customerName;
      if (!phone && !name) return;
      try {
        const res = await api.storefront.customerOrders(slug, { phone, name });
        if (res.data && Array.isArray(res.data)) {
          setOrderHistory(res.data);
          localStorage.setItem(`dine_order_history_${slug}`, JSON.stringify(res.data));
        }
      } catch (e) {}
    };
    fetchCustomerHistory();
  }, [slug, customerUser?.phone, customerUser?.name]);

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

  // Prompt completion popup immediately whenever active order finishes
  useEffect(() => {
    if (activeOrder && activeOrder.status === 'completed' && completedOrderConfirmedId !== activeOrder.order_number) {
      setIsOrderCompletedModalOpen(true);
    }
  }, [activeOrder?.status, activeOrder?.order_number, completedOrderConfirmedId]);

  // Customer confirms completed order to refresh table/session for next order
  const handleConfirmCompletedOrder = () => {
    if (!activeOrder) return;
    const finalOrder = { ...activeOrder, status: 'completed' };
    setCompletedOrderConfirmedId(finalOrder.order_number);
    setIsOrderCompletedModalOpen(false);

    // Ensure order is safely recorded in customer's order history
    setOrderHistory(prev => {
      const exists = prev.some(o => o.order_number === finalOrder.order_number);
      const updated = exists
        ? prev.map(o => o.order_number === finalOrder.order_number ? finalOrder : o)
        : [finalOrder, ...prev];
      localStorage.setItem(`dine_order_history_${slug}`, JSON.stringify(updated));
      return updated;
    });

    // Clear active live order state & localStorage so diner can place a new order
    setActiveOrder(null);
    localStorage.removeItem(`dine_active_order_${slug}`);

    showToast?.('Order completed & confirmed! Ready for your next order.', 'success');
  };

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

  // Filter items by category and search query
  const filteredItems = allItems.filter(item => {
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
      const opt = availableAddons.find(o => String(o.id) === String(addId));
      return sum + (opt ? Number(opt.price || 0) : 0);
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
      price: selectedProduct.price + (modalSize === 'Large (16oz)' ? 30 : 0) + modalAddons.reduce((s, id) => s + (availableAddons.find(o => String(o.id) === String(id))?.price || 0), 0),
      size: modalSize,
      sugar: isDrink ? modalSugar : null,
      addons: modalAddons.map(id => availableAddons.find(o => String(o.id) === String(id))?.name).filter(Boolean),
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
        customer_email: customerUser?.email || '',
        customer_id: customerUser?.id || null,
        order_type: diningMode,
        table_number: diningMode === 'dine_in' ? selectedTable : 'Takeaway',
        payment_method: paymentMethod.toLowerCase().replace(/\s+/g, '_'),
        notes: [
          diningMode === 'takeaway'
            ? `[TAKEOUT • Pickup: ${selectedArrival} • Utensils: ${includeUtensils ? 'Yes' : 'No'}${takeoutNotes ? ` • Note: ${takeoutNotes}` : ''}]`
            : `[DINE-IN • Table: ${selectedTable}]`,
          cart.map(it => it.instructions ? `[${it.name}: ${it.instructions}]` : '').filter(Boolean).join(' ')
        ].filter(Boolean).join(' ').trim(),
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
        order_type: diningMode,
        placedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setActiveOrder(enrichedOrder);
      localStorage.setItem(`dine_active_order_${slug}`, JSON.stringify(enrichedOrder));
      setOrderHistory(prev => {
        const updated = [enrichedOrder, ...prev.filter(o => o.order_number !== enrichedOrder.order_number)];
        localStorage.setItem(`dine_order_history_${slug}`, JSON.stringify(updated));
        return updated;
      });
      setCart([]);
      setIsCartOpen(false);
      showToast?.(
        diningMode === 'takeaway'
          ? `Takeout Order #${createdOrder.order_number} confirmed! We will prepare it for counter pickup.`
          : `Dine-In Order #${createdOrder.order_number} confirmed! Sent to the kitchen for ${selectedTable}.`,
        'success'
      );
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

  const TRACKING_STEPS = diningMode === 'takeaway' ? [
    { label: 'Order Received', icon: 'ri-file-list-3-line', desc: 'Sent to restaurant kitchen' },
    { label: 'Confirmed', icon: 'ri-checkbox-circle-line', desc: 'Accepted by kitchen staff' },
    { label: 'Cooking & Packing', icon: 'ri-fire-line', desc: 'Chefs cooking & packing to-go' },
    { label: 'Ready for Pickup', icon: 'ri-shopping-bag-3-line', desc: 'Hot & ready at front counter' },
    { label: 'Completed', icon: 'ri-check-double-line', desc: 'Enjoy your takeout meal!' }
  ] : [
    { label: 'Order Received', icon: 'ri-file-list-3-line', desc: 'Sent to restaurant kitchen' },
    { label: 'Confirmed', icon: 'ri-checkbox-circle-line', desc: 'Accepted by table staff' },
    { label: 'Cooking Fresh', icon: 'ri-fire-line', desc: 'Chefs crafting your meal' },
    { label: 'Serving to Table', icon: 'ri-restaurant-2-line', desc: `Served fresh to ${activeOrder?.table_number || selectedTable}` },
    { label: 'Completed', icon: 'ri-check-double-line', desc: 'Enjoy your dine-in experience!' }
  ];

  if (suspendedData) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0F1116',
        color: '#FFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
      }}>
        <div style={{
          maxWidth: '520px',
          width: '100%',
          backgroundColor: '#181B22',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '20px',
          padding: '40px 32px',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)'
        }}>
          <div style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            color: '#EF4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            margin: '0 auto 20px'
          }}>
            <i className="ri-error-warning-fill" />
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 12px',
            borderRadius: '20px',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#F87171',
            fontSize: '11px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '14px'
          }}>
            <i className="ri-lock-line" />
            <span>Storefront Suspended</span>
          </div>

          <h2 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 10px 0', color: '#FFF' }}>
            {suspendedData.restaurant?.name || slug}
          </h2>

          <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: 1.6, margin: '0 0 20px 0' }}>
            This restaurant's digital storefront and online ordering system are currently unavailable.
          </p>

          <div style={{
            backgroundColor: 'rgba(15, 17, 22, 0.7)',
            border: '1px solid #282D37',
            borderRadius: '12px',
            padding: '14px 16px',
            textAlign: 'left',
            marginBottom: '24px'
          }}>
            <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
              Notice from Platform Administration:
            </div>
            <div style={{ fontSize: '13px', color: '#E2E8F0', fontWeight: 600 }}>
              {suspendedData.reason || suspendedData.restaurant?.suspended_reason || 'Administrative hold / Past due billing review'}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <a
              href={`/portal/${slug}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '12px',
                backgroundColor: '#FF5A1F',
                color: '#FFF',
                fontWeight: 700,
                fontSize: '13px',
                textDecoration: 'none'
              }}
            >
              <i className="ri-dashboard-line" />
              <span>Open Restaurant Tenant Portal</span>
            </a>

            <a
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '12px',
                backgroundColor: 'transparent',
                border: '1px solid #282D37',
                color: '#94A3B8',
                fontWeight: 600,
                fontSize: '13px',
                textDecoration: 'none'
              }}
            >
              <i className="ri-arrow-left-line" />
              <span>Back to RestoSaaS Home</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (notFound || (!loading && !data && !suspendedData)) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#0F1116',
        color: '#FFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif"
      }}>
        <div style={{
          maxWidth: '520px',
          width: '100%',
          backgroundColor: '#181B22',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '24px',
          padding: '44px 32px',
          textAlign: 'center',
          boxShadow: '0 24px 48px rgba(0,0,0,0.6)'
        }}>
          <div style={{
            width: '76px',
            height: '76px',
            borderRadius: '50%',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            color: '#F87171',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '38px',
            margin: '0 auto 20px',
            border: '1px solid rgba(239, 68, 68, 0.25)'
          }}>
            <i className="ri-store-3-line" />
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 14px',
            borderRadius: '20px',
            backgroundColor: 'rgba(244, 63, 94, 0.12)',
            border: '1px solid rgba(244, 63, 94, 0.25)',
            color: '#FB7185',
            fontSize: '11px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '16px'
          }}>
            <i className="ri-error-warning-line" />
            <span>Storefront Not Found (404)</span>
          </div>

          <h2 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 12px 0', color: '#FFF', letterSpacing: '-0.02em' }}>
            "{slug}" Does Not Exist
          </h2>

          <p style={{ fontSize: '14.5px', color: '#94A3B8', lineHeight: 1.6, margin: '0 0 28px 0' }}>
            No restaurant digital storefront with identifier <strong style={{ color: '#F1F5F9' }}>@{slug}</strong> has been provisioned on this platform yet.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <a
              href="/admin"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '13px 22px',
                borderRadius: '12px',
                backgroundColor: '#6366F1',
                color: '#FFF',
                fontWeight: 700,
                fontSize: '14px',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
              }}
            >
              <i className="ri-shield-keyhole-line" />
              <span>Provision Restaurant in Super Admin</span>
            </a>

            <a
              href="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '12px 22px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#E2E8F0',
                fontWeight: 600,
                fontSize: '13px',
                textDecoration: 'none'
              }}
            >
              <i className="ri-arrow-left-line" />
              <span>Back to RestoSaaS Home</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: DINE_THEME.bgSoft }}>
        <div style={{ textAlign: 'center' }}>
          <img
            src="/dine/IMG_0162.jpeg"
            alt="DINE"
            style={{ width: '88px', height: '88px', borderRadius: '50%', objectFit: 'cover', border: `3px solid ${DINE_THEME.teal}`, boxShadow: `0 8px 24px ${DINE_THEME.tealGlow}`, marginBottom: '16px', animation: 'spin 4s linear infinite' }}
          />
          <h3 style={{ margin: '0 0 6px 0', color: DINE_THEME.dark, fontWeight: 700, fontSize: '20px' }}>Loading {restaurant?.name || 'DINE Storefront'}...</h3>
          <p style={{ margin: 0, color: DINE_THEME.slate, fontSize: '13px' }}>Loading digital menu and restaurant ordering...</p>
        </div>
      </div>
    );
  }

  const currentStep = getTrackingStepIndex(activeOrder?.status);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: DINE_THEME.pinkSoft,
      color: DINE_THEME.dark,
      fontFamily: DINE_THEME.fontFamily,
      '--customer-card-bg': DINE_THEME.white,
      '--customer-hover-bg': isDarkMode ? '#1F293D' : '#F1F5F9',
      '--storefront-border': DINE_THEME.border
    }}>

      {/* ─── TOP WEB APP BAR ────────────────────────────────────────────── */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        backgroundColor: DINE_THEME.navBg,
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${DINE_THEME.border}`,
        boxShadow: isDarkMode ? '0 4px 20px rgba(0, 0, 0, 0.4)' : '0 4px 20px rgba(38, 50, 56, 0.04)'
      }}>
        <div className="storefront-header-inner">

          {/* Logo & Brand Identity */}
          <div className="storefront-brand-section">
            <div style={{ position: 'relative' }}>
              <img
                src={restaurant?.logo_url || '/dine/IMG_0162.jpeg'}
                alt={restaurant?.name || 'DINE'}
                style={{ width: '46px', height: '46px', borderRadius: DINE_THEME.radius, objectFit: 'cover', border: `2px solid ${DINE_THEME.teal}`, boxShadow: `0 4px 12px ${DINE_THEME.tealLight}` }}
              />
              <span style={{ position: 'absolute', bottom: -2, right: -2, width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10B981', border: `2px solid ${isDarkMode ? '#161F30' : '#FFF'}` }} />
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
              </div>
            </div>
          </div>

          {/* Dining Mode & Table / Pickup Selector */}
          <div className="storefront-dining-selector" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              display: 'flex',
              backgroundColor: isDarkMode ? '#1F293D' : '#F1F5F9',
              borderRadius: '14px',
              padding: '3px',
              border: `1.5px solid ${diningMode === 'dine_in' ? (isDarkMode ? 'rgba(16, 185, 129, 0.5)' : '#86EFAC') : (isDarkMode ? 'rgba(234, 88, 12, 0.5)' : '#FDBA74')}`,
              boxShadow: diningMode === 'dine_in' ? '0 2px 10px rgba(16, 185, 129, 0.15)' : '0 2px 10px rgba(234, 88, 12, 0.15)',
              transition: 'all 0.25s ease'
            }}>
              <button
                type="button"
                onClick={() => setDiningMode('dine_in')}
                style={{
                  padding: '7px 16px',
                  borderRadius: '11px',
                  fontSize: '12px',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  background: diningMode === 'dine_in' ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)' : 'transparent',
                  color: diningMode === 'dine_in' ? '#FFF' : (isDarkMode ? '#94A3B8' : '#475569'),
                  boxShadow: diningMode === 'dine_in' ? '0 3px 10px rgba(5, 150, 105, 0.35)' : 'none',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <i className="ri-restaurant-2-fill" style={{ fontSize: '14px' }} />
                <span>Dine-In</span>
              </button>
              <button
                type="button"
                onClick={() => setDiningMode('takeaway')}
                style={{
                  padding: '7px 16px',
                  borderRadius: '11px',
                  fontSize: '12px',
                  fontWeight: 800,
                  border: 'none',
                  cursor: 'pointer',
                  background: diningMode === 'takeaway' ? 'linear-gradient(135deg, #EA580C 0%, #F97316 100%)' : 'transparent',
                  color: diningMode === 'takeaway' ? '#FFF' : (isDarkMode ? '#94A3B8' : '#475569'),
                  boxShadow: diningMode === 'takeaway' ? '0 3px 10px rgba(234, 88, 12, 0.35)' : 'none',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <i className="ri-takeaway-fill" style={{ fontSize: '14px' }} />
                <span>Takeout</span>
              </button>
            </div>

            {/* Sub-selector customized for the chosen mode */}
            {diningMode === 'dine_in' ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: isDarkMode ? 'rgba(6, 78, 59, 0.35)' : '#F0FDF4',
                padding: '6px 12px',
                borderRadius: '12px',
                border: isDarkMode ? '1.5px solid rgba(16, 185, 129, 0.4)' : '1.5px solid #86EFAC',
                fontSize: '12px',
                fontWeight: 700,
                color: isDarkMode ? '#A7F3D0' : '#065F46',
                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.1)'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
                <i className="ri-qr-code-line" style={{ color: isDarkMode ? '#34D399' : '#059669', fontSize: '14px' }} />
                <span>Table:</span>
                <select
                  value={selectedTable}
                  onChange={e => setSelectedTable(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    fontWeight: 800,
                    color: isDarkMode ? '#A7F3D0' : '#065F46',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  {(data?.tables?.length > 0 ? data.tables : [{ table_number: 'Table 1' }, { table_number: 'Table 2' }, { table_number: 'Table 3' }, { table_number: 'Table 4' }, { table_number: 'Table 5' }, { table_number: 'Table 6' }, { table_number: 'VIP Table' }]).map(t => (
                    <option key={t.table_number} value={t.table_number} style={{ backgroundColor: isDarkMode ? '#161F30' : '#FFF', color: isDarkMode ? '#F8FAFC' : '#065F46' }}>{t.table_number}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: isDarkMode ? 'rgba(124, 45, 18, 0.35)' : '#FFF7ED',
                padding: '6px 12px',
                borderRadius: '12px',
                border: isDarkMode ? '1.5px solid rgba(249, 115, 22, 0.4)' : '1.5px solid #FDBA74',
                fontSize: '12px',
                fontWeight: 700,
                color: isDarkMode ? '#FED7AA' : '#9A3412',
                boxShadow: '0 2px 6px rgba(234, 88, 12, 0.1)'
              }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EA580C', display: 'inline-block' }} />
                <i className="ri-time-line" style={{ color: isDarkMode ? '#FB923C' : '#EA580C', fontSize: '14px' }} />
                <span>Pickup:</span>
                <select
                  value={selectedArrival}
                  onChange={e => setSelectedArrival(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    fontWeight: 800,
                    color: isDarkMode ? '#FED7AA' : '#9A3412',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  {ARRIVAL_TIMES.map(t => (
                    <option key={t} value={t} style={{ backgroundColor: isDarkMode ? '#161F30' : '#FFF', color: isDarkMode ? '#F8FAFC' : '#9A3412' }}>{t}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Quick Actions (Admin switcher, Order Tracking Pill, Cart Trigger) */}
          <div className="storefront-actions-section">
            {activeOrder && (
              <button
                type="button"
                onClick={() => setIsHistoryOpen(true)}
                style={{
                  backgroundColor: isDarkMode ? 'rgba(180, 83, 9, 0.3)' : '#FEF3C7',
                  color: isDarkMode ? '#FCD34D' : '#92400E',
                  border: isDarkMode ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid #FDE68A',
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

            {/* Customer / Account Dropdown Menu */}
            {customerUser ? (
              <div className="customer-user-dropdown-container" ref={customerDropdownRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setIsCustomerDropdownOpen(prev => !prev)}
                  className="customer-account-btn"
                  aria-expanded={isCustomerDropdownOpen}
                  style={{
                    backgroundColor: isCustomerDropdownOpen ? DINE_THEME.tealLight : DINE_THEME.pinkLight,
                    color: DINE_THEME.dark,
                    border: `1.5px solid ${isCustomerDropdownOpen ? DINE_THEME.teal : DINE_THEME.border}`,
                    padding: '5px 12px 5px 6px',
                    borderRadius: '24px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    boxShadow: isCustomerDropdownOpen ? `0 0 0 3px ${DINE_THEME.tealLight}` : 'none'
                  }}
                  title="Customer Account Menu"
                >
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <img
                      src={customerUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(customerUser.name || 'Customer')}`}
                      alt=""
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: DINE_THEME.white,
                        border: `1.5px solid ${DINE_THEME.teal}`,
                        objectFit: 'cover'
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        bottom: -1,
                        right: -1,
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        backgroundColor: '#10B981',
                        border: `1.5px solid ${isDarkMode ? '#161F30' : '#FFF'}`
                      }}
                      title="Logged In"
                    />
                  </div>
                  <span className="customer-name-display" style={{ maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {customerUser.name}
                  </span>
                  <i
                    className="ri-arrow-down-s-line"
                    style={{
                      fontSize: '15px',
                      color: DINE_THEME.slate,
                      transition: 'transform 0.2s ease',
                      transform: isCustomerDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                  />
                </button>

                {isCustomerDropdownOpen && (
                  <div
                    className="customer-dropdown-menu"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      width: '270px',
                      backgroundColor: DINE_THEME.white,
                      borderRadius: '16px',
                      boxShadow: '0 14px 40px rgba(0, 0, 0, 0.25), 0 4px 12px rgba(0, 0, 0, 0.12)',
                      border: `1px solid ${DINE_THEME.border}`,
                      padding: '8px',
                      zIndex: 1100,
                      animation: 'fadeInSlide 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  >
                    {/* Profile Header */}
                    <div
                      style={{
                        padding: '12px',
                        borderRadius: '12px',
                        backgroundColor: DINE_THEME.pinkLight,
                        marginBottom: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={customerUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(customerUser.name || 'Customer')}`}
                          alt=""
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '50%',
                            backgroundColor: DINE_THEME.white,
                            border: `2px solid ${DINE_THEME.teal}`,
                            objectFit: 'cover'
                          }}
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: DINE_THEME.dark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {customerUser.name}
                          </div>
                          <div style={{ fontSize: '11px', color: DINE_THEME.slate, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '1px' }}>
                            {customerUser.email || customerUser.phone || 'Customer Account'}
                          </div>
                        </div>
                      </div>
                      <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', backgroundColor: isDarkMode ? 'rgba(22, 163, 74, 0.25)' : '#DCFCE7', color: isDarkMode ? '#86EFAC' : '#15803D' }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#16A34A' }} />
                          Active Session
                        </span>
                        <span style={{ fontSize: '11px', color: DINE_THEME.slate, fontWeight: 600 }}>
                          {diningMode === 'dine_in' ? selectedTable : 'Takeout'}
                        </span>
                      </div>
                    </div>

                    {/* Dropdown Options */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <button
                        type="button"
                        className="customer-dropdown-item"
                        onClick={() => {
                          setIsCustomerDropdownOpen(false);
                          setIsHistoryOpen(true);
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '9px 12px',
                          borderRadius: '10px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: DINE_THEME.dark,
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background-color 0.15s'
                        }}
                      >
                        <i className="ri-history-line" style={{ color: DINE_THEME.teal, fontSize: '16px' }} />
                        <span>My Orders & History</span>
                      </button>

                      <button
                        type="button"
                        className="customer-dropdown-item"
                        onClick={() => {
                          setIsCustomerDropdownOpen(false);
                          setIsAuthModalOpen(true);
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '9px 12px',
                          borderRadius: '10px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: DINE_THEME.dark,
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background-color 0.15s'
                        }}
                      >
                        <i className="ri-user-settings-line" style={{ color: DINE_THEME.teal, fontSize: '16px' }} />
                        <span>Profile & Switch Account</span>
                      </button>

                      <button
                        type="button"
                        className="customer-dropdown-item"
                        onClick={() => {
                          setIsCustomerDropdownOpen(false);
                          setIsCartOpen(true);
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '9px 12px',
                          borderRadius: '10px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: DINE_THEME.dark,
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background-color 0.15s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <i className="ri-shopping-bag-3-line" style={{ color: DINE_THEME.teal, fontSize: '16px' }} />
                          <span>View Current Cart</span>
                        </div>
                        {cart.length > 0 && (
                          <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px', backgroundColor: DINE_THEME.teal, color: '#FFF' }}>
                            {cart.reduce((s, i) => s + (i.qty || 1), 0)}
                          </span>
                        )}
                      </button>
                    </div>

                    <div style={{ height: '1px', backgroundColor: DINE_THEME.border, margin: '6px 4px' }} />

                    {/* Logout Button */}
                    <button
                      type="button"
                      className="customer-dropdown-item customer-logout-btn"
                      onClick={() => {
                        setIsCustomerDropdownOpen(false);
                        handleCustomerLogout();
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: 'none',
                        backgroundColor: isDarkMode ? 'rgba(220, 38, 38, 0.2)' : '#FEF2F2',
                        color: isDarkMode ? '#F87171' : '#DC2626',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s'
                      }}
                    >
                      <i className="ri-logout-box-r-line" style={{ fontSize: '16px', color: isDarkMode ? '#F87171' : '#DC2626' }} />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                style={{
                  backgroundColor: isDarkMode ? DINE_THEME.white : '#FFF',
                  color: isDarkMode ? DINE_THEME.teal : DINE_THEME.tealDark,
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
                boxShadow: `0 4px 14px ${DINE_THEME.tealGlow}`,
                transition: 'transform 0.15s ease'
              }}
            >
              <i className="ri-shopping-bag-3-fill" style={{ fontSize: '16px' }} />
              <span>Cart</span>
              {cartItemCount > 0 && (
                <span style={{
                  backgroundColor: isDarkMode ? '#0B0F19' : '#FFF',
                  color: isDarkMode ? '#5EEAD4' : DINE_THEME.tealDark,
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
        position: 'relative',
        background: themeConfig.hero_style === 'minimal'
          ? DINE_THEME.white
          : (restaurant?.banner_url
              ? `linear-gradient(to bottom, rgba(0,0,0,0.45), rgba(0,0,0,0.75)), url(${restaurant.banner_url}) center/cover no-repeat`
              : `linear-gradient(135deg, ${DINE_THEME.pink} 0%, ${DINE_THEME.white} 100%)`),
        borderBottom: `1px solid ${DINE_THEME.border}`,
        padding: themeConfig.hero_style === 'minimal'
          ? '24px 20px 20px'
          : (themeConfig.hero_style === 'glass' ? '36px 20px' : (restaurant?.banner_url ? '44px 20px 36px' : '28px 20px 24px')),
        color: (themeConfig.hero_style !== 'minimal' && restaurant?.banner_url) ? '#FFFFFF' : DINE_THEME.dark,
        transition: 'all 0.3s ease'
      }}>
        <div style={{
          maxWidth: '1240px',
          margin: '0 auto',
          ...(themeConfig.hero_style === 'glass' && restaurant?.banner_url ? {
            backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.72)' : 'rgba(255, 255, 255, 0.82)',
            backdropFilter: 'blur(16px)',
            borderRadius: DINE_THEME.radius,
            padding: '24px 28px',
            border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.6)'}`,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)'
          } : {})
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '20px' }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: (themeConfig.hero_style !== 'minimal' && restaurant?.banner_url) ? 'rgba(255,255,255,0.2)' : DINE_THEME.white,
                backdropFilter: (themeConfig.hero_style !== 'minimal' && restaurant?.banner_url) ? 'blur(8px)' : 'none',
                padding: '4px 12px',
                borderRadius: DINE_THEME.pillRadius,
                border: (themeConfig.hero_style !== 'minimal' && restaurant?.banner_url) ? '1px solid rgba(255,255,255,0.3)' : `1px solid ${DINE_THEME.border}`,
                fontSize: '11px',
                fontWeight: 800,
                color: (themeConfig.hero_style !== 'minimal' && restaurant?.banner_url) ? '#FFF' : DINE_THEME.teal,
                marginBottom: '8px'
              }}>
                <i className="ri-store-2-line" style={{ color: (themeConfig.hero_style !== 'minimal' && restaurant?.banner_url) ? '#FCD34D' : DINE_THEME.teal }} />
                <span>{restaurant?.cuisine_type ? `${restaurant.cuisine_type.toUpperCase()} • DIGITAL STOREFRONT` : 'AUTHENTIC RESTAURANT STOREFRONT'}</span>
              </div>
              <h2 style={{
                margin: '0 0 6px 0',
                fontSize: '28px',
                fontWeight: 800,
                color: (themeConfig.hero_style !== 'minimal' && restaurant?.banner_url) ? '#FFFFFF' : DINE_THEME.dark,
                letterSpacing: '-0.5px',
                textShadow: (themeConfig.hero_style !== 'minimal' && restaurant?.banner_url) ? '0 2px 10px rgba(0,0,0,0.5)' : 'none'
              }}>
                {restaurant?.name ? `Welcome to ${restaurant.name}` : 'Crave It? Tap, Customize & Dine.'}
              </h2>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: (themeConfig.hero_style !== 'minimal' && restaurant?.banner_url) ? 'rgba(255,255,255,0.9)' : DINE_THEME.slate,
                maxWidth: '580px',
                lineHeight: 1.5,
                textShadow: (themeConfig.hero_style !== 'minimal' && restaurant?.banner_url) ? '0 1px 4px rgba(0,0,0,0.4)' : 'none'
              }}>
                {restaurant?.cuisine_type
                  ? `Freshly prepared ${restaurant.cuisine_type.toLowerCase()} specialties made to order. Direct kitchen dispatch.`
                  : 'Handcrafted meals, drinks & specialty items brewed fresh to order.'}
              </p>
            </div>

            {/* Mode-Tailored Arrival & Service Indicator */}
            <div style={{
              backgroundColor: diningMode === 'dine_in'
                ? (isDarkMode ? 'rgba(6, 78, 59, 0.35)' : '#F0FDF4')
                : (isDarkMode ? 'rgba(124, 45, 18, 0.35)' : '#FFF7ED'),
              padding: '14px 18px',
              borderRadius: '16px',
              border: `1.5px solid ${diningMode === 'dine_in'
                ? (isDarkMode ? 'rgba(16, 185, 129, 0.4)' : '#86EFAC')
                : (isDarkMode ? 'rgba(249, 115, 22, 0.4)' : '#FDBA74')}`,
              boxShadow: diningMode === 'dine_in' ? '0 4px 16px rgba(16, 185, 129, 0.1)' : '0 4px 16px rgba(234, 88, 12, 0.1)',
              color: DINE_THEME.dark,
              minWidth: '280px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 800, color: diningMode === 'dine_in' ? (isDarkMode ? '#6EE7B7' : '#065F46') : (isDarkMode ? '#FDBA74' : '#9A3412') }}>
                  <i className={diningMode === 'dine_in' ? 'ri-restaurant-2-fill' : 'ri-time-fill'} style={{ color: diningMode === 'dine_in' ? (isDarkMode ? '#34D399' : '#059669') : (isDarkMode ? '#FB923C' : '#EA580C'), fontSize: '15px' }} />
                  <span>{diningMode === 'dine_in' ? 'Dine-In Arrival & Seating:' : 'Takeout Pickup Window:'}</span>
                </div>
                <span style={{
                  fontSize: '10px',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '10px',
                  backgroundColor: diningMode === 'dine_in'
                    ? (isDarkMode ? 'rgba(5, 150, 105, 0.3)' : '#DCFCE7')
                    : (isDarkMode ? 'rgba(234, 88, 12, 0.3)' : '#FFEDD5'),
                  color: diningMode === 'dine_in'
                    ? (isDarkMode ? '#A7F3D0' : '#15803D')
                    : (isDarkMode ? '#FED7AA' : '#C2410C')
                }}>
                  {diningMode === 'dine_in' ? `Table ${selectedTable}` : 'Counter Pickup'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {ARRIVAL_TIMES.map(t => {
                  const isSelected = selectedArrival === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setSelectedArrival(t)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        border: isSelected
                          ? `1.5px solid ${diningMode === 'dine_in' ? '#059669' : '#EA580C'}`
                          : (isDarkMode ? '1px solid #2A364F' : '1px solid #CBD5E1'),
                        backgroundColor: isSelected
                          ? (diningMode === 'dine_in' ? '#059669' : '#EA580C')
                          : (isDarkMode ? '#1F293D' : '#FFF'),
                        color: isSelected ? '#FFF' : (isDarkMode ? '#CBD5E1' : '#475569'),
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.1)' : 'none'
                      }}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── DEDICATED DINING EXPERIENCE BANNER (Dine-In vs Takeout Identity) ─── */}
      <div style={{
        maxWidth: '1240px',
        margin: '18px auto 0',
        padding: '0 20px'
      }}>
        {diningMode === 'dine_in' ? (
          <div style={{
            background: isDarkMode
              ? 'linear-gradient(135deg, rgba(6, 78, 59, 0.45) 0%, #161F30 60%, rgba(6, 78, 59, 0.3) 100%)'
              : 'linear-gradient(135deg, #F0FDF4 0%, #FFFFFF 55%, #ECFDF5 100%)',
            border: isDarkMode ? '1.5px solid rgba(16, 185, 129, 0.4)' : '1.5px solid #86EFAC',
            borderRadius: '18px',
            padding: '16px 22px',
            boxShadow: isDarkMode ? '0 4px 20px rgba(0, 0, 0, 0.4)' : '0 4px 18px rgba(16, 185, 129, 0.08)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '300px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                flexShrink: 0
              }}>
                <i className="ri-restaurant-2-fill" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: isDarkMode ? '#6EE7B7' : '#065F46' }}>
                    Table Service Experience
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: isDarkMode ? 'rgba(5, 150, 105, 0.3)' : '#DCFCE7',
                    color: isDarkMode ? '#A7F3D0' : '#166534',
                    border: isDarkMode ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid #BBF7D0'
                  }}>
                    Assigned: {selectedTable}
                  </span>
                </div>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: isDarkMode ? '#94A3B8' : '#047857' }}>
                  Take a seat! Dishes are freshly cooked and delivered directly to your table with dining tableware.
                </p>
              </div>
            </div>

            {/* Quick Table Switcher Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: isDarkMode ? '#6EE7B7' : '#065F46', marginRight: '4px' }}>
                Quick Switch Table:
              </span>
              {(data?.tables?.length > 0 ? data.tables : [{ table_number: 'Table 1' }, { table_number: 'Table 2' }, { table_number: 'Table 3' }, { table_number: 'Table 4' }, { table_number: 'VIP Table' }]).slice(0, 6).map(t => (
                <button
                  key={t.table_number}
                  type="button"
                  onClick={() => setSelectedTable(t.table_number)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: selectedTable === t.table_number
                      ? '2px solid #059669'
                      : (isDarkMode ? '1px solid #2A364F' : '1px solid #CBD5E1'),
                    backgroundColor: selectedTable === t.table_number
                      ? '#059669'
                      : (isDarkMode ? '#1F293D' : '#FFF'),
                    color: selectedTable === t.table_number
                      ? '#FFF'
                      : (isDarkMode ? '#E2E8F0' : '#334155'),
                    transition: 'all 0.15s ease',
                    boxShadow: selectedTable === t.table_number ? '0 2px 6px rgba(5, 150, 105, 0.25)' : 'none'
                  }}
                >
                  {t.table_number}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div style={{
            background: isDarkMode
              ? 'linear-gradient(135deg, rgba(124, 45, 18, 0.45) 0%, #161F30 60%, rgba(124, 45, 18, 0.3) 100%)'
              : 'linear-gradient(135deg, #FFF7ED 0%, #FFFFFF 55%, #FFEDD5 100%)',
            border: isDarkMode ? '1.5px solid rgba(249, 115, 22, 0.4)' : '1.5px solid #FDBA74',
            borderRadius: '18px',
            padding: '16px 22px',
            boxShadow: isDarkMode ? '0 4px 20px rgba(0, 0, 0, 0.4)' : '0 4px 18px rgba(234, 88, 12, 0.08)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '300px' }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '14px',
                background: 'linear-gradient(135deg, #EA580C 0%, #F97316 100%)',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '22px',
                boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)',
                flexShrink: 0
              }}>
                <i className="ri-takeaway-fill" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '15px', fontWeight: 800, color: isDarkMode ? '#FDBA74' : '#9A3412' }}>
                    Takeout & To-Go Express
                  </span>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: isDarkMode ? 'rgba(234, 88, 12, 0.3)' : '#FFEDD5',
                    color: isDarkMode ? '#FED7AA' : '#C2410C',
                    border: isDarkMode ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid #FED7AA'
                  }}>
                    Ready in: {selectedArrival}
                  </span>
                  <span style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '10px',
                    backgroundColor: isDarkMode ? 'rgba(180, 83, 9, 0.3)' : '#FEF3C7',
                    color: isDarkMode ? '#FCD34D' : '#92400E'
                  }}>
                    Front Counter #1
                  </span>
                </div>
                <p style={{ margin: '2px 0 0', fontSize: '12px', color: isDarkMode ? '#94A3B8' : '#C2410C' }}>
                  Fast pickup at counter. Sealed in tamper-evident thermal boxes with eco-friendly utensils.
                </p>
              </div>
            </div>

            {/* Quick Pickup Window Chips */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: isDarkMode ? '#FDBA74' : '#9A3412', marginRight: '4px' }}>
                Pickup Timing:
              </span>
              {ARRIVAL_TIMES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedArrival(t)}
                  style={{
                    padding: '5px 10px',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    border: selectedArrival === t
                      ? '2px solid #EA580C'
                      : (isDarkMode ? '1px solid #2A364F' : '1px solid #CBD5E1'),
                    backgroundColor: selectedArrival === t
                      ? '#EA580C'
                      : (isDarkMode ? '#1F293D' : '#FFF'),
                    color: selectedArrival === t
                      ? '#FFF'
                      : (isDarkMode ? '#E2E8F0' : '#334155'),
                    transition: 'all 0.15s ease',
                    boxShadow: selectedArrival === t ? '0 2px 6px rgba(234, 88, 12, 0.25)' : 'none'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ─── LIVE ORDER TRACKER BANNER (If Active Order) ───────────────── */}
      {activeOrder && (
        <div style={{
          backgroundColor: DINE_THEME.white,
          borderBottom: `2px solid ${DINE_THEME.teal}`,
          padding: '16px 20px',
          boxShadow: `0 4px 20px ${DINE_THEME.tealLight}`
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
              <div style={{ position: 'absolute', top: '16px', left: '20px', right: '20px', height: '3px', backgroundColor: isDarkMode ? '#2A364F' : '#E2E8F0', zIndex: 1 }} />
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
                      backgroundColor: isPassed ? DINE_THEME.teal : (isDarkMode ? '#1F293D' : '#FFF'),
                      border: `2px solid ${isPassed ? DINE_THEME.teal : (isDarkMode ? '#2A364F' : '#CBD5E1')}`,
                      color: isPassed ? '#FFF' : DINE_THEME.slate,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      boxShadow: isCurrent ? `0 0 0 4px ${DINE_THEME.tealLight}` : 'none',
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

        {/* Category Navigation & Live Search Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginBottom: '20px' }}>
          {/* Dynamic Category Count Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: 800, color: DINE_THEME.dark }}>
              Menu Catalog
            </span>
            <span style={{ fontSize: '12px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px', backgroundColor: DINE_THEME.pinkLight, color: DINE_THEME.slate, border: `1px solid ${DINE_THEME.border}` }}>
              {categories.length} {categories.length === 1 ? 'Category' : 'Categories'} • {allItems.length} {allItems.length === 1 ? 'Item' : 'Items'}
            </span>
          </div>

          {/* Search Box */}
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: DINE_THEME.white, borderRadius: '12px', border: `1px solid ${DINE_THEME.border}`, padding: '7px 14px', width: '320px', maxWidth: '100%', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
            <i className="ri-search-line" style={{ color: DINE_THEME.slate, marginRight: '8px', fontSize: '16px' }} />
            <input
              type="text"
              placeholder="Search dishes, drinks, extras..."
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
                  borderRadius: DINE_THEME.pillRadius,
                  fontSize: '13px',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  border: isCatActive ? `1px solid ${DINE_THEME.teal}` : `1px solid ${DINE_THEME.border}`,
                  backgroundColor: isCatActive ? DINE_THEME.teal : DINE_THEME.white,
                  color: isCatActive ? '#FFF' : DINE_THEME.dark,
                  boxShadow: isCatActive ? `0 4px 12px ${DINE_THEME.tealGlow}` : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {catName}
              </button>
            );
          })}
        </div>

        {/* ─── RESPONSIVE MENU CARDS GRID / COMPACT LIST ─────────────────── */}
        {allItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '64px 20px', backgroundColor: DINE_THEME.white, borderRadius: DINE_THEME.radius, border: `1px solid ${DINE_THEME.border}`, maxWidth: '600px', margin: '30px auto' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: DINE_THEME.tealLight, color: DINE_THEME.tealDark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', margin: '0 auto 16px' }}>
              <i className="ri-restaurant-line" />
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 800, color: DINE_THEME.dark }}>
              Menu Coming Soon
            </h3>
            <p style={{ margin: '0 0 20px 0', color: DINE_THEME.slate, fontSize: '14px', lineHeight: 1.5 }}>
              <strong>{restaurant?.name || 'This restaurant'}</strong> has not published any menu items yet. Tenant portal admins can add categories and dishes directly from their management dashboard.
            </p>
            <a
              href={`/portal/${slug}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: DINE_THEME.pillRadius,
                backgroundColor: DINE_THEME.teal,
                color: '#FFF',
                fontWeight: 700,
                fontSize: '13px',
                textDecoration: 'none'
              }}
            >
              <i className="ri-dashboard-line" />
              <span>Open Tenant Management Portal</span>
            </a>
          </div>
        ) : filteredItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: DINE_THEME.white, borderRadius: DINE_THEME.radius, border: `1px solid ${DINE_THEME.border}` }}>
            <i className="ri-search-2-line" style={{ fontSize: '42px', color: DINE_THEME.slate, display: 'block', marginBottom: '10px' }} />
            <h4 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 700, color: DINE_THEME.dark }}>No dishes found</h4>
            <p style={{ margin: 0, color: DINE_THEME.slate, fontSize: '14px' }}>Try searching for a different item or switch category filters.</p>
          </div>
        ) : themeConfig.card_density === 'compact_list' ? (
          /* Compact Bistro List View */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filteredItems.map(item => (
              <div
                key={item.id}
                style={{
                  backgroundColor: DINE_THEME.white,
                  borderRadius: DINE_THEME.radius,
                  border: `1px solid ${DINE_THEME.border}`,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  cursor: 'pointer'
                }}
                onClick={() => openProductModal(item)}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = `0 6px 18px ${DINE_THEME.tealLight}`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.03)';
                }}
              >
                <img
                  src={item.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&auto=format&fit=crop&q=80'}
                  alt={item.name}
                  style={{ width: '84px', height: '84px', borderRadius: DINE_THEME.radius, objectFit: 'cover', flexShrink: 0 }}
                  loading="lazy"
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: DINE_THEME.dark }}>
                      {item.name}
                    </h3>
                    {item.badge && (
                      <span style={{
                        backgroundColor: item.badge === 'Bestseller' ? DINE_THEME.teal : DINE_THEME.gold,
                        color: '#FFF',
                        fontSize: '10px',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: DINE_THEME.pillRadius
                      }}>
                        {item.badge}
                      </span>
                    )}
                  </div>
                  <p style={{
                    margin: '0 0 6px 0',
                    fontSize: '12px',
                    color: DINE_THEME.slate,
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {item.description || 'Prepared fresh with high quality ingredients.'}
                  </p>
                  <span style={{ fontSize: '11px', color: DINE_THEME.slate, fontWeight: 600 }}>
                    {item.categoryName}
                  </span>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <span style={{ fontSize: '17px', fontWeight: 800, color: DINE_THEME.dark }}>
                    ₱{item.price.toFixed(0)}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      openProductModal(item);
                    }}
                    style={{
                      backgroundColor: DINE_THEME.teal,
                      color: '#FFF',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: DINE_THEME.pillRadius,
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      boxShadow: `0 2px 8px ${DINE_THEME.tealLight}`
                    }}
                  >
                    <i className="ri-add-line" style={{ fontWeight: 800 }} />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Spacious Visual Grid View */
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
            gap: '20px'
          }}>
            {filteredItems.map(item => (
              <div
                key={item.id}
                style={{
                  backgroundColor: DINE_THEME.white,
                  borderRadius: DINE_THEME.radius,
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
                  e.currentTarget.style.boxShadow = `0 12px 28px ${DINE_THEME.tealLight}`;
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
                      backgroundColor: item.badge === 'Bestseller' ? DINE_THEME.teal : DINE_THEME.gold,
                      color: '#FFF',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: DINE_THEME.pillRadius,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }}>
                      {item.badge}
                    </span>
                  )}
                  {/* Mode badge on card photo */}
                  <span style={{
                    position: 'absolute',
                    bottom: '10px',
                    left: '10px',
                    backgroundColor: diningMode === 'dine_in' ? 'rgba(5, 150, 105, 0.92)' : 'rgba(234, 88, 12, 0.92)',
                    backdropFilter: 'blur(4px)',
                    color: '#FFF',
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: DINE_THEME.pillRadius,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                  }}>
                    <i className={diningMode === 'dine_in' ? 'ri-restaurant-2-fill' : 'ri-takeaway-fill'} />
                    <span>{diningMode === 'dine_in' ? 'Dine-In' : 'To-Go'}</span>
                  </span>

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
                    borderRadius: DINE_THEME.pillRadius
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
                        backgroundColor: diningMode === 'dine_in'
                          ? (isDarkMode ? 'rgba(5, 150, 105, 0.22)' : '#F0FDF4')
                          : (isDarkMode ? 'rgba(234, 88, 12, 0.22)' : '#FFF7ED'),
                        color: diningMode === 'dine_in'
                          ? (isDarkMode ? '#6EE7B7' : '#065F46')
                          : (isDarkMode ? '#FDBA74' : '#9A3412'),
                        border: `1.5px solid ${diningMode === 'dine_in' ? (isDarkMode ? 'rgba(16, 185, 129, 0.4)' : '#86EFAC') : (isDarkMode ? 'rgba(249, 115, 22, 0.4)' : '#FDBA74')}`,
                        padding: '6px 14px',
                        borderRadius: DINE_THEME.pillRadius,
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <i className={diningMode === 'dine_in' ? 'ri-restaurant-2-line' : 'ri-takeaway-line'} style={{ fontWeight: 800 }} />
                      <span>{diningMode === 'dine_in' ? 'Order for Table' : 'Order To-Go'}</span>
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
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: DINE_THEME.white,
            borderRadius: '20px',
            width: '100%',
            maxWidth: '520px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 24px 60px rgba(0,0,0,0.35)',
            border: `1px solid ${DINE_THEME.border}`,
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
                  backgroundColor: isDarkMode ? 'rgba(22, 31, 48, 0.9)' : 'rgba(255,255,255,0.9)',
                  border: `1px solid ${DINE_THEME.border}`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  color: DINE_THEME.dark,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
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
                        backgroundColor: modalSize === sz ? DINE_THEME.tealLight : (isDarkMode ? '#1F293D' : '#FFF'),
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
                          backgroundColor: modalSugar === s ? DINE_THEME.tealLight : (isDarkMode ? '#1F293D' : '#FFF'),
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
                  {availableAddons.map(addon => {
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
                          backgroundColor: isChecked ? DINE_THEME.pinkLight : (isDarkMode ? '#1F293D' : '#F8FAFC'),
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
                    backgroundColor: isDarkMode ? '#1F293D' : '#FFF',
                    color: DINE_THEME.dark,
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
                    boxShadow: `0 6px 16px ${DINE_THEME.tealGlow}`
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
            backgroundColor: DINE_THEME.white,
            width: '100%',
            maxWidth: '460px',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '-8px 0 30px rgba(0,0,0,0.3)',
            borderLeft: `1px solid ${DINE_THEME.border}`
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

            {/* Cart Mode Banner */}
            <div style={{
              padding: '12px 18px',
              backgroundColor: diningMode === 'dine_in'
                ? (isDarkMode ? 'rgba(6, 78, 59, 0.35)' : '#F0FDF4')
                : (isDarkMode ? 'rgba(124, 45, 18, 0.35)' : '#FFF7ED'),
              borderBottom: `1.5px solid ${diningMode === 'dine_in'
                ? (isDarkMode ? 'rgba(16, 185, 129, 0.4)' : '#86EFAC')
                : (isDarkMode ? 'rgba(249, 115, 22, 0.4)' : '#FDBA74')}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  backgroundColor: diningMode === 'dine_in' ? '#059669' : '#EA580C',
                  color: '#FFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  flexShrink: 0
                }}>
                  <i className={diningMode === 'dine_in' ? 'ri-restaurant-2-fill' : 'ri-takeaway-fill'} />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: diningMode === 'dine_in' ? (isDarkMode ? '#6EE7B7' : '#065F46') : (isDarkMode ? '#FDBA74' : '#9A3412') }}>
                    {diningMode === 'dine_in' ? `Dine-In • Table Service` : `Takeout / To-Go Express`}
                  </div>
                  <div style={{ fontSize: '11px', color: diningMode === 'dine_in' ? (isDarkMode ? '#A7F3D0' : '#047857') : (isDarkMode ? '#FED7AA' : '#C2410C') }}>
                    {diningMode === 'dine_in'
                      ? `Served fresh to ${selectedTable}`
                      : `Pick up at counter • Est: ${selectedArrival}`}
                  </div>
                </div>
              </div>

              {diningMode === 'dine_in' ? (
                <select
                  value={selectedTable}
                  onChange={e => setSelectedTable(e.target.value)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '8px',
                    border: isDarkMode ? '1.5px solid rgba(16, 185, 129, 0.4)' : '1.5px solid #86EFAC',
                    backgroundColor: isDarkMode ? '#1F293D' : '#FFF',
                    color: isDarkMode ? '#A7F3D0' : '#065F46',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {(data?.tables?.length > 0 ? data.tables : [{ table_number: 'Table 1' }, { table_number: 'Table 2' }, { table_number: 'Table 3' }, { table_number: 'Table 4' }, { table_number: 'VIP Table' }]).map(t => (
                    <option key={t.table_number} value={t.table_number} style={{ backgroundColor: isDarkMode ? '#161F30' : '#FFF', color: isDarkMode ? '#F8FAFC' : '#065F46' }}>{t.table_number}</option>
                  ))}
                </select>
              ) : (
                <select
                  value={selectedArrival}
                  onChange={e => setSelectedArrival(e.target.value)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '8px',
                    border: isDarkMode ? '1.5px solid rgba(249, 115, 22, 0.4)' : '1.5px solid #FDBA74',
                    backgroundColor: isDarkMode ? '#1F293D' : '#FFF',
                    color: isDarkMode ? '#FED7AA' : '#9A3412',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  {ARRIVAL_TIMES.map(t => (
                    <option key={t} value={t} style={{ backgroundColor: isDarkMode ? '#161F30' : '#FFF', color: isDarkMode ? '#F8FAFC' : '#9A3412' }}>{t}</option>
                  ))}
                </select>
              )}
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
                        backgroundColor: isDarkMode ? '#1F293D' : '#FFF',
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
                            style={{ width: '28px', height: '28px', border: 'none', background: 'none', fontWeight: 800, color: DINE_THEME.dark, cursor: 'pointer' }}
                          >
                            -
                          </button>
                          <span style={{ width: '24px', textAlign: 'center', fontSize: '13px', fontWeight: 700, color: DINE_THEME.dark }}>
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateCartItemQty(item.cartItemId, 1)}
                            style={{ width: '28px', height: '28px', border: 'none', background: 'none', fontWeight: 800, color: DINE_THEME.dark, cursor: 'pointer' }}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Takeout Specific Options (Cutlery & Packaging Notes) */}
                  {diningMode === 'takeaway' && (
                    <div style={{
                      backgroundColor: isDarkMode ? 'rgba(124, 45, 18, 0.3)' : '#FFF7ED',
                      border: isDarkMode ? '1.5px solid rgba(249, 115, 22, 0.4)' : '1.5px solid #FED7AA',
                      borderRadius: '12px',
                      padding: '12px 14px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 700, color: isDarkMode ? '#FDBA74' : '#9A3412', cursor: 'pointer' }}>
                          <input
                            type="checkbox"
                            checked={includeUtensils}
                            onChange={e => setIncludeUtensils(e.target.checked)}
                            style={{ width: '16px', height: '16px', accentColor: '#EA580C', cursor: 'pointer' }}
                          />
                          <span>Include disposable cutlery, napkins & straws</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        placeholder="Special packaging notes (e.g. separate sauce, double bag)"
                        value={takeoutNotes}
                        onChange={e => setTakeoutNotes(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          borderRadius: '8px',
                          border: isDarkMode ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid #FDBA74',
                          backgroundColor: isDarkMode ? '#161F30' : '#FFF',
                          fontSize: '11px',
                          color: DINE_THEME.dark,
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  )}

                  {/* Customer Information Form */}
                  <div style={{ marginTop: '14px', paddingTop: '16px', borderTop: `1px solid ${DINE_THEME.border}` }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: 800, color: DINE_THEME.dark }}>
                      {diningMode === 'dine_in' ? 'Diner Table Information' : 'Pickup Customer Information'}
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
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            border: `1px solid ${DINE_THEME.border}`,
                            backgroundColor: isDarkMode ? '#1F293D' : '#FFF',
                            color: DINE_THEME.dark,
                            fontSize: '13px',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: DINE_THEME.slate, marginBottom: '4px' }}>
                          Mobile Number ({diningMode === 'takeaway' ? 'Required for pickup SMS alert' : 'Optional'})
                        </label>
                        <input
                          type="tel"
                          placeholder="e.g. 0917 123 4567"
                          value={customerPhone}
                          onChange={e => setCustomerPhone(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            border: `1px solid ${DINE_THEME.border}`,
                            backgroundColor: isDarkMode ? '#1F293D' : '#FFF',
                            color: DINE_THEME.dark,
                            fontSize: '13px',
                            boxSizing: 'border-box'
                          }}
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
                        {
                          id: 'Cash on Dine',
                          label: diningMode === 'dine_in' ? 'Pay at Table' : 'Pay at Counter',
                          icon: 'ri-money-dollar-circle-line',
                          color: '#F59E0B'
                        }
                      ].map(pay => (
                        <button
                          key={pay.id}
                          type="button"
                          onClick={() => setPaymentMethod(pay.id)}
                          style={{
                            padding: '10px 4px',
                            borderRadius: '10px',
                            border: paymentMethod === pay.id ? `2px solid ${pay.color}` : `1px solid ${DINE_THEME.border}`,
                            backgroundColor: paymentMethod === pay.id ? `${pay.color}20` : (isDarkMode ? '#1F293D' : '#FFF'),
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
                backgroundColor: DINE_THEME.white
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: DINE_THEME.slate, marginBottom: '4px' }}>
                  <span>Subtotal</span>
                  <span>₱{cartSubtotal.toFixed(0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: DINE_THEME.slate, marginBottom: '8px' }}>
                  <span>VAT & Packaging ({diningMode === 'takeaway' ? 'Eco-Box Included' : 'Included'})</span>
                  <span>₱0.00</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 800, color: DINE_THEME.dark, marginBottom: '14px' }}>
                  <span>Total Amount</span>
                  <span style={{ color: diningMode === 'dine_in' ? '#059669' : '#EA580C' }}>₱{cartSubtotal.toFixed(0)}</span>
                </div>

                <button
                  type="button"
                  disabled={isPlacingOrder}
                  onClick={handleCheckout}
                  style={{
                    width: '100%',
                    background: isPlacingOrder
                      ? DINE_THEME.slate
                      : (diningMode === 'dine_in'
                          ? 'linear-gradient(135deg, #059669 0%, #10B981 100%)'
                          : 'linear-gradient(135deg, #EA580C 0%, #F97316 100%)'),
                    color: '#FFF',
                    border: 'none',
                    padding: '14px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: isPlacingOrder ? 'not-allowed' : 'pointer',
                    boxShadow: diningMode === 'dine_in'
                      ? '0 6px 18px rgba(16, 185, 129, 0.35)'
                      : '0 6px 18px rgba(234, 88, 12, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {isPlacingOrder ? (
                    <>
                      <i className="ri-loader-4-line" style={{ animation: 'spin 1s linear infinite' }} />
                      <span>Placing Your Order...</span>
                    </>
                  ) : (
                    <>
                      <i className={diningMode === 'dine_in' ? 'ri-restaurant-2-fill' : 'ri-takeaway-fill'} style={{ fontSize: '16px' }} />
                      <span>
                        {diningMode === 'dine_in'
                          ? `Place Dine-In Order (${selectedTable}) • ₱${cartSubtotal.toFixed(0)}`
                          : `Place Takeout Order (${selectedArrival}) • ₱${cartSubtotal.toFixed(0)}`}
                      </span>
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
            backgroundColor: DINE_THEME.white,
            borderRadius: '20px',
            width: '100%',
            maxWidth: '540px',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '24px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
            border: `1px solid ${DINE_THEME.border}`
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
                    Real-Time Kitchen Status
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 800, color: DINE_THEME.dark }}>
                      Order #{activeOrder.order_number}
                    </span>
                    {activeOrder.order_type === 'takeaway' ? (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '10px',
                        backgroundColor: isDarkMode ? 'rgba(234, 88, 12, 0.3)' : '#FFEDD5',
                        color: isDarkMode ? '#FED7AA' : '#C2410C',
                        border: isDarkMode ? '1px solid rgba(249, 115, 22, 0.4)' : '1px solid #FED7AA',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        <i className="ri-takeaway-fill" /> Takeout Express
                      </span>
                    ) : (
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '10px',
                        backgroundColor: isDarkMode ? 'rgba(5, 150, 105, 0.3)' : '#DCFCE7',
                        color: isDarkMode ? '#A7F3D0' : '#15803D',
                        border: isDarkMode ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid #BBF7D0',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}>
                        <i className="ri-restaurant-2-fill" /> Dine-In Table Service
                      </span>
                    )}
                  </div>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    backgroundColor: currentStep === 5 ? '#10B981' : (activeOrder.order_type === 'takeaway' ? '#EA580C' : DINE_THEME.teal),
                    color: '#FFF'
                  }}>
                    {activeOrder.status}
                  </span>
                </div>

                <div style={{ fontSize: '12px', color: DINE_THEME.slate, marginBottom: '12px' }}>
                  Diner: <strong>{activeOrder.customer_name}</strong> •{' '}
                  {activeOrder.order_type === 'takeaway' ? (
                    <span>Pickup: <strong style={{ color: isDarkMode ? '#FDBA74' : '#C2410C' }}>Counter #1 ({activeOrder.arrivalTime || 'ASAP'})</strong></span>
                  ) : (
                    <span>Table: <strong style={{ color: isDarkMode ? '#6EE7B7' : '#15803D' }}>{activeOrder.table_number || selectedTable}</strong></span>
                  )}{' '}
                  • Method: <strong>{activeOrder.payment_method}</strong>
                </div>

                <div style={{ backgroundColor: isDarkMode ? '#1F293D' : '#FFF', borderRadius: '12px', padding: '10px 12px', border: `1px solid ${DINE_THEME.border}` }}>
                  {(activeOrder.items || []).map((it, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', padding: '6px 0', borderBottom: idx < (activeOrder.items || []).length - 1 ? `1px dashed ${DINE_THEME.border}` : 'none', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                        <img
                          src={it.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80'}
                          alt={it.item_name}
                          style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover', border: `1px solid ${DINE_THEME.border}`, flexShrink: 0 }}
                          onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80'; }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <span style={{ fontWeight: 700, color: DINE_THEME.dark, display: 'block' }}>
                            <span style={{ color: DINE_THEME.tealDark, fontWeight: 800 }}>{it.quantity}x</span> {it.item_name}
                          </span>
                          {it.instructions && (
                            <span style={{ fontSize: '11px', color: DINE_THEME.slate, display: 'block', marginTop: '1px' }}>
                              ({it.instructions})
                            </span>
                          )}
                        </div>
                      </div>
                      <span style={{ fontWeight: 800, color: DINE_THEME.tealDark, flexShrink: 0 }}>
                        ₱{(it.subtotal || it.price * it.quantity).toFixed(0)}
                      </span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', fontWeight: 800, paddingTop: '8px', marginTop: '6px', borderTop: `1px solid ${DINE_THEME.border}` }}>
                    <span>Total Bill</span>
                    <span style={{ color: DINE_THEME.tealDark }}>₱{Number(activeOrder.total).toFixed(0)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Past Orders History List */}
            <div style={{ marginTop: activeOrder ? '16px' : '0', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: DINE_THEME.dark }}>
                  Orders & Purchase History ({orderHistory.length})
                </h4>
                {customerUser && (
                  <span style={{ fontSize: '11px', color: DINE_THEME.teal, fontWeight: 700 }}>
                    {customerUser.name}
                  </span>
                )}
              </div>

              {orderHistory.length === 0 && !activeOrder ? (
                <div style={{
                  textAlign: 'center',
                  padding: '24px 16px',
                  backgroundColor: DINE_THEME.pinkLight,
                  borderRadius: '12px',
                  border: `1px dashed ${DINE_THEME.border}`
                }}>
                  <i className="ri-shopping-bag-line" style={{ fontSize: '30px', color: DINE_THEME.slate, display: 'block', marginBottom: '6px' }} />
                  <div style={{ fontSize: '13px', fontWeight: 700, color: DINE_THEME.dark }}>No Past Orders Found</div>
                  <span style={{ fontSize: '11px', color: DINE_THEME.slate }}>
                    Your placed orders will show up here with item breakdowns and status.
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                  {orderHistory.map(ord => {
                    const isSelected = activeOrder?.order_number === ord.order_number;
                    return (
                      <div
                        key={ord.id || ord.order_number}
                        onClick={() => setActiveOrder(ord)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '10px',
                          backgroundColor: isSelected ? (isDarkMode ? 'rgba(42, 157, 154, 0.25)' : '#F0FDFA') : (isDarkMode ? '#1F293D' : '#FFF'),
                          border: `1px solid ${isSelected ? DINE_THEME.teal : DINE_THEME.border}`,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <strong style={{ fontSize: '12px', color: DINE_THEME.dark }}>#{ord.order_number}</strong>
                            <span style={{
                              fontSize: '9px',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              padding: '2px 5px',
                              borderRadius: '4px',
                              backgroundColor: ord.status === 'completed' ? '#D1FAE5' : (ord.status === 'ready' ? '#FEF3C7' : DINE_THEME.tealLight),
                              color: ord.status === 'completed' ? '#065F46' : (ord.status === 'ready' ? '#92400E' : DINE_THEME.tealDark)
                            }}>
                              {ord.status}
                            </span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                            <span style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '1px 6px',
                              borderRadius: '4px',
                              backgroundColor: ord.order_type === 'takeaway' ? '#FFEDD5' : '#DCFCE7',
                              color: ord.order_type === 'takeaway' ? '#C2410C' : '#15803D'
                            }}>
                              {ord.order_type === 'takeaway' ? 'Takeout' : (ord.table_number || 'Dine-in')}
                            </span>
                            <span style={{ fontSize: '11px', color: DINE_THEME.slate }}>
                              {new Date(ord.created_at || Date.now()).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <strong style={{ fontSize: '13px', color: DINE_THEME.tealDark, display: 'block' }}>
                            ₱{Number(ord.total || 0).toFixed(0)}
                          </strong>
                          <span style={{ fontSize: '10px', color: DINE_THEME.slate }}>
                            {(ord.items || []).length} item{(ord.items || []).length === 1 ? '' : 's'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

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
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: DINE_THEME.white,
            borderRadius: '24px',
            width: '100%',
            maxWidth: '480px',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 25px 60px rgba(0,0,0,0.35)',
            border: `1px solid ${DINE_THEME.border}`,
            overflow: 'hidden'
          }}>
            {/* Modal Header */}
            <div style={{
              background: isDarkMode
                ? 'linear-gradient(135deg, #1F293D 0%, #161F30 100%)'
                : `linear-gradient(135deg, ${DINE_THEME.pinkLight} 0%, #FFF 100%)`,
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
                    {restaurant?.name || 'Restaurant'} • Customer Account
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
                  {/* Verified Customer Header Banner */}
                  <div style={{
                    background: `linear-gradient(135deg, ${DINE_THEME.tealDark} 0%, ${DINE_THEME.teal} 100%)`,
                    borderRadius: '16px',
                    padding: '20px',
                    color: '#FFF',
                    marginBottom: '20px',
                    boxShadow: `0 8px 24px ${DINE_THEME.tealGlow}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px'
                  }}>
                    <div>
                      <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', opacity: 0.85 }}>
                        Customer Account
                      </span>
                      <h4 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 800 }}>
                        {customerUser.name}
                      </h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.9 }}>
                        {customerUser.email || customerUser.phone || 'Dine-in Customer'}
                      </p>
                    </div>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '22px'
                    }}>
                      <i className="ri-user-smile-line" />
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
                      <span style={{ fontSize: '12px', color: DINE_THEME.slate, fontWeight: 600 }}>Full Name:</span>
                      <strong style={{ fontSize: '13px', color: DINE_THEME.dark }}>{customerUser.name}</strong>
                    </div>
                    {customerUser.email && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '12px', color: DINE_THEME.slate, fontWeight: 600 }}>Email Address:</span>
                        <strong style={{ fontSize: '13px', color: DINE_THEME.dark }}>{customerUser.email}</strong>
                      </div>
                    )}
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
                              backgroundColor: isDarkMode ? '#1F293D' : '#FFF',
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

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setIsAuthModalOpen(false)}
                      style={{
                        width: '100%',
                        padding: '13px',
                        borderRadius: '12px',
                        border: 'none',
                        backgroundColor: DINE_THEME.teal,
                        color: '#FFF',
                        fontSize: '14px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: `0 4px 14px ${DINE_THEME.tealGlow}`
                      }}
                    >
                      Continue Dining
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleCustomerLogout();
                        setIsAuthModalOpen(false);
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '12px',
                        border: isDarkMode ? '1.5px solid rgba(239, 68, 68, 0.4)' : `1.5px solid #FCA5A5`,
                        backgroundColor: isDarkMode ? 'rgba(220, 38, 38, 0.2)' : '#FEF2F2',
                        color: isDarkMode ? '#F87171' : '#DC2626',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                    >
                      <i className="ri-logout-box-r-line" style={{ fontSize: '16px' }} />
                      <span>Log Out of Account</span>
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
                        backgroundColor: authModalTab === 'signin' ? (isDarkMode ? '#1F293D' : '#FFF') : 'transparent',
                        color: authModalTab === 'signin' ? (isDarkMode ? '#F8FAFC' : DINE_THEME.tealDark) : DINE_THEME.slate,
                        fontWeight: 800,
                        fontSize: '13px',
                        cursor: 'pointer',
                        boxShadow: authModalTab === 'signin' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
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
                        backgroundColor: authModalTab === 'register' ? (isDarkMode ? '#1F293D' : '#FFF') : 'transparent',
                        color: authModalTab === 'register' ? (isDarkMode ? '#F8FAFC' : DINE_THEME.tealDark) : DINE_THEME.slate,
                        fontWeight: 800,
                        fontSize: '13px',
                        cursor: 'pointer',
                        boxShadow: authModalTab === 'register' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
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
                      backgroundColor: isDarkMode ? 'rgba(153, 27, 27, 0.3)' : '#FEE2E2',
                      color: isDarkMode ? '#FCA5A5' : '#991B1B',
                      border: isDarkMode ? '1px solid rgba(239, 68, 68, 0.4)' : 'none',
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
                    /* ─── CUSTOMER SIGN IN FORM ─── */
                    <form onSubmit={handleUnifiedLogin}>
                      <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '17px', fontWeight: 800, color: DINE_THEME.dark }}>
                          Sign In to {restaurant?.name || 'Restaurant'}
                        </h4>
                        <p style={{ margin: 0, fontSize: '12px', color: DINE_THEME.slate, lineHeight: 1.5 }}>
                          Access your past orders and enjoy fast 1-click checkout.
                        </p>
                      </div>

                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: DINE_THEME.slate, marginBottom: '6px' }}>
                          EMAIL OR MOBILE NUMBER *
                        </label>
                        <input
                          type="text"
                          value={authIdentifier}
                          onChange={e => setAuthIdentifier(e.target.value)}
                          placeholder="e.g. 0917 555 101 or diner@email.com"
                          required
                          style={{
                            width: '100%',
                            padding: '12px 14px',
                            borderRadius: '10px',
                            border: `1.5px solid ${DINE_THEME.border}`,
                            backgroundColor: isDarkMode ? '#1F293D' : '#FFF',
                            color: DINE_THEME.dark,
                            outline: 'none',
                            fontSize: '14px',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: '18px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: DINE_THEME.slate, marginBottom: '6px' }}>
                          PASSWORD *
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type={showAuthPassword ? 'text' : 'password'}
                            value={authPassword}
                            onChange={e => setAuthPassword(e.target.value)}
                            placeholder="Enter your account password"
                            required
                            style={{
                              width: '100%',
                              padding: '12px 42px 12px 14px',
                              borderRadius: '10px',
                              border: `1.5px solid ${DINE_THEME.border}`,
                              backgroundColor: isDarkMode ? '#1F293D' : '#FFF',
                              color: DINE_THEME.dark,
                              outline: 'none',
                              fontSize: '14px',
                              boxSizing: 'border-box'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowAuthPassword(!showAuthPassword)}
                            style={{
                              position: 'absolute',
                              right: '12px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              color: showAuthPassword ? DINE_THEME.teal : DINE_THEME.slate,
                              cursor: 'pointer',
                              padding: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '16px'
                            }}
                            title={showAuthPassword ? 'Hide password' : 'Show password'}
                          >
                            <i className={showAuthPassword ? 'ri-eye-off-line' : 'ri-eye-line'} />
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={authLoading || !authIdentifier.trim() || !authPassword.trim()}
                        style={{
                          width: '100%',
                          padding: '14px',
                          backgroundColor: DINE_THEME.teal,
                          color: '#FFF',
                          border: 'none',
                          borderRadius: '12px',
                          fontSize: '14px',
                          fontWeight: 800,
                          cursor: (authLoading || !authIdentifier.trim() || !authPassword.trim()) ? 'not-allowed' : 'pointer',
                          boxShadow: `0 6px 20px ${DINE_THEME.tealGlow}`,
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

                      <div style={{ marginTop: '16px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
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
                        <a
                          href={`/portal/${slug}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: DINE_THEME.slate,
                            fontSize: '11px',
                            textDecoration: 'none',
                            fontWeight: 600,
                            marginTop: '4px'
                          }}
                        >
                          Restaurant Staff / Owner? <span style={{ color: DINE_THEME.tealDark, textDecoration: 'underline' }}>Open Restaurant Portal ↗</span>
                        </a>
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
                          Save your favorite orders and enjoy fast 1-click checkout!
                        </p>
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
                            backgroundColor: isDarkMode ? '#1F293D' : '#FFF',
                            color: DINE_THEME.dark,
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
                            backgroundColor: isDarkMode ? '#1F293D' : '#FFF',
                            color: DINE_THEME.dark,
                            outline: 'none',
                            fontSize: '14px',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: '14px' }}>
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
                            backgroundColor: isDarkMode ? '#1F293D' : '#FFF',
                            color: DINE_THEME.dark,
                            outline: 'none',
                            fontSize: '14px',
                            boxSizing: 'border-box'
                          }}
                        />
                      </div>

                      <div style={{ marginBottom: '18px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: DINE_THEME.slate, marginBottom: '6px' }}>
                          CREATE PASSWORD *
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type={showRegPassword ? 'text' : 'password'}
                            required
                            value={regPassword}
                            onChange={e => setRegPassword(e.target.value)}
                            placeholder="Create account password"
                            style={{
                              width: '100%',
                              padding: '12px 42px 12px 14px',
                              borderRadius: '10px',
                              border: `1.5px solid ${DINE_THEME.border}`,
                              backgroundColor: isDarkMode ? '#1F293D' : '#FFF',
                              color: DINE_THEME.dark,
                              outline: 'none',
                              fontSize: '14px',
                              boxSizing: 'border-box'
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowRegPassword(!showRegPassword)}
                            style={{
                              position: 'absolute',
                              right: '12px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'none',
                              border: 'none',
                              color: showRegPassword ? DINE_THEME.teal : DINE_THEME.slate,
                              cursor: 'pointer',
                              padding: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '16px'
                            }}
                            title={showRegPassword ? 'Hide password' : 'Show password'}
                          >
                            <i className={showRegPassword ? 'ri-eye-off-line' : 'ri-eye-line'} />
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={authLoading || !regName.trim() || !regPhone.trim() || !regPassword.trim()}
                        style={{
                          width: '100%',
                          padding: '14px',
                          backgroundColor: DINE_THEME.teal,
                          color: '#FFF',
                          border: 'none',
                          borderRadius: '12px',
                          fontSize: '14px',
                          fontWeight: 800,
                          cursor: (authLoading || !regName.trim() || !regPhone.trim() || !regPassword.trim()) ? 'not-allowed' : 'pointer',
                          boxShadow: `0 6px 20px ${DINE_THEME.tealGlow}`,
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

      {/* ─── ORDER COMPLETED CELEBRATION & CONFIRMATION MODAL ───────────── */}
      {isOrderCompletedModalOpen && activeOrder && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 120,
          padding: '20px',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            backgroundColor: DINE_THEME.white,
            borderRadius: '24px',
            maxWidth: '480px',
            width: '100%',
            padding: '32px 26px',
            textAlign: 'center',
            boxShadow: isDarkMode ? '0 25px 60px rgba(0,0,0,0.7)' : '0 25px 60px rgba(0,0,0,0.3)',
            border: isDarkMode ? '1px solid #059669' : '2px solid #86EFAC',
            position: 'relative'
          }}>
            {/* Celebration Icon */}
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '44px',
              margin: '0 auto 18px',
              boxShadow: '0 10px 25px rgba(16, 185, 129, 0.35)'
            }}>
              <i className="ri-checkbox-circle-fill" />
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: isDarkMode ? 'rgba(5, 150, 105, 0.25)' : '#DCFCE7',
              color: isDarkMode ? '#6EE7B7' : '#166534',
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '11px',
              fontWeight: 800,
              textTransform: 'uppercase',
              marginBottom: '8px'
            }}>
              <i className="ri-checkbox-circle-fill" style={{ color: '#10B981' }} />
              <span>Order Completed</span>
            </div>

            <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 800, color: DINE_THEME.dark, letterSpacing: '-0.3px' }}>
              {activeOrder.order_type === 'takeaway' ? 'Your Takeout is Ready!' : 'Hope You Enjoyed Your Meal!'}
            </h3>

            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: DINE_THEME.slate, lineHeight: 1.5 }}>
              Order <strong style={{ color: DINE_THEME.dark }}>#{activeOrder.order_number}</strong> has been completed.
              {activeOrder.order_type === 'takeaway'
                ? ' Thank you for ordering with us. Please pick up your food at the front counter.'
                : ` Thank you for dining at ${restaurant?.name || 'our restaurant'}! Dishes have been served to Table ${activeOrder.table_number || selectedTable}.`}
            </p>

            {/* Order Recap Card */}
            <div style={{
              backgroundColor: isDarkMode ? '#1F293D' : '#F8FAFC',
              borderRadius: '16px',
              padding: '16px',
              border: `1px solid ${DINE_THEME.border}`,
              marginBottom: '20px',
              textAlign: 'left'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '8px', borderBottom: `1px solid ${DINE_THEME.border}` }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: DINE_THEME.dark }}>
                  {activeOrder.order_type === 'takeaway' ? 'Takeout Order' : `Table Service (${activeOrder.table_number || selectedTable})`}
                </span>
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#10B981' }}>
                  ₱{Number(activeOrder.total || 0).toFixed(0)}
                </span>
              </div>

              {/* Items summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
                {(activeOrder.items || []).map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                    <span style={{ color: DINE_THEME.dark, fontWeight: 600 }}>
                      <strong style={{ color: '#10B981' }}>{it.quantity}x</strong> {it.item_name}
                    </span>
                    <span style={{ color: DINE_THEME.slate, fontWeight: 700 }}>
                      ₱{(it.subtotal || it.price * it.quantity || 0).toFixed(0)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Prompt banner */}
            <div style={{
              backgroundColor: isDarkMode ? 'rgba(5, 150, 105, 0.2)' : '#ECFDF5',
              border: isDarkMode ? '1px solid rgba(5, 150, 105, 0.4)' : '1px solid #A7F3D0',
              borderRadius: '12px',
              padding: '10px 14px',
              marginBottom: '20px',
              fontSize: '12px',
              color: isDarkMode ? '#6EE7B7' : '#065F46',
              fontWeight: 600
            }}>
              <i className="ri-information-line" style={{ marginRight: '6px' }} />
              Confirm this order to complete your current session so you are ready to order again anytime.
            </div>

            {/* Confirm & Ready Button */}
            <button
              type="button"
              onClick={handleConfirmCompletedOrder}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
                color: '#FFF',
                border: 'none',
                padding: '14px 20px',
                borderRadius: '14px',
                fontSize: '15px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 8px 20px rgba(5, 150, 105, 0.35)',
                transition: 'all 0.2s ease'
              }}
            >
              <i className="ri-check-double-line" style={{ fontSize: '18px' }} />
              <span>Confirm & Ready for Another Order</span>
            </button>
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
          backgroundColor: DINE_THEME.white,
          borderTop: `1px solid ${DINE_THEME.border}`,
          padding: '12px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          zIndex: 35,
          boxShadow: isDarkMode ? '0 -4px 20px rgba(0,0,0,0.5)' : '0 -4px 16px rgba(0,0,0,0.06)'
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
