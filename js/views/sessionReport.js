import { loadExercises } from "../storage.js";
import { getPlan } from "../services/planService.js";
import { getSession } from "../services/sessionService.js";
import { buildSessionReport, isFilledSet } from "../services/comparisonService.js";
import { escapeHtml, customBadge, formatSetShort } from "./exercises.js";
import { formatNumber } from "../ui/format.js";

const fmtNumber = (n) => Math.round(n).toLocaleString("de-DE");
const fmtDate = (iso) => new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });

export function trainingTitle(session) {
  const plan = getPlan(session.planId);
  const day = plan?.days.find((d) => d.id === session.dayId);
  return {
    plan: plan?.name ?? "Training",
    day: day?.name ?? "",
  };
}

const STATUS = {
  up: { icon: "↑", cls: "up", label: "gesteigert" },
  same: { icon: "＝", cls: "same", label: "gleich" },
  down: { icon: "↓", cls: "down", label: "weniger" },
  new: { icon: "★", cls: "new", label: "neu" },
};

export function deltaPill(comparison) {
  const s = STATUS[comparison.status];
  const text =
    comparison.status === "new"
      ? "Neu"
      : comparison.status === "same" && comparison.deltaPercent === 0
        ? "gleich"
        : `${comparison.deltaPercent > 0 ? "+" : ""}${comparison.deltaPercent} %`;
  return `<span class="delta-pill ${s.cls}">${text}</span>`;
}

// Kleine Fortschrittsmarker für Verlaufs-Karten, z. B. "↑ 4  ＝ 1  ↓ 1".
export function countsChipsHtml(counts, personalBests = 0) {
  const chip = (key, n) => (n > 0 ? `<span class="count-chip ${STATUS[key].cls}" title="${n} ${STATUS[key].label}">${STATUS[key].icon} ${n}</span>` : "");
  return `${chip("up", counts.up)}${chip("same", counts.same)}${chip("down", counts.down)}${chip("new", counts.new)}${
    personalBests > 0 ? `<span class="count-chip pb" title="${personalBests} Bestgewicht">🏆 ${personalBests}</span>` : ""
  }`;
}

export function personalBestCount(report) {
  return report.items.filter((i) => i.personalBest).length;
}

function itemHtml(item, exerciseById) {
  const exercise = exerciseById.get(item.performed.exerciseId);
  const c = item.comparison;
  const s = STATUS[c.status];
  const sets = item.performed.sets.filter(isFilledSet).map((set) => `<span class="set-pill">${formatSetShort(set)}</span>`).join("");

  let detail = "";
  if (c.status === "new") {
    detail = "Noch kein Vergleich vorhanden";
  } else {
    const unit = c.mode === "reps" ? "Wdh." : "kg";
    detail = `${c.mode === "reps" ? "Wiederholungen" : "Volumen"} ${fmtNumber(c.currentValue)} ${unit} · vorher ${fmtNumber(c.referenceValue)} ${unit}`;
    if (c.topWeightDelta) {
      detail += ` · Bestgewicht ${formatNumber(c.current.topWeight)} kg (${c.topWeightDelta > 0 ? "+" : ""}${formatNumber(c.topWeightDelta)})`;
    }
    if (!c.sameDay) detail += " · Vergleich mit anderem Trainingstag";
  }

  return `
    <div class="report-item">
      <div class="status-dot ${s.cls}" aria-label="${s.label}">${s.icon}</div>
      <div class="report-item-main">
        <div class="report-item-head">
          <span class="report-item-name">${escapeHtml(exercise?.name ?? "Unbekannte Übung")}${customBadge(exercise)}${
            item.personalBest ? ' <span class="pb-badge" title="Neues Bestgewicht">🏆</span>' : ""
          }</span>
          ${deltaPill(c)}
        </div>
        <div class="report-sets">${sets}</div>
        <div class="list-row-sub">${escapeHtml(detail)}</div>
      </div>
    </div>`;
}

// HTML der gesamten Auswertung. variant "summary" = direkt nach dem Abschluss, "detail" = Verlauf.
export function reportHtml(report, { variant }) {
  const { session } = report;
  const exerciseById = new Map(loadExercises().map((e) => [e.id, e]));
  const title = trainingTitle(session);
  const trained = report.items.filter((i) => !i.skipped);
  const skipped = report.items.filter((i) => i.skipped);

  const when = new Date(session.completedAt ?? session.date).toLocaleString("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });

  let comparisonLine;
  if (report.previousDate && report.volumeDeltaPercent !== null) {
    const d = report.volumeDeltaPercent;
    comparisonLine = `Gesamtvolumen <strong class="${d > 0 ? "text-up" : d < 0 ? "text-down" : ""}">${d > 0 ? "+" : ""}${d} %</strong> gegenüber dem letzten Training dieses Tages (${fmtDate(report.previousDate)})`;
  } else {
    comparisonLine = "Erstes Training dieses Tages – ab jetzt gibt es einen Vergleich.";
  }

  const tile = (value, label, unit = "") => `<div class="stat-tile"><div class="stat-value">${value}${unit ? `<span class="stat-unit">${unit}</span>` : ""}</div><div class="stat-label">${label}</div></div>`;

  return `
    <div class="card hero-card">
      ${variant === "summary" ? '<div class="hero-kicker">Geschafft!</div>' : ""}
      <div class="hero-title">${escapeHtml(title.plan)}${title.day ? ` · ${escapeHtml(title.day)}` : ""}</div>
      <div class="list-row-sub" style="margin-bottom:12px;">${escapeHtml(when)}</div>
      <div class="stat-tiles">
        ${tile(report.trainedCount, report.trainedCount === 1 ? "Übung" : "Übungen")}
        ${tile(report.totalSets, "Sätze")}
        ${report.totalVolume > 0 ? tile(fmtNumber(report.totalVolume), "Volumen", "kg") : tile(report.totalReps, "Wdh.")}
        ${report.durationMinutes !== null ? tile(report.durationMinutes, "Dauer", "min") : ""}
      </div>
      <div class="hero-compare">${comparisonLine}</div>
    </div>

    <div class="balance-row">
      ${(["up", "same", "down", "new"])
        .map((k) => `<div class="balance ${STATUS[k].cls}"><span class="balance-n">${report.counts[k]}</span><span class="balance-l">${STATUS[k].label}</span></div>`)
        .join("")}
    </div>

    <div class="card report-list">
      ${trained.length === 0 ? '<p style="color:var(--color-text-secondary);">Keine Sätze eingetragen.</p>' : trained.map((i) => itemHtml(i, exerciseById)).join("")}
    </div>

    ${
      skipped.length > 0
        ? `<div class="list-row-sub" style="margin:0 4px 12px;">Nicht trainiert: ${skipped
            .map((i) => escapeHtml(exerciseById.get(i.performed.exerciseId)?.name ?? "Unbekannt"))
            .join(", ")}</div>`
        : ""
    }
  `;
}

// Vollbild-Auswertung direkt nach "Training abschließen".
export function renderSessionSummary(container, setTitle, sessionId, onClose) {
  const session = getSession(sessionId);
  if (!session) {
    onClose();
    return;
  }
  setTitle("Auswertung", onClose);
  container.innerHTML = `
    ${reportHtml(buildSessionReport(session), { variant: "summary" })}
    <button class="btn-primary" id="summary-done" style="width:100%; margin-top:4px;">Fertig</button>
  `;
  container.scrollTop = 0;
  container.querySelector("#summary-done").addEventListener("click", onClose);
}
