import { exerciseMetrics, isFilledSet } from "./comparisonService.js";

// Hinweis "Gewicht steigern" nach dem Prinzip der Doppelprogression: Wurde im Vergleichstraining
// bei mindestens so vielen Sätzen wie geplant mit dem Spitzengewicht die obere Grenze der
// Wiederholungsspanne erreicht, ist beim nächsten Mal ein höheres Gewicht dran. Wärmesätze mit
// weniger Gewicht zählen nicht mit. Es wird bewusst kein Zielgewicht genannt - die nächste
// mögliche Stufe hängt vom Gerät im Studio ab.
//
// range: { min, max } (siehe effectiveRepRange), plannedSets: geplante Satzanzahl,
// reference: Ergebnis von findReference. -> { lastWeight, sets } oder null
export function increaseHint({ range, plannedSets }, reference) {
  if (!reference || !range || range.max == null || !(plannedSets >= 1)) return null;

  const sets = reference.performed.sets.filter(isFilledSet);
  const metrics = exerciseMetrics(sets);
  if (!metrics.usesWeight) return null; // ohne Gewicht gibt es nichts zu steigern

  const atTopWeight = sets.filter((s) => (s.weight ?? 0) === metrics.topWeight);
  const reachedMax = atTopWeight.filter((s) => (s.reps ?? 0) >= range.max);
  if (reachedMax.length < plannedSets) return null;

  return { lastWeight: metrics.topWeight, sets: reachedMax.length };
}

// Wurde im laufenden Training bereits ein höheres Gewicht als beim letzten Mal eingetragen?
export function hasIncreasedWeight(currentSets, hint) {
  return Boolean(hint) && currentSets.some((s) => (s.weight ?? 0) > hint.lastWeight);
}
