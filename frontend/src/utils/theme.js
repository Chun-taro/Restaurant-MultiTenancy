/**
 * RestoSaaS / Dine Superadmin Dynamic Theme Engine
 * Provides curated presets, custom dual-color mixing, and live CSS variable injection.
 */

export const THEMES = [
  {
    id: 'teal-pink',
    name: 'Teal & Pink Mix',
    tagline: 'Dine Signature • Luminous Aqua & Hot Neon Pink',
    description: 'Electric tropical aqua teal combined with vibrant hot magenta-pink and rich berry undertones, matching the official Dine brand identity.',
    isSignature: true,
    primary: '#00C4CC',
    primaryHover: '#00ACB5',
    primaryLight: '#38E1ED',
    primaryDark: '#008B94',
    accent: '#FF2A85',
    accentHover: '#E61872',
    accentLight: '#FF6BB0',
    accentDark: '#C40A5B',
    borderGlow: '#00C4CC',
    primaryRgb: '0, 196, 204',
    accentRgb: '255, 42, 133',
    gradient: 'linear-gradient(135deg, #00C4CC 0%, #FF2A85 100%)',
    gradientGlow: 'linear-gradient(135deg, rgba(0, 196, 204, 0.28) 0%, rgba(255, 42, 133, 0.28) 100%)',
    previewColors: ['#00C4CC', '#FF2A85']
  },
  {
    id: 'terracotta',
    name: 'Culinary Terracotta',
    tagline: 'Warm Cast-Iron & Bistro Flame',
    description: 'Traditional bistro ambiance with warm terracotta orange and roasted amber accents.',
    primary: '#E05A2B',
    primaryHover: '#C84B20',
    primaryLight: '#F08358',
    primaryDark: '#A63B14',
    accent: '#F59E0B',
    accentHover: '#D97706',
    accentLight: '#FBBF24',
    accentDark: '#B45309',
    borderGlow: '#E05A2B',
    primaryRgb: '224, 90, 43',
    accentRgb: '245, 158, 11',
    gradient: 'linear-gradient(135deg, #E05A2B 0%, #F59E0B 100%)',
    gradientGlow: 'linear-gradient(135deg, rgba(224, 90, 43, 0.25) 0%, rgba(245, 158, 11, 0.25) 100%)',
    previewColors: ['#E05A2B', '#F59E0B']
  },
  {
    id: 'emerald-gold',
    name: 'Emerald & Gold',
    tagline: 'Botanical Herb & Artisan Brass',
    description: 'Fresh farm-to-table organic green combined with rich culinary brass highlights.',
    primary: '#10B981',
    primaryHover: '#059669',
    primaryLight: '#34D399',
    primaryDark: '#047857',
    accent: '#F59E0B',
    accentHover: '#D97706',
    accentLight: '#FCD34D',
    accentDark: '#B45309',
    borderGlow: '#10B981',
    primaryRgb: '16, 185, 129',
    accentRgb: '245, 158, 11',
    gradient: 'linear-gradient(135deg, #10B981 0%, #F59E0B 100%)',
    gradientGlow: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(245, 158, 11, 0.25) 100%)',
    previewColors: ['#10B981', '#F59E0B']
  },
  {
    id: 'violet-cyan',
    name: 'Midnight Violet & Cyan',
    tagline: 'Cyber Gastro Lounge & Neon Cyan',
    description: 'Sophisticated royal violet paired with electric cyan for a sleek after-hours lounge feel.',
    primary: '#8B5CF6',
    primaryHover: '#7C3AED',
    primaryLight: '#A78BFA',
    primaryDark: '#6D28D9',
    accent: '#06B6D4',
    accentHover: '#0891B2',
    accentLight: '#67E8F9',
    accentDark: '#0E7490',
    borderGlow: '#8B5CF6',
    primaryRgb: '139, 92, 246',
    accentRgb: '6, 182, 212',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
    gradientGlow: 'linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(6, 182, 212, 0.25) 100%)',
    previewColors: ['#8B5CF6', '#06B6D4']
  },
  {
    id: 'ocean-coral',
    name: 'Ocean Azure & Coral',
    tagline: 'Pacific Sky & Warm Coral Rose',
    description: 'Refreshing azure blue with vivid coral accents inspired by coastal dining experiences.',
    primary: '#0284C7',
    primaryHover: '#0369A1',
    primaryLight: '#38BDF8',
    primaryDark: '#075985',
    accent: '#FB7185',
    accentHover: '#F43F5E',
    accentLight: '#FDA4AF',
    accentDark: '#E11D48',
    borderGlow: '#0284C7',
    primaryRgb: '2, 132, 199',
    accentRgb: '251, 113, 133',
    gradient: 'linear-gradient(135deg, #0284C7 0%, #FB7185 100%)',
    gradientGlow: 'linear-gradient(135deg, rgba(2, 132, 199, 0.25) 0%, rgba(251, 113, 133, 0.25) 100%)',
    previewColors: ['#0284C7', '#FB7185']
  },
  {
    id: 'custom',
    name: 'Custom Dual-Tone',
    tagline: 'Personalized Primary & Accent Color Blend',
    description: 'Pick any primary brand color and accent shade using live color pickers.',
    isCustom: true,
    previewColors: ['#00C4CC', '#FF2A85']
  }
];

/**
 * Convert Hex color to RGB object and comma-separated string
 */
export function hexToRgb(hex) {
  let cleanHex = (hex || '').replace('#', '').trim();
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  if (cleanHex.length !== 6) {
    return { r: 0, g: 196, b: 204, str: '0, 196, 204' };
  }
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return { r, g, b, str: `${r}, ${g}, ${b}` };
}

/**
 * Adjust color brightness by percentage (-100 to 100)
 */
export function adjustBrightness(hex, percent) {
  const { r, g, b } = hexToRgb(hex);
  const factor = percent / 100;
  const adjust = (c) => {
    const val = factor > 0 ? c + (255 - c) * factor : c + c * factor;
    return Math.max(0, Math.min(255, Math.round(val)));
  };
  const toHex = (n) => n.toString(16).padStart(2, '0');
  return `#${toHex(adjust(r))}${toHex(adjust(g))}${toHex(adjust(b))}`;
}

/**
 * Generate full palette variables for a given theme ID and optional custom colors
 */
export function generateThemeVariables(themeId = 'teal-pink', customPrimary = '#00C4CC', customAccent = '#FF2A85') {
  const preset = THEMES.find(t => t.id === themeId);
  
  if (preset && !preset.isCustom) {
    return {
      themeId: preset.id,
      name: preset.name,
      primary: preset.primary,
      primaryHover: preset.primaryHover,
      primaryLight: preset.primaryLight,
      primaryDark: preset.primaryDark,
      primaryGlow: `rgba(${preset.primaryRgb}, 0.16)`,
      primaryBorder: `rgba(${preset.primaryRgb}, 0.28)`,
      accent: preset.accent,
      accentHover: preset.accentHover,
      accentLight: preset.accentLight,
      accentDark: preset.accentDark,
      accentGlow: `rgba(${preset.accentRgb}, 0.18)`,
      accentBorder: `rgba(${preset.accentRgb}, 0.35)`,
      borderGlow: preset.borderGlow,
      gradientBrand: preset.gradient,
      gradientGlow: preset.gradientGlow,
      primaryRgb: preset.primaryRgb,
      accentRgb: preset.accentRgb
    };
  }

  // Custom theme calculation
  const p = customPrimary || '#00C4CC';
  const a = customAccent || '#FF2A85';
  const pRgb = hexToRgb(p).str;
  const aRgb = hexToRgb(a).str;

  return {
    themeId: 'custom',
    name: 'Custom Dual-Tone',
    primary: p,
    primaryHover: adjustBrightness(p, -14),
    primaryLight: adjustBrightness(p, 22),
    primaryDark: adjustBrightness(p, -28),
    primaryGlow: `rgba(${pRgb}, 0.16)`,
    primaryBorder: `rgba(${pRgb}, 0.28)`,
    accent: a,
    accentHover: adjustBrightness(a, -14),
    accentLight: adjustBrightness(a, 22),
    accentDark: adjustBrightness(a, -28),
    accentGlow: `rgba(${aRgb}, 0.18)`,
    accentBorder: `rgba(${aRgb}, 0.35)`,
    borderGlow: p,
    gradientBrand: `linear-gradient(135deg, ${p} 0%, ${a} 100%)`,
    gradientGlow: `linear-gradient(135deg, rgba(${pRgb}, 0.25) 0%, rgba(${aRgb}, 0.25) 100%)`,
    primaryRgb: pRgb,
    accentRgb: aRgb
  };
}

/**
 * Apply CSS variables dynamically to the document root element
 */
export function applyTheme(themeId = 'teal-pink', customPrimary = '#00C4CC', customAccent = '#FF2A85') {
  if (typeof document === 'undefined') return;

  const vars = generateThemeVariables(themeId, customPrimary, customAccent);
  const root = document.documentElement;

  root.style.setProperty('--primary', vars.primary);
  root.style.setProperty('--primary-hover', vars.primaryHover);
  root.style.setProperty('--primary-light', vars.primaryLight);
  root.style.setProperty('--primary-dark', vars.primaryDark);
  root.style.setProperty('--primary-glow', vars.primaryGlow);
  root.style.setProperty('--primary-border', vars.primaryBorder);
  root.style.setProperty('--border-glow', vars.borderGlow);

  root.style.setProperty('--accent', vars.accent);
  root.style.setProperty('--accent-hover', vars.accentHover);
  root.style.setProperty('--accent-light', vars.accentLight);
  root.style.setProperty('--accent-dark', vars.accentDark);
  root.style.setProperty('--accent-glow', vars.accentGlow);
  root.style.setProperty('--accent-border', vars.accentBorder);

  root.style.setProperty('--gradient-brand', vars.gradientBrand);
  root.style.setProperty('--gradient-glow', vars.gradientGlow);

  root.setAttribute('data-admin-theme', vars.themeId);

  // Store in localStorage for zero-flicker reload
  try {
    localStorage.setItem('dine_admin_theme_id', themeId);
    if (customPrimary) localStorage.setItem('dine_admin_custom_primary', customPrimary);
    if (customAccent) localStorage.setItem('dine_admin_custom_accent', customAccent);
  } catch (e) {}

  return vars;
}

/**
 * Retrieve saved theme preferences from localStorage (defaults to teal-pink)
 */
export function getStoredTheme() {
  if (typeof localStorage === 'undefined') {
    return { themeId: 'teal-pink', customPrimary: '#00C4CC', customAccent: '#FF2A85' };
  }
  const themeId = localStorage.getItem('dine_admin_theme_id') || 'teal-pink';
  let customPrimary = localStorage.getItem('dine_admin_custom_primary');
  let customAccent = localStorage.getItem('dine_admin_custom_accent');

  // Upgrade legacy muted teal/pink defaults to the calibrated Dine vibrant palette
  if (!customPrimary || customPrimary === '#0D9488') customPrimary = '#00C4CC';
  if (!customAccent || customAccent === '#EC4899') customAccent = '#FF2A85';

  return { themeId, customPrimary, customAccent };
}
