import { loadExercises } from "../storage.js";
import { filterExercises } from "../services/exerciseFilter.js";
import { getAlternatives, addAlternative, createAlternative } from "../services/alternativeService.js";
import { openModal, closeModal } from "../ui/modal.js";
import { escapeHtml } from "./exercises.js";
import { pickRowHtml } from "./exercisePicker.js";

export function openAlternativePicker(exerciseId, onSelect) {
  const state = { searchText: "" };

  openModal((sheet) => {
    render(sheet);

    function render(sheet) {
      const previousScroll = sheet.querySelector(".sheet-scroll")?.scrollTop ?? 0;
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
        <div class="sheet-scroll">
          ${
            existingAlternatives.length > 0
              ? `
            <div class="detail-section">
              <h3>Bestehende Alternativen</h3>
              ${existingAlternatives.map((e) => pickRowHtml(e, "data-select")).join("")}
            </div>
          `
              : ""
          }
          <div class="detail-section">
            <h3>Neue Alternativübung anlegen</h3>
            <div class="inline-form">
              <input type="text" id="new-alt-name" class="text-input" placeholder="Name der Übung" />
              <button class="btn-primary" id="create-alt-btn">Hinzufügen</button>
            </div>
          </div>
          <div class="detail-section">
            <h3>Andere Übung als Alternative nutzen</h3>
            <input type="text" class="search-input" placeholder="Übung suchen" id="alt-search" value="${escapeHtml(state.searchText)}" />
            ${candidates.map((e) => pickRowHtml(e, "data-select-other")).join("")}
          </div>
        </div>
      `;

      sheet.querySelector(".sheet-scroll").scrollTop = previousScroll;

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
  }, { tall: true });
}
