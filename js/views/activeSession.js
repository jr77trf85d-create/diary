import { loadExercises } from "../storage.js";
import {
  getSession,
  completeSession,
  addSet,
  removeSet,
  updateSet,
  replaceExercise,
  getLastPerformance,
} from "../services/sessionService.js";
import { showExerciseDetail, escapeHtml, customBadge } from "./exercises.js";
import { openAlternativePicker } from "./alternativePicker.js";

export function renderActiveSession(container, setTitle, sessionId, onDone) {
  const session = getSession(sessionId);
  if (!session) {
    onDone();
    return;
  }

  setTitle("Training", onDone);

  const exerciseById = new Map(loadExercises().map((e) => [e.id, e]));

  container.innerHTML = `
    ${session.performedExercises
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((pe) => performedExerciseCard(pe, exerciseById))
      .join("")}
    <button class="btn-primary" id="finish-session-btn" style="width:100%; margin-top:8px;">Training abschließen</button>
  `;

  wireCardEvents(container, session, exerciseById, () => renderActiveSession(container, setTitle, sessionId, onDone));

  container.querySelector("#finish-session-btn").addEventListener("click", () => {
    completeSession(sessionId);
    onDone();
  });
}

function performedExerciseCard(pe, exerciseById) {
  const exercise = exerciseById.get(pe.exerciseId);
  const last = getLastPerformance(pe.exerciseId, undefined);

  return `
    <div class="card" data-pe-card="${pe.id}">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:4px;">
        <div style="flex:1; font-weight:700; font-size:16px;">${escapeHtml(exercise?.name ?? "Unbekannte Übung")}${customBadge(exercise)}</div>
        <button class="icon-btn" data-info="${pe.id}" aria-label="Anleitung">ℹ️</button>
        <button class="icon-btn" data-alt="${pe.id}" aria-label="Alternative wählen">🔁</button>
      </div>
      ${
        last
          ? `<div class="list-row-sub" style="margin-bottom:8px;">Letztes Mal: ${last.sets
              .map((s) => formatSet(s))
              .filter(Boolean)
              .join(", ") || "–"}</div>`
          : ""
      }
      <div data-sets-container="${pe.id}">
        ${pe.sets.map((s, i) => setRowHtml(pe.id, s, i)).join("")}
      </div>
      <button class="chip" data-add-set="${pe.id}" style="margin-top:4px;">+ Satz</button>
    </div>
  `;
}

function setRowHtml(peId, set, index) {
  return `
    <div class="set-row" data-set-id="${set.id}" data-pe-id="${peId}">
      <span class="set-row-label">Satz ${index + 1}</span>
      <input type="number" inputmode="decimal" placeholder="kg" class="set-input" data-field="weight" value="${set.weight ?? ""}" />
      <input type="number" inputmode="numeric" placeholder="Wdh." class="set-input" data-field="reps" value="${set.reps ?? ""}" />
      <button class="icon-btn danger" data-remove-set="${set.id}" aria-label="Satz entfernen">✕</button>
    </div>
  `;
}

function formatSet(set) {
  if (set.weight == null && set.reps == null) return null;
  const weight = set.weight != null ? `${set.weight}kg` : "–";
  const reps = set.reps != null ? `${set.reps}` : "–";
  return `${weight} × ${reps}`;
}

function wireCardEvents(container, session, exerciseById, rerender) {
  container.querySelectorAll("[data-info]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const exercise = exerciseById.get(
        session.performedExercises.find((pe) => pe.id === btn.dataset.info)?.exerciseId
      );
      if (exercise) showExerciseDetail(exercise);
    });
  });

  container.querySelectorAll("[data-alt]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pe = session.performedExercises.find((p) => p.id === btn.dataset.alt);
      if (!pe) return;
      openAlternativePicker(pe.exerciseId, (newExerciseId) => {
        replaceExercise(session.id, pe.id, newExerciseId);
        rerender();
      });
    });
  });

  container.querySelectorAll("[data-add-set]").forEach((btn) => {
    btn.addEventListener("click", () => {
      addSet(session.id, btn.dataset.addSet);
      rerender();
    });
  });

  container.querySelectorAll("[data-remove-set]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const row = btn.closest("[data-set-id]");
      removeSet(session.id, row.dataset.peId, row.dataset.setId);
      rerender();
    });
  });

  container.querySelectorAll(".set-input").forEach((input) => {
    input.addEventListener("change", () => {
      const row = input.closest("[data-set-id]");
      const field = input.dataset.field;
      const value = input.value === "" ? null : Number(input.value);
      updateSet(session.id, row.dataset.peId, row.dataset.setId, { [field]: value });
    });
  });
}
