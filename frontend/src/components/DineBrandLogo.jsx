import React from 'react';

/**
 * DineBrandLogo - Authentic plate & spoon brand emblem for RestoSaaS / DINE
 * Exactly matches the signature promotional logo art from the official Dine brand.
 * 
 * @param {string} color - 'pink' | 'white' | 'teal' | custom hex
 * @param {number} height - Height in pixels (default: 36)
 * @param {boolean} showText - Whether to render the 'INE' brand text (default: true)
 * @param {string} className - Optional CSS class
 */
export default function DineBrandLogo({
  color = '#FF2A85',
  textColor = null,
  height = 36,
  showText = true,
  className = '',
  style = {}
}) {
  const iconColor = color === 'pink' ? '#FF2A85' : color === 'white' ? '#FFFFFF' : color === 'teal' ? '#00C4CC' : color;
  const brandTextColor = textColor
    ? (textColor === 'pink' ? '#FF2A85' : textColor === 'white' ? '#FFFFFF' : textColor === 'teal' ? '#00C4CC' : textColor)
    : iconColor;

  // ViewBox proportions: Aspect ratio ~ 2.6:1 when text is shown, ~ 1.1:1 icon only
  const viewBox = showText ? '0 0 170 64' : '0 0 72 64';
  const width = showText ? Math.round(height * 2.65) : Math.round(height * 1.12);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={viewBox}
      width={width}
      height={height}
      className={className}
      style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style }}
    >
      <defs>
        <filter id="dine-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor={iconColor} floodOpacity="0.3" />
        </filter>
      </defs>

      <g filter="url(#dine-glow)">
        {/* Outer Plate Arc */}
        <path
          d="M 28 8 A 24 24 0 0 0 28 56"
          fill="none"
          stroke={iconColor}
          strokeWidth="4.5"
          strokeLinecap="round"
        />

        {/* Inner Plate Arc */}
        <path
          d="M 28 17 A 15 15 0 0 0 28 47"
          fill="none"
          stroke={iconColor}
          strokeWidth="3.2"
          strokeLinecap="round"
        />

        {/* Diagonal Spoon forming the stem of D */}
        {/* Spoon Handle */}
        <line
          x1="38"
          y1="54"
          x2="52"
          y2="24"
          stroke={iconColor}
          strokeWidth="4.2"
          strokeLinecap="round"
        />

        {/* Spoon Head (Oval Bowl) */}
        <ellipse
          cx="57"
          cy="15"
          rx="7"
          ry="10"
          transform="rotate(25 57 15)"
          fill="none"
          stroke={iconColor}
          strokeWidth="3.6"
        />
      </g>

      {/* Brand Letters: I N E (forming D - I - N - E together with the plate+spoon D) */}
      {showText && (
        <g fill={brandTextColor} style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, sans-serif", fontWeight: 900 }}>
          {/* I */}
          <rect x="76" y="14" width="8.5" height="36" rx="4.2" />

          {/* N */}
          <path
            d="M 94 47 L 94 17 C 94 15.3 95.3 14 97 14 C 98.7 14 100 15.3 100 17 L 100 37 L 118 15.5 C 119 14.3 120.5 13.8 122 14.5 C 123.2 15.2 124 16.5 124 18 L 124 47 C 124 48.7 122.7 50 121 50 C 119.3 50 118 48.7 118 47 L 118 27 L 100 48.5 C 99 49.7 97.5 50.2 96 49.5 C 94.8 48.8 94 47.5 94 47 Z"
          />

          {/* E */}
          <path
            d="M 133 18 C 133 15.8 134.8 14 137 14 L 157 14 C 158.7 14 160 15.3 160 17 C 160 18.7 158.7 20 157 20 L 141.5 20 L 141.5 28.5 L 154 28.5 C 155.7 28.5 157 29.8 157 31.5 C 157 33.2 155.7 34.5 154 34.5 L 141.5 34.5 L 141.5 44 L 158 44 C 159.7 44 161 45.3 161 47 C 161 48.7 159.7 50 158 50 L 137 50 C 134.8 50 133 48.2 133 46 Z"
          />
        </g>
      )}
    </svg>
  );
}
