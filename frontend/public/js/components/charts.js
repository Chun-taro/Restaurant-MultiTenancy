/**
 * Crisp SVG Interactive Charts
 */

const Charts = {
  renderLineChart(containerId, data = [], options = {}) {
    const container = document.getElementById(containerId);
    if (!container || !data.length) return;

    const width = container.clientWidth || 600;
    const height = options.height || 220;
    const padding = { top: 25, right: 30, bottom: 35, left: 55 };

    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const values = data.map(d => d.value);
    const maxVal = Math.max(...values) * 1.15 || 100;
    const minVal = 0;

    // Calculate points
    const points = data.map((d, i) => {
      const x = padding.left + (i / (data.length - 1)) * chartW;
      const y = padding.top + chartH - ((d.value - minVal) / (maxVal - minVal)) * chartH;
      return { x, y, label: d.label, value: d.value };
    });

    const pathD = points.reduce((acc, p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      // Smooth cubic bezier
      const prev = points[i - 1];
      const cp1x = prev.x + (p.x - prev.x) / 2;
      const cp1y = prev.y;
      const cp2x = prev.x + (p.x - prev.x) / 2;
      const cp2y = p.y;
      return `${acc} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p.x} ${p.y}`;
    }, '');

    const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

    // Horizontal grid lines
    let gridLines = '';
    const ticks = 4;
    for (let i = 0; i <= ticks; i++) {
      const y = padding.top + (i / ticks) * chartH;
      const val = Math.round(maxVal - (i / ticks) * maxVal);
      gridLines += `
        <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="rgba(255,255,255,0.06)" stroke-dasharray="4" />
        <text x="${padding.left - 10}" y="${y + 4}" fill="#6B7280" font-size="11" text-anchor="end" font-family="'JetBrains Mono', monospace">₱${(val / 1000).toFixed(0)}k</text>
      `;
    }

    // X-axis labels
    const xLabels = points.map(p => `
      <text x="${p.x}" y="${height - 10}" fill="#9CA3AF" font-size="11" text-anchor="middle" font-family="'Plus Jakarta Sans', sans-serif">${p.label}</text>
    `).join('');

    // Dots
    const dots = points.map(p => `
      <circle cx="${p.x}" cy="${p.y}" r="5" fill="#6366F1" stroke="#FFFFFF" stroke-width="2" class="chart-point" data-val="₱${p.value.toLocaleString()}">
        <title>${p.label}: ₱${p.value.toLocaleString()}</title>
      </circle>
    `).join('');

    container.innerHTML = `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" style="overflow: visible;">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#6366F1" stop-opacity="0.38"/>
            <stop offset="100%" stop-color="#6366F1" stop-opacity="0.0"/>
          </linearGradient>
        </defs>
        ${gridLines}
        <path d="${areaD}" fill="url(#chartGradient)" />
        <path d="${pathD}" fill="none" stroke="#6366F1" stroke-width="3.5" stroke-linecap="round" />
        ${dots}
        ${xLabels}
      </svg>
    `;
  }
};

window.Charts = Charts;
