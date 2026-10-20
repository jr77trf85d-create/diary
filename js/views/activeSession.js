import { loadExercises } from "../storage.js";
import {
  getSession,
  completeSession,
  addSet,
  removeSet,
  updateSet,
  replaceExercise,
  getLastPerformance,
  copyFirstWeightToFollowing,
  addAdHocExercise,
  removeAdHocExercise,
} from "../services/sessionService.js";
import { showExerciseDetail, escapeHtml, customBadge } from "./exercises.js";
import { openAlternativePicker } from "./alternativePicker.js";
import { openExercisePicker } from "./exercisePicker.js";
import { confirmDialog } from "../ui/modal.js";
import { formatRepTarget } from "../data/repRanges.js";

// Welche Übungskarten gerade aufgeklappt sind. Standardmäßig ist alles eingeklappt; der Zustand
// überlebt Neuzeichnen (z. B. nach "+ Satz"), nicht aber das Verlassen des Trainings.
const expanded = new Set();

export function renderActiveSession(container, setTitle, sessionId, onDone) {
  const session = getSession(sessionId);
  if (!session) {
    onDone();
    return;
  }

  setTitle("Training", onDone);

  const scrollTop = container.scrollTop;
  const exerciseById = new Map(loadExercises().map((e) => [e.id, e]));
  const rerender = () => renderActiveSession(container, setTitle, sessionId, onDone);

  container.innerHTML = `
    ${session.performedExercises
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((pe) => performedExerciseCard(pe, exerciseById))
      .join("")}
    <button class="btn-secondary" id="add-adhoc-btn" style="width:100%; margin-top:4px;">+ Spontane Übung hinzufügen</button>
    <button class="btn-primary" id="finish-session-btn" style="width:100%; margin-top:12px;">Training abschließen</button>
  `;
  container.scrollTop = scrollTop;

  wireCardEvents(container, session, exerciseById, rerender);

  container.querySelector("#add-adhoc-btn").addEventListener("click", () => {
    openExercisePicker((exerciseId) => {
      const added = addAdHocExercise(session.id, exerciseId);
      if (added) expanded.add(added.id);
      rerender();
    });
  });

  container.querySelector("#finish-session-btn").addEventListener("click", () => {
    expanded.clear();
    completeSession(sessionId);
    onDone();
  });
}

function summaryText(pe, filledCount) {
  const parts = [`${filledCount}/${pe.sets.length} Sätze`];
  const target = formatRepTarget(pe.targetRepsMin, pe.targetRepsMax);
  if (target) parts.push(`Ziel ${target} Wdh.`);
  return parts.join(" · ");
}

function isFilled(set) {
  return set.weight != null || set.reps != null;
}

function performedExerciseCard(pe, exerciseById) {
  const exercise = exerciseById.get(pe.exerciseId);
  const last = getLastPerformance(pe.exerciseId, undefined);
  const isOpen = expanded.has(pe.id);
  const target = formatRepTarget(pe.targetRepsMin, pe.targetRepsMax);

  return `
    <div class="card" data-pe-card="${pe.id}">
      <button class="card-header" data-toggle="${pe.id}" aria-expanded="${isOpen}">
        <span class="card-chevron ${isOpen ? "open" : ""}">›</span>
        <span class="card-title">
          <span class="card-name">${escapeHtml(exercise?.name ?? "Unbekannte Übung")}${customBadge(exercise)}${
            pe.adHoc ? ' <span class="adhoc-badge">Spontan</span>' : ""
          }</span>
          <span class="list-row-sub" data-summary>${summaryText(pe, pe.sets.filter(isFilled).length)}</span>
        </span>
      </button>
      ${pe.note ? `<div class="pe-note">📝 ${escapeHtml(pe.note)}</div>` : ""}
      <div class="card-body" data-body="${pe.id}" ${isOpen ? "" : "hidden"}>
        ${
          last
            ? `<div class="list-row-sub" style="margin-bottom:8px;">Letztes Mal: ${
                last.sets.map((s) => formatSet(s)).filter(Boolean).join(", ") || "–"
              }</div>`
            : ""
        }
        <div data-sets-container="${pe.id}">
          ${pe.sets.map((s, i) => setRowHtml(pe, s, i, target)).join("")}
        </div>
        <div style="display:flex; align-items:center; gap:8px; margin-top:4px;">
          <button class="chip" data-add-set="${pe.id}">+ Satz</button>
          <span style="flex:1;"></span>
          <button class="icon-btn" data-info="${pe.id}" aria-label="Anleitung">ℹ️</button>
          <button class="icon-btn" data-alt="${pe.id}" aria-label="Alternative wählen">🔁</button>
          ${
            pe.adHoc
              ? `<button class="icon-btn danger" data-remove-adhoc="${pe.id}" aria-label="Spontane Übung entfernen">🗑</button>`
              : ""
          }
        </div>
      </div>
    </div>
  `;
}

function setRowHtml(pe, set, index, target) {
  const copyCell =
    index === 0 && pe.sets.length > 1
      ? `<button class="set-copy" data-copy-weight="${pe.id}" aria-label="Gewicht auf alle folgenden Sätze übertragen" title="Gewicht auf folgende Sätze übertragen">↓</button>`
      : `<span class="set-copy-spacer"></span>`;
  return `
    <div class="set-row" data-set-id="${set.id}" data-pe-id="${pe.id}">
      <span class="set-row-label">Satz ${index + 1}</span>
      <input type="number" inputmode="decimal" placeholder="kg" class="set-input" data-field="weight" value="${set.weight ?? ""}" />
      ${copyCell}
      <input type="number" inputmode="numeric" placeholder="${target || "Wdh."}" class="set-input" data-field="reps" value="${set.reps ?? ""}" />
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
  const findPe = (id) => session.performedExercises.find((p) => p.id === id);

  // Ein-/Ausklappen ohne Neuzeichnen
  container.querySelectorAll("[data-toggle]").forEach((header) => {
    header.addEventListener("click", () => {
      const id = header.dataset.toggle;
      const body = container.querySelector(`[data-body="${id}"]`);
      const open = body.hidden;
      body.hidden = !open;
      header.setAttribute("aria-expanded", String(open));
      header.querySelector(".card-chevron").classList.toggle("open", open);
      if (open) expanded.add(id);
      else expanded.delete(id);
    });
  });

  container.querySelectorAll("[data-info]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const exercise = exerciseById.get(findPe(btn.dataset.info)?.exerciseId);
      if (exercise) showExerciseDetail(exercise);
    });
  });

  container.querySelectorAll("[data-alt]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const pe = findPe(btn.dataset.alt);
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

  container.querySelectorAll("[data-copy-weight]").forEach((btn) => {
    btn.addEventListener("click", () => {
      copyFirstWeightToFollowing(session.id, btn.dataset.copyWeight);
      rerender();
    });
  });

  container.querySelectorAll("[data-remove-adhoc]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const pe = findPe(btn.dataset.removeAdhoc);
      if (!pe) return;
      if (pe.sets.some(isFilled)) {
        const ok = await confirmDialog("Diese spontane Übung samt eingetragener Sätze aus dem Training entfernen?", {
          confirmLabel: "Entfernen",
        });
        if (!ok) return;
      }
      removeAdHocExercise(session.id, pe.id);
      expanded.delete(pe.id);
      rerender();
    });
  });

  // Jede Eingabe wird sofort gespeichert (nicht erst beim Verlassen des Feldes), damit nichts
  // verloren geht, wenn die App mit offener Tastatur geschlossen wird.
  container.querySelectorAll(".set-input").forEach((input) => {
    input.addEventListener("input", () => {
      const row = input.closest("[data-set-id]");
      const field = input.dataset.field;
      const value = input.value === "" ? null : Number(input.value);
      updateSet(session.id, row.dataset.peId, row.dataset.setId, { [field]: value });

      // Zusammenfassung der eingeklappten Karte live aktualisieren
      const card = row.closest("[data-pe-card]");
      const pe = getSession(session.id)?.performedExercises.find((p) => p.id === row.dataset.peId);
      if (card && pe) card.querySelector("[data-summary]").textContent = summaryText(pe, pe.sets.filter(isFilled).length);
    });
  });
}
