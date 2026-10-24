import { loadSessions } from "../storage.js";

// Ab dieser Abweichung zum Vergleichstraining zählt etwas als besser/schlechter (statt "gleich").
export const PROGRESS_TOLERANCE = 0.02;

export function isFilledSet(set) {
  return set.weight != null || set.reps != null;
}

// Kennzahlen einer Übung innerhalb eines Trainings. Volumen = Gewicht × Wiederholungen,
// summiert über alle ausgefüllten Sätze (wie im Statistik-Chart der Übung).
export function exerciseMetrics(sets) {
  const filled = sets.filter(isFilledSet);
  const volume = filled.reduce((sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0), 0);
  const reps = filled.reduce((sum, s) => sum + (s.reps ?? 0), 0);
  const topWeight = filled.reduce((max, s) => Math.max(max, s.weight ?? 0), 0);
  return {
    filledSets: filled.length,
    volume,
    reps,
    topWeight,
    usesWeight: filled.some((s) => (s.weight ?? 0) > 0),
  };
}

// Übungen ohne Gewicht (Klimmzüge, Liegestütze ...) werden über die Wiederholungen verglichen.
export function metricFor(metrics, mode) {
  return mode === "reps" ? metrics.reps : metrics.volume;
}

export function modeForReference(referenceMetrics) {
  return referenceMetrics.usesWeight ? "volume" : "reps";
}

// `sessions` erlaubt, die Trainings einmal zu laden und mehrfach zu verwenden (Verlaufsliste).
function completedSessions({ excludeSessionId = null, before = null, sessions = null } = {}) {
  return (sessions ?? loadSessions())
    .filter((s) => s.completedAt && s.id !== excludeSessionId)
    .filter((s) => before === null || new Date(s.completedAt) < new Date(before))
    .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
}

function findPerformed(session, exerciseId) {
  const performed = session.performedExercises.find((p) => p.exerciseId === exerciseId);
  return performed && performed.sets.some(isFilledSet) ? performed : null;
}

// Vergleichstraining für eine Übung: zuerst das letzte abgeschlossene Training desselben
// Trainingstags, in dem die Übung vorkam; sonst ihr letztes Training an irgendeinem anderen Tag.
// `before` begrenzt auf Trainings vor einem Zeitpunkt (für die Ansicht älterer Trainings).
export function findReference(exerciseId, { planId, dayId, excludeSessionId = null, before = null, sessions: all = null }) {
  const sessions = completedSessions({ excludeSessionId, before, sessions: all });

  for (const session of sessions) {
    if (session.planId !== planId || session.dayId !== dayId) continue;
    const performed = findPerformed(session, exerciseId);
    if (performed) return { session, performed, sameDay: true };
  }
  for (const session of sessions) {
    const performed = findPerformed(session, exerciseId);
    if (performed) return { session, performed, sameDay: false };
  }
  return null;
}

// Ergebnis eines Vergleichs: status = "up" | "same" | "down" | "new"
export function compareToReference(currentSets, reference) {
  const current = exerciseMetrics(currentSets);
  if (!reference) return { status: "new", current, reference: null };

  const refMetrics = exerciseMetrics(reference.performed.sets);
  const mode = modeForReference(refMetrics);
  const refValue = metricFor(refMetrics, mode);
  if (refValue <= 0) return { status: "new", current, reference: null };

  const currentValue = metricFor(current, mode);
  const ratio = currentValue / refValue;
  const heavier = mode === "volume" && current.topWeight > refMetrics.topWeight;

  let status = "same";
  if (ratio > 1 + PROGRESS_TOLERANCE || (ratio >= 1 && heavier)) status = "up";
  else if (ratio < 1 - PROGRESS_TOLERANCE) status = "down";

  return {
    status,
    mode,
    current,
    currentValue,
    referenceValue: refValue,
    referenceMetrics: refMetrics,
    referenceDate: reference.session.completedAt,
    sameDay: reference.sameDay,
    ratio,
    deltaPercent: Math.round((ratio - 1) * 100),
    topWeightDelta: mode === "volume" ? current.topWeight - refMetrics.topWeight : null,
  };
}

// Bestgewicht: höher als alles, was vor diesem Training mit der Übung geschafft wurde
// (nur wenn es überhaupt frühere Trainings gibt).
export function isPersonalBest(exerciseId, topWeight, { excludeSessionId = null, before = null, sessions = null } = {}) {
  if (!(topWeight > 0)) return false;
  let hadEarlier = false;
  let best = 0;
  for (const session of completedSessions({ excludeSessionId, before, sessions })) {
    const performed = findPerformed(session, exerciseId);
    if (!performed) continue;
    hadEarlier = true;
    best = Math.max(best, exerciseMetrics(performed.sets).topWeight);
  }
  return hadEarlier && topWeight > best;
}

// Stand des Balkens während des Trainings. null = es gibt keinen Vergleichswert.
export function liveProgress(currentSets, reference) {
  if (!reference) return null;
  const refMetrics = exerciseMetrics(reference.performed.sets);
  const mode = modeForReference(refMetrics);
  const target = metricFor(refMetrics, mode);
  if (target <= 0) return null;
  const value = metricFor(exerciseMetrics(currentSets), mode);
  return { mode, value, target, ratio: value / target, percent: Math.round((value / target) * 100) };
}

// Gesamtauswertung eines abgeschlossenen Trainings (für Abschluss-Übersicht und Verlauf).
export function buildSessionReport(session, allSessions = loadSessions()) {
  const before = session.completedAt ?? null;
  const items = session.performedExercises
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((performed) => {
      const metrics = exerciseMetrics(performed.sets);
      if (metrics.filledSets === 0) return { performed, metrics, skipped: true };
      const reference = findReference(performed.exerciseId, {
        planId: session.planId,
        dayId: session.dayId,
        excludeSessionId: session.id,
        before,
        sessions: allSessions,
      });
      const comparison = compareToReference(performed.sets, reference);
      const personalBest = isPersonalBest(performed.exerciseId, metrics.topWeight, {
        excludeSessionId: session.id,
        before,
        sessions: allSessions,
      });
      return { performed, metrics, skipped: false, comparison, personalBest };
    });

  const trained = items.filter((i) => !i.skipped);
  const counts = { up: 0, same: 0, down: 0, new: 0 };
  for (const item of trained) counts[item.comparison.status]++;

  const totalVolume = trained.reduce((sum, i) => sum + i.metrics.volume, 0);
  const totalSets = trained.reduce((sum, i) => sum + i.metrics.filledSets, 0);
  const totalReps = trained.reduce((sum, i) => sum + i.metrics.reps, 0);

  // Vorheriges Training desselben Trainingstags (für Gesamt-Vergleich und Überschrift)
  const previous = completedSessions({ excludeSessionId: session.id, before, sessions: allSessions }).find(
    (s) => s.planId === session.planId && s.dayId === session.dayId
  );
  let previousVolume = null;
  if (previous) {
    previousVolume = previous.performedExercises.reduce((sum, p) => sum + exerciseMetrics(p.sets).volume, 0);
  }

  const durationMs = session.completedAt ? new Date(session.completedAt) - new Date(session.date) : null;
  // Wurde ein Training erst Stunden nach dem Start abgeschlossen, ist die Dauer nicht aussagekräftig.
  const durationMinutes =
    durationMs !== null && durationMs > 60_000 && durationMs < 6 * 3_600_000 ? Math.round(durationMs / 60_000) : null;

  return {
    session,
    items,
    counts,
    trainedCount: trained.length,
    totalVolume,
    totalSets,
    totalReps,
    durationMinutes,
    previousDate: previous?.completedAt ?? null,
    volumeDeltaPercent:
      previousVolume && previousVolume > 0 ? Math.round((totalVolume / previousVolume - 1) * 100) : null,
  };
}

export function sessionHasData(session) {
  return session.performedExercises.some((p) => p.sets.some(isFilledSet));
}
