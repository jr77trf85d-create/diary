import { loadExercises } from "../storage.js";
import { filterExercises } from "../services/exerciseFilter.js";
import { getAlternatives, addAlternative, createAlternative } from "../services/alternativeService.js";
import { openModal, closeModal } from "../ui/modal.js";
import { escapeHtml } from "./exercises.js";

export function openAlternativePicker(exerciseId, onSelect) {
  const state = { searchText: "" };

  openModal((sheet) => {
    sheet.style.maxHeight = "85vh";
    sheet.style.display = "flex";
    sheet.style.flexDirection = "column";
    render(sheet);

    function render(sheet) {
      const exercises = loadExercises();
      const existingAlternatives = getAlternatives(exerciseId).sort((a, b) => a.name.localeCompare(b.name, "de"));
      const excludeIds = new Set([exerciseId, ...existingAlternatives.map((e) => e.id)]);
      const candidates = filterExercises(
        exercises.filter((e) => !excludeIds.has(e.id)),
        state.searchText,
        null
      ).sort((a, b) => a.name.localeCompare(b.name, "de"));

      sheet.innerHTML = `
        <h2>Alternative wählen</h2>
        ${
          existingAlternatives.length > 0
            ? `
          <div class="detail-section">
            <h3>Bestehende Alternativen</h3>
            ${existingAlternatives
              .map((e) => `<button class="list-row-main list-row" data-select="${e.id}" style="width:100%; display:block; cursor:pointer;">${escapeHtml(e.name)}</button>`)
              .join("")}
          </div>
        `
            : ""
        }
        <div class="detail-section">
          <h3>Neue Alternativübung anlegen</h3>
          <div style="display:flex; gap:8px;">
            <input type="text" id="new-alt-name" placeholder="Name der Übung" style="flex:1; background:var(--color-surface-elevated); border:1px solid var(--color-divider); border-radius:var(--radius-sm); color:var(--color-text-primary); padding:10px 12px; font-size:16px;" />
            <button class="btn-primary" id="create-alt-btn">Hinzufügen</button>
          </div>
        </div>
        <div class="detail-section" style="flex:1; min-height:0; display:flex; flex-direction:column;">
          <h3>Andere Übung als Alternative nutzen</h3>
          <input type="text" class="search-input" placeholder="Übung suchen" id="alt-search" value="${escapeHtml(state.searchText)}" />
          <div style="overflow-y:auto;">
            ${candidates
              .map((e) => `<button class="list-row-main list-row" data-select-other="${e.id}" style="width:100%; display:block; cursor:pointer;">${escapeHtml(e.name)}</button>`)
              .join("")}
          </div>
        </div>
      `;

      sheet.querySelectorAll("[data-select]").forEach((btn) => {
        btn.addEventListener("click", () => {
          closeModal();
          onSelect(btn.dataset.select);
        });
      });

      sheet.querySelectorAll("[data-select-other]").forEach((btn) => {
        btn.addEventListener("click", () => {
          addAlternative(exerciseId, btn.dataset.selectOther);
          closeModal();
          onSelect(btn.dataset.selectOther);
        });
      });

      sheet.querySelector("#create-alt-btn").addEventListener("click", () => {
        const nameInput = sheet.querySelector("#new-alt-name");
        const name = nameInput.value.trim();
        if (!name) return;
        const created = createAlternative(name, exerciseId);
        closeModal();
        onSelect(created.id);
      });

      sheet.querySelector("#alt-search").addEventListener("input", (e) => {
        state.searchText = e.target.value;
        const caret = e.target.selectionStart;
        render(sheet);
        const input = sheet.querySelector("#alt-search");
        input.focus();
        input.setSelectionRange(caret, caret);
      });
    }
  });
}
