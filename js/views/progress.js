import { loadExercises, loadSessions } from "../storage.js";
import { showExerciseDetail, escapeHtml, customBadge } from "./exercises.js";
import { getHistory, groupByWeek, weekLabel, weeklyStats, formatKg } from "../services/historyService.js";
import { deleteSession } from "../services/sessionService.js";
import { reportHtml, trainingTitle, countsChipsHtml, personalBestCount } from "./sessionReport.js";
import { barChartSvg } from "../ui/charts.js";
import { confirmDialog } from "../ui/modal.js";
import { buildSessionReport } from "../services/comparisonService.js";

// Verlauf-Tab: Umschalter "Trainings" (Zeitleiste vergangener Einheiten) | "Übungen" (je Übung).
const state = { mode: "sessions", detailId: null };

export function renderProgress(container, setTitle) {
  if (state.mode === "sessions" && state.detailId) {
    return renderSessionDetail(container, setTitle);
  }

  setTitle("Verlauf", null);
  container.innerHTML = `
    <div class="segmented" role="tablist">
      <button role="tab" class="${state.mode === "sessions" ? "active" : ""}" data-mode="sessions" aria-selected="${state.mode === "sessions"}">Trainings</button>
      <button role="tab" class="${state.mode === "exercises" ? "active" : ""}" data-mode="exercises" aria-selected="${state.mode === "exercises"}">Übungen</button>
    </div>
    <div id="progress-body"></div>
  `;
  container.querySelectorAll("[data-mode]").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.mode = btn.dataset.mode;
      renderProgress(container, setTitle);
    });
  });

  const body = container.querySelector("#progress-body");
  if (state.mode === "sessions") renderSessionList(body, container, setTitle);
  else renderExerciseList(body);
}

// ---------- Trainings ----------

function renderSessionList(body, container, setTitle) {
  const history = getHistory();
  if (history.length === 0) {
    body.innerHTML = `
      <div class="empty-state">
        <div style="font-size:40px;">🏁</div>
        <h3>Noch keine Trainings</h3>
        <p>Sobald du ein Training abgeschlossen hast, erscheint es hier mit Auswertung und Vergleich.</p>
      </div>`;
    return;
  }

  const weeks = weeklyStats(history, 8);
  const current = weeks[weeks.length - 1];
  const fmtDay = (d) => d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
  const tile = (value, label, unit = "") => `<div class="stat-tile"><div class="stat-value">${value}${unit ? `<span class="stat-unit">${unit}</span>` : ""}</div><div class="stat-label">${label}</div></div>`;

  body.innerHTML = `
    <div class="card">
      <h3 class="section-title">Diese Woche</h3>
      <div class="stat-tiles">
        ${tile(current.trainings, current.trainings === 1 ? "Training" : "Trainings")}
        ${tile(current.sets, "Sätze")}
        ${tile(Math.round(current.volume).toLocaleString("de-DE"), "Volumen", "kg")}
      </div>
      <div class="list-row-sub" style="margin:14px 0 4px;">Volumen der letzten 8 Wochen</div>
      ${barChartSvg(weeks.map((w) => w.volume), [fmtDay(weeks[0].weekStart), "diese Woche"])}
    </div>

    ${groupByWeek(history)
      .map((group) => {
        const volume = group.reports.reduce((sum, r) => sum + r.totalVolume, 0);
        return `
        <div class="week-header">
          <span>${escapeHtml(weekLabel(group.weekStart))}</span>
          <span>${group.reports.length} ${group.reports.length === 1 ? "Training" : "Trainings"} · ${formatKg(volume)}</span>
        </div>
        ${group.reports.map(sessionCardHtml).join("")}`;
      })
      .join("")}
  `;

  body.querySelectorAll("[data-open-session]").forEach((card) => {
    card.addEventListener("click", () => {
      state.detailId = card.dataset.openSession;
      renderProgress(container, setTitle);
    });
  });
}

function sessionCardHtml(report) {
  const { session } = report;
  const done = new Date(session.completedAt);
  const title = trainingTitle(session);
  const dow = done.toLocaleDateString("de-DE", { weekday: "short" }).replace(".", "");
  const mon = done.toLocaleDateString("de-DE", { month: "short" }).replace(".", "");
  const meta = [
    `${report.trainedCount} ${report.trainedCount === 1 ? "Übung" : "Übungen"}`,
    `${report.totalSets} Sätze`,
    report.totalVolume > 0 ? formatKg(report.totalVolume) : `${report.totalReps} Wdh.`,
    report.durationMinutes !== null ? `${report.durationMinutes} min` : null,
  ].filter(Boolean);

  return `
    <button class="session-card" data-open-session="${session.id}" aria-label="Training vom ${done.toLocaleDateString("de-DE")} öffnen">
      <span class="session-date">
        <span class="session-dow">${escapeHtml(dow)}</span>
        <span class="session-day">${done.getDate()}</span>
        <span class="session-mon">${escapeHtml(mon)}</span>
      </span>
      <span class="session-main">
        <span class="session-title">${escapeHtml(title.day || title.plan)}</span>
        ${title.day ? `<span class="session-plan">${escapeHtml(title.plan)}</span>` : ""}
        <span class="session-meta">${meta.join(" · ")}</span>
        <span class="session-chips">${countsChipsHtml(report.counts, personalBestCount(report))}</span>
      </span>
      <span class="chevron">›</span>
    </button>`;
}

function renderSessionDetail(container, setTitle) {
  const session = loadSessions().find((s) => s.id === state.detailId && s.completedAt);
  const back = () => {
    state.detailId = null;
    renderProgress(container, setTitle);
  };
  if (!session) {
    back();
    return;
  }

  setTitle("Training", back);
  container.innerHTML = `
    ${reportHtml(buildSessionReport(session), { variant: "detail" })}
    <button class="btn-danger" id="delete-session-btn" style="width:100%; margin-top:4px;">Dieses Training löschen</button>
  `;
  container.scrollTop = 0;

  container.querySelector("#delete-session-btn").addEventListener("click", async () => {
    const ok = await confirmDialog(
      "Dieses Training wirklich löschen? Es fließt dann auch nicht mehr in Statistiken und Vergleichswerte ein.",
      { confirmLabel: "Löschen" }
    );
    if (ok) {
      deleteSession(session.id);
      back();
    }
  });
}

// ---------- Übungen ----------

function renderExerciseList(body) {
  const exerciseById = new Map(loadExercises().map((e) => [e.id, e]));
  const lastTrainedAt = new Map();

  for (const session of loadSessions()) {
    if (!session.completedAt) continue;
    for (const pe of session.performedExercises) {
      const hasData = pe.sets.some((s) => s.weight != null || s.reps != null);
      if (!hasData) continue;
      const current = lastTrainedAt.get(pe.exerciseId);
      if (!current || new Date(session.date) > new Date(current)) {
        lastTrainedAt.set(pe.exerciseId, session.date);
      }
    }
  }

  const trained = Array.from(lastTrainedAt.entries())
    .map(([exerciseId, date]) => ({ exercise: exerciseById.get(exerciseId), date }))
    .filter((e) => e.exercise)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (trained.length === 0) {
    body.innerHTML = `
      <div class="empty-state">
        <div style="font-size:40px;">📈</div>
        <h3>Noch kein Trainingsverlauf</h3>
        <p>Sobald du eine Trainingseinheit abgeschlossen hast, erscheinen hier deine Übungen mit Fortschritts-Charts.</p>
      </div>`;
    return;
  }

  body.innerHTML = trained
    .map(
      ({ exercise, date }) => `
    <div class="list-row" data-exercise-id="${exercise.id}" style="cursor:pointer;">
      <div class="list-row-main" style="font-weight:600;">
        ${escapeHtml(exercise.name)}${customBadge(exercise)}
        <div class="list-row-sub">Zuletzt trainiert: ${formatDate(date)}</div>
      </div>
      <span class="chevron">›</span>
    </div>
  `
    )
    .join("");

  body.querySelectorAll("[data-exercise-id]").forEach((row) => {
    row.addEventListener("click", () => {
      const exercise = exerciseById.get(row.dataset.exerciseId);
      if (exercise) showExerciseDetail(exercise);
    });
  });
}

function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}
