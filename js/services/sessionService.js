import { loadSessions, saveSessions, makeId } from "../storage.js";
import { getPlan } from "./planService.js";

const DEFAULT_AD_HOC_SETS = 3;

function emptySets(count) {
  return Array.from({ length: count }, () => ({ id: makeId(), weight: null, reps: null }));
}

export function startSession(planId, dayId) {
  const plan = getPlan(planId);
  const day = plan?.days.find((d) => d.id === dayId);
  if (!day) return null;

  const sessions = loadSessions();
  const session = {
    id: makeId(),
    planId,
    dayId,
    date: new Date().toISOString(),
    completedAt: null,
    performedExercises: day.planExercises
      .slice()
      .sort((a, b) => a.order - b.order)
      .map((pe, i) => ({
        id: makeId(),
        planExerciseId: pe.id,
        exerciseId: pe.exerciseId,
        order: i,
        // Ziel und Notiz werden beim Start übernommen, damit sie im Training sichtbar sind.
        targetRepsMin: pe.targetRepsMin ?? null,
        targetRepsMax: pe.targetRepsMax ?? null,
        note: pe.note ?? "",
        adHoc: false,
        sets: emptySets(pe.targetSets),
      })),
  };
  sessions.push(session);
  saveSessions(sessions);
  return session;
}

export function getSession(sessionId) {
  return loadSessions().find((s) => s.id === sessionId) ?? null;
}

export function completeSession(sessionId) {
  const sessions = loadSessions();
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) return;
  session.completedAt = new Date().toISOString();
  saveSessions(sessions);
}

// Noch nicht abgeschlossene Trainings (z. B. weil die App währenddessen geschlossen wurde),
// das jüngste zuerst.
export function getUnfinishedSessions() {
  return loadSessions()
    .filter((s) => !s.completedAt)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function getUnfinishedSessionForDay(planId, dayId) {
  return getUnfinishedSessions().find((s) => s.planId === planId && s.dayId === dayId) ?? null;
}

export function discardSession(sessionId) {
  saveSessions(loadSessions().filter((s) => s.id !== sessionId));
}

export function addSet(sessionId, performedExerciseId) {
  withPerformedExercise(sessionId, performedExerciseId, (pe) => {
    pe.sets.push({ id: makeId(), weight: null, reps: null });
  });
}

export function removeSet(sessionId, performedExerciseId, setId) {
  withPerformedExercise(sessionId, performedExerciseId, (pe) => {
    pe.sets = pe.sets.filter((s) => s.id !== setId);
  });
}

export function updateSet(sessionId, performedExerciseId, setId, { weight, reps }) {
  withPerformedExercise(sessionId, performedExerciseId, (pe) => {
    const set = pe.sets.find((s) => s.id === setId);
    if (!set) return;
    if (weight !== undefined) set.weight = weight;
    if (reps !== undefined) set.reps = reps;
  });
}

// Überträgt das Gewicht des ersten Satzes auf alle folgenden Sätze, die noch kein Gewicht
// haben (bereits eingetragene Werte bleiben unangetastet). Liefert die Anzahl befüllter Sätze.
export function copyFirstWeightToFollowing(sessionId, performedExerciseId) {
  let filled = 0;
  withPerformedExercise(sessionId, performedExerciseId, (pe) => {
    const first = pe.sets[0];
    if (!first || first.weight == null) return;
    for (const set of pe.sets.slice(1)) {
      if (set.weight == null) {
        set.weight = first.weight;
        filled++;
      }
    }
  });
  return filled;
}

export function replaceExercise(sessionId, performedExerciseId, newExerciseId) {
  withPerformedExercise(sessionId, performedExerciseId, (pe) => {
    pe.exerciseId = newExerciseId;
  });
}

// Spontane Übung nur für dieses Training: wird nicht im Plan gespeichert, zählt aber für
// "Letztes Mal" und den Verlauf, weil beides über die Übung (nicht den Plan) läuft.
export function addAdHocExercise(sessionId, exerciseId) {
  const sessions = loadSessions();
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) return null;
  const performed = {
    id: makeId(),
    planExerciseId: null,
    exerciseId,
    order: session.performedExercises.reduce((max, p) => Math.max(max, p.order), -1) + 1,
    targetRepsMin: null,
    targetRepsMax: null,
    note: "",
    adHoc: true,
    sets: emptySets(DEFAULT_AD_HOC_SETS),
  };
  session.performedExercises.push(performed);
  saveSessions(sessions);
  return performed;
}

// Entfernt eine spontan hinzugefügte Übung wieder (Planübungen lassen sich nicht entfernen).
export function removeAdHocExercise(sessionId, performedExerciseId) {
  const sessions = loadSessions();
  const session = sessions.find((s) => s.id === sessionId);
  const performed = session?.performedExercises.find((p) => p.id === performedExerciseId);
  if (!performed || !performed.adHoc) return false;
  session.performedExercises = session.performedExercises.filter((p) => p.id !== performedExerciseId);
  saveSessions(sessions);
  return true;
}

// Letzte abgeschlossene Session (vor der aktuellen) mit Sätzen für diese Übung -
// zeigt dem Nutzer, was er beim letzten Mal geschafft hat.
export function getLastPerformance(exerciseId, excludeSessionId) {
  const sessions = loadSessions()
    .filter((s) => s.completedAt && s.id !== excludeSessionId)
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));

  for (const session of sessions) {
    const pe = session.performedExercises.find((p) => p.exerciseId === exerciseId);
    if (pe && pe.sets.some((s) => s.weight != null || s.reps != null)) {
      return { date: session.completedAt, sets: pe.sets };
    }
  }
  return null;
}

function withPerformedExercise(sessionId, performedExerciseId, mutate) {
  const sessions = loadSessions();
  const session = sessions.find((s) => s.id === sessionId);
  const pe = session?.performedExercises.find((p) => p.id === performedExerciseId);
  if (!pe) return;
  mutate(pe);
  saveSessions(sessions);
}
