import { createBackupJson, backupFileName, parseBackup, applyBackup, BackupError } from "../services/backupService.js";
import { seedExercisesIfNeeded } from "../services/exerciseSeeder.js";
import { migratePlanNotesToExercises } from "../services/exerciseService.js";
import { confirmDialog, openModal, closeModal } from "../ui/modal.js";
import { countSessions, deleteAllSessions } from "../services/sessionService.js";
import { escapeHtml } from "./exercises.js";

export function renderMore(container, setTitle) {
  setTitle("Mehr", null);

  container.innerHTML = `
    <div class="card">
      <h3 class="section-title">Sicherung</h3>
      <p class="more-text">Deine Pläne, Trainings und eigenen Übungen liegen nur auf diesem iPhone. Mit einer Sicherungsdatei kannst du sie in "Dateien" ablegen und bei Bedarf wieder einspielen, z. B. nach einer Neuinstallation.</p>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <button class="btn-primary" id="export-btn">Sicherung exportieren</button>
        <button class="btn-secondary" id="import-btn">Sicherung einspielen</button>
      </div>
      <input type="file" id="import-file" accept="application/json,.json" hidden />
      <p id="backup-status" class="more-status" hidden></p>
    </div>

    <div class="card">
      <h3 class="section-title">App-Version</h3>
      <p class="more-text" id="version-text">Version wird ermittelt ...</p>
      <button class="btn-secondary" id="update-btn">Nach Updates suchen</button>
      <p id="update-status" class="more-status" hidden></p>
      <p class="more-text" style="margin-top:12px;">Updates ändern nur die App, nie deine Daten.</p>
    </div>

    <div class="card">
      <h3 class="section-title">Statistiken zurücksetzen</h3>
      <p class="more-text" id="reset-text"></p>
      <button class="btn-danger" id="reset-btn">Statistiken zurücksetzen ...</button>
      <p id="reset-status" class="more-status" hidden></p>
    </div>

    <div class="card">
      <h3 class="section-title">Speicher</h3>
      <p class="more-text" id="persist-text">Wird geprüft ...</p>
    </div>
  `;

  const backupStatus = container.querySelector("#backup-status");
  const showStatus = (el, text, isError = false) => {
    el.textContent = text;
    el.style.color = isError ? "var(--color-error)" : "var(--color-accent)";
    el.hidden = false;
  };

  container.querySelector("#export-btn").addEventListener("click", async () => {
    try {
      await exportBackup();
      showStatus(backupStatus, "Sicherung erstellt.");
    } catch (err) {
      if (err?.name === "AbortError") return; // Teilen-Dialog abgebrochen
      showStatus(backupStatus, "Die Sicherung konnte nicht erstellt werden.", true);
    }
  });

  const fileInput = container.querySelector("#import-file");
  container.querySelector("#import-btn").addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    fileInput.value = "";
    if (!file) return;
    try {
      const { data, summary } = parseBackup(await file.text());
      const when = summary.exportedAt ? new Date(summary.exportedAt).toLocaleDateString("de-DE") : "unbekannt";
      const ok = await confirmDialog(
        `Sicherung vom ${escapeHtml(when)} einspielen? Sie enthält ${plural(summary.plans, "Plan", "Pläne")}, ${plural(summary.sessions, "Training", "Trainings")} und ${plural(summary.customExercises, "eigene Übung", "eigene Übungen")}. <strong>Alle aktuellen Daten auf diesem Gerät werden dadurch ersetzt.</strong>`,
        { confirmLabel: "Einspielen" }
      );
      if (!ok) return;
      applyBackup(data);
      seedExercisesIfNeeded();
      migratePlanNotesToExercises(); // Sicherungen aus älteren Versionen enthalten Plan-Notizen
      showStatus(backupStatus, "Sicherung eingespielt.");
    } catch (err) {
      if (!(err instanceof BackupError)) throw err;
      showStatus(backupStatus, err.message, true);
    }
  });

  const updateStatus = container.querySelector("#update-status");
  container.querySelector("#update-btn").addEventListener("click", async () => {
    const registration = await navigator.serviceWorker?.getRegistration();
    if (!registration) {
      showStatus(updateStatus, "Die Offline-Funktion ist nicht aktiv, daher gibt es keine Update-Prüfung.", true);
      return;
    }
    showStatus(updateStatus, "Suche läuft ...");
    try {
      await registration.update();
      if (registration.installing || registration.waiting) {
        showStatus(updateStatus, "Neue Version gefunden, sie wird geladen ...");
      } else {
        showStatus(updateStatus, "Du hast die aktuelle Version.");
      }
    } catch {
      showStatus(updateStatus, "Die Prüfung ist fehlgeschlagen. Bist du online?", true);
    }
  });

  // ---- Statistiken zurücksetzen (zweistufig) ----
  const resetText = container.querySelector("#reset-text");
  const resetBtn = container.querySelector("#reset-btn");
  const resetStatus = container.querySelector("#reset-status");
  const refreshResetCard = () => {
    const n = countSessions();
    resetText.textContent =
      n === 0
        ? "Es gibt aktuell keine Statistiken."
        : `Löscht alle ${plural(n, "Training", "Trainings")} samt Verlauf, Charts, Vergleichswerten und Balken. Pläne, eigene Übungen und Notizen bleiben erhalten.`;
    resetBtn.disabled = n === 0;
  };
  refreshResetCard();

  resetBtn.addEventListener("click", () => {
    startReset(backupStatus, () => {
      refreshResetCard();
      showStatus(resetStatus, "Statistiken wurden zurückgesetzt.");
    });
  });

  showVersion(container.querySelector("#version-text"));
  showPersistence(container.querySelector("#persist-text"));
}

const RESET_WORD = "ZURÜCKSETZEN";

// Schritt 1: Warnung mit Möglichkeit zur Sicherung. Schritt 2: Bestätigungswort eintippen.
function startReset(backupStatusEl, onDone) {
  const total = countSessions();
  openModal((sheet) => {
    sheet.innerHTML = `
      <h2>Statistiken zurücksetzen?</h2>
      <p class="modal-message">Alle <strong>${plural(total, "Training", "Trainings")}</strong> werden dauerhaft gelöscht, inklusive Verlauf, Charts und Vergleichswerten. Das lässt sich nicht rückgängig machen.<br><br>Pläne, eigene Übungen und Notizen bleiben erhalten. Wenn du die Daten vielleicht noch brauchst, erstelle vorher eine Sicherung.</p>
      <div class="modal-actions" style="flex-direction:column;">
        <button class="btn-secondary" id="reset-backup">Erst Sicherung exportieren</button>
        <button class="btn-danger" id="reset-next">Weiter</button>
        <button class="btn-secondary" id="reset-cancel">Abbrechen</button>
      </div>
    `;
    sheet.querySelector("#reset-cancel").addEventListener("click", closeModal);
    sheet.querySelector("#reset-backup").addEventListener("click", async () => {
      try {
        await exportBackup();
        backupStatusEl.textContent = "Sicherung erstellt.";
        backupStatusEl.style.color = "var(--color-accent)";
        backupStatusEl.hidden = false;
      } catch (err) {
        if (err?.name !== "AbortError") throw err;
      }
    });
    sheet.querySelector("#reset-next").addEventListener("click", () => confirmReset(onDone));
  });
}

function confirmReset(onDone) {
  openModal((sheet) => {
    sheet.innerHTML = `
      <h2>Letzte Bestätigung</h2>
      <p class="modal-message">Tippe zur Bestätigung <strong>${RESET_WORD}</strong> ein.</p>
      <div class="form-field">
        <input type="text" id="reset-confirm" autocapitalize="characters" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="${RESET_WORD}" aria-label="Bestätigungswort" />
      </div>
      <div class="modal-actions">
        <button class="btn-secondary" id="reset-abort">Abbrechen</button>
        <button class="btn-danger" id="reset-final" disabled>Endgültig löschen</button>
      </div>
    `;
    const input = sheet.querySelector("#reset-confirm");
    const finalBtn = sheet.querySelector("#reset-final");
    input.addEventListener("input", () => {
      finalBtn.disabled = input.value.trim().toLocaleUpperCase("de") !== RESET_WORD;
    });
    sheet.querySelector("#reset-abort").addEventListener("click", closeModal);
    finalBtn.addEventListener("click", () => {
      if (finalBtn.disabled) return;
      deleteAllSessions();
      closeModal();
      onDone();
    });
    input.focus();
  });
}

async function exportBackup() {
  const json = createBackupJson();
  const name = backupFileName();
  const file = new File([json], name, { type: "application/json" });

  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: "Diary Sicherung" });
    return;
  }

  // Fallback: normaler Download
  const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function showVersion(el) {
  try {
    const names = (await caches.keys()).filter((n) => n.startsWith("diary-cache-"));
    const version = names.map((n) => n.replace("diary-cache-", "")).sort().pop();
    el.textContent = version ? `Installierte Version: ${version}` : "Version unbekannt (Offline-Funktion noch nicht aktiv).";
  } catch {
    el.textContent = "Version unbekannt.";
  }
}

async function showPersistence(el) {
  try {
    if (!navigator.storage?.persisted) {
      el.textContent = "Dieses Gerät meldet nicht, ob der Speicher dauerhaft geschützt ist.";
      return;
    }
    const persisted = await navigator.storage.persisted();
    el.textContent = persisted
      ? "Dauerhafter Speicher ist aktiv: iOS löscht deine Daten nicht automatisch."
      : "Dauerhafter Speicher ist nicht bestätigt. Erstelle regelmäßig eine Sicherung.";
  } catch {
    el.textContent = "Speicherstatus unbekannt.";
  }
}

function plural(count, singular, pluralForm) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}
