import { loadExercises } from "../storage.js";
import {
  getSession,
  completeSession,
  discardSession,
  addSet,
  removeSet,
  updateSet,
  replaceExercise,
  copyFirstWeightToFollowing,
  addAdHocExercise,
  removeAdHocExercise,
} from "../services/sessionService.js";
import { findReference, liveProgress, isFilledSet, sessionHasData } from "../services/comparisonService.js";
import { increaseHint, hasIncreasedWeight } from "../services/progressionService.js";
import { showExerciseDetail, showExerciseStats, escapeHtml, customBadge, formatSetShort } from "./exercises.js";
import { openAlternativePicker } from "./alternativePicker.js";
import { openExercisePicker } from "./exercisePicker.js";
import { confirmDialog } from "../ui/modal.js";
import { progressBarHtml, updateProgressBar } from "../ui/progressBar.js";
import { formatRepTarget, effectiveRepRange } from "../data/repRanges.js";
import { formatNumber } from "../ui/format.js";

// Welche Übungskarte gerade aufgeklappt ist: immer höchstens eine, standardmäßig keine. Der Zustand
// überlebt Neuzeichnen (z. B. nach "+ Satz"), nicht aber das Verlassen des Trainings.
const expanded = new Set();

// callbacks: { onBack: () => void, onFinished: (sessionId) => void }
export function renderActiveSession(container, setTitle, sessionId, { onBack, onFinished }) {
  const session = getSession(sessionId);
  if (!session) {
    onBack();
    return;
  }

  setTitle("Training", onBack);

  const scrollTop = container.scrollTop;
  const exerciseById = new Map(loadExercises().map((e) => [e.id, e]));
  const rerender = () => renderActiveSession(container, setTitle, sessionId, { onBack, onFinished });

  // Vergleichswert je Übung: letztes Training desselben Trainingstags, sonst letztes Training der Übung.
  const references = new Map(
    session.performedExercises.map((pe) => [
      pe.id,
      findReference(pe.exerciseId, { planId: session.planId, dayId: session.dayId, excludeSessionId: session.id }),
    ])
  );

  container.innerHTML = `
    ${session.performedExercises
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((pe) => performedExerciseCard(pe, exerciseById.get(pe.exerciseId), references.get(pe.id)))
      .join("")}
    <button class="btn-secondary" id="add-adhoc-btn" style="width:100%; margin-top:4px;">+ Spontane Übung hinzufügen</button>
    <button class="btn-primary" id="finish-session-btn" style="width:100%; margin-top:12px;">Training abschließen</button>
  `;
  container.scrollTop = scrollTop;

  wireCardEvents(container, session, exerciseById, references, rerender);

  container.querySelector("#add-adhoc-btn").addEventListener("click", () => {
    openExercisePicker((exerciseId) => {
      const added = addAdHocExercise(session.id, exerciseId);
      expanded.clear();
      if (added) expanded.add(added.id);
      rerender();
      if (added) scrollCardIntoView(container, added.id);
    });
  });

  container.querySelector("#finish-session-btn").addEventListener("click", async () => {
    const current = getSession(sessionId);
    if (!current) return;
    if (!sessionHasData(current)) {
      // Ein Training ohne einen einzigen Satz würde nur den Verlauf verstopfen.
      const ok = await confirmDialog("Es wurde noch nichts eingetragen. Dieses Training verwerfen?", {
        confirmLabel: "Verwerfen",
      });
      if (ok) {
        expanded.clear();
        discardSession(sessionId);
        onBack();
      }
      return;
    }
    expanded.clear();
    completeSession(sessionId);
    onFinished(sessionId);
  });
}

function scrollCardIntoView(container, peId) {
  const card = container.querySelector(`[data-pe-card="${peId}"]`);
  if (!card) return;
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  card.scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
}

// Wiederholungsspanne: eigene Eintragung aus dem Plan, sonst die Empfehlung der Standardübung.
function rangeFor(pe, exercise) {
  return effectiveRepRange(pe.targetRepsMin, pe.targetRepsMax, exercise?.name ?? "");
}

function summaryText(pe, filledCount, range) {
  const parts = [`${filledCount}/${pe.sets.length} Sätze`];
  const target = range ? formatRepTarget(range.min, range.max) : "";
  if (target) parts.push(`Ziel ${target} Wdh.`);
  return parts.join(" · ");
}

function comparisonNote(reference) {
  if (!reference) return "";
  const date = new Date(reference.session.completedAt).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
  return `Vergleich mit Training vom ${date}${reference.sameDay ? "" : " (anderer Trainingstag)"}`;
}

// Gewicht-steigern-Hinweis; ist im laufenden Training schon ein höheres Gewicht eingetragen,
// wird daraus eine Bestätigung.
function hintHtml(hint, done) {
  if (!hint) return "";
  const text = done
    ? `✓ Gewicht gesteigert (zuletzt ${formatNumber(hint.lastWeight)} kg)`
    : `💡 Gewicht steigern: letztes Mal alle ${hint.sets} Sätze mit ${formatNumber(hint.lastWeight)} kg geschafft`;
  return `<div class="hint ${done ? "done" : ""}" data-hint>${text}</div>`;
}

function plannedSetsOf(pe) {
  return pe.targetSets ?? pe.sets.length;
}

function performedExerciseCard(pe, exercise, reference) {
  const isOpen = expanded.has(pe.id);
  const range = rangeFor(pe, exercise);
  const target = range ? formatRepTarget(range.min, range.max) : "";
  const hint = increaseHint({ range, plannedSets: plannedSetsOf(pe) }, reference);
  const note = (exercise?.note ?? "").trim();
  const refSets = reference ? reference.performed.sets : [];

  return `
    <div class="card" data-pe-card="${pe.id}">
      <div class="card-top">
        <button class="card-header" data-toggle="${pe.id}" aria-expanded="${isOpen}">
          <span class="card-chevron ${isOpen ? "open" : ""}" aria-hidden="true"></span>
          <span class="card-title">
            <span class="card-name">${escapeHtml(exercise?.name ?? "Unbekannte Übung")}${customBadge(exercise)}${
              pe.adHoc ? ' <span class="adhoc-badge">Spontan</span>' : ""
            }</span>
            <span class="list-row-sub" data-summary>${summaryText(pe, pe.sets.filter(isFilledSet).length, range)}</span>
          </span>
        </button>
        <button class="icon-btn stats-btn" data-stats="${pe.id}" aria-label="Statistik anzeigen">📈</button>
      </div>
      <div class="pe-note" data-pe-note ${note ? "" : "hidden"}>📝 <span data-pe-note-text>${escapeHtml(note)}</span></div>
      ${hintHtml(hint, hint ? hasIncreasedWeight(pe.sets, hint) : false)}
      ${progressBarHtml(liveProgress(pe.sets, reference))}
      <div class="card-body" data-body="${pe.id}" ${isOpen ? "" : "hidden"}>
        ${reference ? `<div class="list-row-sub" style="margin-bottom:8px;">${escapeHtml(comparisonNote(reference))}</div>` : ""}
        <div data-sets-container="${pe.id}">
          ${pe.sets.map((s, i) => setBlockHtml(pe, s, i, target, reference ? refSets[i] ?? null : undefined)).join("")}
        </div>
        <div style="display:flex; align-items:center; gap:8px; margin-top:4px;">
          <button class="chip" data-add-set="${pe.id}">+ Satz</button>
          <span style="flex:1;"></span>
          <button class="icon-btn" data-info="${pe.id}" aria-label="Details und Notiz">ℹ️</button>
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

// Vergleich eines Satzes mit dem gleichen Satz im Vergleichstraining.
// -> "better" (schwerer oder mehr Wiederholungen), "equal" oder "" (schlechter / unvollständig)
function compareSet(current, last) {
  if (!last || !isFilledSet(last) || current.reps == null) return "";
  if (last.weight != null) {
    if (current.weight == null) return "";
    if (current.weight > last.weight) return "better";
    if (current.weight < last.weight) return "";
  }
  const lastReps = last.reps ?? 0;
  if (current.reps > lastReps) return "better";
  return current.reps === lastReps ? "equal" : "";
}

function lastTimeHtml(set, last) {
  if (last === undefined) return ""; // es gibt kein Vergleichstraining
  const filled = last && isFilledSet(last);
  const state = filled ? compareSet(set, last) : "";
  const text = filled ? formatSetShort(last) : "–";
  return `<button type="button" class="set-last ${state}" data-fill-last="${set.id}" ${filled ? "" : "disabled"}
      title="${filled ? "Antippen übernimmt diese Werte in die leeren Felder" : ""}">
      <span>Letztes Mal: ${escapeHtml(text)}</span>${state === "better" ? '<span class="set-last-arrow">↑</span>' : ""}
    </button>`;
}

function setBlockHtml(pe, set, index, target, last) {
  const copyCell =
    index === 0 && pe.sets.length > 1
      ? `<button class="set-copy" data-copy-weight="${pe.id}" aria-label="Gewicht auf alle folgenden Sätze übertragen" title="Gewicht auf folgende Sätze übertragen">↓</button>`
      : `<span class="set-copy-spacer"></span>`;
  return `
    <div class="set-block" data-set-block="${set.id}">
      <div class="set-row" data-set-id="${set.id}" data-pe-id="${pe.id}">
        <span class="set-row-label">Satz ${index + 1}</span>
        <input type="number" inputmode="decimal" placeholder="kg" class="set-input" data-field="weight" value="${set.weight ?? ""}" />
        ${copyCell}
        <input type="number" inputmode="numeric" placeholder="${target || "Wdh."}" class="set-input" data-field="reps" value="${set.reps ?? ""}" />
        <button class="icon-btn danger" data-remove-set="${set.id}" aria-label="Satz entfernen">✕</button>
      </div>
      ${lastTimeHtml(set, last)}
    </div>
  `;
}

function wireCardEvents(container, session, exerciseById, references, rerender) {
  const findPe = (id) => session.performedExercises.find((p) => p.id === id);

  // Akkordeon: Beim Öffnen einer Übung klappen alle anderen zu (ohne Neuzeichnen).
  container.querySelectorAll("[data-toggle]").forEach((header) => {
    header.addEventListener("click", () => {
      const id = header.dataset.toggle;
      const wasOpen = expanded.has(id);

      container.querySelectorAll("[data-body]").forEach((body) => (body.hidden = true));
      container.querySelectorAll("[data-toggle]").forEach((h) => {
        h.setAttribute("aria-expanded", "false");
        h.querySelector(".card-chevron").classList.remove("open");
      });
      expanded.clear();

      if (!wasOpen) {
        container.querySelector(`[data-body="${id}"]`).hidden = false;
        header.setAttribute("aria-expanded", "true");
        header.querySelector(".card-chevron").classList.add("open");
        expanded.add(id);
        scrollCardIntoView(container, id);
      }
    });
  });

  container.querySelectorAll("[data-stats]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const exercise = exerciseById.get(findPe(btn.dataset.stats)?.exerciseId);
      if (exercise) showExerciseStats(exercise);
    });
  });

  container.querySelectorAll("[data-info]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const exercise = exerciseById.get(findPe(btn.dataset.info)?.exerciseId);
      if (!exercise) return;
      const card = btn.closest("[data-pe-card]");
      showExerciseDetail(exercise, {
        // Notiz direkt in der Karte aktualisieren, während sie in den Details bearbeitet wird
        onNoteChange: (text) => {
          const noteEl = card.querySelector("[data-pe-note]");
          noteEl.querySelector("[data-pe-note-text]").textContent = text;
          noteEl.hidden = text === "";
        },
      });
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
      if (pe.sets.some(isFilledSet)) {
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

  // Antippen von "Letztes Mal" übernimmt die alten Werte in die noch leeren Felder des Satzes.
  container.querySelectorAll("[data-fill-last]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const block = btn.closest("[data-set-block]");
      const row = block.querySelector("[data-set-id]");
      const pe = findPe(row.dataset.peId);
      const index = pe.sets.findIndex((s) => s.id === row.dataset.setId);
      const last = references.get(pe.id)?.performed.sets[index];
      if (!last) return;
      const fill = (field, value) => {
        const input = row.querySelector(`[data-field="${field}"]`);
        if (value == null || input.value !== "") return;
        input.value = value;
        input.dispatchEvent(new Event("input", { bubbles: true }));
      };
      fill("weight", last.weight);
      fill("reps", last.reps);
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

      // Zusammenfassung, Balken, Satz-Vergleich und Hinweis live aktualisieren (ohne Neuaufbau)
      const card = row.closest("[data-pe-card]");
      const pe = getSession(session.id)?.performedExercises.find((p) => p.id === row.dataset.peId);
      if (!card || !pe) return;
      const exercise = exerciseById.get(pe.exerciseId);
      const reference = references.get(pe.id);
      const range = rangeFor(pe, exercise);

      card.querySelector("[data-summary]").textContent = summaryText(pe, pe.sets.filter(isFilledSet).length, range);
      updateProgressBar(card.querySelector("[data-prog]"), liveProgress(pe.sets, reference));
      updateSetComparison(row.closest("[data-set-block]"), pe, row.dataset.setId, reference);

      const hint = increaseHint({ range, plannedSets: plannedSetsOf(pe) }, reference);
      const hintEl = card.querySelector("[data-hint]");
      if (hint && hintEl) {
        const done = hasIncreasedWeight(pe.sets, hint);
        hintEl.classList.toggle("done", done);
        hintEl.textContent = done
          ? `✓ Gewicht gesteigert (zuletzt ${formatNumber(hint.lastWeight)} kg)`
          : `💡 Gewicht steigern: letztes Mal alle ${hint.sets} Sätze mit ${formatNumber(hint.lastWeight)} kg geschafft`;
      }
    });
  });
}

function updateSetComparison(block, pe, setId, reference) {
  const button = block?.querySelector("[data-fill-last]");
  if (!button || !reference) return;
  const index = pe.sets.findIndex((s) => s.id === setId);
  const last = reference.performed.sets[index];
  const state = last && isFilledSet(last) ? compareSet(pe.sets[index], last) : "";
  button.classList.toggle("better", state === "better");
  button.classList.toggle("equal", state === "equal");
  let arrow = button.querySelector(".set-last-arrow");
  if (state === "better" && !arrow) {
    arrow = document.createElement("span");
    arrow.className = "set-last-arrow";
    arrow.textContent = "↑";
    button.appendChild(arrow);
  } else if (state !== "better" && arrow) {
    arrow.remove();
  }
}
