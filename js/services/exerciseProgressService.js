import { loadSessions } from "../storage.js";

// Gewichts-/Wiederholungs-/Volumenverlauf einer Übung über alle Trainingssessions hinweg
// (unabhängig davon, ob als Haupt- oder Alternativübung durchgeführt). Portiert aus der
// nativen App: pro Session wird der Topsatz (höchstes Gewicht) sowie das Gesamtvolumen
// der tatsächlich ausgefüllten Sätze ermittelt - leere Platzhalter-Sätze zählen nicht mit.
export function getProgressHistory(exerciseId) {
  const sessions = loadSessions()
    .slice()
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const points = [];
  for (const session of sessions) {
    const performed = session.performedExercises.find((pe) => pe.exerciseId === exerciseId);
    if (!performed) continue;

    const filledSets = performed.sets.filter((s) => s.weight != null || s.reps != null);
    if (filledSets.length === 0) continue;

    const topSet = filledSets.reduce((max, s) => ((s.weight ?? 0) > (max.weight ?? 0) ? s : max));
    const totalVolume = filledSets.reduce((sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0), 0);

    points.push({
      date: session.date,
      maxWeight: topSet.weight ?? 0,
      repsAtMaxWeight: topSet.reps ?? 0,
      totalVolume,
    });
  }
  return points;
}
