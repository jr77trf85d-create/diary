let overlayEl = null;

// Auf dem iPhone verdeckt die Tastatur den unteren Teil der Seite, ohne dass sich das Layout
// anpasst. Deshalb wird das Overlay an den sichtbaren Bereich (visualViewport) angepasst, damit
// Eingabefelder und Buttons des Fensters immer über der Tastatur bleiben.
function syncToVisualViewport() {
  const vv = window.visualViewport;
  if (!vv || !overlayEl || overlayEl.style.display === "none") return;
  overlayEl.style.top = `${vv.offsetTop}px`;
  overlayEl.style.left = `${vv.offsetLeft}px`;
  overlayEl.style.width = `${vv.width}px`;
  overlayEl.style.height = `${vv.height}px`;
}

function ensureOverlay() {
  if (overlayEl) return overlayEl;
  overlayEl = document.createElement("div");
  overlayEl.className = "modal-overlay";
  overlayEl.style.display = "none";
  overlayEl.innerHTML = `<div class="modal-sheet" id="modal-sheet" role="dialog" aria-modal="true"></div>`;
  overlayEl.addEventListener("click", (event) => {
    if (event.target === overlayEl) closeModal();
  });
  document.body.appendChild(overlayEl);
  window.visualViewport?.addEventListener("resize", syncToVisualViewport);
  window.visualViewport?.addEventListener("scroll", syncToVisualViewport);
  return overlayEl;
}

// Optionen: tall = Fenster nimmt immer fast die ganze Höhe ein (Auswahllisten), das Fenster
// selbst scrollt dann nicht, sondern nur der Bereich mit .sheet-scroll.
// split = Inhalt (.sheet-scroll) scrollt, Titel und Buttons darunter bleiben sichtbar (Formulare).
export function openModal(renderFn, { tall = false, split = false } = {}) {
  const overlay = ensureOverlay();
  const sheet = overlay.querySelector("#modal-sheet");
  sheet.innerHTML = "";
  sheet.className = ["modal-sheet", tall && "modal-sheet--tall", split && "modal-sheet--split"].filter(Boolean).join(" ");
  sheet.removeAttribute("style");
  renderFn(sheet);
  overlay.style.display = "flex";
  syncToVisualViewport();
}

export function closeModal() {
  if (!overlayEl) return;
  overlayEl.style.display = "none";
  overlayEl.style.top = overlayEl.style.left = overlayEl.style.width = overlayEl.style.height = "";
  overlayEl.querySelector("#modal-sheet").innerHTML = "";
}

export function confirmDialog(message, { confirmLabel = "Löschen", destructive = true } = {}) {
  return new Promise((resolve) => {
    openModal((sheet) => {
      sheet.innerHTML = `
        <p class="modal-message">${message}</p>
        <div class="modal-actions">
          <button class="btn-secondary" data-action="cancel">Abbrechen</button>
          <button class="${destructive ? "btn-danger" : "btn-primary"}" data-action="confirm">${confirmLabel}</button>
        </div>
      `;
      sheet.querySelector('[data-action="cancel"]').addEventListener("click", () => {
        closeModal();
        resolve(false);
      });
      sheet.querySelector('[data-action="confirm"]').addEventListener("click", () => {
        closeModal();
        resolve(true);
      });
    });
  });
}
