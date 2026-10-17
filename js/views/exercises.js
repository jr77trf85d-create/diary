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
import { getProgressHistory } from "../services/exerciseProgressService.js";
import { chartCardHtml } from "../ui/charts.js";

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
    const history = getProgressHistory(exercise.id);
    const dateLabels = history.map((p) => formatShortDate(p.date));

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
        exercise.muscleFeedback
          ? `<div class="detail-section">
        <h3>Muskelgefühl</h3>
        <p>${escapeHtml(exercise.muscleFeedback)}</p>
      </div>`
          : ""
      }
      ${chartCardHtml("Gewicht (Topsatz)", history.map((p) => p.maxWeight), dateLabels, { formatValue: (v) => `${v}kg` })}
      ${chartCardHtml("Wiederholungen (bei Topsatz)", history.map((p) => p.repsAtMaxWeight), dateLabels, { color: "var(--color-accent-secondary)" })}
      ${chartCardHtml("Volumen", history.map((p) => p.totalVolume), dateLabels, { color: "var(--color-accent-secondary)", formatValue: (v) => `${Math.round(v)}kg` })}
      ${
        history.length === 0
          ? `<div class="detail-section"><p style="color:var(--color-text-secondary);">Noch keine Trainingsdaten für diese Übung.</p></div>`
          : ""
      }
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

// Formular zum Anlegen (exercise = null) oder Bearbeiten einer eigenen Übung.
function openExerciseForm(exercise) {
  const editing = exercise !== null;
  openModal((sheet) => {
    sheet.innerHTML = `
      <h2>${editing ? "Eigene Übung bearbeiten" : "Eigene Übung"}</h2>
      <div class="form-field">
        <label>Name</label>
        <input type="text" id="custom-name" value="${escapeAttr(exercise?.name ?? "")}" placeholder="z. B. Kabel-Fliegende" />
      </div>
      <div class="form-field">
        <label>Muskelgruppe</label>
        <select id="custom-group">
          ${MUSCLE_GROUPS.map(
            (g) => `<option value="${g.id}" ${g.id === (exercise?.muscleGroup ?? "sonstige") ? "selected" : ""}>${g.label}</option>`
          ).join("")}
        </select>
      </div>
      <div class="form-field">
        <label>Beschreibung (optional)</label>
        <textarea id="custom-description" rows="4" placeholder="Ausführung, Hinweise ...">${escapeHtml(exercise?.instructions ?? "")}</textarea>
      </div>
      <p id="custom-error" style="color:var(--color-error); font-size:14px; margin-bottom:12px;" hidden></p>
      <div class="modal-actions">
        <button class="btn-secondary" id="custom-cancel">Abbrechen</button>
        <button class="btn-primary" id="custom-save">Speichern</button>
      </div>
    `;

    sheet.querySelector("#custom-cancel").addEventListener("click", closeModal);
    sheet.querySelector("#custom-save").addEventListener("click", () => {
      const data = {
        name: sheet.querySelector("#custom-name").value,
        muscleGroup: sheet.querySelector("#custom-group").value,
        instructions: sheet.querySelector("#custom-description").value,
      };
      try {
        if (editing) updateCustomExercise(exercise.id, data);
        else addCustomExercise(data);
        closeModal();
        refresh();
      } catch (err) {
        if (!(err instanceof ExerciseValidationError)) throw err;
        const errorEl = sheet.querySelector("#custom-error");
        errorEl.textContent =
          err.code === "empty" ? "Bitte gib einen Namen ein." : "Eine Übung mit diesem Namen gibt es bereits.";
        errorEl.hidden = false;
      }
    });
    sheet.querySelector("#custom-name").focus();
  });
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
