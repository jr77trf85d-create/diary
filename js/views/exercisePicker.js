import { loadExercises } from "../storage.js";
import { filterExercises } from "../services/exerciseFilter.js";
import { MUSCLE_GROUPS, muscleGroupLabel } from "../data/muscleGroups.js";
import { openModal, closeModal } from "../ui/modal.js";
import { escapeHtml, customBadge, openExerciseForm } from "./exercises.js";

export function openExercisePicker(onSelect) {
  const state = { searchText: "", selectedMuscleGroup: null };
  const exercises = loadExercises().slice().sort((a, b) => a.name.localeCompare(b.name, "de"));

  openModal((sheet) => {
    sheet.style.maxHeight = "85vh";
    sheet.style.display = "flex";
    sheet.style.flexDirection = "column";
    render(sheet);

    function render(sheet) {
      const filtered = filterExercises(exercises, state.searchText, state.selectedMuscleGroup);
      sheet.innerHTML = `
        <h2>Übung auswählen</h2>
        <button class="btn-secondary" id="picker-new-exercise" style="width:100%; margin-bottom:12px;">+ Neue Übung anlegen</button>
        <input type="text" class="search-input" placeholder="Übung suchen" id="picker-search" value="${escapeHtml(state.searchText)}" />
        <div class="chip-row" id="picker-chip-row">
          <button class="chip ${state.selectedMuscleGroup === null ? "active" : ""}" data-group="">Alle</button>
          ${MUSCLE_GROUPS.map(
            (g) => `<button class="chip ${state.selectedMuscleGroup === g.id ? "active" : ""}" data-group="${g.id}">${g.label}</button>`
          ).join("")}
        </div>
        <div style="overflow-y:auto; flex:1;">
          ${
            filtered.length === 0
              ? `<div class="empty-state"><p>Keine Übungen gefunden.</p></div>`
              : filtered
                  .map(
                    (e) => `
                <button class="list-row-main list-row" data-id="${e.id}" style="width:100%; display:block; cursor:pointer;">
                  ${escapeHtml(e.name)}${customBadge(e)}
                  <div class="list-row-sub">${escapeHtml(muscleGroupLabel(e.muscleGroup))}</div>
                </button>
              `
                  )
                  .join("")
          }
        </div>
      `;

      // Neue Übung anlegen und direkt übernehmen; bei Abbruch zurück zur Auswahl.
      sheet.querySelector("#picker-new-exercise").addEventListener("click", () => {
        openExerciseForm(null, {
          onSaved: (created) => onSelect(created.id),
          onCancel: () => openExercisePicker(onSelect),
        });
      });

      sheet.querySelector("#picker-search").addEventListener("input", (e) => {
        state.searchText = e.target.value;
        const caret = e.target.selectionStart;
        render(sheet);
        const input = sheet.querySelector("#picker-search");
        input.focus();
        input.setSelectionRange(caret, caret);
      });

      sheet.querySelector("#picker-chip-row").addEventListener("click", (event) => {
        const chip = event.target.closest("button[data-group]");
        if (!chip) return;
        const group = chip.dataset.group || null;
        state.selectedMuscleGroup = state.selectedMuscleGroup === group ? null : group;
        render(sheet);
      });

      sheet.querySelectorAll("button[data-id]").forEach((btn) => {
        btn.addEventListener("click", () => {
          closeModal();
          onSelect(btn.dataset.id);
        });
      });
    }
  });
}
