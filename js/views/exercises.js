import { loadExercises } from "../storage.js";
import { filterExercises } from "../services/exerciseFilter.js";
import { MUSCLE_GROUPS, muscleGroupLabel } from "../data/muscleGroups.js";
import { openModal } from "../ui/modal.js";
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
            ${escapeHtml(e.name)}
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
      <div class="muscle-tag">${escapeHtml(muscleGroupLabel(exercise.muscleGroup))}</div>
      ${
        exercise.instructions
          ? `<div class="detail-section">
        <h3>Ausführung</h3>
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
    `;
  });
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
