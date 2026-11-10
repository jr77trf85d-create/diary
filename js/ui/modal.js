let overlayEl = null;
let frameEl = null;
let currentOnClose = null;

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

// Fenster lassen sich auf drei Wegen schließen: ✕ oben rechts, Tippen auf den abgedunkelten Rand
// und Herunterwischen am Griff oberhalb des Titels.
function wireSwipeToClose(grab) {
  const CLOSE_DISTANCE = 90; // px
  const CLOSE_SPEED = 0.6; // px pro ms
  let startY = null;
  let startTime = 0;
  let offset = 0;

  grab.addEventListener("pointerdown", (event) => {
    if (event.target.closest(".modal-close")) return;
    startY = event.clientY;
    startTime = event.timeStamp;
    offset = 0;
    try {
      grab.setPointerCapture(event.pointerId);
    } catch {
      // ohne Capture funktioniert die Geste weiterhin, solange der Finger über dem Griff bleibt
    }
    frameEl.style.transition = "none";
  });

  grab.addEventListener("pointermove", (event) => {
    if (startY === null) return;
    offset = Math.max(0, event.clientY - startY);
    frameEl.style.transform = `translateY(${offset}px)`;
  });

  const finish = (event) => {
    if (startY === null) return;
    const speed = offset / Math.max(1, event.timeStamp - startTime);
    startY = null;
    frameEl.style.transition = "transform 0.18s ease-out";
    if (offset > CLOSE_DISTANCE || (offset > 20 && speed > CLOSE_SPEED)) {
      frameEl.style.transform = "translateY(100%)";
      setTimeout(closeModal, 160);
    } else {
      frameEl.style.transform = "";
    }
  };
  grab.addEventListener("pointerup", finish);
  grab.addEventListener("pointercancel", finish);
}

function ensureOverlay() {
  if (overlayEl) return overlayEl;
  overlayEl = document.createElement("div");
  overlayEl.className = "modal-overlay";
  overlayEl.style.display = "none";
  overlayEl.innerHTML = `
    <div class="modal-frame" id="modal-frame" role="dialog" aria-modal="true">
      <div class="modal-grab" id="modal-grab">
        <span class="modal-grab-bar" aria-hidden="true"></span>
        <button type="button" class="modal-close" id="modal-close" aria-label="Schließen">✕</button>
      </div>
      <div class="modal-sheet" id="modal-sheet"></div>
    </div>`;
  frameEl = overlayEl.querySelector("#modal-frame");
  overlayEl.addEventListener("click", (event) => {
    if (event.target === overlayEl) closeModal();
  });
  overlayEl.querySelector("#modal-close").addEventListener("click", () => closeModal());
  wireSwipeToClose(overlayEl.querySelector("#modal-grab"));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && overlayEl.style.display !== "none") closeModal();
  });
  document.body.appendChild(overlayEl);
  window.visualViewport?.addEventListener("resize", syncToVisualViewport);
  window.visualViewport?.addEventListener("scroll", syncToVisualViewport);
  return overlayEl;
}

// Optionen:
//  tall    = Fenster nimmt immer fast die ganze Höhe ein (Auswahllisten); nur der Bereich mit
//            .sheet-scroll scrollt, Titel und Suche bleiben stehen.
//  split   = Inhalt (.sheet-scroll) scrollt, Titel und Buttons darunter bleiben sichtbar (Formulare).
//  onClose = wird aufgerufen, wenn das Fenster geschlossen oder durch ein anderes ersetzt wird.
export function openModal(renderFn, { tall = false, split = false, onClose = null } = {}) {
  const overlay = ensureOverlay();
  const sheet = overlay.querySelector("#modal-sheet");

  if (currentOnClose) {
    const previous = currentOnClose;
    currentOnClose = null;
    previous();
  }
  currentOnClose = onClose;

  sheet.innerHTML = "";
  sheet.className = ["modal-sheet", (tall || split) && "modal-sheet--flex"].filter(Boolean).join(" ");
  sheet.scrollTop = 0;
  frameEl.className = ["modal-frame", tall && "modal-frame--tall"].filter(Boolean).join(" ");
  frameEl.style.transform = "";
  frameEl.style.transition = "";
  renderFn(sheet);
  overlay.style.display = "flex";
  syncToVisualViewport();
}

export function closeModal() {
  if (!overlayEl || overlayEl.style.display === "none") return;
  overlayEl.style.display = "none";
  overlayEl.style.top = overlayEl.style.left = overlayEl.style.width = overlayEl.style.height = "";
  frameEl.style.transform = "";
  frameEl.style.transition = "";
  overlayEl.querySelector("#modal-sheet").innerHTML = "";
  if (currentOnClose) {
    const callback = currentOnClose;
    currentOnClose = null;
    callback();
  }
}

// Wird das Fenster über ✕, den Rand oder Wischen geschlossen, gilt das als "Abbrechen".
export function confirmDialog(message, { confirmLabel = "Löschen", destructive = true } = {}) {
  return new Promise((resolve) => {
    openModal(
      (sheet) => {
        sheet.innerHTML = `
        <p class="modal-message">${message}</p>
        <div class="modal-actions">
          <button class="btn-secondary" data-action="cancel">Abbrechen</button>
          <button class="${destructive ? "btn-danger" : "btn-primary"}" data-action="confirm">${confirmLabel}</button>
        </div>
      `;
        sheet.querySelector('[data-action="cancel"]').addEventListener("click", () => closeModal());
        sheet.querySelector('[data-action="confirm"]').addEventListener("click", () => {
          resolve(true); // vor dem Schließen, sonst würde onClose zuerst "false" melden
          closeModal();
        });
      },
      { onClose: () => resolve(false) }
    );
  });
}
