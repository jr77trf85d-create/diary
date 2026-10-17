import { loadSessions, saveSessions, makeId } from "../storage.js";
import { getPlan } from "./planService.js";

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
        sets: Array.from({ length: pe.targetSets }, () => ({ id: makeId(), weight: null, reps: null })),
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

export function replaceExercise(sessionId, performedExerciseId, newExerciseId) {
  withPerformedExercise(sessionId, performedExerciseId, (pe) => {
    pe.exerciseId = newExerciseId;
  });
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
