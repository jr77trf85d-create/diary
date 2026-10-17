let overlayEl = null;

function ensureOverlay() {
  if (overlayEl) return overlayEl;
  overlayEl = document.createElement("div");
  overlayEl.className = "modal-overlay";
  overlayEl.style.display = "none";
  overlayEl.innerHTML = `<div class="modal-sheet" id="modal-sheet"></div>`;
  overlayEl.addEventListener("click", (event) => {
    if (event.target === overlayEl) closeModal();
  });
  document.body.appendChild(overlayEl);
  return overlayEl;
}

export function openModal(renderFn) {
  const overlay = ensureOverlay();
  const sheet = overlay.querySelector("#modal-sheet");
  sheet.innerHTML = "";
  renderFn(sheet);
  overlay.style.display = "flex";
}

export function closeModal() {
  if (!overlayEl) return;
  overlayEl.style.display = "none";
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
