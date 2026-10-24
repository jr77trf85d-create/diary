import { loadExercises } from "../storage.js";
import { filterExercises } from "../services/exerciseFilter.js";
import { MUSCLE_GROUPS, muscleGroupLabel } from "../data/muscleGroups.js";
import { openModal, closeModal, confirmDialog } from "../ui/modal.js";
import { refresh } from "../router.js";
import {
  isCustomExercise,
  addCustomExercise,
  updateCustomExercise,
  deleteCustomExercise,
  ExerciseValidationError,
} from "../services/exerciseService.js";
import { getProgressHistory, getRecentPerformances } from "../services/exerciseProgressService.js";
import { chartCardHtml } from "../ui/charts.js";
import { recommendedReps } from "../data/repRanges.js";
import { formatNumber } from "../ui/format.js";

const state = {
  searchText: "",
  selectedMuscleGroup: null,
};

export function renderExercises(container, setTitle) {
  setTitle("Übungen", null);
  const exercises = loadExercises().slice().sort((a, b) => a.name.localeCompare(b.name, "de"));
  const filtered = filterExercises(exercises, state.searchText, state.selectedMuscleGroup);

  container.innerHTML = `
    <button class="btn-primary" id="add-custom-exercise-btn" style="width:100%; margin-bottom:12px;">+ Eigene Übung</button>
    <input
      type="text"
      class="search-input"
      placeholder="Übung suchen"
      value="${escapeAttr(state.searchText)}"
      id="exercise-search"
    />
    <div class="chip-row" id="muscle-chip-row">
      ${chipHtml("Alle", state.selectedMuscleGroup === null, "")}
      ${MUSCLE_GROUPS.map((g) => chipHtml(g.label, state.selectedMuscleGroup === g.id, g.id)).join("")}
    </div>
    ${filtered.length === 0 ? emptyStateHtml() : listHtml(filtered)}
  `;

  container.querySelector("#add-custom-exercise-btn").addEventListener("click", () => {
    openExerciseForm(null);
  });

  const searchInput = container.querySelector("#exercise-search");
  searchInput.addEventListener("input", (e) => {
    state.searchText = e.target.value;
    renderExercises(container, setTitle);
    const refocused = container.querySelector("#exercise-search");
    refocused.focus();
    refocused.setSelectionRange(refocused.value.length, refocused.value.length);
  });

  container.querySelector("#muscle-chip-row").addEventListener("click", (event) => {
    const chip = event.target.closest("button[data-group]");
    if (!chip) return;
    const group = chip.dataset.group || null;
    state.selectedMuscleGroup = state.selectedMuscleGroup === group ? null : group;
    renderExercises(container, setTitle);
  });

  container.querySelectorAll(".list-row[data-exercise-id]").forEach((row) => {
    row.addEventListener("click", () => {
      const exercise = exercises.find((e) => e.id === row.dataset.exerciseId);
      if (exercise) showExerciseDetail(exercise);
    });
  });
}

function chipHtml(label, active, groupId) {
  return `<button class="chip ${active ? "active" : ""}" data-group="${groupId}">${label}</button>`;
}

function listHtml(exercises) {
  return `
    <div>
      ${exercises
        .map(
          (e) => `
        <div class="list-row" data-exercise-id="${e.id}" style="cursor:pointer;">
          <div class="list-row-main" style="font-weight:600;">
            ${escapeHtml(e.name)}${customBadge(e)}
            <div class="list-row-sub">${escapeHtml(muscleGroupLabel(e.muscleGroup))}</div>
          </div>
          <span class="chevron">›</span>
        </div>
      `
        )
        .join("")}
    </div>
  `;
}

function emptyStateHtml() {
  return `
    <div class="empty-state">
      <div style="font-size:40px;">🔍</div>
      <h3>Keine Übungen gefunden</h3>
      <p>Versuch eine andere Suche oder einen anderen Filter.</p>
    </div>
  `;
}

export function showExerciseDetail(exercise) {
  openModal((sheet) => {
    sheet.innerHTML = `
      <h2>${escapeHtml(exercise.name)}</h2>
      <div class="muscle-tag">${escapeHtml(muscleGroupLabel(exercise.muscleGroup))}</div>${customBadge(exercise)}
      ${
        exercise.instructions
          ? `<div class="detail-section">
        <h3>${isCustomExercise(exercise) ? "Beschreibung" : "Ausführung"}</h3>
        <p>${escapeHtml(exercise.instructions)}</p>
      </div>`
          : ""
      }
      ${
        recommendedReps(exercise.name)
          ? `<div class="detail-section">
        <h3>Empfehlung</h3>
        <p style="color:var(--color-accent);">${escapeHtml(recommendedReps(exercise.name).text)}</p>
      </div>`
          : ""
      }
      ${
        exercise.muscleFeedback
          ? `<div class="detail-section">
        <h3>Muskelgefühl</h3>
        <p>${escapeHtml(exercise.muscleFeedback)}</p>
      </div>`
          : ""
      }
      ${exerciseStatsHtml(exercise)}
      ${
        isCustomExercise(exercise)
          ? `<div class="modal-actions" style="justify-content:space-between; margin-top:8px;">
        <button class="btn-danger" id="delete-custom-btn">Löschen</button>
        <button class="btn-secondary" id="edit-custom-btn">Bearbeiten</button>
      </div>`
          : ""
      }
    `;

    if (isCustomExercise(exercise)) {
      sheet.querySelector("#edit-custom-btn").addEventListener("click", () => openExerciseForm(exercise));
      sheet.querySelector("#delete-custom-btn").addEventListener("click", async () => {
        const ok = await confirmDialog(
          `"${escapeHtml(exercise.name)}" wirklich löschen? Die Übung wird auch aus allen Trainingsplänen entfernt. Bereits aufgezeichnete Trainingsdaten bleiben erhalten.`
        );
        if (ok) {
          deleteCustomExercise(exercise.id);
          refresh();
        }
      });
    }
  });
}

// Charts (Gewicht, Wiederholungen, Volumen) und die letzten Trainings einer Übung.
function exerciseStatsHtml(exercise) {
  const history = getProgressHistory(exercise.id);
  if (history.length === 0) {
    return `<div class="detail-section"><p style="color:var(--color-text-secondary);">Noch keine Trainingsdaten für diese Übung.</p></div>`;
  }
  const dateLabels = history.map((p) => formatShortDate(p.date));
  const recent = getRecentPerformances(exercise.id, 5);
  return `
    ${chartCardHtml("Gewicht (Topsatz)", history.map((p) => p.maxWeight), dateLabels, { formatValue: (v) => `${formatNumber(v)} kg` })}
    ${chartCardHtml("Wiederholungen (bei Topsatz)", history.map((p) => p.repsAtMaxWeight), dateLabels, { color: "var(--color-accent-secondary)" })}
    ${chartCardHtml("Volumen", history.map((p) => p.totalVolume), dateLabels, { color: "var(--color-accent-secondary)", formatValue: (v) => `${Math.round(v).toLocaleString("de-DE")} kg` })}
    <div class="detail-section">
      <h3>Letzte Trainings</h3>
      ${recent
        .map(
          (r) => `
        <div class="recent-row">
          <div class="recent-date">${new Date(r.date).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "2-digit" })}</div>
          <div class="recent-sets">${r.sets.map((set) => `<span class="set-pill">${formatSetShort(set)}</span>`).join("")}</div>
        </div>`
        )
        .join("")}
    </div>`;
}

export function formatSetShort(set) {
  const weight = set.weight != null ? `${formatNumber(set.weight)} kg` : "–";
  const reps = set.reps != null ? set.reps : "–";
  return set.weight == null ? `${reps} Wdh.` : `${weight} × ${reps}`;
}

// Nur die Statistik einer Übung (zum Aufrufen während des Trainings).
export function showExerciseStats(exercise) {
  openModal((sheet) => {
    sheet.innerHTML = `
      <h2>${escapeHtml(exercise.name)}${customBadge(exercise)}</h2>
      <div class="muscle-tag">${escapeHtml(muscleGroupLabel(exercise.muscleGroup))}</div>
      ${exerciseStatsHtml(exercise)}
      <div class="modal-actions" style="margin-top:8px;"><button class="btn-secondary" id="stats-close">Schließen</button></div>
    `;
    sheet.querySelector("#stats-close").addEventListener("click", closeModal);
  });
}

// Formular zum Anlegen (exercise = null) oder Bearbeiten einer eigenen Übung.
export function openExerciseForm(exercise, { onSaved = null, onCancel = null } = {}) {
  const editing = exercise !== null;
  let selectedGroup = exercise?.muscleGroup ?? "sonstige";
  openModal((sheet) => {
    sheet.innerHTML = `
      <h2>${editing ? "Eigene Übung bearbeiten" : "Eigene Übung"}</h2>
      <div class="sheet-scroll">
      <div class="form-field">
        <label>Name</label>
        <input type="text" id="custom-name" value="${escapeAttr(exercise?.name ?? "")}" placeholder="z. B. Kabel-Fliegende" />
      </div>
      <div class="form-field">
        <label>Muskelgruppe</label>
        <div class="chip-wrap" id="custom-group" role="radiogroup" aria-label="Muskelgruppe">
          ${MUSCLE_GROUPS.map(
            (g) => `<button type="button" class="chip ${g.id === selectedGroup ? "active" : ""}" role="radio" aria-checked="${g.id === selectedGroup}" data-group="${g.id}">${g.label}</button>`
          ).join("")}
        </div>
      </div>
      <div class="form-field">
        <label>Beschreibung (optional)</label>
        <textarea id="custom-description" rows="4" placeholder="Ausführung, Hinweise ...">${escapeHtml(exercise?.instructions ?? "")}</textarea>
      </div>
      </div>
      <p id="custom-error" style="color:var(--color-error); font-size:14px; margin:8px 0 0;" hidden></p>
      <div class="modal-actions" style="margin-top:12px;">
        <button class="btn-secondary" id="custom-cancel">Abbrechen</button>
        <button class="btn-primary" id="custom-save">Speichern</button>
      </div>
    `;

    sheet.querySelector("#custom-cancel").addEventListener("click", () => {
      closeModal();
      onCancel?.();
    });
    sheet.querySelector("#custom-save").addEventListener("click", () => {
      const data = {
        name: sheet.querySelector("#custom-name").value,
        muscleGroup: selectedGroup,
        instructions: sheet.querySelector("#custom-description").value,
      };
      try {
        const saved = editing ? updateCustomExercise(exercise.id, data) : addCustomExercise(data);
        closeModal();
        if (onSaved) onSaved(saved);
        else refresh();
      } catch (err) {
        if (!(err instanceof ExerciseValidationError)) throw err;
        const errorEl = sheet.querySelector("#custom-error");
        errorEl.textContent =
          err.code === "empty" ? "Bitte gib einen Namen ein." : "Eine Übung mit diesem Namen gibt es bereits.";
        errorEl.hidden = false;
      }
    });
    sheet.querySelector("#custom-group").addEventListener("click", (event) => {
      const chip = event.target.closest("button[data-group]");
      if (!chip) return;
      selectedGroup = chip.dataset.group;
      sheet.querySelectorAll("#custom-group .chip").forEach((c) => {
        const active = c.dataset.group === selectedGroup;
        c.classList.toggle("active", active);
        c.setAttribute("aria-checked", String(active));
      });
    });
    sheet.querySelector("#custom-name").focus();
  }, { split: true });
}

export function customBadge(exercise) {
  return isCustomExercise(exercise) ? ` <span class="custom-badge">Eigene</span>` : "";
}

function formatShortDate(isoString) {
  const d = new Date(isoString);
  return `${d.getDate()}.${d.getMonth() + 1}.`;
}

export function escapeHtml(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttr(str) {
  return escapeHtml(str).replace(/"/g, "&quot;");
}
