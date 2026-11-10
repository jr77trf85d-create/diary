import { loadExercises, loadSessions } from "../storage.js";
import {
  getPlans,
  getPlan,
  createPlan,
  deletePlan,
  renamePlan,
  renameDay,
  addExerciseToDay,
  removeExerciseFromDay,
  updateTargetSets,
  updateTargetReps,
} from "../services/planService.js";
import { openModal, closeModal, confirmDialog } from "../ui/modal.js";
import { openExercisePicker } from "./exercisePicker.js";
import { escapeHtml, customBadge, showExerciseDetail } from "./exercises.js";
import { refresh } from "../router.js";
import {
  startSession,
  getUnfinishedSessions,
  getUnfinishedSessionForDay,
  discardSession,
} from "../services/sessionService.js";
import { recommendedReps, effectiveRepRange } from "../data/repRanges.js";
import { findReference } from "../services/comparisonService.js";
import { increaseHint } from "../services/progressionService.js";
import { renderActiveSession } from "./activeSession.js";
import { renderSessionSummary } from "./sessionReport.js";
import { TRAINING_PLAN_PRESETS } from "../data/presets.js";
import { instantiatePreset, PresetInstantiationError } from "../services/presetInstantiationService.js";

const nav = { screen: "list" };

export function renderPlans(container, setTitle) {
  if (nav.screen === "presets") {
    return renderPresetList(container, setTitle);
  }
  if (nav.screen === "presetDetail") {
    const preset = TRAINING_PLAN_PRESETS.find((p) => p.id === nav.presetId);
    if (!preset) {
      nav.screen = "presets";
      return renderPlans(container, setTitle);
    }
    return renderPresetDetail(container, setTitle, preset);
  }
  if (nav.screen === "plan") {
    const plan = getPlan(nav.planId);
    if (!plan) {
      nav.screen = "list";
      return renderPlans(container, setTitle);
    }
    return renderPlanDetail(container, setTitle, plan);
  }
  if (nav.screen === "session") {
    return renderActiveSession(container, setTitle, nav.sessionId, {
      onBack: () => {
        nav.screen = "day";
        renderPlans(container, setTitle);
      },
      onFinished: (sessionId) => {
        nav.screen = "summary";
        nav.sessionId = sessionId;
        renderPlans(container, setTitle);
      },
    });
  }
  if (nav.screen === "summary") {
    return renderSessionSummary(container, setTitle, nav.sessionId, () => {
      nav.screen = "day";
      renderPlans(container, setTitle);
    });
  }
  if (nav.screen === "day") {
    const plan = getPlan(nav.planId);
    const day = plan?.days.find((d) => d.id === nav.dayId);
    if (!plan || !day) {
      nav.screen = "list";
      return renderPlans(container, setTitle);
    }
    return renderDayDetail(container, setTitle, plan, day);
  }
  return renderPlanList(container, setTitle);
}

function renderPlanList(container, setTitle) {
  setTitle("Pläne", null);
  const plans = getPlans();
  const unfinished = getUnfinishedSessions();

  container.innerHTML = `
    ${unfinished
      .map((session) => {
        const plan = plans.find((p) => p.id === session.planId);
        const day = plan?.days.find((d) => d.id === session.dayId);
        const label = plan && day ? `${plan.name}: ${day.name}` : "Training";
        return `
      <div class="card resume-card" data-session-id="${session.id}">
        <div style="font-weight:700; margin-bottom:2px;">Training läuft</div>
        <div class="list-row-sub" style="margin-bottom:10px;">${escapeHtml(label)} · gestartet ${formatStarted(session.date)}</div>
        <div class="modal-actions" style="justify-content:space-between;">
          <button class="btn-secondary" data-discard-session="${session.id}">Verwerfen</button>
          <button class="btn-primary" data-resume-session="${session.id}">Fortsetzen</button>
        </div>
      </div>`;
      })
      .join("")}
    <div style="display:flex; gap:8px; margin-bottom:16px;">
      <button class="btn-primary" id="create-plan-btn" style="flex:1;">+ Neuer Trainingsplan</button>
      <button class="btn-secondary" id="open-presets-btn">Vorlagen</button>
    </div>
    ${
      plans.length === 0
        ? `<div class="empty-state"><div style="font-size:40px;">📋</div><h3>Noch keine Trainingspläne</h3><p>Leg oben deinen ersten Trainingsplan an.</p></div>`
        : plans
            .map(
              (p) => `
        <div class="list-row" data-plan-id="${p.id}">
          <button class="list-row-main" data-open-plan="${p.id}">
            ${escapeHtml(p.name)}
            <div class="list-row-sub">${p.days.length} Tag${p.days.length === 1 ? "" : "e"}</div>
          </button>
          <button class="icon-btn danger" data-delete-plan="${p.id}" aria-label="Plan löschen">🗑</button>
        </div>
      `
            )
            .join("")
    }
  `;

  container.querySelectorAll("[data-resume-session]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const session = unfinished.find((s) => s.id === btn.dataset.resumeSession);
      if (!session) return;
      nav.screen = "session";
      nav.sessionId = session.id;
      nav.planId = session.planId;
      nav.dayId = session.dayId;
      renderPlans(container, setTitle);
    });
  });

  container.querySelectorAll("[data-discard-session]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const ok = await confirmDialog(
        "Dieses unfertige Training wirklich verwerfen? Alle bisher eingetragenen Sätze gehen verloren.",
        { confirmLabel: "Verwerfen" }
      );
      if (ok) {
        discardSession(btn.dataset.discardSession);
        renderPlans(container, setTitle);
      }
    });
  });

  container.querySelector("#create-plan-btn").addEventListener("click", showCreatePlanModal);
  container.querySelector("#open-presets-btn").addEventListener("click", () => {
    nav.screen = "presets";
    renderPlans(container, setTitle);
  });

  container.querySelectorAll("[data-open-plan]").forEach((btn) => {
    btn.addEventListener("click", () => {
      nav.screen = "plan";
      nav.planId = btn.dataset.openPlan;
      renderPlans(container, setTitle);
    });
  });

  container.querySelectorAll("[data-delete-plan]").forEach((btn) => {
    btn.addEventListener("click", async (event) => {
      event.stopPropagation();
      const plan = getPlans().find((p) => p.id === btn.dataset.deletePlan);
      const ok = await confirmDialog(
        `"${escapeHtml(plan?.name ?? "")}" wirklich löschen? Alle Tage und Übungen in diesem Plan gehen verloren.`
      );
      if (ok) {
        deletePlan(btn.dataset.deletePlan);
        renderPlans(container, setTitle);
      }
    });
  });
}

function showCreatePlanModal() {
  openModal((sheet) => {
    sheet.innerHTML = `
      <h2>Neuer Trainingsplan</h2>
      <div class="form-field">
        <label>Name</label>
        <input type="text" id="plan-name" placeholder="z. B. Push/Pull/Legs" />
      </div>
      <div class="form-field">
        <label>Anzahl Tage im Rotationsplan</label>
        <div class="stepper">
          <button type="button" id="days-minus">−</button>
          <span id="days-value">3</span>
          <button type="button" id="days-plus">+</button>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn-secondary" id="cancel-create">Abbrechen</button>
        <button class="btn-primary" id="confirm-create">Erstellen</button>
      </div>
    `;

    let days = 3;
    const daysValueEl = sheet.querySelector("#days-value");
    sheet.querySelector("#days-minus").addEventListener("click", () => {
      days = Math.max(1, days - 1);
      daysValueEl.textContent = days;
    });
    sheet.querySelector("#days-plus").addEventListener("click", () => {
      days = Math.min(14, days + 1);
      daysValueEl.textContent = days;
    });

    sheet.querySelector("#cancel-create").addEventListener("click", closeModal);
    sheet.querySelector("#confirm-create").addEventListener("click", () => {
      const nameInput = sheet.querySelector("#plan-name");
      const name = nameInput.value.trim() || "Neuer Trainingsplan";
      const plan = createPlan(name, days);
      closeModal();
      nav.screen = "plan";
      nav.planId = plan.id;
      refresh();
    });

    sheet.querySelector("#plan-name").focus();
  });
}

function renderPlanDetail(container, setTitle, plan) {
  setTitle(plan.name, () => {
    nav.screen = "list";
    renderPlans(container, setTitle);
  });

  container.innerHTML = `
    <div class="form-field">
      <label>Name des Plans</label>
      <input type="text" id="plan-name-edit" value="${escapeHtml(plan.name)}" />
    </div>
    ${plan.days
      .slice()
      .sort((a, b) => a.order - b.order)
      .map(
        (d) => `
      <div class="list-row">
        <button class="list-row-main" data-open-day="${d.id}">
          ${escapeHtml(d.name)}
          <div class="list-row-sub">${d.planExercises.length} Übung${d.planExercises.length === 1 ? "" : "en"}</div>
        </button>
        <span class="chevron">›</span>
      </div>
    `
      )
      .join("")}
  `;

  const nameInput = container.querySelector("#plan-name-edit");
  nameInput.addEventListener("change", () => {
    renamePlan(plan.id, nameInput.value);
    setTitle(getPlan(plan.id).name, () => {
      nav.screen = "list";
      renderPlans(container, setTitle);
    });
  });

  container.querySelectorAll("[data-open-day]").forEach((btn) => {
    btn.addEventListener("click", () => {
      nav.screen = "day";
      nav.dayId = btn.dataset.openDay;
      renderPlans(container, setTitle);
    });
  });
}

function renderDayDetail(container, setTitle, plan, day) {
  setTitle(day.name, () => {
    nav.screen = "plan";
    renderPlans(container, setTitle);
  });

  const exercises = loadExercises();
  const exerciseById = new Map(exercises.map((e) => [e.id, e]));

  // "Gewicht steigern"-Hinweis: gleiche Regel und gleiches Vergleichstraining wie im Training selbst.
  const allSessions = loadSessions();
  function hintFor(pe, exercise) {
    if (!exercise) return null;
    const range = effectiveRepRange(pe.targetRepsMin, pe.targetRepsMax, exercise.name);
    const reference = findReference(pe.exerciseId, { planId: plan.id, dayId: day.id, sessions: allSessions });
    return increaseHint({ range, plannedSets: pe.targetSets }, reference);
  }

  container.innerHTML = `
    <div class="form-field">
      <label>Name des Tages</label>
      <input type="text" id="day-name-edit" value="${escapeHtml(day.name)}" />
    </div>
    <button class="btn-primary" id="add-exercise-btn" style="width:100%; margin-bottom:16px;">+ Übung hinzufügen</button>
    ${
      day.planExercises.length > 0
        ? `<button class="btn-primary" id="start-session-btn" style="width:100%; margin-bottom:16px;">${
            getUnfinishedSessionForDay(plan.id, day.id) ? "▶ Training fortsetzen" : "▶ Training starten"
          }</button>`
        : ""
    }
    ${
      day.planExercises.length === 0
        ? `<div class="empty-state"><p>Noch keine Übungen an diesem Tag.</p></div>`
        : day.planExercises
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((pe) => {
              const exercise = exerciseById.get(pe.exerciseId);
              const recommendation = exercise ? recommendedReps(exercise.name) : null;
              const userHasRange = pe.targetRepsMin != null || pe.targetRepsMax != null;
              const note = (exercise?.note ?? "").trim();
              return `
            <div class="card" data-plan-card="${pe.id}">
              <div style="display:flex; align-items:center; gap:4px; margin-bottom:10px;">
                <div style="flex:1; min-width:0; font-weight:700; overflow-wrap:anywhere;">${escapeHtml(exercise?.name ?? "Unbekannte Übung")}${customBadge(exercise)}
                  <span class="hint-badge" data-hint-badge="${pe.id}" ${hintFor(pe, exercise) ? "" : "hidden"}>💡 Steigern</span></div>
                <button class="icon-btn" data-info-pe="${pe.id}" aria-label="Details und Notiz">ℹ️</button>
                <button class="icon-btn danger" data-remove-pe="${pe.id}" aria-label="Übung entfernen">🗑</button>
              </div>
              <div class="plan-controls">
                <div class="plan-control">
                  <span class="plan-control-label">Sätze</span>
                  <div class="stepper" data-pe-id="${pe.id}">
                    <button type="button" data-sets-minus>−</button>
                    <span>${pe.targetSets}</span>
                    <button type="button" data-sets-plus>+</button>
                  </div>
                </div>
                <div class="plan-control" data-reps-for="${pe.id}">
                  <span class="plan-control-label">Wiederholungen</span>
                  <div class="rep-inputs">
                    <input type="number" inputmode="numeric" min="1" class="rep-input" data-rep="min" placeholder="${recommendation?.min ?? "von"}" aria-label="Wiederholungen von" value="${pe.targetRepsMin ?? ""}" />
                    <span>–</span>
                    <input type="number" inputmode="numeric" min="1" class="rep-input" data-rep="max" placeholder="${recommendation?.max ?? "bis"}" aria-label="Wiederholungen bis" value="${pe.targetRepsMax ?? ""}" />
                  </div>
                </div>
              </div>
              ${
                recommendation
                  ? `<div class="list-row-sub" style="margin:6px 0 0;" data-reps-hint="${pe.id}">${
                      userHasRange ? "Empfehlung" : "Es gilt die Empfehlung"
                    }: ${escapeHtml(recommendation.text)}</div>`
                  : ""
              }
              <div class="pe-note" data-plan-note="${pe.id}" ${note ? "" : "hidden"}>📝 <span>${escapeHtml(note)}</span></div>
            </div>
          `;
            })
            .join("")
    }
  `;

  const dayNameInput = container.querySelector("#day-name-edit");
  dayNameInput.addEventListener("change", () => {
    renameDay(plan.id, day.id, dayNameInput.value);
    setTitle(dayNameInput.value.trim() || day.name, () => {
      nav.screen = "plan";
      renderPlans(container, setTitle);
    });
  });

  container.querySelector("#add-exercise-btn").addEventListener("click", () => {
    openExercisePicker((exerciseId) => {
      addExerciseToDay(plan.id, day.id, exerciseId);
      renderPlans(container, setTitle);
    });
  });

  container.querySelector("#start-session-btn")?.addEventListener("click", () => {
    const session = getUnfinishedSessionForDay(plan.id, day.id) ?? startSession(plan.id, day.id);
    if (!session) return;
    nav.screen = "session";
    nav.sessionId = session.id;
    renderPlans(container, setTitle);
  });

  container.querySelectorAll("[data-pe-id]").forEach((stepper) => {
    const peId = stepper.dataset.peId;
    const current = day.planExercises.find((pe) => pe.id === peId);
    stepper.querySelector("[data-sets-minus]").addEventListener("click", () => {
      updateTargetSets(plan.id, day.id, peId, current.targetSets - 1);
      renderPlans(container, setTitle);
    });
    stepper.querySelector("[data-sets-plus]").addEventListener("click", () => {
      updateTargetSets(plan.id, day.id, peId, current.targetSets + 1);
      renderPlans(container, setTitle);
    });
  });

  // Das Wiederholungsziel wird bei jeder Eingabe gespeichert (ohne Neuaufbau der Ansicht, damit
  // Tastatur und Cursor erhalten bleiben). Der Steigern-Hinweis hängt von der Spanne ab und wird
  // dabei mitgeführt.
  container.querySelectorAll("[data-reps-for]").forEach((group) => {
    const peId = group.dataset.repsFor;
    const [minInput, maxInput] = group.querySelectorAll(".rep-input");
    const save = () => {
      updateTargetReps(plan.id, day.id, peId, minInput.value, maxInput.value);
      const updated = getPlan(plan.id)?.days.find((d) => d.id === day.id)?.planExercises.find((p) => p.id === peId);
      const exercise = exerciseById.get(updated?.exerciseId);
      const badge = container.querySelector(`[data-hint-badge="${peId}"]`);
      if (updated && badge) badge.hidden = !hintFor(updated, exercise);
      const userHasRange = updated && (updated.targetRepsMin != null || updated.targetRepsMax != null);
      const hint = container.querySelector(`[data-reps-hint="${peId}"]`);
      if (hint) hint.textContent = hint.textContent.replace(/^[^:]+/, userHasRange ? "Empfehlung" : "Es gilt die Empfehlung");
    };
    minInput.addEventListener("input", save);
    maxInput.addEventListener("input", save);
  });

  // Notiz wird in den Details der Übung gepflegt (hier nur Anzeige).
  container.querySelectorAll("[data-info-pe]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pe = day.planExercises.find((p) => p.id === btn.dataset.infoPe);
      const exercise = exerciseById.get(pe?.exerciseId);
      if (!exercise) return;
      showExerciseDetail(exercise, {
        onNoteChange: (text) => {
          const noteEl = container.querySelector(`[data-plan-note="${pe.id}"]`);
          noteEl.querySelector("span").textContent = text;
          noteEl.hidden = text === "";
        },
      });
    });
  });

  container.querySelectorAll("[data-remove-pe]").forEach((btn) => {
    btn.addEventListener("click", () => {
      removeExerciseFromDay(plan.id, day.id, btn.dataset.removePe);
      renderPlans(container, setTitle);
    });
  });
}

function renderPresetList(container, setTitle) {
  setTitle("Vorlagen", () => {
    nav.screen = "list";
    renderPlans(container, setTitle);
  });

  container.innerHTML = TRAINING_PLAN_PRESETS.map(
    (preset) => `
    <div class="list-row" data-open-preset="${preset.id}" style="cursor:pointer; flex-direction:column; align-items:stretch;">
      <div style="font-weight:700; font-size:16px; margin-bottom:4px;">${escapeHtml(preset.name)}</div>
      <div style="font-size:13px; color:var(--color-text-secondary); margin-bottom:8px;">${preset.days.length} Tage</div>
      ${ratingBarHtml("Muskelaufbau", preset.muscleGrowthRating)}
      ${ratingBarHtml("Komplexität", preset.complexityRating)}
      ${ratingBarHtml("Zeitaufwand", preset.timeInvestmentRating)}
    </div>
  `
  ).join("");

  container.querySelectorAll("[data-open-preset]").forEach((row) => {
    row.addEventListener("click", () => {
      nav.screen = "presetDetail";
      nav.presetId = row.dataset.openPreset;
      renderPlans(container, setTitle);
    });
  });
}

function renderPresetDetail(container, setTitle, preset) {
  setTitle(preset.name, () => {
    nav.screen = "presets";
    renderPlans(container, setTitle);
  });

  container.innerHTML = `
    <div class="detail-section">
      <p>${escapeHtml(preset.summary)}</p>
    </div>
    <div class="card">
      ${ratingBarHtml("Muskelaufbau", preset.muscleGrowthRating)}
      ${ratingBarHtml("Komplexität", preset.complexityRating)}
      ${ratingBarHtml("Zeitaufwand", preset.timeInvestmentRating)}
    </div>
    ${preset.days
      .map(
        (day) => `
      <div class="card">
        <div style="font-weight:700; margin-bottom:8px;">${escapeHtml(day.name)}</div>
        ${day.exercises
          .map(
            (e) => `
          <div style="display:flex; justify-content:space-between; font-size:14px; padding:4px 0; color:var(--color-text-primary);">
            <span>${escapeHtml(e.exerciseName)}</span>
            <span style="color:var(--color-text-secondary);">${e.numberOfSets} Sätze</span>
          </div>
        `
          )
          .join("")}
      </div>
    `
      )
      .join("")}
    <button class="btn-primary" id="use-preset-btn" style="width:100%; margin-top:8px;">Diesen Plan verwenden</button>
  `;

  container.querySelector("#use-preset-btn").addEventListener("click", () => {
    showUsePresetModal(preset, container, setTitle);
  });
}

function showUsePresetModal(preset, container, setTitle) {
  openModal((sheet) => {
    sheet.innerHTML = `
      <h2>Plan übernehmen</h2>
      <div class="form-field">
        <label>Name</label>
        <input type="text" id="instantiate-name" value="${escapeHtml(preset.name)}" />
      </div>
      <div class="modal-actions">
        <button class="btn-secondary" id="cancel-instantiate">Abbrechen</button>
        <button class="btn-primary" id="confirm-instantiate">Übernehmen</button>
      </div>
    `;
    sheet.querySelector("#cancel-instantiate").addEventListener("click", closeModal);
    sheet.querySelector("#confirm-instantiate").addEventListener("click", () => {
      const name = sheet.querySelector("#instantiate-name").value;
      try {
        const plan = instantiatePreset(preset, name);
        closeModal();
        nav.screen = "plan";
        nav.planId = plan.id;
        renderPlans(container, setTitle);
      } catch (err) {
        if (err instanceof PresetInstantiationError) {
          sheet.querySelector(".modal-actions").insertAdjacentHTML(
            "beforebegin",
            `<p style="color:var(--color-error); font-size:14px;">Übung "${escapeHtml(err.exerciseName)}" wurde nicht gefunden.</p>`
          );
        } else {
          throw err;
        }
      }
    });
    sheet.querySelector("#instantiate-name").focus();
  });
}

function ratingBarHtml(label, value) {
  const dots = "●".repeat(value) + "○".repeat(5 - value);
  return `
    <div style="display:flex; justify-content:space-between; align-items:center; font-size:13px; color:var(--color-text-secondary); margin-bottom:4px;">
      <span>${label}</span>
      <span style="color:var(--color-accent); letter-spacing:2px;">${dots}</span>
    </div>
  `;
}

function formatStarted(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
