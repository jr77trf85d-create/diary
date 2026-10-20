import {
  loadExercises,
  saveExercises,
  loadPlans,
  savePlans,
  loadSessions,
  saveSessions,
} from "../storage.js";

const FORMAT = "diary-backup";
const VERSION = 1;

export class BackupError extends Error {
  constructor(message) {
    super(message);
    this.name = "BackupError";
  }
}

// Alle Nutzerdaten (Übungen inkl. eigener Übungen, Pläne, Trainings) als JSON-Text.
export function createBackupJson(now = new Date()) {
  return JSON.stringify(
    {
      format: FORMAT,
      version: VERSION,
      exportedAt: now.toISOString(),
      data: {
        exercises: loadExercises(),
        plans: loadPlans(),
        sessions: loadSessions(),
      },
    },
    null,
    2
  );
}

export function backupFileName(now = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `diary-sicherung-${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.json`;
}

// Prüft eine Sicherungsdatei, ohne etwas zu verändern. Liefert die Daten plus eine Zusammenfassung.
export function parseBackup(text) {
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new BackupError("Die Datei ist keine gültige Sicherung (kein lesbares JSON).");
  }
  if (!parsed || parsed.format !== FORMAT) {
    throw new BackupError("Die Datei stammt nicht aus Diary.");
  }
  if (parsed.version > VERSION) {
    throw new BackupError("Die Sicherung stammt aus einer neueren App-Version. Bitte zuerst die App aktualisieren.");
  }
  const { exercises, plans, sessions } = parsed.data ?? {};
  if (![exercises, plans, sessions].every(Array.isArray)) {
    throw new BackupError("Die Sicherung ist unvollständig oder beschädigt.");
  }
  return {
    data: { exercises, plans, sessions },
    summary: {
      exportedAt: parsed.exportedAt ?? null,
      plans: plans.length,
      sessions: sessions.length,
      customExercises: exercises.filter((e) => e?.custom === true).length,
    },
  };
}

// Ersetzt ALLE aktuellen Daten durch die der Sicherung (vorher mit parseBackup prüfen).
export function applyBackup(data) {
  saveExercises(data.exercises);
  savePlans(data.plans);
  saveSessions(data.sessions);
}
