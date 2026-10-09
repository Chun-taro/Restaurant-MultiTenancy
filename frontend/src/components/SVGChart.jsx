import React from 'react';

export default function SVGChart({ data = [], height = 220 }) {
  if (!data || data.length === 0) return null;

  const width = 600;
  const padding = { top: 25, right: 30, bottom: 35, left: 55 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const values = data.map(d => d.value);
  const maxVal = Math.max(...values) * 1.15 || 100;
  const minVal = 0;

  const points = data.map((d, i) => {
    const x = padding.left + (i / (data.length - 1)) * chartW;
    const y = padding.top + chartH - ((d.value - minVal) / (maxVal - minVal)) * chartH;
    return { x, y, label: d.label, value: d.value };
  });

  const pathD = points.reduce((acc, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = points[i - 1];
    const cp1x = prev.x + (p.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (p.x - prev.x) / 2;
    const cp2y = p.y;
    return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  const ticks = 4;
  const gridLines = [];
  for (let i = 0; i <= ticks; i++) {
    const y = padding.top + (i / ticks) * chartH;
    const val = Math.round(maxVal - (i / ticks) * maxVal);
    gridLines.push({ y, val });
  }

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF5A1F" stopOpacity="0.38" />
          <stop offset="100%" stopColor="#FF5A1F" stopOpacity="0.0" />
        </linearGradient>
      </defs>

      {gridLines.map((g, idx) => (
        <g key={idx}>
          <line
            x1={padding.left}
            y1={g.y}
            x2={width - padding.right}
            y2={g.y}
            stroke="rgba(255,255,255,0.06)"
            strokeDasharray="4"
          />
          <text
            x={padding.left - 10}
            y={g.y + 4}
            fill="#6B7280"
            fontSize="11"
            textAnchor="end"
            fontFamily="'JetBrains Mono', monospace"
          >
            ₱{(g.val / 1000).toFixed(0)}k
          </text>
        </g>
      ))}

      <path d={areaD} fill="url(#chartGradient)" />
      <path d={pathD} fill="none" stroke="#FF5A1F" strokeWidth="3.5" strokeLinecap="round" />

      {points.map((p, idx) => (
        <circle
          key={idx}
          cx={p.x}
          cy={p.y}
          r="5"
          fill="#FF5A1F"
          stroke="#FFFFFF"
          strokeWidth="2"
        >
          <title>{p.label}: ₱{p.value.toLocaleString()}</title>
        </circle>
      ))}

      {points.map((p, idx) => (
        <text
          key={idx}
          x={p.x}
          y={height - 10}
          fill="#9CA3AF"
          fontSize="11"
          textAnchor="middle"
          fontFamily="'Plus Jakarta Sans', sans-serif"
        >
          {p.label}
        </text>
      ))}
    </svg>
  );
}
