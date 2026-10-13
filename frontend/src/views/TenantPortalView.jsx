import React, { useState, useEffect, useRef, useMemo } from 'react';
import { api } from '../services/api';
import ConfirmModal from '../components/ConfirmModal';
import DineBrandLogo from '../components/DineBrandLogo';

export const THEME_PRESETS = [
  {
    id: 'teal_pink_dine',
    name: 'Teal & Pink Mix',
    icon: 'ri-flashlight-line',
    primary: '#00C4CC',
    secondary: '#0F172A',
    accent: '#FF2A85',
    bgStyle: 'slate_clean',
    font: 'Plus Jakarta Sans',
    radius: 'smooth',
    hero: 'cinematic',
    desc: 'Dine Signature • Luminous aqua teal with hot neon magenta pink'
  },
  {
    id: 'cyber_teal_pink',
    name: 'Cyber Teal & Neon Pink',
    icon: 'ri-sparkling-fill',
    primary: '#00C4CC',
    secondary: '#F8FAFC',
    accent: '#FF2A85',
    bgStyle: 'midnight_dark',
    font: 'Space Grotesk',
    radius: 'smooth',
    hero: 'glass',
    desc: 'Midnight dark lounge with luminous aqua teal and hot neon pink'
  },
  {
    id: 'emerald_clean',
    name: 'Emerald Botanical',
    icon: 'ri-leaf-line',
    primary: '#10B981',
    secondary: '#064E3B',
    accent: '#F59E0B',
    bgStyle: 'matcha_soft',
    font: 'Outfit',
    radius: 'smooth',
    hero: 'cinematic',
    desc: 'Fresh organic greens & warm amber accents'
  },
  {
    id: 'tokyo_midnight',
    name: 'Tokyo Midnight Dark',
    icon: 'ri-moon-clear-line',
    primary: '#8B5CF6',
    secondary: '#F8FAFC',
    accent: '#EC4899',
    bgStyle: 'midnight_dark',
    font: 'Space Grotesk',
    radius: 'smooth',
    hero: 'glass',
    desc: 'Sleek dark mode with electric violet & neon rose'
  },
  {
    id: 'warm_bistro',
    name: 'Warm Roast & Cafe',
    icon: 'ri-cup-line',
    primary: '#D97706',
    secondary: '#451A03',
    accent: '#F59E0B',
    bgStyle: 'warm_cream',
    font: 'Playfair Display',
    radius: 'rounded',
    hero: 'cinematic',
    desc: 'Cozy bakery & roastery with warm cream background'
  },
  {
    id: 'fine_dining',
    name: 'Fine Dining Bistro',
    icon: 'ri-goblet-line',
    primary: '#BE123C',
    secondary: '#1C1917',
    accent: '#D97706',
    bgStyle: 'warm_cream',
    font: 'Playfair Display',
    radius: 'smooth',
    hero: 'glass',
    desc: 'Burgundy wine luxury with gold editorial serif'
  },
  {
    id: 'ocean_breeze',
    name: 'Ocean Coastal',
    icon: 'ri-water-flash-line',
    primary: '#0284C7',
    secondary: '#0F172A',
    accent: '#06B6D4',
    bgStyle: 'slate_clean',
    font: 'Plus Jakarta Sans',
    radius: 'smooth',
    hero: 'cinematic',
    desc: 'Deep marine azure with cyan accents for seafood & poke'
  },
  {
    id: 'pastel_bloom',
    name: 'Pastel Bloom & Boba',
    icon: 'ri-heart-3-line',
    primary: '#EC4899',
    secondary: '#4A044E',
    accent: '#F43F5E',
    bgStyle: 'rose_blush',
    font: 'Outfit',
    radius: 'rounded',
    hero: 'glass',
    desc: 'Sweet sakura blush with rounded pill styling'
  },
  {
    id: 'smash_grill',
    name: 'Smash & Grill BBQ',
    icon: 'ri-fire-line',
    primary: '#EA580C',
    secondary: '#18181B',
    accent: '#FBBF24',
    bgStyle: 'slate_clean',
    font: 'Space Grotesk',
    radius: 'sharp',
    hero: 'cinematic',
    desc: 'High-octane fiery orange & crisp sharp borders'
  },
  {
    id: 'obsidian_luxury',
    name: 'Obsidian Omakase',
    icon: 'ri-vip-crown-line',
    primary: '#F59E0B',
    secondary: '#F8FAFC',
    accent: '#E2E8F0',
    bgStyle: 'midnight_dark',
    font: 'Playfair Display',
    radius: 'smooth',
    hero: 'cinematic',
    desc: 'Prestige gold & midnight obsidian luxury dining'
  },
  {
    id: 'modern_minimal',
    name: 'Modernist Clean',
    icon: 'ri-layout-masonry-line',
    primary: '#2563EB',
    secondary: '#0F172A',
    accent: '#3B82F6',
    bgStyle: 'pure_white',
    font: 'Inter',
    radius: 'sharp',
    hero: 'minimal',
    desc: 'Stark white precision with crisp typography'
  }
];

export const THEME_BG_STYLES = [
  { id: 'slate_clean', label: 'Clean Slate', bg: '#F8FAFC', card: '#FFFFFF', text: '#1E293B', border: '#E2E8F0', tag: 'Balanced Slate' },
  { id: 'warm_cream', label: 'Bistro Cream', bg: '#FAF7F2', card: '#FFFFFF', text: '#292524', border: '#E7E5E4', tag: 'Warm & Cozy' },
  { id: 'midnight_dark', label: 'Midnight Dark', bg: '#0F172A', card: '#1E293B', text: '#F8FAFC', border: '#334155', isDark: true, tag: 'Dark Mode' },
  { id: 'matcha_soft', label: 'Matcha Botanical', bg: '#F0FDF4', card: '#FFFFFF', text: '#064E3B', border: '#DCFCE7', tag: 'Fresh Green' },
  { id: 'rose_blush', label: 'Sakura Blush', bg: '#FFF1F2', card: '#FFFFFF', text: '#4C0519', border: '#FFE4E6', tag: 'Soft Pastel' },
  { id: 'pure_white', label: 'Pure Minimal', bg: '#FFFFFF', card: '#FAFAFA', text: '#09090B', border: '#E4E4E7', tag: 'Stark Crisp' }
];

export const THEME_FONTS = [
  { id: 'Plus Jakarta Sans', label: 'Plus Jakarta Sans', style: 'Modern & Balanced', font: "'Plus Jakarta Sans', sans-serif" },
  { id: 'Playfair Display', label: 'Playfair Display', style: 'Luxury Serif & Bistro', font: "'Playfair Display', serif" },
  { id: 'Outfit', label: 'Outfit', style: 'Friendly Geometric & Bubble', font: "'Outfit', sans-serif" },
  { id: 'Inter', label: 'Inter', style: 'Precision Swiss Minimal', font: "'Inter', sans-serif" },
  { id: 'Space Grotesk', label: 'Space Grotesk', style: 'Punchy Urban & Grill', font: "'Space Grotesk', sans-serif" }
];

export const THEME_RADII = [
  { id: 'sharp', label: 'Sharp Crisp', radius: '6px', pill: '8px', desc: 'Minimalist 6px architectural corners' },
  { id: 'smooth', label: 'Smooth Curved', radius: '16px', pill: '14px', desc: 'Natural balanced 16px curves' },
  { id: 'rounded', label: 'Ultra Rounded', radius: '26px', pill: '28px', desc: 'Playful 26px pill aesthetic' }
];

export const THEME_HEROES = [
  { id: 'cinematic', label: 'Cinematic Cover', icon: 'ri-image-2-line', desc: 'Rich full banner with atmospheric contrast overlay' },
  { id: 'glass', label: 'Floating Glassmorphism', icon: 'ri-contrast-drop-line', desc: 'Frosted translucent floating card over backdrop' },
  { id: 'minimal', label: 'Compact Minimalist', icon: 'ri-layout-top-line', desc: 'Fast, compact header focusing straight on the menu' }
];

export const THEME_DENSITIES = [
  { id: 'grid_spacious', label: 'Spacious Photo Grid', icon: 'ri-layout-grid-line', desc: 'Large appetizing photo cards in responsive grid' },
  { id: 'compact_list', label: 'Bistro Compact List', icon: 'ri-list-check-2', desc: 'Streamlined rows with side thumbnail for fast ordering' }
];

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
  const [isMobileTenantSidebarOpen, setIsMobileTenantSidebarOpen] = useState(false);
  const [isTenantUserDropdownOpen, setIsTenantUserDropdownOpen] = useState(false);
  const tenantUserDropdownRef = useRef(null);

  // Close tenant user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (tenantUserDropdownRef.current && !tenantUserDropdownRef.current.contains(event.target)) {
        setIsTenantUserDropdownOpen(false);
      }
    };
    if (isTenantUserDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isTenantUserDropdownOpen]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    setIsMobileTenantSidebarOpen(false);
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
  const [notFound, setNotFound] = useState(false);

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
    message = 'Are you sure?',
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

  const [settingsForm, setSettingsForm] = useState({
    name: '',
    cuisine_type: '',
    primary_color: '#00C4CC',
    secondary_color: '#1E293B',
    logo_url: '',
    banner_url: '',
    phone: '',
    address: '',
    city: '',
    email: '',
    theme_config: {
      preset: 'teal_pink_dine',
      primary_color: '#00C4CC',
      secondary_color: '#1E293B',
      accent_color: '#FF2A85',
      bg_style: 'slate_clean',
      font_family: 'Plus Jakarta Sans',
      border_radius: 'smooth',
      hero_style: 'cinematic',
      card_density: 'grid_spacious'
    }
  });

  const updateThemeConfig = (updates) => {
    setSettingsForm(prev => {
      const currentTheme = prev.theme_config || {};
      const nextTheme = { ...currentTheme, ...updates };
      return {
        ...prev,
        primary_color: updates.primary_color || nextTheme.primary_color || prev.primary_color,
        secondary_color: updates.secondary_color || nextTheme.secondary_color || prev.secondary_color,
        theme_config: nextTheme
      };
    });
  };

  const applyThemePreset = (preset) => {
    updateThemeConfig({
      preset: preset.id,
      primary_color: preset.primary,
      secondary_color: preset.secondary,
      accent_color: preset.accent,
      bg_style: preset.bgStyle,
      font_family: preset.font,
      border_radius: preset.radius,
      hero_style: preset.hero
    });
  };

  // Dynamic Theme Tokens that adapt to the restaurant's active color theme
  const activeThemeConfig = settingsForm?.theme_config || {};
  const primaryBrandColor = activeThemeConfig.primary_color || settingsForm?.primary_color || overview?.restaurant?.primary_color || '#00C4CC';
  const secondaryBrandColor = activeThemeConfig.secondary_color || settingsForm?.secondary_color || overview?.restaurant?.secondary_color || '#1E293B';
  const accentBrandColor = activeThemeConfig.accent_color || '#FF2A85';

  const activeBgStyle = activeThemeConfig.bg_style || activeThemeConfig.bgStyle || (['tokyo_midnight', 'obsidian_luxury', 'cyber_neon', 'cyber_teal_pink'].includes(activeThemeConfig.preset) ? 'midnight_dark' : 'slate_clean');
  const isDarkPortal = activeBgStyle === 'midnight_dark' || ['tokyo_midnight', 'obsidian_luxury', 'cyber_neon', 'cyber_teal_pink'].includes(activeThemeConfig.preset);

  const portalPalette = useMemo(() => {
    switch (activeBgStyle) {
      case 'midnight_dark':
        return {
          bg: '#0B0F19',
          card: '#161F30',
          cardSoft: '#1F293D',
          sidebar: '#111827',
          sidebarFooter: '#0B0F19',
          header: 'rgba(17, 24, 39, 0.95)',
          text: '#F8FAFC',
          mutedText: '#94A3B8',
          border: '#2A364F',
          borderDark: '#374151',
          inputBg: '#1F293D'
        };
      case 'warm_cream':
        return {
          bg: '#FAF7F2',
          card: '#FFFFFF',
          cardSoft: '#F4EFE6',
          sidebar: '#FFFFFF',
          sidebarFooter: '#FAF7F2',
          header: 'rgba(250, 247, 242, 0.95)',
          text: '#292524',
          mutedText: '#78716C',
          border: '#E7E5E4',
          borderDark: '#D6D3D1',
          inputBg: '#FAF7F2'
        };
      case 'matcha_soft':
        return {
          bg: '#F0FDF4',
          card: '#FFFFFF',
          cardSoft: '#DCFCE7',
          sidebar: '#FFFFFF',
          sidebarFooter: '#F0FDF4',
          header: 'rgba(240, 253, 244, 0.95)',
          text: '#064E3B',
          mutedText: '#047857',
          border: '#DCFCE7',
          borderDark: '#BBF7D0',
          inputBg: '#F0FDF4'
        };
      case 'rose_blush':
        return {
          bg: '#FFF1F2',
          card: '#FFFFFF',
          cardSoft: '#FFE4E6',
          sidebar: '#FFFFFF',
          sidebarFooter: '#FFF1F2',
          header: 'rgba(255, 241, 242, 0.95)',
          text: '#4C0519',
          mutedText: '#9F1239',
          border: '#FFE4E6',
          borderDark: '#FECDD3',
          inputBg: '#FFF1F2'
        };
      case 'pure_white':
        return {
          bg: '#FFFFFF',
          card: '#FAFAFA',
          cardSoft: '#F4F4F5',
          sidebar: '#FFFFFF',
          sidebarFooter: '#FAFAFA',
          header: 'rgba(255, 255, 255, 0.96)',
          text: '#09090B',
          mutedText: '#71717A',
          border: '#E4E4E7',
          borderDark: '#D4D4D8',
          inputBg: '#F4F4F5'
        };
      case 'slate_clean':
      default:
        return {
          bg: '#F8FAFC',
          card: '#FFFFFF',
          cardSoft: '#F1F5F9',
          sidebar: '#FFFFFF',
          sidebarFooter: '#FAFAFA',
          header: 'rgba(255, 255, 255, 0.95)',
          text: '#1E293B',
          mutedText: '#64748B',
          border: '#E2E8F0',
          borderDark: '#CBD5E1',
          inputBg: '#F8FAFC'
        };
    }
  }, [activeBgStyle]);

  const isTealPink = activeThemeConfig.preset === 'teal_pink_dine' || primaryBrandColor === '#00C4CC' || accentBrandColor === '#FF2A85';

  const C = {
    white: portalPalette.card,
    pink: isTealPink ? '#FF2A85' : portalPalette.cardSoft,
    pinkLight: isTealPink ? (isDarkPortal ? 'rgba(255, 42, 133, 0.16)' : '#FFF1F6') : portalPalette.cardSoft,
    pinkSoft: isTealPink ? (isDarkPortal ? '#1A0E18' : '#FFF5F8') : portalPalette.bg,
    pinkGlow: isTealPink ? 'rgba(255, 42, 133, 0.35)' : 'none',
    gradientBrand: isTealPink ? 'linear-gradient(135deg, #00C4CC 0%, #FF2A85 100%)' : `linear-gradient(135deg, ${primaryBrandColor} 0%, ${accentBrandColor} 100%)`,
    bgSoft: portalPalette.bg,
    bgMuted: portalPalette.cardSoft,
    cardBg: portalPalette.card,
    sidebarBg: portalPalette.sidebar,
    sidebarFooter: portalPalette.sidebarFooter,
    headerBg: portalPalette.header,
    inputBg: portalPalette.inputBg,
    teal: primaryBrandColor,
    tealDark: '#008B94',
    tealLight: `${primaryBrandColor}18`,
    tealGlow: `${primaryBrandColor}33`,
    berry: '#6E1838',
    dark: isDarkPortal ? portalPalette.text : (secondaryBrandColor || '#1E293B'),
    slate: portalPalette.mutedText,
    border: portalPalette.border,
    borderDark: portalPalette.borderDark,
    grayBorder: portalPalette.border,
    gold: accentBrandColor,
    isDark: isDarkPortal,
    isTealPink,
    primaryBtnBg: isTealPink ? 'linear-gradient(135deg, #00C4CC 0%, #FF2A85 100%)' : primaryBrandColor,
    primaryBtnGlow: isTealPink ? '0 4px 14px rgba(0, 196, 204, 0.35)' : `0 4px 14px ${primaryBrandColor}33`,
    fontFamily: activeThemeConfig.font_family || 'Plus Jakarta Sans',
    radius: activeThemeConfig.border_radius === 'sharp' ? '6px' : activeThemeConfig.border_radius === 'rounded' ? '20px' : '14px'
  };
  // Selected Category filter in Menu tab
  const [selectedMenuCat, setSelectedMenuCat] = useState('all');
  const [menuSubTab, setMenuSubTab] = useState('items'); // 'items' | 'addons'

  // Add-ons Management state
  const [addons, setAddons] = useState([]);
  const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
  const [editingAddon, setEditingAddon] = useState(null);
  const [addonForm, setAddonForm] = useState({
    name: '',
    price: '',
    type: 'food',
    is_available: 1
  });

  // Instruction badges parser
  const renderInstructionBadges = (instructionsStr) => {
    if (!instructionsStr) return null;
    const parts = instructionsStr.split('|').map(s => s.trim()).filter(Boolean);
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
        {parts.map((p, pIdx) => {
          const isAddon = p.includes('Extra') || p.includes('Egg') || p.includes('Cheese') || p.includes('Shot') || p.includes('Milk') || p.includes('+') || p.includes('Rice') || p.includes('Sauce') || p.includes('Dip') || p.includes('Syrup');
          return (
            <span
              key={pIdx}
              style={{
                fontSize: '11px',
                fontWeight: isAddon ? 700 : 500,
                padding: '2px 7px',
                borderRadius: '6px',
                backgroundColor: isAddon ? '#FEF3C7' : '#F1F5F9',
                color: isAddon ? '#92400E' : '#334155',
                border: `1px solid ${isAddon ? '#FDE68A' : '#E2E8F0'}`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                lineHeight: 1.3
              }}
            >
              {isAddon && <i className="ri-add-circle-fill" style={{ fontSize: '10px', color: '#D97706' }} />}
              {p}
            </span>
          );
        })}
      </div>
    );
  };

  // Modals state
  const [selectedOrderModal, setSelectedOrderModal] = useState(null);
  const [proofLightboxUrl, setProofLightboxUrl] = useState(null);
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

  const handleDeleteStaff = (member) => {
    if (member.isOwner) {
      showToast?.('Platform Owner account cannot be deleted from restaurant staff list.', 'warning');
      return;
    }
    showConfirm({
      title: 'Remove Staff Member',
      message: `Are you sure you want to remove "${member.name}" from the restaurant staff list?`,
      type: 'danger',
      confirmText: 'Remove Staff',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await api.tenantPortal.deleteStaff(tenantId, member.id);
          showToast?.(`Removed ${member.name} from restaurant staff`, 'info');
          const sRes = await api.tenantPortal.staff(tenantId);
          setStaffList(sRes.data?.all || []);
        } catch (err) {
          showToast?.(err.message, 'error');
        }
      }
    });
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
      setAddons(menuRes.data?.addons || []);
      setTables(tablesRes.data);

      if (overRes.data?.restaurant) {
        const r = overRes.data.restaurant;
        let parsedTheme = {};
        if (r.theme_config) {
          try {
            parsedTheme = typeof r.theme_config === 'string' ? JSON.parse(r.theme_config) : r.theme_config;
          } catch (e) {
            console.warn('Could not parse theme_config', e);
          }
        }
        setSettingsForm({
          name: r.name || '',
          cuisine_type: r.cuisine_type || '',
          primary_color: parsedTheme.primary_color || r.primary_color || '#00C4CC',
          secondary_color: parsedTheme.secondary_color || r.secondary_color || '#1E293B',
          logo_url: r.logo_url || '',
          banner_url: r.banner_url || '',
          phone: r.phone || '',
          address: r.address || '',
          city: r.city || '',
          email: r.email || '',
          theme_config: {
            preset: parsedTheme.preset || 'teal_pink_dine',
            primary_color: parsedTheme.primary_color || r.primary_color || '#00C4CC',
            secondary_color: parsedTheme.secondary_color || r.secondary_color || '#1E293B',
            accent_color: parsedTheme.accent_color || '#FF2A85',
            bg_style: parsedTheme.bg_style || parsedTheme.bgStyle || (['tokyo_midnight', 'obsidian_luxury', 'cyber_neon'].includes(parsedTheme.preset) ? 'midnight_dark' : 'slate_clean'),
            font_family: parsedTheme.font_family || 'Plus Jakarta Sans',
            border_radius: parsedTheme.border_radius || 'smooth',
            hero_style: parsedTheme.hero_style || 'cinematic',
            card_density: parsedTheme.card_density || 'grid_spacious'
          }
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
      if (err.status === 404 || err.message?.toLowerCase().includes('not found')) {
        setNotFound(true);
      } else {
        showToast?.(err.message, 'error');
      }
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
      const updateRes = await api.tenantPortal.updateOrderStatus(tenantId, orderId, newStatus);
      const friendlyLabels = {
        pending: 'Pending',
        new: 'New Order',
        confirmed: 'Confirmed',
        preparing: 'Cooking',
        ready: 'Ready for Pickup',
        completed: 'Completed',
        cancelled: 'Cancelled'
      };
      const label = friendlyLabels[newStatus] || newStatus;
      showToast?.(updateRes?.message || `Order status updated to ${label}!`, 'success');
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

  // Confirm and approve customer GCash or Maya payment screenshot
  const handleConfirmPayment = async (orderId) => {
    try {
      const updateRes = await api.tenantPortal.confirmPayment(tenantId, orderId);
      showToast?.(updateRes?.message || 'Payment confirmed & approved! Order moved to confirmed.', 'success');
      const res = await api.tenantPortal.orders(tenantId);
      setOrders(res.data);
      const overRes = await api.tenantPortal.overview(tenantId);
      setOverview(overRes.data);
      const repRes = await api.tenantPortal.reports(tenantId);
      setReports(repRes.data);
      if (selectedOrderModal?.id === orderId) {
        setSelectedOrderModal(prev => prev ? ({ ...prev, payment_status: 'paid', status: prev.status === 'pending' ? 'confirmed' : prev.status }) : null);
      }
    } catch (err) {
      showToast?.(err.message, 'error');
    }
  };

  // Add / Edit Item
  const handleSaveItem = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...itemForm,
        category_id: itemForm.category_id || menuData.categories[0]?.id
      };
      if (!payload.category_id) {
        showToast?.('Please create or select a category first.', 'error');
        return;
      }
      if (editingItem) {
        await api.tenantPortal.updateItem(tenantId, editingItem.id, payload);
        showToast?.('Menu item updated!');
      } else {
        await api.tenantPortal.createItem(tenantId, payload);
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

  const handleDeleteItem = (itemId) => {
    showConfirm({
      title: 'Delete Menu Item',
      message: 'Are you sure you want to delete this menu item from the restaurant database? This cannot be undone.',
      type: 'danger',
      confirmText: 'Delete Item',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await api.tenantPortal.deleteItem(tenantId, itemId);
          showToast?.('Menu item deleted from tenant DB');
          const res = await api.tenantPortal.menu(tenantId);
          setMenuData(res.data);
        } catch (err) {
          showToast?.(err.message, 'error');
        }
      }
    });
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

  const handleDeleteCategory = (catId, catName) => {
    showConfirm({
      title: 'Delete Category',
      message: `Delete category "${catName}" and all of its items from this restaurant database?`,
      type: 'danger',
      confirmText: 'Delete Category',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await api.tenantPortal.deleteCategory(tenantId, catId);
          showToast?.(`Category "${catName}" deleted!`);
          const res = await api.tenantPortal.menu(tenantId);
          setMenuData(res.data);
          if (res.data?.addons) setAddons(res.data.addons);
          if (selectedMenuCat === catId) setSelectedMenuCat('all');
        } catch (err) {
          showToast?.(err.message, 'error');
        }
      }
    });
  };

  // Add-on CRUD Handlers
  const handleSaveAddon = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: addonForm.name.trim(),
        price: parseFloat(addonForm.price) || 0,
        type: addonForm.type || 'food',
        is_available: addonForm.is_available ? 1 : 0
      };
      if (!payload.name) {
        showToast?.('Add-on name is required', 'error');
        return;
      }
      if (editingAddon) {
        await api.tenantPortal.updateAddon(tenantId, editingAddon.id, payload);
        showToast?.('Add-on updated successfully!', 'success');
      } else {
        await api.tenantPortal.createAddon(tenantId, payload);
        showToast?.('New add-on added to menu catalog!', 'success');
      }
      setIsAddonModalOpen(false);
      setEditingAddon(null);
      setAddonForm({ name: '', price: '', type: 'food', is_available: 1 });
      const mRes = await api.tenantPortal.menu(tenantId);
      setMenuData(mRes.data);
      setAddons(mRes.data?.addons || []);
    } catch (err) {
      showToast?.(err.message, 'error');
    }
  };

  const handleToggleAddonStock = async (addon) => {
    try {
      const nextStatus = addon.is_available ? 0 : 1;
      await api.tenantPortal.updateAddon(tenantId, addon.id, { is_available: nextStatus });
      showToast?.(`Add-on "${addon.name}" is now ${nextStatus ? 'In Stock' : 'Sold Out'}`);
      const mRes = await api.tenantPortal.menu(tenantId);
      setMenuData(mRes.data);
      setAddons(mRes.data?.addons || []);
    } catch (err) {
      showToast?.(err.message, 'error');
    }
  };

  const handleDeleteAddon = (addonId, addonName) => {
    showConfirm({
      title: 'Delete Add-on',
      message: `Delete add-on "${addonName}" from this restaurant catalog?`,
      type: 'danger',
      confirmText: 'Delete Add-on',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await api.tenantPortal.deleteAddon(tenantId, addonId);
          showToast?.(`Add-on "${addonName}" deleted`);
          const mRes = await api.tenantPortal.menu(tenantId);
          setMenuData(mRes.data);
          setAddons(mRes.data?.addons || []);
        } catch (err) {
          showToast?.(err.message, 'error');
        }
      }
    });
  };

  // Change Subscription Plan
  const handleChangePlan = (planId, planName) => {
    showConfirm({
      title: 'Switch Subscription Plan',
      message: `Switch your restaurant SaaS subscription plan to "${planName}"?`,
      type: 'info',
      confirmText: 'Switch Plan',
      cancelText: 'Cancel',
      onConfirm: async () => {
        try {
          await api.tenantPortal.changeSubscriptionPlan(tenantId, { plan_id: planId });
          showToast?.(`Subscription plan updated to "${planName}"!`, 'success');
          const subRes = await api.tenantPortal.subscription(tenantId);
          setSubscriptionData(subRes.data);
        } catch (err) {
          showToast?.(err.message, 'error');
        }
      }
    });
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
      const payload = {
        ...settingsForm,
        primary_color: settingsForm.theme_config?.primary_color || settingsForm.primary_color,
        secondary_color: settingsForm.theme_config?.secondary_color || settingsForm.secondary_color
      };
      await api.tenantPortal.updateSettings(tenantId, payload);
      showToast?.('Restaurant branding & theme customization saved!', 'success');
      const overRes = await api.tenantPortal.overview(tenantId);
      setOverview(overRes.data);
    } catch (err) {
      showToast?.(err.message, 'error');
    }
  };

  // Upload Custom Media directly into Tenant's Dedicated Folder
  const [uploadingField, setUploadingField] = useState(null);
  const handleFileUpload = async (file, targetField, folder = 'general') => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast?.('Please upload a valid image file (PNG, JPG, WEBP, GIF, SVG)', 'error');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast?.('Image file exceeds 10MB limit', 'error');
      return;
    }

    setUploadingField(targetField);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const res = await api.tenantPortal.uploadImage(tenantId, {
            file: reader.result,
            fileName: file.name,
            folder
          });
          if (targetField === 'logo') {
            setSettingsForm(prev => ({ ...prev, logo_url: res.url }));
          } else if (targetField === 'banner') {
            setSettingsForm(prev => ({ ...prev, banner_url: res.url }));
          } else if (targetField === 'menu_item') {
            setItemForm(prev => ({ ...prev, image_url: res.url }));
          }
          showToast?.(res.message || 'Image uploaded to restaurant directory!', 'success');
        } catch (err) {
          showToast?.(err.message || 'Failed to upload image', 'error');
        } finally {
          setUploadingField(null);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploadingField(null);
      showToast?.('Failed to process image file', 'error');
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

  if (notFound || (!loading && !overview)) {
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
            <i className="ri-dashboard-2-line" />
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
            <span>Tenant Workspace Not Found (404)</span>
          </div>

          <h2 style={{ fontSize: '26px', fontWeight: 800, margin: '0 0 12px 0', color: '#FFF', letterSpacing: '-0.02em' }}>
            "{tenantSlug}" Does Not Exist
          </h2>

          <p style={{ fontSize: '14.5px', color: '#94A3B8', lineHeight: 1.6, margin: '0 0 28px 0' }}>
            No restaurant kitchen or management portal with identifier <strong style={{ color: '#F1F5F9' }}>@{tenantSlug}</strong> has been provisioned on this platform yet.
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
                backgroundColor: '#10B981',
                color: '#FFF',
                fontWeight: 700,
                fontSize: '14px',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)'
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
              <span>Back to Dine Home</span>
            </a>
          </div>
        </div>
      </div>
    );
  }

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
          backgroundColor: C.cardBg,
          borderRadius: '24px',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.18)',
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
                  backgroundColor: portalAuthTab === 'signin' ? C.cardBg : 'transparent',
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
                  backgroundColor: portalAuthTab === 'register' ? C.cardBg : 'transparent',
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
                    background: C.primaryBtnBg,
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: (isLoggingIn || !loginEmail.trim()) ? 'not-allowed' : 'pointer',
                    boxShadow: C.primaryBtnGlow,
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
                      { id: 'customer', label: 'Diner / Cust' },
                      { id: 'staff', label: 'Kitchen Staff' },
                      { id: 'admin', label: 'Admin / Mgr' }
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
                    background: C.primaryBtnBg,
                    color: '#FFF',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: (isLoggingIn || !portalRegName.trim()) ? 'not-allowed' : 'pointer',
                    boxShadow: C.primaryBtnGlow,
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
    subscription: { title: 'Subscription & Billing', subtitle: 'Manage your SaaS plan tier, resource quotas, features & invoice receipts' },
    settings: { title: 'Store Settings & Branding', subtitle: 'Cuisine profiles, brand colors, contact info, and theme' }
  };

  const currentTabMeta = tabMeta[activeTab] || { title: 'Restaurant Portal', subtitle: '' };

  return (
    <div
      className={`tenant-portal-root ${C.isDark ? 'tenant-portal-dark' : ''}`}
      style={{
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: C.pinkSoft,
        color: C.dark,
        fontFamily: `'${C.fontFamily}', -apple-system, BlinkMacSystemFont, sans-serif`,
        '--tenant-header-bg': C.headerBg,
        '--tenant-border': C.border,
        '--tenant-card-bg': C.cardBg,
        '--tenant-text': C.dark,
        '--tenant-muted': C.slate,
        '--tenant-input-bg': C.inputBg
      }}
    >

      {/* ─── MOBILE BACKDROP OVERLAY ────────────────────────────────────── */}
      <div
        className={`tenant-sidebar-backdrop ${isMobileTenantSidebarOpen ? 'active' : ''}`}
        onClick={() => setIsMobileTenantSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* ─── TENANT ADMIN SIDEBAR NAVIGATION ────────────────────────────── */}
      <aside
        className={`tenant-sidebar ${isMobileTenantSidebarOpen ? 'is-mobile-open' : ''}`}
        style={{
          width: '260px',
          flexShrink: 0,
          backgroundColor: C.sidebarBg,
          borderRight: `1px solid ${C.border}`,
          display: 'flex',
          flexDirection: 'column',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 40,
          boxShadow: '2px 0 16px rgba(0,0,0,0.02)'
        }}
      >
        {/* Brand Area */}
        <div style={{ padding: '18px 16px 14px', borderBottom: `1px solid ${C.border}`, backgroundColor: isTealPink ? '#00C4CC12' : 'transparent' }}>
          {isTealPink && (
            <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <DineBrandLogo color="#FF2A85" textColor={isDarkPortal ? '#FFFFFF' : '#0F172A'} height={24} />
              <span style={{ fontSize: '9px', fontWeight: 800, padding: '2px 7px', borderRadius: '6px', backgroundColor: '#FF2A85', color: '#FFF', letterSpacing: '0.04em' }}>
                TENANT
              </span>
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <img
              src={restaurant.logo_url || '/dine/IMG_0162.jpeg'}
              alt={restaurant.name || 'DINE'}
              style={{ width: '42px', height: '42px', borderRadius: '12px', objectFit: 'cover', border: `2px solid ${isTealPink ? '#00C4CC' : C.teal}`, boxShadow: `0 2px 8px ${C.tealLight}` }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{ margin: 0, fontSize: '14.5px', fontWeight: 800, color: C.dark, letterSpacing: '-0.3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {restaurant.name || 'DINE Kitchen'}
              </h2>
              <span style={{
                display: 'inline-block',
                marginTop: '3px',
                fontSize: '10px',
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: '6px',
                backgroundColor: staffUser?.role === 'admin' ? '#FEF3C7' : (isTealPink ? 'rgba(0, 196, 204, 0.15)' : C.tealLight),
                color: staffUser?.role === 'admin' ? '#92400E' : (isTealPink ? '#008B94' : C.tealDark),
                border: staffUser?.role === 'admin' ? '1px solid #FDE68A' : 'none'
              }}>
                {staffUser?.role === 'admin' ? 'OWNER ADMIN' : 'STAFF PORTAL'}
              </span>
            </div>

            <button
              type="button"
              className="tenant-sidebar-close-btn"
              onClick={() => setIsMobileTenantSidebarOpen(false)}
              title="Close sidebar"
              aria-label="Close menu"
            >
              <i className="ri-close-line" />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: C.slate, backgroundColor: isTealPink ? '#FFF1F6' : C.pinkLight, padding: '7px 10px', borderRadius: '8px', border: isTealPink ? '1px solid rgba(255, 42, 133, 0.22)' : 'none' }}>
            <i className="ri-store-2-line" style={{ color: isTealPink ? '#FF2A85' : C.teal, fontSize: '14px' }} />
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
                  backgroundColor: isTabActive ? (isTealPink ? '#00C4CC' : C.teal) : 'transparent',
                  background: isTabActive ? (isTealPink ? 'linear-gradient(135deg, #00C4CC 0%, #FF2A85 100%)' : C.teal) : 'transparent',
                  color: isTabActive ? '#FFFFFF' : C.slate,
                  fontWeight: isTabActive ? 800 : 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '10px',
                  boxShadow: isTabActive ? (isTealPink ? '0 4px 14px rgba(0, 196, 204, 0.35)' : `0 4px 14px ${C.tealGlow}`) : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <i className={tab.icon} style={{ fontSize: '16px', color: isTabActive ? '#FFFFFF' : (isTealPink ? '#00C4CC' : C.tealDark) }} />
                  <span>{tab.label}</span>
                </div>
                {tab.tag && !tab.badge && (
                  <span style={{
                    padding: '2px 6px',
                    borderRadius: '6px',
                    fontSize: '10px',
                    fontWeight: 800,
                    backgroundColor: isTabActive ? 'rgba(255,255,255,0.25)' : (isTealPink ? 'rgba(0, 196, 204, 0.12)' : C.tealLight),
                    color: isTabActive ? '#FFFFFF' : (isTealPink ? '#008B94' : C.tealDark),
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
                    backgroundColor: isTabActive ? 'rgba(255,255,255,0.25)' : (isTealPink ? '#FF2A85' : C.pinkLight),
                    color: isTabActive ? '#FFFFFF' : (isTealPink ? '#FFFFFF' : C.dark)
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Sidebar Footer */}
        <div style={{ padding: '14px', borderTop: `1px solid ${C.border}`, backgroundColor: C.sidebarFooter, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <a
            href={`/store/${tenantSlug}`}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '9px 12px',
              borderRadius: '10px',
              backgroundColor: isTealPink ? '#FF2A85' : C.tealLight,
              color: '#FFFFFF',
              border: isTealPink ? '1px solid rgba(255, 42, 133, 0.4)' : `1px solid ${C.teal}`,
              fontSize: '12px',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: isTealPink ? '0 3px 12px rgba(255, 42, 133, 0.35)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <i className="ri-external-link-line" /> Open Web Storefront ↗
          </a>
        </div>
      </aside>

      {/* ─── MAIN PORTAL CONTENT WRAPPER ─────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>

        {/* Top Header Bar */}
        <header className="tenant-header" style={{
          backgroundColor: isTealPink ? '#00C4CC' : C.headerBg,
          color: isTealPink ? '#FFFFFF' : C.dark,
          borderBottom: isTealPink ? '1px solid rgba(255, 255, 255, 0.22)' : `1px solid ${C.border}`,
          boxShadow: isTealPink ? '0 4px 20px rgba(0, 196, 204, 0.25)' : '0 2px 10px rgba(0, 0, 0, 0.02)'
        }}>
          <div className="tenant-header-left">
            <button
              type="button"
              className="tenant-burger-btn"
              onClick={() => setIsMobileTenantSidebarOpen(prev => !prev)}
              aria-label="Toggle navigation menu"
              title="Open Navigation Menu"
              style={{ color: isTealPink ? '#FFFFFF' : C.dark }}
            >
              <i className="ri-menu-2-line" />
            </button>

            {isTealPink && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '6px' }}>
                <DineBrandLogo color="#FF2A85" textColor="#FFFFFF" height={26} />
              </div>
            )}

            <div className="tenant-header-titles">
              <h1 style={{ margin: 0, fontWeight: 800, color: isTealPink ? '#FFFFFF' : C.dark, letterSpacing: '-0.3px' }}>
                {currentTabMeta.title}
              </h1>
              <p style={{ margin: 0, fontSize: '12.5px', color: isTealPink ? 'rgba(255, 255, 255, 0.9)' : C.slate }}>
                {currentTabMeta.subtitle}
              </p>
            </div>
          </div>

          <div className="tenant-header-right">
            {/* Live Clock Pill (hidden on very small mobile) */}
            <div className="tenant-time-pill" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              color: isTealPink ? '#FFFFFF' : C.slate,
              backgroundColor: isTealPink ? 'rgba(255, 255, 255, 0.2)' : C.pinkLight,
              padding: '6px 12px',
              borderRadius: '10px',
              border: isTealPink ? '1px solid rgba(255, 255, 255, 0.3)' : `1px solid ${C.border}`
            }}>
              <i className="ri-time-line" style={{ color: isTealPink ? '#FFFFFF' : C.teal }} />
              <strong style={{ color: isTealPink ? '#FFFFFF' : C.dark }}>{currentTime}</strong>
            </div>

            {/* Quick Storefront Link */}
            <a
              href={`/store/${tenantSlug}`}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm tenant-store-btn"
              title="View Public Storefront"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '10px',
                backgroundColor: isTealPink ? '#FF2A85' : C.cardBg,
                border: isTealPink ? '1px solid rgba(255, 255, 255, 0.28)' : `1px solid ${C.border}`,
                color: isTealPink ? '#FFFFFF' : C.dark,
                fontSize: '12px',
                fontWeight: 700,
                textDecoration: 'none',
                boxShadow: isTealPink ? '0 3px 12px rgba(255, 42, 133, 0.35)' : 'none'
              }}
            >
              <i className="ri-external-link-line" style={{ color: isTealPink ? '#FFFFFF' : C.teal }} />
              <span className="tenant-btn-text">Storefront</span>
            </a>

            {/* ─── UPPER RIGHT TENANT / STAFF USER DROPDOWN ──────────────── */}
            {staffUser && (
              <div className="tenant-user-dropdown-container" ref={tenantUserDropdownRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setIsTenantUserDropdownOpen(prev => !prev)}
                  className="tenant-user-btn"
                  aria-expanded={isTenantUserDropdownOpen}
                  style={{
                    backgroundColor: isTenantUserDropdownOpen
                      ? (isTealPink ? 'rgba(255, 255, 255, 0.32)' : C.tealLight)
                      : (isTealPink ? 'rgba(255, 255, 255, 0.2)' : C.pinkLight),
                    color: isTealPink ? '#FFFFFF' : C.dark,
                    border: `1.5px solid ${isTenantUserDropdownOpen ? (isTealPink ? '#FFFFFF' : C.teal) : (isTealPink ? 'rgba(255, 255, 255, 0.35)' : C.border)}`,
                    padding: '4px 12px 4px 6px',
                    borderRadius: '24px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.2s ease',
                    boxShadow: isTenantUserDropdownOpen ? (isTealPink ? '0 0 0 3px rgba(255,255,255,0.3)' : `0 0 0 3px ${C.tealLight}`) : 'none'
                  }}
                  title="User Account & Navigation"
                >
                  <div className="tenant-user-avatar-wrap" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <img
                      src={staffUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(staffUser.name || 'Staff')}`}
                      alt=""
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        backgroundColor: C.cardBg,
                        border: `1.5px solid ${staffUser.role === 'admin' ? '#F59E0B' : (isTealPink ? '#FFFFFF' : C.teal)}`,
                        objectFit: 'cover'
                      }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        bottom: -1,
                        right: -1,
                        width: '9px',
                        height: '9px',
                        borderRadius: '50%',
                        backgroundColor: staffUser.role === 'admin' ? '#F59E0B' : '#10B981',
                        border: `1.5px solid ${C.cardBg}`
                      }}
                      title="Active"
                    />
                  </div>
                  <div className="tenant-user-meta" style={{ textAlign: 'left', lineHeight: 1.15 }}>
                    <div className="tenant-user-name" style={{ fontSize: '12px', fontWeight: 800, color: C.dark, maxWidth: '110px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {staffUser.name}
                    </div>
                    <div className="tenant-user-role" style={{ fontSize: '9.5px', fontWeight: 800, color: staffUser.role === 'admin' ? '#D97706' : C.tealDark, letterSpacing: '0.3px' }}>
                      {staffUser.role === 'admin' ? 'OWNER' : 'STAFF'}
                    </div>
                  </div>
                  <i
                    className="ri-arrow-down-s-line tenant-user-caret"
                    style={{
                      fontSize: '15px',
                      color: C.slate,
                      transition: 'transform 0.2s ease',
                      transform: isTenantUserDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                    }}
                  />
                </button>

                {isTenantUserDropdownOpen && (
                  <div
                    className="tenant-dropdown-menu"
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      width: '280px',
                      backgroundColor: C.cardBg,
                      borderRadius: '16px',
                      boxShadow: '0 16px 42px rgba(0, 0, 0, 0.24), 0 4px 14px rgba(0, 0, 0, 0.1)',
                      border: `1px solid ${C.border}`,
                      padding: '8px',
                      zIndex: 1100,
                      animation: 'fadeInSlide 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  >
                    {/* User Header Profile */}
                    <div
                      style={{
                        padding: '12px',
                        borderRadius: '12px',
                        backgroundColor: staffUser.role === 'admin' ? (C.isDark ? '#2D2006' : '#FFFBEB') : C.pinkLight,
                        border: staffUser.role === 'admin' ? (C.isDark ? '1px solid #78350F' : '1px solid #FDE68A') : `1px solid ${C.border}`,
                        marginBottom: '6px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={staffUser.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(staffUser.name || 'Staff')}`}
                          alt=""
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '50%',
                            backgroundColor: C.cardBg,
                            border: `2px solid ${staffUser.role === 'admin' ? '#F59E0B' : C.teal}`,
                            objectFit: 'cover'
                          }}
                        />
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: '13.5px', fontWeight: 800, color: C.dark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {staffUser.name}
                          </div>
                          <div style={{ fontSize: '11px', color: C.slate, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '1px' }}>
                            {staffUser.email || (staffUser.role === 'staff' ? 'Staff PIN Session' : 'Restaurant Admin')}
                          </div>
                        </div>
                      </div>

                      <div style={{ marginTop: '9px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: '10px',
                          backgroundColor: staffUser.role === 'admin' ? '#FEF3C7' : '#DCFCE7',
                          color: staffUser.role === 'admin' ? '#92400E' : '#15803D'
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: staffUser.role === 'admin' ? '#F59E0B' : '#16A34A' }} />
                          {staffUser.role === 'admin' ? 'OWNER ADMIN' : 'KITCHEN STAFF'}
                        </span>
                        <span style={{ fontSize: '11px', color: C.slate, fontWeight: 600 }}>
                          {restaurant.name || tenantSlug}
                        </span>
                      </div>
                    </div>

                    {/* Quick Portal Nav Items */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <button
                        type="button"
                        className="tenant-dropdown-item"
                        onClick={() => {
                          setIsTenantUserDropdownOpen(false);
                          handleTabChange('settings');
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
                          color: C.dark,
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background-color 0.15s'
                        }}
                      >
                        <i className="ri-settings-3-line" style={{ color: C.teal, fontSize: '16px' }} />
                        <span>Store Settings & Branding</span>
                      </button>

                      <button
                        type="button"
                        className="tenant-dropdown-item"
                        onClick={() => {
                          setIsTenantUserDropdownOpen(false);
                          handleTabChange('subscription');
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
                          color: C.dark,
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background-color 0.15s'
                        }}
                      >
                        <i className="ri-vip-crown-line" style={{ color: '#D97706', fontSize: '16px' }} />
                        <span>Subscription & Plan</span>
                      </button>

                      <button
                        type="button"
                        className="tenant-dropdown-item"
                        onClick={() => {
                          setIsTenantUserDropdownOpen(false);
                          handleTabChange('staff');
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
                          color: C.dark,
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'background-color 0.15s'
                        }}
                      >
                        <i className="ri-team-line" style={{ color: C.teal, fontSize: '16px' }} />
                        <span>Team Roster & PINs</span>
                      </button>

                      <a
                        href={`/store/${tenantSlug}`}
                        target="_blank"
                        rel="noreferrer"
                        className="tenant-dropdown-item"
                        onClick={() => setIsTenantUserDropdownOpen(false)}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '9px 12px',
                          borderRadius: '10px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: C.dark,
                          fontSize: '13px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'left',
                          textDecoration: 'none',
                          boxSizing: 'border-box',
                          transition: 'background-color 0.15s'
                        }}
                      >
                        <i className="ri-external-link-line" style={{ color: C.teal, fontSize: '16px' }} />
                        <span>View Live Storefront ↗</span>
                      </a>
                    </div>

                    <div style={{ height: '1px', backgroundColor: C.border, margin: '6px 4px' }} />

                    {/* Sign Out Button */}
                    <button
                      type="button"
                      className="tenant-dropdown-item tenant-logout-btn"
                      onClick={() => {
                        setIsTenantUserDropdownOpen(false);
                        handleStaffSignOut();
                      }}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '9px 12px',
                        borderRadius: '10px',
                        border: 'none',
                        backgroundColor: '#FEF2F2',
                        color: '#DC2626',
                        fontSize: '13px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s'
                      }}
                    >
                      <i className="ri-logout-box-r-line" style={{ fontSize: '16px', color: '#DC2626' }} />
                      <span>Log Out of Portal</span>
                    </button>
                  </div>
                )}
              </div>
            )}
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
                  Restaurant Storefront Suspended by Superadmin
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
                { title: 'Total Orders', value: metrics.totalOrders || 0, icon: 'ri-file-list-3-line', color: '#6366F1', bg: C.isDark ? 'rgba(99, 102, 241, 0.18)' : '#EEF2FF' },
                { title: 'Kitchen Queue', value: metrics.pendingOrders + metrics.preparingOrders, icon: 'ri-fire-line', color: '#F59E0B', bg: C.isDark ? 'rgba(245, 158, 11, 0.18)' : '#FEF3C7' },
                { title: 'Ready to Serve', value: metrics.readyOrders || 0, icon: 'ri-notification-3-line', color: '#10B981', bg: C.isDark ? 'rgba(16, 185, 129, 0.18)' : '#D1FAE5' },
                { title: 'Active Tables', value: `${tables.length} tables`, icon: 'ri-qr-code-line', color: '#EC4899', bg: C.isDark ? 'rgba(236, 72, 153, 0.18)' : '#FCE7F3' }
              ].map(stat => (
                <div key={stat.title} style={{ backgroundColor: C.cardBg, borderRadius: '16px', padding: '18px', border: `1px solid ${C.border}`, boxShadow: '0 4px 16px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
              <div style={{ backgroundColor: C.cardBg, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '20px' }}>
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
                      <div key={o.id} style={{ padding: '14px', borderRadius: '12px', border: `1px solid ${C.border}`, backgroundColor: C.pinkLight, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ flex: '1 1 240px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                            <span style={{ fontSize: '16px', fontWeight: 800, color: C.dark }}>{o.customer_name}</span>
                            <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', backgroundColor: C.cardBg, color: C.tealDark, border: `1px solid ${C.border}` }}>
                              {o.order_type === 'takeaway' ? 'Takeout' : 'Dine-In'}
                            </span>
                          </div>
                          <div style={{ fontSize: '12px', color: C.slate }}>
                            Order <strong style={{ color: C.tealDark, fontFamily: 'monospace' }}>#{o.order_number}</strong> • ₱{o.total} • Status: <strong style={{ textTransform: 'uppercase' }}>{o.status}</strong>
                          </div>

                          {/* Food Items with Thumbnails (Max 3, Clickable for full popup) */}
                          {(o.items || []).length > 0 && (
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px', alignItems: 'center' }}>
                              {(o.items || []).slice(0, 3).map((it, idx) => (
                                <div
                                  key={idx}
                                  onClick={() => setSelectedOrderModal(o)}
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', backgroundColor: C.cardBg, padding: '3px 8px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '11px', cursor: 'pointer' }}
                                  title="Click to view full order"
                                >
                                  <img
                                    src={it.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80'}
                                    alt={it.item_name}
                                    style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }}
                                    onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80'; }}
                                  />
                                  <span><strong style={{ color: C.tealDark }}>{it.quantity}x</strong> {it.item_name}</span>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => setSelectedOrderModal(o)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  backgroundColor: C.tealLight,
                                  color: C.tealDark,
                                  padding: '4px 9px',
                                  borderRadius: '8px',
                                  border: `1px solid ${C.tealDark}33`,
                                  fontSize: '11px',
                                  fontWeight: 800,
                                  cursor: 'pointer'
                                }}
                                title="View full order details & add-ons"
                              >
                                <i className="ri-fullscreen-line" />
                                <span>{(o.items || []).length > 3 ? `+${(o.items || []).length - 3} more` : 'Details ↗'}</span>
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Progression Action */}
                        <div style={{ display: 'flex', gap: '6px' }}>
                          {(o.status === 'pending' || o.status === 'new') && (
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(o.id, 'confirmed')}
                              style={{ padding: '6px 12px', borderRadius: '8px', background: C.primaryBtnBg, color: '#FFF', border: 'none', fontSize: '11px', fontWeight: 700, cursor: 'pointer', boxShadow: C.primaryBtnGlow }}
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
                              Complete
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Bestsellers Ranking */}
              <div style={{ backgroundColor: C.cardBg, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '20px' }}>
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
                          <span style={{ width: '22px', height: '22px', borderRadius: '50%', backgroundColor: idx === 0 ? C.teal : C.cardBg, color: idx === 0 ? '#FFF' : C.dark, fontSize: '11px', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
                      backgroundColor: orderFilter === f.id ? C.teal : C.cardBg,
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
                <div key={order.id} style={{ backgroundColor: C.cardBg, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '18px', boxShadow: '0 4px 16px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                          <h4 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: C.dark, letterSpacing: '-0.2px' }}>
                            {order.customer_name}
                          </h4>
                          <span style={{ fontSize: '11px', fontWeight: 800, padding: '2px 8px', borderRadius: '6px', backgroundColor: C.pinkLight, color: C.tealDark, border: `1px solid ${C.border}` }}>
                            {order.order_type === 'takeaway' ? 'Takeout' : 'Dine-In'}
                          </span>
                        </div>
                        <div style={{ fontSize: '12px', color: C.slate, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>Order <strong style={{ color: C.tealDark, fontFamily: 'monospace' }}>#{order.order_number}</strong></span>
                          {order.customer_phone && <span>• {order.customer_phone}</span>}
                        </div>
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

                    {/* Items List with Food Images (Clickable for full popup) */}
                    <div
                      onClick={() => setSelectedOrderModal(order)}
                      style={{
                        backgroundColor: C.pinkSoft,
                        borderRadius: '12px',
                        padding: '10px 12px',
                        marginBottom: '14px',
                        border: `1px solid ${C.border}`,
                        cursor: 'pointer',
                        transition: 'border-color 0.15s ease'
                      }}
                      title="Click to view full order details & add-ons"
                    >
                      {(order.items || []).slice(0, 3).map((it, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            fontSize: '12px',
                            padding: '6px 0',
                            borderBottom: idx < Math.min(3, (order.items || []).length) - 1 ? `1px dashed ${C.border}` : 'none',
                            gap: '10px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', minWidth: 0, flex: 1 }}>
                            <img
                              src={it.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80'}
                              alt={it.item_name}
                              style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover', border: `1px solid ${C.border}`, flexShrink: 0, marginTop: '2px' }}
                              onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80'; }}
                            />
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <span style={{ fontWeight: 800, color: C.dark, display: 'block' }}>
                                <span style={{ color: C.tealDark, fontWeight: 800 }}>{it.quantity}x</span> {it.item_name}
                              </span>
                              {renderInstructionBadges(it.instructions)}
                            </div>
                          </div>
                          <span style={{ fontWeight: 800, color: C.tealDark, flexShrink: 0, paddingTop: '2px' }}>
                            ₱{(it.subtotal || it.price * it.quantity).toFixed(0)}
                          </span>
                        </div>
                      ))}

                      {/* Always show View Details & Add-ons Button for all orders */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrderModal(order);
                        }}
                        style={{
                          width: '100%',
                          marginTop: '8px',
                          padding: '8px 10px',
                          borderRadius: '8px',
                          backgroundColor: C.tealLight,
                          color: C.tealDark,
                          border: `1px solid ${C.tealDark}33`,
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <i className="ri-fullscreen-line" style={{ fontSize: '13px' }} />
                        <span>
                          {(order.items || []).length > 3
                            ? `+${(order.items || []).length - 3} more item${((order.items || []).length - 3) === 1 ? '' : 's'} • View all items & add-ons ↗`
                            : `View full order & add-ons details ↗`}
                        </span>
                      </button>

                      {order.notes && (
                        <div style={{ fontSize: '11px', color: '#92400E', backgroundColor: '#FEF3C7', padding: '6px 10px', borderRadius: '8px', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <i className="ri-information-line" />
                          <span><strong>Note:</strong> {order.notes}</span>
                        </div>
                      )}

                      {/* Digital Wallet (GCash & Maya) Payment Verification Alert on Order Card */}
                      {['gcash', 'maya'].some(m => order.payment_method?.toLowerCase()?.includes(m)) && (() => {
                        const isMaya = order.payment_method?.toLowerCase()?.includes('maya');
                        const walletName = isMaya ? 'Maya' : 'GCash';
                        return order.payment_status === 'pending_verification' ? (
                          <div style={{
                            marginTop: '10px',
                            backgroundColor: isDarkPortal ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB',
                            border: isDarkPortal ? '1px solid rgba(245, 158, 11, 0.4)' : '1.5px solid #FCD34D',
                            borderRadius: '10px',
                            padding: '8px 10px'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', marginBottom: '6px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <i className="ri-error-warning-fill" style={{ color: '#D97706', fontSize: '15px' }} />
                                <span style={{ fontSize: '11px', fontWeight: 800, color: isDarkPortal ? '#FCD34D' : '#92400E' }}>
                                  {walletName} Verification Needed
                                </span>
                              </div>
                              {order.payment_reference && (
                                <span style={{ fontSize: '10px', fontWeight: 700, color: isDarkPortal ? '#CBD5E1' : '#78350F', backgroundColor: isDarkPortal ? '#1F293D' : '#FEF3C7', padding: '1px 5px', borderRadius: '4px' }}>
                                  Ref: {order.payment_reference}
                                </span>
                              )}
                            </div>

                            <div style={{ display: 'flex', gap: '6px' }}>
                              {order.payment_proof && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setProofLightboxUrl(order.payment_proof);
                                  }}
                                  style={{
                                    flex: 1,
                                    padding: '5px 8px',
                                    borderRadius: '6px',
                                    backgroundColor: isDarkPortal ? '#1F293D' : '#FFF',
                                    border: isDarkPortal ? '1px solid #374151' : '1px solid #CBD5E1',
                                    color: isDarkPortal ? '#F8FAFC' : '#334155',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px'
                                  }}
                                >
                                  <i className="ri-image-line" />
                                  <span>View Receipt</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleConfirmPayment(order.id);
                                }}
                                style={{
                                  flex: 1,
                                  padding: '5px 8px',
                                  borderRadius: '6px',
                                  backgroundColor: '#059669',
                                  border: 'none',
                                  color: '#FFF',
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: '4px',
                                  boxShadow: '0 2px 6px rgba(5, 150, 105, 0.3)'
                                }}
                              >
                                <i className="ri-check-line" />
                                <span>Confirm Payment</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div style={{
                            marginTop: '8px',
                            backgroundColor: isDarkPortal ? 'rgba(16, 185, 129, 0.15)' : '#DCFCE7',
                            border: isDarkPortal ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid #86EFAC',
                            borderRadius: '8px',
                            padding: '4px 8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            fontSize: '10px',
                            fontWeight: 700,
                            color: isDarkPortal ? '#6EE7B7' : '#166534'
                          }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <i className="ri-checkbox-circle-fill" style={{ color: '#10B981' }} />
                              <span>{walletName} Verified</span>
                            </div>
                            {order.payment_proof && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProofLightboxUrl(order.payment_proof);
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: isDarkPortal ? '#6EE7B7' : '#166534',
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  textDecoration: 'underline',
                                  cursor: 'pointer'
                                }}
                              >
                                View Proof
                              </button>
                            )}
                          </div>
                        );
                      })()}
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
            {/* Sub-tab navigation: Dishes & Items vs Add-ons & Extras */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '14px', marginBottom: '20px', borderBottom: `1px solid ${C.border}`, paddingBottom: '14px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setMenuSubTab('items')}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 800,
                    border: menuSubTab === 'items' ? `1px solid ${C.teal}` : `1px solid ${C.border}`,
                    backgroundColor: menuSubTab === 'items' ? C.teal : C.cardBg,
                    color: menuSubTab === 'items' ? '#FFF' : C.dark,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <i className="ri-restaurant-line" />
                  <span>Dishes & Items ({menuData.categories?.reduce((acc, c) => acc + (c.items?.length || 0), 0) || 0})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMenuSubTab('addons')}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 800,
                    border: menuSubTab === 'addons' ? '1px solid #D97706' : `1px solid ${C.border}`,
                    backgroundColor: menuSubTab === 'addons' ? '#D97706' : C.cardBg,
                    color: menuSubTab === 'addons' ? '#FFF' : (C.isDark ? '#F59E0B' : '#B45309'),
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <i className="ri-price-tag-3-fill" style={{ color: menuSubTab === 'addons' ? '#FFF' : '#F59E0B' }} />
                  <span>Add-ons & Extras Catalog ({addons.length})</span>
                </button>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    setEditingAddon(null);
                    setAddonForm({ name: '', price: '', type: 'food', is_available: 1 });
                    setIsAddonModalOpen(true);
                  }}
                  style={{
                    backgroundColor: C.isDark ? '#451A03' : '#FEF3C7',
                    color: C.isDark ? '#FDE68A' : '#92400E',
                    border: `1px solid ${C.isDark ? '#78350F' : '#FDE68A'}`,
                    padding: '8px 14px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <i className="ri-add-line" style={{ color: '#D97706' }} /> + Add Add-on
                </button>
                {menuSubTab === 'items' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setCatForm({ name: '', description: '', icon: 'ri-restaurant-line' });
                        setIsCatModalOpen(true);
                      }}
                      style={{ backgroundColor: C.cardBg, color: C.dark, border: `1px solid ${C.border}`, padding: '8px 14px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
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
                      style={{ background: C.primaryBtnBg, color: '#FFF', border: 'none', padding: '8px 16px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: C.primaryBtnGlow }}
                    >
                      <i className="ri-add-line" /> + Add New Item
                    </button>
                  </>
                )}
              </div>
            </div>

            {menuSubTab === 'addons' ? (
              <div>
                <div style={{ backgroundColor: C.cardBg, borderRadius: '14px', padding: '16px 20px', border: `1px solid ${C.border}`, marginBottom: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: 800, color: C.dark }}>
                      Restaurant Add-ons & Customization Extras
                    </h3>
                    <p style={{ margin: 0, fontSize: '12px', color: C.slate }}>
                      Configure add-on options that customers can attach to dishes and drinks in the storefront (e.g. extra rice, egg, cheese, dips, extra shots, oat milk).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingAddon(null);
                      setAddonForm({ name: '', price: '', type: 'food', is_available: 1 });
                      setIsAddonModalOpen(true);
                    }}
                    style={{
                      backgroundColor: '#D97706',
                      color: '#FFF',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <i className="ri-add-line" /> + New Add-on
                  </button>
                </div>

                {addons.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '50px 20px', backgroundColor: C.cardBg, borderRadius: '16px', border: `1px dashed ${C.borderDark}` }}>
                    <i className="ri-price-tag-3-line" style={{ fontSize: '42px', color: '#D97706', display: 'block', marginBottom: '12px' }} />
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 800, color: C.dark }}>No Add-ons Configured Yet</h3>
                    <p style={{ margin: '0 0 20px 0', fontSize: '13px', color: C.slate, maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto' }}>
                      Add delicious extras like Extra Rice, Melted Cheese, Sunny-Side Egg, or Oat Milk Upgrade for your customers.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingAddon(null);
                        setAddonForm({ name: '', price: '', type: 'food', is_available: 1 });
                        setIsAddonModalOpen(true);
                      }}
                      style={{ backgroundColor: '#D97706', color: '#FFF', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}
                    >
                      + Add First Add-on
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
                    {addons.map(addon => (
                      <div
                        key={addon.id}
                        style={{
                          backgroundColor: C.cardBg,
                          borderRadius: '14px',
                          border: `1px solid ${addon.is_available ? C.border : '#EF444433'}`,
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                          opacity: addon.is_available ? 1 : 0.75
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                backgroundColor: addon.type === 'drink' ? '#EFF6FF' : (addon.type === 'both' ? '#F5F3FF' : '#FEF3C7'),
                                color: addon.type === 'drink' ? '#2563EB' : (addon.type === 'both' ? '#7C3AED' : '#D97706'),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '16px'
                              }}>
                                <i className={addon.type === 'drink' ? 'ri-cup-line' : (addon.type === 'both' ? 'ri-apps-2-line' : 'ri-restaurant-line')} />
                              </div>
                              <div>
                                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: C.dark }}>{addon.name}</h4>
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  textTransform: 'uppercase',
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: addon.type === 'drink' ? '#DBEAFE' : (addon.type === 'both' ? '#EDE9FE' : '#FDE68A'),
                                  color: addon.type === 'drink' ? '#1E40AF' : (addon.type === 'both' ? '#5B21B6' : '#92400E'),
                                  display: 'inline-block',
                                  marginTop: '2px'
                                }}>
                                  {addon.type === 'drink' ? 'Beverage Extra' : (addon.type === 'both' ? 'Universal' : 'Food Extra')}
                                </span>
                              </div>
                            </div>

                            <span style={{ fontSize: '15px', fontWeight: 800, color: C.tealDark }}>
                              ₱{Number(addon.price || 0).toFixed(0)}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '14px', paddingTop: '10px', borderTop: `1px solid ${C.pinkLight}` }}>
                          {/* Availability Toggle */}
                          <button
                            type="button"
                            onClick={() => handleToggleAddonStock(addon)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              padding: '4px 9px',
                              borderRadius: '6px',
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              border: 'none',
                              backgroundColor: addon.is_available ? '#D1FAE5' : '#FEE2E2',
                              color: addon.is_available ? '#065F46' : '#991B1B'
                            }}
                            title="Click to toggle availability"
                          >
                            <i className={addon.is_available ? 'ri-checkbox-circle-fill' : 'ri-close-circle-fill'} />
                            <span>{addon.is_available ? 'In Stock' : 'Sold Out'}</span>
                          </button>

                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingAddon(addon);
                                setAddonForm({
                                  name: addon.name,
                                  price: addon.price,
                                  type: addon.type || 'food',
                                  is_available: addon.is_available ? 1 : 0
                                });
                                setIsAddonModalOpen(true);
                              }}
                              style={{ border: 'none', background: 'none', color: C.tealDark, fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                            >
                              <i className="ri-edit-line" /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAddon(addon.id, addon.name)}
                              style={{ border: 'none', background: 'none', color: '#EF4444', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}
                            >
                              <i className="ri-delete-bin-line" /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                {/* Categories Bar */}
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '20px' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedMenuCat('all')}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 700,
                      border: selectedMenuCat === 'all' ? `1px solid ${C.teal}` : `1px solid ${C.border}`,
                      backgroundColor: selectedMenuCat === 'all' ? C.teal : C.cardBg,
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
                        backgroundColor: selectedMenuCat === cat.id ? C.teal : C.cardBg
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

            {/* Empty State when no categories exist */}
            {menuData.categories.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', backgroundColor: C.cardBg, borderRadius: '16px', border: `1px dashed ${C.borderDark}` }}>
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
                  style={{ background: C.primaryBtnBg, color: '#FFF', border: 'none', padding: '10px 20px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '8px', boxShadow: C.primaryBtnGlow }}
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
                    <div style={{ textAlign: 'center', padding: '40px 20px', backgroundColor: C.cardBg, borderRadius: '16px', border: `1px dashed ${C.borderDark}` }}>
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
                        style={{ background: C.primaryBtnBg, color: '#FFF', border: 'none', padding: '9px 18px', borderRadius: '10px', fontSize: '13px', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: C.primaryBtnGlow }}
                      >
                        <i className="ri-add-line" /> Add Item to Menu
                      </button>
                    </div>
                  );
                }

                return (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
                    {filteredItems.map(item => (
                      <div key={item.id} style={{ backgroundColor: C.cardBg, borderRadius: '14px', border: `1px solid ${C.border}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 14px rgba(0,0,0,0.02)' }}>
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
                  background: C.primaryBtnBg,
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
                  boxShadow: C.primaryBtnGlow
                }}
              >
                <i className="ri-user-add-line" style={{ fontSize: '16px' }} />
                <span>+ Add Team Member / Admin</span>
              </button>
            </div>

            {/* Quick Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
              <div style={{ backgroundColor: C.cardBg, padding: '16px 20px', borderRadius: '16px', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '12px', color: C.slate, fontWeight: 600, display: 'block' }}>Total Staff</span>
                  <span style={{ fontSize: '22px', fontWeight: 800, color: C.dark }}>{staffList.length}</span>
                </div>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: C.tealLight, color: C.tealDark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  <i className="ri-team-line" />
                </div>
              </div>

              <div style={{ backgroundColor: C.cardBg, padding: '16px 20px', borderRadius: '16px', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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

              <div style={{ backgroundColor: C.cardBg, padding: '16px 20px', borderRadius: '16px', border: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
            <div style={{ backgroundColor: C.cardBg, borderRadius: '16px', border: `1px solid ${C.border}`, overflow: 'hidden' }}>
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
                              {member.role === 'admin' ? 'Admin' : (member.role === 'manager' ? 'Manager' : (member.role === 'kitchen' ? 'Kitchen' : (member.role === 'cashier' ? 'Cashier' : 'Staff')))}
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
                                    backgroundColor: C.cardBg,
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
          <div style={{ backgroundColor: C.cardBg, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '24px' }}>
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
              backgroundColor: C.isDark
                ? (subscriptionData?.subscription?.has_advanced_analytics ? 'rgba(16, 185, 129, 0.12)' : 'rgba(59, 130, 246, 0.12)')
                : (subscriptionData?.subscription?.has_advanced_analytics ? '#F0FDF4' : '#EFF6FF'),
              border: `1px solid ${C.isDark
                ? (subscriptionData?.subscription?.has_advanced_analytics ? 'rgba(16, 185, 129, 0.3)' : 'rgba(59, 130, 246, 0.3)')
                : (subscriptionData?.subscription?.has_advanced_analytics ? '#BBF7D0' : '#BFDBFE')}`,
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
                      ? `Advanced Analytics Active (${subscriptionData?.subscription?.plan_name})`
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
              <div style={{ backgroundColor: C.cardBg, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '20px' }}>
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
              <div style={{ backgroundColor: C.cardBg, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '20px' }}>
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

        {/* 6.5. SUBSCRIPTION & BILLING TAB */}
        {activeTab === 'subscription' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Active Subscription Hero Card */}
            <div style={{
              backgroundColor: C.cardBg,
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
                <div style={{ backgroundColor: C.cardBg, borderRadius: '14px', border: `1px solid ${C.border}`, padding: '18px' }}>
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
                <div style={{ backgroundColor: C.cardBg, borderRadius: '14px', border: `1px solid ${C.border}`, padding: '18px' }}>
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
                <div style={{ backgroundColor: C.cardBg, borderRadius: '14px', border: `1px solid ${C.border}`, padding: '18px' }}>
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
                        backgroundColor: C.cardBg,
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
                          Active Current Plan
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
                            backgroundColor: C.cardBg,
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
                            e.currentTarget.style.backgroundColor = C.cardBg;
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
            <div style={{ backgroundColor: C.cardBg, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '20px' }}>
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
            <div style={{ backgroundColor: C.cardBg, borderRadius: '16px', border: `1px solid ${C.border}`, padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '14px', borderBottom: `1px solid ${C.pinkLight}` }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: C.tealLight, color: C.tealDark, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
                  <i className="ri-palette-line" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: C.dark }}>Brand Identity & Theme Customization</h3>
                  <p style={{ margin: 0, fontSize: '12px', color: C.slate }}>Customize how your restaurant appears to customers on your storefront</p>
                </div>
              </div>

              <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                {/* ─── 1. CURATED 1-CLICK THEME PRESETS ────────────────────────── */}
                <div style={{ backgroundColor: C.pinkSoft, padding: '18px', borderRadius: '14px', border: `1px solid ${C.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div>
                      <label style={{ fontSize: '13px', fontWeight: 800, color: C.dark, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>1-Click Curated Designer Themes</span>
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '8px', backgroundColor: C.tealLight, color: C.tealDark }}>Instant Setup</span>
                      </label>
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: C.slate }}>
                        Select a curated designer theme to instantly apply harmonious colors, typography & styling
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px' }}>
                    {THEME_PRESETS.map(preset => {
                      const isSelected = activeThemeConfig.preset === preset.id;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => applyThemePreset(preset)}
                          style={{
                            padding: '12px',
                            borderRadius: '12px',
                            border: isSelected ? `2px solid ${preset.primary}` : `1px solid ${C.border}`,
                            backgroundColor: C.cardBg,
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            position: 'relative',
                            boxShadow: isSelected ? `0 4px 14px ${preset.primary}33` : '0 1px 4px rgba(0,0,0,0.03)',
                            transition: 'all 0.18s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <div style={{ width: '24px', height: '24px', borderRadius: '6px', backgroundColor: `${preset.primary}18`, color: preset.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px' }}>
                                <i className={preset.icon} />
                              </div>
                              <span style={{ fontSize: '12px', fontWeight: 800, color: C.dark }}>{preset.name}</span>
                            </div>
                            {isSelected && (
                              <i className="ri-checkbox-circle-fill" style={{ color: preset.primary, fontSize: '16px' }} />
                            )}
                          </div>

                          {/* Color Palette Chips */}
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <span style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: preset.primary, border: '1px solid rgba(0,0,0,0.1)' }} title="Primary" />
                            <span style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: preset.secondary, border: '1px solid rgba(0,0,0,0.1)' }} title="Secondary" />
                            <span style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: preset.accent, border: '1px solid rgba(0,0,0,0.1)' }} title="Accent" />
                            <span style={{ fontSize: '10px', color: C.slate, fontWeight: 700, marginLeft: '4px' }}>{preset.font}</span>
                          </div>

                          <p style={{ margin: 0, fontSize: '10px', color: C.slate, lineHeight: 1.35 }}>
                            {preset.desc}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ─── 2. COLOR PALETTE STUDIO ───────────────────────────────────── */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <label style={{ fontSize: '14px', fontWeight: 800, color: C.dark }}>
                      Color Palette Studio
                    </label>
                    <span style={{ fontSize: '11px', color: C.slate, fontWeight: 600 }}>Click swatch or enter hex codes</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                    {/* Primary Brand Color */}
                    <div style={{ padding: '12px', borderRadius: '10px', border: `1px solid ${C.border}`, backgroundColor: C.cardBg }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: C.slate, textTransform: 'uppercase', marginBottom: '6px' }}>
                        Primary Brand Color
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="color"
                          value={activeThemeConfig.primary_color || settingsForm.primary_color || '#2A9D9A'}
                          onChange={e => updateThemeConfig({ primary_color: e.target.value })}
                          style={{ width: '42px', height: '38px', border: `1px solid ${C.border}`, borderRadius: '8px', cursor: 'pointer', padding: '2px', backgroundColor: C.cardBg }}
                        />
                        <input
                          type="text"
                          value={activeThemeConfig.primary_color || settingsForm.primary_color || '#2A9D9A'}
                          onChange={e => updateThemeConfig({ primary_color: e.target.value })}
                          style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '12px', fontWeight: 700, fontFamily: 'monospace' }}
                        />
                      </div>
                      <span style={{ display: 'block', fontSize: '10px', color: C.slate, marginTop: '4px' }}>Buttons, active category tabs & icons</span>
                    </div>

                    {/* Secondary / Text Contrast Color */}
                    <div style={{ padding: '12px', borderRadius: '10px', border: `1px solid ${C.border}`, backgroundColor: C.cardBg }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: C.slate, textTransform: 'uppercase', marginBottom: '6px' }}>
                        Secondary / Headings
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="color"
                          value={activeThemeConfig.secondary_color || settingsForm.secondary_color || '#1E293B'}
                          onChange={e => updateThemeConfig({ secondary_color: e.target.value })}
                          style={{ width: '42px', height: '38px', border: `1px solid ${C.border}`, borderRadius: '8px', cursor: 'pointer', padding: '2px', backgroundColor: C.cardBg }}
                        />
                        <input
                          type="text"
                          value={activeThemeConfig.secondary_color || settingsForm.secondary_color || '#1E293B'}
                          onChange={e => updateThemeConfig({ secondary_color: e.target.value })}
                          style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '12px', fontWeight: 700, fontFamily: 'monospace' }}
                        />
                      </div>
                      <span style={{ display: 'block', fontSize: '10px', color: C.slate, marginTop: '4px' }}>Titles, header text & dark contrast accents</span>
                    </div>

                    {/* Accent / Highlight Color */}
                    <div style={{ padding: '12px', borderRadius: '10px', border: `1px solid ${C.border}`, backgroundColor: C.cardBg }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: C.slate, textTransform: 'uppercase', marginBottom: '6px' }}>
                        Accent / Ribbon Highlight
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="color"
                          value={activeThemeConfig.accent_color || '#F59E0B'}
                          onChange={e => updateThemeConfig({ accent_color: e.target.value })}
                          style={{ width: '42px', height: '38px', border: `1px solid ${C.border}`, borderRadius: '8px', cursor: 'pointer', padding: '2px', backgroundColor: C.cardBg }}
                        />
                        <input
                          type="text"
                          value={activeThemeConfig.accent_color || '#F59E0B'}
                          onChange={e => updateThemeConfig({ accent_color: e.target.value })}
                          style={{ flex: 1, padding: '8px 10px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '12px', fontWeight: 700, fontFamily: 'monospace' }}
                        />
                      </div>
                      <span style={{ display: 'block', fontSize: '10px', color: C.slate, marginTop: '4px' }}>Bestseller tags, stars & special alerts</span>
                    </div>
                  </div>

                  {/* Quick Color Swatches */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: C.slate, marginRight: '4px' }}>Quick Swatches:</span>
                    {[
                      { name: 'Aqua Teal', hex: '#00C4CC' },
                      { name: 'Neon Pink', hex: '#FF2A85' },
                      { name: 'Emerald', hex: '#10B981' },
                      { name: 'Orange', hex: '#F97316' },
                      { name: 'Amber', hex: '#D97706' },
                      { name: 'Rose', hex: '#E11D48' },
                      { name: 'Indigo', hex: '#6366F1' },
                      { name: 'Violet', hex: '#8B5CF6' },
                      { name: 'Sky', hex: '#0284C7' },
                      { name: 'Obsidian', hex: '#1E293B' }
                    ].map(swatch => (
                      <button
                        key={swatch.hex}
                        type="button"
                        onClick={() => updateThemeConfig({ primary_color: swatch.hex })}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 8px',
                          borderRadius: '6px',
                          border: (activeThemeConfig.primary_color === swatch.hex || settingsForm.primary_color === swatch.hex) ? `2px solid ${C.dark}` : `1px solid ${C.border}`,
                          backgroundColor: C.cardBg,
                          color: C.dark,
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: swatch.hex }} />
                        {swatch.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ─── 3. BACKGROUND AESTHETIC & THEME AMBIENCE ──────────────────── */}
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: C.dark, marginBottom: '6px' }}>
                    Aesthetic Background & Ambience
                  </label>
                  <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: C.slate }}>
                    Choose the visual mood and background styling of your customer digital storefront
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                    {THEME_BG_STYLES.map(bg => {
                      const isSelected = (activeThemeConfig.bg_style || 'slate_clean') === bg.id;
                      return (
                        <button
                          key={bg.id}
                          type="button"
                          onClick={() => updateThemeConfig({ bg_style: bg.id })}
                          style={{
                            padding: '12px',
                            borderRadius: '12px',
                            border: isSelected ? `2px solid ${C.teal}` : `1px solid ${C.border}`,
                            backgroundColor: bg.bg,
                            color: bg.text,
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            boxShadow: isSelected ? `0 4px 14px ${C.tealLight}` : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '12px', fontWeight: 800 }}>{bg.label}</span>
                            {isSelected && <i className="ri-check-line" style={{ color: C.teal, fontSize: '16px', fontWeight: 900 }} />}
                          </div>
                          <span style={{ fontSize: '10px', opacity: 0.8, fontWeight: 600 }}>{bg.tag}</span>
                          <div style={{ height: '6px', width: '100%', borderRadius: '4px', backgroundColor: bg.card, border: `1px solid ${bg.border}`, marginTop: '4px' }} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ─── 4. BRAND TYPOGRAPHY (GOOGLE FONTS) ────────────────────────── */}
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 800, color: C.dark, marginBottom: '6px' }}>
                    Brand Typography
                  </label>
                  <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: C.slate }}>
                    Select the font typeface that reflects your dining atmosphere
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
                    {THEME_FONTS.map(fontItem => {
                      const isSelected = (activeThemeConfig.font_family || 'Plus Jakarta Sans') === fontItem.id;
                      return (
                        <button
                          key={fontItem.id}
                          type="button"
                          onClick={() => updateThemeConfig({ font_family: fontItem.id })}
                          style={{
                            padding: '12px',
                            borderRadius: '12px',
                            border: isSelected ? `2px solid ${C.teal}` : `1px solid ${C.border}`,
                            backgroundColor: isSelected ? C.tealLight : C.cardBg,
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            fontFamily: fontItem.font,
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '14px', fontWeight: 800, color: C.dark }}>{fontItem.label}</span>
                            {isSelected && <i className="ri-check-line" style={{ color: C.teal, fontSize: '16px' }} />}
                          </div>
                          <span style={{ fontSize: '11px', color: C.slate, fontFamily: 'sans-serif' }}>{fontItem.style}</span>
                          <span style={{ fontSize: '12px', color: C.tealDark, marginTop: '4px', fontWeight: 700 }}>
                            Crispy Wagyu Burger • ₱350
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ─── 5. SHAPE LANGUAGE & CORNER RADIUS ────────────────────────── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  {/* Corner Radius */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: C.dark, marginBottom: '6px' }}>
                      Corner Shape Language
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {THEME_RADII.map(rad => {
                        const isSelected = (activeThemeConfig.border_radius || 'smooth') === rad.id;
                        return (
                          <button
                            key={rad.id}
                            type="button"
                            onClick={() => updateThemeConfig({ border_radius: rad.id })}
                            style={{
                              padding: '10px 14px',
                              borderRadius: rad.radius,
                              border: isSelected ? `2px solid ${C.teal}` : `1px solid ${C.border}`,
                              backgroundColor: isSelected ? C.tealLight : C.cardBg,
                              textAlign: 'left',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 800, color: C.dark }}>{rad.label}</div>
                              <div style={{ fontSize: '10px', color: C.slate }}>{rad.desc}</div>
                            </div>
                            <span style={{
                              padding: '4px 10px',
                              borderRadius: rad.pill,
                              backgroundColor: C.teal,
                              color: '#FFF',
                              fontSize: '11px',
                              fontWeight: 800
                            }}>
                              Preview
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Hero Style */}
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: C.dark, marginBottom: '6px' }}>
                      Storefront Header Banner
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {THEME_HEROES.map(hero => {
                        const isSelected = (activeThemeConfig.hero_style || 'cinematic') === hero.id;
                        return (
                          <button
                            key={hero.id}
                            type="button"
                            onClick={() => updateThemeConfig({ hero_style: hero.id })}
                            style={{
                              padding: '10px 14px',
                              borderRadius: '12px',
                              border: isSelected ? `2px solid ${C.teal}` : `1px solid ${C.border}`,
                              backgroundColor: isSelected ? C.tealLight : C.cardBg,
                              textAlign: 'left',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <i className={hero.icon} style={{ fontSize: '16px', color: C.teal }} />
                              <div>
                                <div style={{ fontSize: '12px', fontWeight: 800, color: C.dark }}>{hero.label}</div>
                                <div style={{ fontSize: '10px', color: C.slate }}>{hero.desc}</div>
                              </div>
                            </div>
                            {isSelected && <i className="ri-check-line" style={{ color: C.teal, fontSize: '16px' }} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* ─── 6. MENU CARD DISPLAY DENSITY ──────────────────────────────── */}
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: C.dark, marginBottom: '6px' }}>
                    Menu Item Card Layout
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    {THEME_DENSITIES.map(den => {
                      const isSelected = (activeThemeConfig.card_density || 'grid_spacious') === den.id;
                      return (
                        <button
                          key={den.id}
                          type="button"
                          onClick={() => updateThemeConfig({ card_density: den.id })}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '12px',
                            border: isSelected ? `2px solid ${C.teal}` : `1px solid ${C.border}`,
                            backgroundColor: isSelected ? C.tealLight : C.cardBg,
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className={den.icon} style={{ fontSize: '18px', color: C.teal }} />
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 800, color: C.dark }}>{den.label}</div>
                              <div style={{ fontSize: '10px', color: C.slate }}>{den.desc}</div>
                            </div>
                          </div>
                          {isSelected && <i className="ri-check-line" style={{ color: C.teal, fontSize: '16px' }} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ─── 7. LOGO & BANNER IMAGES ─────────────────────────────────── */}
                <div style={{ paddingTop: '10px', borderTop: `1px solid ${C.pinkLight}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 800, color: C.dark }}>
                      Restaurant Logo Image
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', backgroundColor: C.teal, color: '#FFF', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                      <i className="ri-upload-cloud-2-line" />
                      {uploadingField === 'logo' ? 'Uploading...' : 'Upload Logo File'}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) handleFileUpload(f, 'logo', 'logo');
                        }}
                      />
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '8px' }}>
                    <img
                      src={settingsForm.logo_url || '/dine/IMG_0162.jpeg'}
                      alt="Logo preview"
                      style={{ width: '48px', height: '48px', borderRadius: '12px', objectFit: 'cover', border: `2px solid ${settingsForm.primary_color || C.teal}` }}
                      onError={e => { e.currentTarget.src = '/dine/IMG_0162.jpeg'; }}
                    />
                    <input
                      type="text"
                      placeholder="https://... or upload custom file"
                      value={settingsForm.logo_url}
                      onChange={e => setSettingsForm({ ...settingsForm, logo_url: e.target.value })}
                      style={{ flex: 1, padding: '10px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>

                  {/* Logo Presets */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: C.slate }}>Logo Presets:</span>
                    {[
                      { label: 'Ramen / Asian', url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=160&auto=format&fit=crop&q=80' },
                      { label: 'Cafe & Bakery', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=160&auto=format&fit=crop&q=80' },
                      { label: 'Gourmet Burger', url: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=160&auto=format&fit=crop&q=80' },
                      { label: 'Italian / Pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=160&auto=format&fit=crop&q=80' }
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

                  {/* Header Banner */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label style={{ fontSize: '13px', fontWeight: 800, color: C.dark }}>
                      Storefront Header Banner Image
                    </label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '6px', backgroundColor: C.teal, color: '#FFF', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}>
                      <i className="ri-upload-cloud-2-line" />
                      {uploadingField === 'banner' ? 'Uploading...' : 'Upload Banner File'}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) handleFileUpload(f, 'banner', 'banner');
                        }}
                      />
                    </label>
                  </div>
                  <input
                    type="text"
                    placeholder="https://... or upload custom file"
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

                {/* ─── 8. RESTAURANT BASIC DETAILS ─────────────────────────────── */}
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
                    background: isTealPink ? 'linear-gradient(135deg, #00C4CC 0%, #FF2A85 100%)' : (activeThemeConfig.primary_color || settingsForm.primary_color || C.teal),
                    color: '#FFF',
                    border: 'none',
                    padding: '14px 24px',
                    borderRadius: activeThemeConfig.border_radius === 'sharp' ? '6px' : activeThemeConfig.border_radius === 'rounded' ? '24px' : '12px',
                    fontSize: '14px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: isTealPink ? '0 4px 16px rgba(0, 196, 204, 0.4)' : `0 4px 16px ${(activeThemeConfig.primary_color || C.teal)}44`,
                    transition: 'transform 0.15s ease'
                  }}
                >
                  <i className="ri-save-line" style={{ fontSize: '18px' }} />
                  <span>Save Theme Customization & Brand Settings</span>
                </button>
              </form>
            </div>

            {/* Right: Live Interactive Storefront Preview Card */}
            <div style={{ position: 'sticky', top: '20px' }}>
              {(() => {
                const previewFont = activeThemeConfig.font_family || 'Plus Jakarta Sans';
                const previewRadius = activeThemeConfig.border_radius === 'sharp' ? '6px' : activeThemeConfig.border_radius === 'rounded' ? '22px' : '14px';
                const previewPillRadius = activeThemeConfig.border_radius === 'sharp' ? '6px' : activeThemeConfig.border_radius === 'rounded' ? '24px' : '12px';
                const previewBgStyle = activeThemeConfig.bg_style || 'slate_clean';
                const isDark = previewBgStyle === 'midnight_dark';
                const previewBg = isDark ? '#0F172A' : (previewBgStyle === 'warm_cream' ? '#FAF7F2' : previewBgStyle === 'matcha_soft' ? '#F0FDF4' : previewBgStyle === 'rose_blush' ? '#FFF1F2' : previewBgStyle === 'pure_white' ? '#FFFFFF' : '#F8FAFC');
                const previewCardBg = isDark ? '#1E293B' : '#FFFFFF';
                const previewTextColor = isDark ? '#F8FAFC' : (activeThemeConfig.secondary_color || '#1E293B');
                const previewMutedColor = isDark ? '#94A3B8' : '#64748B';
                const previewBorder = isDark ? '#334155' : (previewBgStyle === 'matcha_soft' ? '#DCFCE7' : previewBgStyle === 'warm_cream' ? '#E7E5E4' : previewBgStyle === 'rose_blush' ? '#FFE4E6' : '#E2E8F0');
                const previewPrimary = activeThemeConfig.primary_color || settingsForm.primary_color || C.teal;
                const previewAccent = activeThemeConfig.accent_color || '#F59E0B';
                const heroStyle = activeThemeConfig.hero_style || 'cinematic';
                const isCompact = activeThemeConfig.card_density === 'compact_list';

                return (
                  <div style={{
                    backgroundColor: previewBg,
                    borderRadius: previewRadius,
                    border: `1px solid ${previewBorder}`,
                    overflow: 'hidden',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
                    fontFamily: `'${previewFont}', -apple-system, sans-serif`,
                    transition: 'all 0.25s ease'
                  }}>
                    {/* Browser Shell Top Bar */}
                    <div style={{
                      padding: '12px 16px',
                      borderBottom: `1px solid ${previewBorder}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      backgroundColor: activeThemeConfig.preset === 'teal_pink_dine' ? '#00C4CC' : (isDark ? '#1E293B' : '#F1F5F9'),
                      color: activeThemeConfig.preset === 'teal_pink_dine' ? '#FFFFFF' : previewTextColor
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {activeThemeConfig.preset === 'teal_pink_dine' ? (
                          <DineBrandLogo color="#FF2A85" textColor="#FFFFFF" height={22} />
                        ) : (
                          <>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#EF4444', display: 'inline-block' }} />
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#F59E0B', display: 'inline-block' }} />
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10B981', display: 'inline-block' }} />
                          </>
                        )}
                        <span style={{ fontSize: '11px', fontWeight: 800, color: activeThemeConfig.preset === 'teal_pink_dine' ? '#FFFFFF' : previewMutedColor, marginLeft: '4px' }}>Live Storefront Preview</span>
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: activeThemeConfig.preset === 'teal_pink_dine' ? '#FFFFFF' : previewPrimary, backgroundColor: activeThemeConfig.preset === 'teal_pink_dine' ? 'rgba(255,255,255,0.22)' : (isDark ? '#0F172A' : '#FFF'), padding: '2px 8px', borderRadius: '6px', border: activeThemeConfig.preset === 'teal_pink_dine' ? '1px solid rgba(255,255,255,0.3)' : `1px solid ${previewBorder}` }}>
                        {tenantSlug}.localhost
                      </span>
                    </div>

                    {/* Simulated Store Banner / Hero Header */}
                    {heroStyle === 'minimal' ? (
                      <div style={{
                        padding: '16px',
                        borderBottom: `1px solid ${previewBorder}`,
                        backgroundColor: previewCardBg,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <img
                          src={settingsForm.logo_url || '/dine/IMG_0162.jpeg'}
                          alt="Logo"
                          style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: previewRadius,
                            objectFit: 'cover',
                            border: `2px solid ${previewPrimary}`
                          }}
                          onError={e => { e.currentTarget.src = '/dine/IMG_0162.jpeg'; }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: previewTextColor }}>
                            {settingsForm.name || 'Your Restaurant'}
                          </h4>
                          <span style={{ fontSize: '11px', color: previewMutedColor, fontWeight: 600 }}>
                            {settingsForm.cuisine_type || 'Specialty Dining'} • {settingsForm.city || 'Metro Manila'}
                          </span>
                        </div>
                        <span style={{ padding: '3px 8px', borderRadius: previewPillRadius, fontSize: '10px', fontWeight: 800, backgroundColor: `${previewPrimary}18`, color: previewPrimary }}>
                          OPEN
                        </span>
                      </div>
                    ) : (
                      <div style={{
                        height: heroStyle === 'glass' ? '135px' : '120px',
                        backgroundColor: previewPrimary,
                        backgroundImage: activeThemeConfig.preset === 'teal_pink_dine' && !settingsForm.banner_url
                          ? 'linear-gradient(130deg, #00C4CC 0%, #009DA3 26%, #6E1838 74%, #4A0E23 100%)'
                          : (settingsForm.banner_url ? `url(${settingsForm.banner_url})` : 'none'),
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        position: 'relative'
                      }}>
                        <div style={{
                          position: 'absolute',
                          inset: 0,
                          background: heroStyle === 'glass'
                            ? 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.65))'
                            : 'linear-gradient(to bottom, rgba(0,0,0,0.25), rgba(0,0,0,0.8))'
                        }} />

                        {heroStyle === 'glass' ? (
                          <div style={{
                            position: 'absolute',
                            inset: '12px',
                            backgroundColor: 'rgba(255,255,255,0.18)',
                            backdropFilter: 'blur(10px)',
                            borderRadius: previewRadius,
                            border: '1px solid rgba(255,255,255,0.35)',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '10px 14px',
                            gap: '12px'
                          }}>
                            <img
                              src={settingsForm.logo_url || '/dine/IMG_0162.jpeg'}
                              alt="Logo"
                              style={{
                                width: '46px',
                                height: '46px',
                                borderRadius: previewRadius,
                                objectFit: 'cover',
                                border: '2px solid #FFF',
                                backgroundColor: '#FFF'
                              }}
                              onError={e => { e.currentTarget.src = '/dine/IMG_0162.jpeg'; }}
                            />
                            <div>
                              <div style={{ fontSize: '15px', fontWeight: 800, color: '#FFF', textShadow: '0 2px 6px rgba(0,0,0,0.4)' }}>
                                {settingsForm.name || 'Your Restaurant'}
                              </div>
                              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.9)', fontWeight: 600 }}>
                                {settingsForm.cuisine_type || 'Specialty Cuisine'}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div style={{ position: 'absolute', bottom: '-20px', left: '16px', display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
                            <img
                              src={settingsForm.logo_url || '/dine/IMG_0162.jpeg'}
                              alt="Logo"
                              style={{
                                width: '56px',
                                height: '56px',
                                borderRadius: previewRadius,
                                objectFit: 'cover',
                                border: '3px solid #FFF',
                                boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                                backgroundColor: '#FFF'
                              }}
                              onError={e => { e.currentTarget.src = '/dine/IMG_0162.jpeg'; }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Simulated Store Info (for cinematic style) */}
                    {heroStyle === 'cinematic' && (
                      <div style={{ padding: '26px 16px 12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                          <div>
                            <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: previewTextColor }}>
                              {settingsForm.name || 'Your Restaurant'}
                            </h4>
                            <span style={{ fontSize: '12px', color: previewMutedColor, fontWeight: 600 }}>
                              {settingsForm.cuisine_type || 'Specialty Cuisine'} • {settingsForm.city || 'Metro Manila'}
                            </span>
                          </div>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: previewPillRadius,
                            fontSize: '11px',
                            fontWeight: 800,
                            backgroundColor: `${previewPrimary}18`,
                            color: previewPrimary
                          }}>
                            OPEN NOW
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Simulated Category Tabs */}
                    <div style={{ padding: '0 16px 14px' }}>
                      <div style={{ display: 'flex', gap: '6px', margin: '10px 0 14px', overflowX: 'auto', paddingBottom: '4px' }}>
                        {['All Menu', 'Signature Bowls', 'Drinks', 'Desserts'].map((tab, idx) => {
                          const isCatActive = idx === 0;
                          const activeBg = activeThemeConfig.preset === 'teal_pink_dine' ? '#FF2A85' : previewPrimary;
                          return (
                            <span
                              key={tab}
                              style={{
                                padding: '5px 12px',
                                borderRadius: previewPillRadius,
                                fontSize: '11px',
                                fontWeight: 700,
                                backgroundColor: isCatActive ? activeBg : (isDark ? '#334155' : '#E2E8F0'),
                                color: isCatActive ? '#FFF' : previewTextColor,
                                boxShadow: isCatActive && activeThemeConfig.preset === 'teal_pink_dine' ? '0 2px 8px rgba(255, 42, 133, 0.35)' : 'none',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {tab}
                            </span>
                          );
                        })}
                      </div>

                      {/* Simulated Dish Card (Density Preview: Grid vs Compact List) */}
                      {isCompact ? (
                        <div style={{
                          padding: '10px',
                          borderRadius: previewRadius,
                          backgroundColor: previewCardBg,
                          border: `1px solid ${previewBorder}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          marginBottom: '14px',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                        }}>
                          <div style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: previewRadius,
                            backgroundColor: `${previewPrimary}18`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: previewPrimary,
                            fontSize: '22px',
                            flexShrink: 0
                          }}>
                            <i className="ri-restaurant-line" />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '12px', fontWeight: 800, color: previewTextColor }}>Chef's Specialty Ramen</div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: previewPrimary }}>₱290.00</div>
                          </div>
                          <button
                            type="button"
                            style={{
                              padding: '5px 12px',
                              borderRadius: previewPillRadius,
                              border: 'none',
                              backgroundColor: previewPrimary,
                              color: '#FFF',
                              fontSize: '11px',
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            + Add
                          </button>
                        </div>
                      ) : (
                        <div style={{
                          borderRadius: previewRadius,
                          backgroundColor: previewCardBg,
                          border: `1px solid ${previewBorder}`,
                          overflow: 'hidden',
                          marginBottom: '14px',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                        }}>
                          <div style={{
                            height: '75px',
                            backgroundColor: `${previewPrimary}18`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px'
                          }}>
                            <span style={{ padding: '2px 7px', borderRadius: previewPillRadius, backgroundColor: previewAccent, color: '#FFF', fontSize: '9px', fontWeight: 800 }}>
                              BESTSELLER
                            </span>
                            <i className="ri-heart-3-line" style={{ color: previewPrimary, fontSize: '16px' }} />
                          </div>
                          <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ fontSize: '12px', fontWeight: 800, color: previewTextColor }}>Specialty Artisan Dish</div>
                              <div style={{ fontSize: '11px', fontWeight: 800, color: previewPrimary, marginTop: '2px' }}>₱280.00</div>
                            </div>
                            <button
                              type="button"
                              style={{
                                padding: '5px 12px',
                                borderRadius: previewPillRadius,
                                border: 'none',
                                backgroundColor: previewPrimary,
                                color: '#FFF',
                                fontSize: '11px',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                            >
                              + Add
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Storefront Active Spec Indicators */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '6px',
                        marginBottom: '12px',
                        fontSize: '10px',
                        textAlign: 'center'
                      }}>
                        <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: isDark ? '#1E293B' : '#F1F5F9', color: previewTextColor }}>
                          <span style={{ display: 'block', color: previewMutedColor, fontWeight: 700 }}>FONT</span>
                          <strong style={{ fontSize: '10px' }}>{previewFont}</strong>
                        </div>
                        <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: isDark ? '#1E293B' : '#F1F5F9', color: previewTextColor }}>
                          <span style={{ display: 'block', color: previewMutedColor, fontWeight: 700 }}>SHAPE</span>
                          <strong style={{ fontSize: '10px' }}>{activeThemeConfig.border_radius || 'smooth'}</strong>
                        </div>
                        <div style={{ padding: '6px', borderRadius: '8px', backgroundColor: isDark ? '#1E293B' : '#F1F5F9', color: previewTextColor }}>
                          <span style={{ display: 'block', color: previewMutedColor, fontWeight: 700 }}>AMBIENCE</span>
                          <strong style={{ fontSize: '10px' }}>{previewBgStyle}</strong>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => onOpenStorefront?.(tenantSlug)}
                        style={{
                          width: '100%',
                          padding: '11px',
                          borderRadius: previewPillRadius,
                          border: `1.5px solid ${previewPrimary}`,
                          backgroundColor: previewCardBg,
                          color: previewPrimary,
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <i className="ri-external-link-line" />
                        <span>Open Live Customer Storefront</span>
                      </button>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </main>
      </div>

      {/* ─── ADD/EDIT ITEM MODAL ─────────────────────────────────────────── */}
      {isItemModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div style={{ backgroundColor: C.cardBg, borderRadius: '16px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', border: `1px solid ${C.border}` }}>
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
                      value={itemForm.category_id || (menuData.categories[0]?.id || '')}
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '11px', fontWeight: 700, color: C.slate }}>Dish Photo / Image</label>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: C.tealDark, fontWeight: 700, cursor: 'pointer' }}>
                      <i className="ri-upload-cloud-2-line" />
                      {uploadingField === 'menu_item' ? 'Uploading...' : 'Upload Custom Photo'}
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => {
                          const f = e.target.files?.[0];
                          if (f) handleFileUpload(f, 'menu_item', 'menu');
                        }}
                      />
                    </label>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <img
                      src={itemForm.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80'}
                      alt="Dish preview"
                      style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'cover', border: `1px solid ${C.border}`, flexShrink: 0 }}
                      onError={e => { e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80'; }}
                    />
                    <input
                      type="text"
                      placeholder="https://... or upload custom photo"
                      value={itemForm.image_url}
                      onChange={e => setItemForm({ ...itemForm, image_url: e.target.value })}
                      style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
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
                  style={{ background: C.primaryBtnBg, color: '#FFF', border: 'none', padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: 800, cursor: 'pointer', marginTop: '6px', boxShadow: C.primaryBtnGlow }}
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
          <div style={{ backgroundColor: C.cardBg, borderRadius: '16px', width: '100%', maxWidth: '420px', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', border: `1px solid ${C.border}` }}>
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
                style={{ background: C.primaryBtnBg, color: '#FFF', border: 'none', padding: '12px', borderRadius: '10px', fontSize: '14px', fontWeight: 800, cursor: 'pointer', marginTop: '6px', boxShadow: C.primaryBtnGlow }}
              >
                Create Category in DB
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD / EDIT ADD-ON MODAL ────────────────────────────────────── */}
      {isAddonModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div style={{ backgroundColor: C.cardBg, borderRadius: '16px', width: '100%', maxWidth: '440px', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', border: `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                  <i className="ri-price-tag-3-fill" />
                </div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: C.dark }}>
                  {editingAddon ? 'Edit Add-on' : 'Add New Add-on'}
                </h3>
              </div>
              <button type="button" onClick={() => setIsAddonModalOpen(false)} style={{ border: 'none', background: 'none', fontSize: '20px', cursor: 'pointer' }}>
                <i className="ri-close-line" />
              </button>
            </div>

            <form onSubmit={handleSaveAddon} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: C.slate, marginBottom: '4px' }}>Add-on Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Extra Garlic Rice, Melted Cheese, Sunny-Side Egg"
                  value={addonForm.name}
                  onChange={e => setAddonForm({ ...addonForm, name: e.target.value })}
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: C.slate, marginBottom: '4px' }}>Extra Price (₱) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="25"
                    value={addonForm.price}
                    onChange={e => setAddonForm({ ...addonForm, price: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: C.slate, marginBottom: '4px' }}>Applicable Category</label>
                  <select
                    value={addonForm.type}
                    onChange={e => setAddonForm({ ...addonForm, type: e.target.value })}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: `1px solid ${C.border}`, fontSize: '13px', boxSizing: 'border-box', backgroundColor: C.cardBg, color: C.dark }}
                  >
                    <option value="food">Food Extra</option>
                    <option value="drink">Beverage Extra</option>
                    <option value="both">Universal (Food & Drink)</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: C.slate, marginBottom: '6px' }}>Availability Status</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <label style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${addonForm.is_available ? '#10B981' : C.border}`,
                    backgroundColor: addonForm.is_available ? '#ECFDF5' : '#FFF',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      name="addon_availability"
                      checked={!!addonForm.is_available}
                      onChange={() => setAddonForm({ ...addonForm, is_available: 1 })}
                      style={{ accentColor: '#10B981' }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#065F46' }}>In Stock</span>
                  </label>

                  <label style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: `1px solid ${!addonForm.is_available ? '#EF4444' : C.border}`,
                    backgroundColor: !addonForm.is_available ? '#FEF2F2' : '#FFF',
                    cursor: 'pointer'
                  }}>
                    <input
                      type="radio"
                      name="addon_availability"
                      checked={!addonForm.is_available}
                      onChange={() => setAddonForm({ ...addonForm, is_available: 0 })}
                      style={{ accentColor: '#EF4444' }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#991B1B' }}>Sold Out</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                style={{
                  backgroundColor: '#D97706',
                  color: '#FFF',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  marginTop: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <i className={editingAddon ? 'ri-save-line' : 'ri-add-line'} />
                <span>{editingAddon ? 'Save Add-on Changes' : 'Create Add-on'}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── ADD / EDIT STAFF MEMBER MODAL ──────────────────────────────── */}
      {/* ─── ADD / EDIT STAFF MODAL (EMAIL & PASSWORD) ────────────────── */}
      {isStaffModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px' }}>
          <div style={{ backgroundColor: C.cardBg, borderRadius: '20px', width: '100%', maxWidth: '460px', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.3)', border: `1px solid ${C.border}` }}>
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
                    <option value="admin">Admin (Full Dashboard)</option>
                    <option value="manager">Shift Manager</option>
                    <option value="kitchen">Kitchen / Chef</option>
                    <option value="cashier">Cashier / POS</option>
                    <option value="staff">Service Crew / Waiter</option>
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
                  background: C.primaryBtnBg,
                  color: '#FFF',
                  border: 'none',
                  padding: '12px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  marginTop: '6px',
                  boxShadow: C.primaryBtnGlow
                }}
              >
                {editingStaff ? 'Update Team Member' : 'Save & Add Team Member'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── FULL ORDER DETAILS POPUP MODAL (For Long Orders) ──────────── */}
      {selectedOrderModal && (
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
          zIndex: 110,
          padding: '16px',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            backgroundColor: C.cardBg,
            borderRadius: '20px',
            width: '100%',
            maxWidth: '560px',
            maxHeight: '85vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
            border: `1px solid ${C.border}`,
            overflow: 'hidden'
          }}>
            {/* Header */}
            <div style={{
              padding: '18px 22px',
              borderBottom: `1px solid ${C.border}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: C.pinkLight
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  backgroundColor: C.teal,
                  color: '#FFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px'
                }}>
                  <i className="ri-restaurant-2-fill" />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: C.dark }}>
                      Order #{selectedOrderModal.order_number}
                    </h3>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      padding: '2px 7px',
                      borderRadius: '6px',
                      backgroundColor: selectedOrderModal.status === 'completed' ? '#D1FAE5' : (selectedOrderModal.status === 'ready' ? '#FEF3C7' : C.tealLight),
                      color: selectedOrderModal.status === 'completed' ? '#065F46' : (selectedOrderModal.status === 'ready' ? '#92400E' : C.tealDark)
                    }}>
                      {selectedOrderModal.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: C.slate, marginTop: '2px' }}>
                    Customer: <strong style={{ color: C.dark }}>{selectedOrderModal.customer_name}</strong> •{' '}
                    <span>{selectedOrderModal.order_type === 'takeaway' ? 'Takeout' : 'Dine-In'}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedOrderModal(null)}
                style={{ border: 'none', background: 'none', fontSize: '22px', cursor: 'pointer', color: C.dark }}
              >
                <i className="ri-close-line" />
              </button>
            </div>

            {/* Content Body: All Items List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: C.dark }}>
                  All Ordered Items ({(selectedOrderModal.items || []).length})
                </span>
                <span style={{ fontSize: '12px', color: C.slate }}>
                  Payment: <strong style={{ color: C.dark }}>{selectedOrderModal.payment_method}</strong>
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {(selectedOrderModal.items || []).map((it, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: `1px solid ${C.border}`,
                      backgroundColor: C.cardBg,
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <img
                        src={it.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80'}
                        alt={it.item_name}
                        style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', border: `1px solid ${C.border}`, flexShrink: 0 }}
                        onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100&auto=format&fit=crop&q=80'; }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontWeight: 800, color: C.dark, fontSize: '13px' }}>
                          <span style={{ color: C.tealDark, fontWeight: 800, marginRight: '4px' }}>{it.quantity}x</span>
                          {it.item_name}
                        </div>
                        {renderInstructionBadges(it.instructions)}
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: C.tealDark }}>
                        ₱{(it.subtotal || it.price * it.quantity || 0).toFixed(0)}
                      </span>
                      <span style={{ display: 'block', fontSize: '10px', color: C.slate }}>
                        ₱{Number(it.price || 0).toFixed(0)} each
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {selectedOrderModal.notes && (
                <div style={{ marginTop: '14px', backgroundColor: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '10px', padding: '10px 12px', fontSize: '12px', color: '#92400E' }}>
                  <i className="ri-information-line" style={{ marginRight: '6px' }} />
                  <strong>Customer Instructions:</strong> {selectedOrderModal.notes}
                </div>
              )}

              {/* Digital Wallet (GCash & Maya) Verification Panel inside Modal */}
              {['gcash', 'maya'].some(m => selectedOrderModal.payment_method?.toLowerCase()?.includes(m)) && (() => {
                const isMaya = selectedOrderModal.payment_method?.toLowerCase()?.includes('maya');
                const walletName = isMaya ? 'Maya' : 'GCash';
                const brandBorder = isMaya ? '#00C853' : '#007DFE';
                return (
                  <div style={{
                    marginTop: '16px',
                    borderRadius: '14px',
                    border: selectedOrderModal.payment_status === 'paid'
                      ? (isDarkPortal ? '1px solid rgba(16, 185, 129, 0.4)' : '1.5px solid #86EFAC')
                      : (isDarkPortal ? '1px solid rgba(245, 158, 11, 0.4)' : '1.5px solid #FCD34D'),
                    backgroundColor: selectedOrderModal.payment_status === 'paid'
                      ? (isDarkPortal ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5')
                      : (isDarkPortal ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB'),
                    padding: '16px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          backgroundColor: selectedOrderModal.payment_status === 'paid' ? '#10B981' : '#F59E0B',
                          color: '#FFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '18px'
                        }}>
                          <i className={selectedOrderModal.payment_status === 'paid' ? 'ri-checkbox-circle-fill' : 'ri-time-line'} />
                        </div>
                        <div>
                          <div style={{
                            fontSize: '14px',
                            fontWeight: 800,
                            color: selectedOrderModal.payment_status === 'paid'
                              ? (isDarkPortal ? '#6EE7B7' : '#065F46')
                              : (isDarkPortal ? '#FCD34D' : '#92400E')
                          }}>
                            {selectedOrderModal.payment_status === 'paid'
                              ? `${walletName} Payment Verified & Approved`
                              : `${walletName} Payment Awaiting Staff Confirmation`}
                          </div>
                          <div style={{ fontSize: '11px', color: C.slate, marginTop: '2px' }}>
                            {selectedOrderModal.payment_status === 'paid'
                              ? 'This order has been verified. Kitchen can fulfill normally.'
                              : `Verify customer proof of payment screenshot below before confirming.`}
                          </div>
                        </div>
                      </div>

                      {selectedOrderModal.payment_status !== 'paid' && (
                        <button
                          type="button"
                          onClick={() => handleConfirmPayment(selectedOrderModal.id)}
                          style={{
                            backgroundColor: '#059669',
                            color: '#FFF',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '10px',
                            fontSize: '12px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)'
                          }}
                        >
                          <i className="ri-check-line" style={{ fontSize: '16px' }} />
                          <span>Confirm {walletName} Payment</span>
                        </button>
                      )}
                    </div>

                    {selectedOrderModal.payment_reference && (
                      <div style={{ fontSize: '12px', color: isDarkPortal ? '#F8FAFC' : '#1E293B', marginBottom: '10px' }}>
                        <strong>Customer Reference No:</strong>{' '}
                        <span style={{ fontFamily: 'monospace', fontSize: '13px', backgroundColor: isDarkPortal ? '#1F293D' : '#FFF', padding: '2px 8px', borderRadius: '6px', border: `1px solid ${C.border}` }}>
                          {selectedOrderModal.payment_reference}
                        </span>
                      </div>
                    )}

                    {selectedOrderModal.payment_proof ? (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '14px',
                        backgroundColor: isDarkPortal ? '#161F30' : '#FFF',
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: `1px solid ${C.border}`
                      }}>
                        <img
                          src={selectedOrderModal.payment_proof}
                          alt={`${walletName} Screenshot`}
                          onClick={() => setProofLightboxUrl(selectedOrderModal.payment_proof)}
                          style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '8px',
                            objectFit: 'cover',
                            cursor: 'pointer',
                            border: `1.5px solid ${brandBorder}`
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12px', fontWeight: 800, color: C.dark }}>
                            {walletName} Payment Screenshot Receipt
                          </div>
                          <div style={{ fontSize: '11px', color: C.slate, marginTop: '2px' }}>
                            Uploaded by diner at checkout. Click to inspect full-size image.
                          </div>
                          <button
                            type="button"
                            onClick={() => setProofLightboxUrl(selectedOrderModal.payment_proof)}
                            style={{
                              marginTop: '6px',
                              background: 'none',
                              border: 'none',
                              color: brandBorder,
                              fontSize: '11px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              padding: 0,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <i className="ri-fullscreen-line" /> Open Fullscreen Image
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: '11px', color: C.slate, fontStyle: 'italic' }}>
                        No payment screenshot was attached to this order.
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Footer Summary & Quick Action */}
            <div style={{
              padding: '16px 22px',
              borderTop: `1px solid ${C.border}`,
              backgroundColor: C.pinkLight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px'
            }}>
              <div>
                <span style={{ fontSize: '11px', color: C.slate, display: 'block' }}>Total Amount</span>
                <span style={{ fontSize: '20px', fontWeight: 800, color: C.dark }}>
                  ₱{Number(selectedOrderModal.total || 0).toFixed(0)}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {(selectedOrderModal.status === 'pending' || selectedOrderModal.status === 'new') && (
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateStatus(selectedOrderModal.id, 'confirmed');
                      setSelectedOrderModal(prev => prev ? ({ ...prev, status: 'confirmed' }) : null);
                    }}
                    style={{ padding: '8px 16px', borderRadius: '10px', background: C.primaryBtnBg, color: '#FFF', border: 'none', fontSize: '12px', fontWeight: 700, cursor: 'pointer', boxShadow: C.primaryBtnGlow }}
                  >
                    Confirm Order ➔
                  </button>
                )}
                {selectedOrderModal.status === 'confirmed' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateStatus(selectedOrderModal.id, 'preparing');
                      setSelectedOrderModal(prev => prev ? ({ ...prev, status: 'preparing' }) : null);
                    }}
                    style={{ padding: '8px 16px', borderRadius: '10px', backgroundColor: '#F59E0B', color: '#FFF', border: 'none', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Start Cooking ➔
                  </button>
                )}
                {selectedOrderModal.status === 'preparing' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateStatus(selectedOrderModal.id, 'ready');
                      setSelectedOrderModal(prev => prev ? ({ ...prev, status: 'ready' }) : null);
                    }}
                    style={{ padding: '8px 16px', borderRadius: '10px', backgroundColor: '#10B981', color: '#FFF', border: 'none', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Mark Ready ➔
                  </button>
                )}
                {selectedOrderModal.status === 'ready' && (
                  <button
                    type="button"
                    onClick={() => {
                      handleUpdateStatus(selectedOrderModal.id, 'completed');
                      setSelectedOrderModal(prev => prev ? ({ ...prev, status: 'completed' }) : null);
                    }}
                    style={{ padding: '8px 16px', borderRadius: '10px', backgroundColor: '#059669', color: '#FFF', border: 'none', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Complete Order ✓
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedOrderModal(null)}
                  style={{ padding: '8px 16px', borderRadius: '10px', backgroundColor: C.cardBg, color: C.dark, border: `1px solid ${C.border}`, fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── PROOF LIGHTBOX MODAL ─────────────────────────────────────── */}
      {proofLightboxUrl && (
        <div
          onClick={() => setProofLightboxUrl(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              backgroundColor: isDarkPortal ? '#161F30' : '#FFF',
              borderRadius: '20px',
              padding: '16px',
              boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <i className="ri-file-shield-2-line" style={{ color: '#007DFE', fontSize: '20px' }} />
                <span style={{ fontSize: '14px', fontWeight: 800, color: C.dark }}>
                  Customer GCash Payment Proof
                </span>
              </div>
              <button
                type="button"
                onClick={() => setProofLightboxUrl(null)}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: isDarkPortal ? '#1F293D' : '#F1F5F9',
                  color: C.dark,
                  fontSize: '18px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <i className="ri-close-line" />
              </button>
            </div>

            <img
              src={proofLightboxUrl}
              alt="Payment Proof"
              style={{
                maxWidth: '85vw',
                maxHeight: '75vh',
                objectFit: 'contain',
                borderRadius: '12px',
                border: `1px solid ${C.border}`
              }}
            />

            <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
              <a
                href={proofLightboxUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  fontSize: '12px',
                  color: '#007DFE',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <i className="ri-external-link-line" /> Open full image in new tab
              </a>
              <button
                type="button"
                onClick={() => setProofLightboxUrl(null)}
                style={{
                  padding: '6px 16px',
                  borderRadius: '8px',
                  backgroundColor: C.teal,
                  color: '#FFF',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation / Alert Modal */}
      <ConfirmModal
        {...confirmModal}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
