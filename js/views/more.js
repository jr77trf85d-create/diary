import { createBackupJson, backupFileName, parseBackup, applyBackup, BackupError } from "../services/backupService.js";
import { seedExercisesIfNeeded } from "../services/exerciseSeeder.js";
import { confirmDialog } from "../ui/modal.js";
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

  showVersion(container.querySelector("#version-text"));
  showPersistence(container.querySelector("#persist-text"));
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
