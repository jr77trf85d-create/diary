// Kleines, abhängigkeitsfreies SVG-Liniendiagramm - passend zum Grundsatz, kein
// Build-Tooling/externe Bibliotheken zu brauchen.
const WIDTH = 300;
const HEIGHT = 120;
const PAD_LEFT = 36;
const PAD_RIGHT = 12;
const PAD_TOP = 12;
const PAD_BOTTOM = 20;

export function lineChartSvg(values, { color = "var(--color-accent)", formatValue = (v) => String(v) } = {}) {
  if (values.length === 0) return "";

  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const xStep = values.length > 1 ? plotWidth / (values.length - 1) : 0;
  const coords = values.map((v, i) => {
    const x = PAD_LEFT + i * xStep;
    const y = PAD_TOP + plotHeight - ((v - min) / range) * plotHeight;
    return [x, y];
  });

  const pathD = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const dots = coords
    .map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${color}" />`)
    .join("");

  return `
    <svg viewBox="0 0 ${WIDTH} ${HEIGHT}" width="100%" style="display:block;">
      <text x="${PAD_LEFT - 6}" y="${PAD_TOP + 4}" text-anchor="end" font-size="10" fill="var(--color-text-secondary)">${formatValue(max)}</text>
      <text x="${PAD_LEFT - 6}" y="${PAD_TOP + plotHeight}" text-anchor="end" font-size="10" fill="var(--color-text-secondary)">${formatValue(min)}</text>
      <line x1="${PAD_LEFT}" y1="${PAD_TOP + plotHeight}" x2="${WIDTH - PAD_RIGHT}" y2="${PAD_TOP + plotHeight}" stroke="var(--color-divider)" stroke-width="1" />
      ${values.length > 1 ? `<path d="${pathD}" fill="none" stroke="${color}" stroke-width="2" />` : ""}
      ${dots}
    </svg>
  `;
}

export function chartCardHtml(title, values, dateLabels, options) {
  if (values.length === 0) {
    return "";
  }
  const first = dateLabels[0];
  const last = dateLabels[dateLabels.length - 1];
  return `
    <div class="detail-section">
      <h3>${title}</h3>
      ${lineChartSvg(values, options)}
      ${
        values.length > 1
          ? `<div style="display:flex; justify-content:space-between; font-size:11px; color:var(--color-text-secondary); margin-top:2px;"><span>${first}</span><span>${last}</span></div>`
          : ""
      }
    </div>
  `;
}
