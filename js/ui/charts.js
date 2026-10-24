// Kleines, abhängigkeitsfreies SVG-Liniendiagramm - passend zum Grundsatz, kein
// Build-Tooling/externe Bibliotheken zu brauchen.
const WIDTH = 300;
const HEIGHT = 120;
// Links genug Platz für Beschriftungen wie "2.465 kg", sonst werden sie am Rand abgeschnitten.
const PAD_LEFT = 60;
const PAD_RIGHT = 14;
const PAD_TOP = 12;
const PAD_BOTTOM = 20;

export function lineChartSvg(values, { color = "var(--color-accent)", formatValue = (v) => String(v) } = {}) {
  if (values.length === 0) return "";

  const plotWidth = WIDTH - PAD_LEFT - PAD_RIGHT;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const flat = max === min;
  const range = max - min || 1;

  const xStep = values.length > 1 ? plotWidth / (values.length - 1) : 0;
  const coords = values.map((v, i) => {
    const x = PAD_LEFT + i * xStep;
    // Verläuft alles auf einem Wert, liegt die Linie in der Mitte statt am unteren Rand.
    const y = flat ? PAD_TOP + plotHeight / 2 : PAD_TOP + plotHeight - ((v - min) / range) * plotHeight;
    return [x, y];
  });

  const pathD = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const dots = coords
    .map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${color}" />`)
    .join("");

  return `
    <svg viewBox="0 0 ${WIDTH} ${HEIGHT}" width="100%" style="display:block;">
      ${
        flat
          ? `<text x="${PAD_LEFT - 8}" y="${PAD_TOP + plotHeight / 2 + 4}" text-anchor="end" font-size="11" fill="var(--color-text-secondary)">${formatValue(max)}</text>`
          : `<text x="${PAD_LEFT - 8}" y="${PAD_TOP + 4}" text-anchor="end" font-size="11" fill="var(--color-text-secondary)">${formatValue(max)}</text>
      <text x="${PAD_LEFT - 8}" y="${PAD_TOP + plotHeight}" text-anchor="end" font-size="11" fill="var(--color-text-secondary)">${formatValue(min)}</text>`
      }
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

// Balkendiagramm (z. B. Volumen je Woche). Der letzte Balken (aktuelle Woche) wird hervorgehoben.
export function barChartSvg(values, labels = []) {
  const width = 300;
  const height = 96;
  const padX = 4;
  const padTop = 8;
  const labelH = 16;
  const plotH = height - padTop - labelH;
  const max = Math.max(...values, 0);
  const gap = 6;
  const barW = (width - padX * 2 - gap * (values.length - 1)) / values.length;

  const bars = values
    .map((v, i) => {
      const h = max > 0 ? Math.max(v > 0 ? 3 : 0, (v / max) * plotH) : 0;
      const x = padX + i * (barW + gap);
      const y = padTop + plotH - h;
      const isLast = i === values.length - 1;
      const fill = v === 0 ? "var(--color-divider)" : isLast ? "var(--color-accent)" : "var(--color-accent-secondary)";
      const opacity = isLast || v === 0 ? 1 : 0.55;
      return `<rect x="${x.toFixed(1)}" y="${(v === 0 ? padTop + plotH - 2 : y).toFixed(1)}" width="${barW.toFixed(1)}" height="${(v === 0 ? 2 : h).toFixed(1)}" rx="3" fill="${fill}" opacity="${opacity}" />`;
    })
    .join("");

  const first = labels[0] ?? "";
  const last = labels[labels.length - 1] ?? "";
  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" style="display:block;" role="img" aria-label="Volumen der letzten Wochen">
      ${bars}
      <text x="${padX}" y="${height - 3}" font-size="10" fill="var(--color-text-secondary)">${first}</text>
      <text x="${width - padX}" y="${height - 3}" font-size="10" text-anchor="end" fill="var(--color-text-secondary)">${last}</text>
    </svg>`;
}
