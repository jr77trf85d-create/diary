// Motivations-Balken im Training: zeigt, wie viel vom Vergleichswert (letztes Training) bereits
// geschafft ist. Ab 100 % bleibt er voll und zeigt den Vorsprung ("+12 %").
const fmt = (n) => Math.round(n).toLocaleString("de-DE");

function texts(progress) {
  const unit = progress.mode === "reps" ? "Wdh." : "kg";
  const label = `${fmt(progress.value)} von ${fmt(progress.target)} ${unit}`;
  const over = progress.percent > 100;
  const pct = over ? `+${progress.percent - 100} %` : `${progress.percent} %`;
  return { label, pct, over, done: progress.percent >= 100 };
}

export function progressBarHtml(progress) {
  if (!progress) {
    return `<div class="prog prog-empty" data-prog>Erstes Training – du legst die Messlatte</div>`;
  }
  const t = texts(progress);
  const width = Math.max(0, Math.min(progress.ratio, 1)) * 100;
  return `
    <div class="prog ${t.done ? "done" : ""} ${t.over ? "over" : ""}" data-prog>
      <div class="prog-top">
        <span class="prog-label" data-prog-label>${t.label}</span>
        <span class="prog-pct" data-prog-pct>${t.pct}</span>
      </div>
      <div class="prog-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.min(progress.percent, 100)}">
        <div class="prog-fill" data-prog-fill style="width:${width.toFixed(1)}%"></div>
      </div>
    </div>`;
}

// Aktualisiert einen vorhandenen Balken, ohne ihn neu aufzubauen (die Breite animiert dadurch).
export function updateProgressBar(root, progress) {
  if (!root || !progress) return;
  const t = texts(progress);
  root.classList.toggle("done", t.done);
  root.classList.toggle("over", t.over);
  root.querySelector("[data-prog-label]").textContent = t.label;
  root.querySelector("[data-prog-pct]").textContent = t.pct;
  root.querySelector("[data-prog-fill]").style.width = `${(Math.max(0, Math.min(progress.ratio, 1)) * 100).toFixed(1)}%`;
  root.querySelector("[role=progressbar]").setAttribute("aria-valuenow", String(Math.min(progress.percent, 100)));
}
