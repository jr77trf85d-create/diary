globalThis.localStorage = (() => {
  let store = {};
  return { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, clear: () => { store = {}; } };
})();
globalThis.window = { crypto: globalThis.crypto };

const base = new URL("../js/", import.meta.url).href;
const storage = await import(base + "storage.js");
const { effectiveRepRange } = await import(base + "data/repRanges.js");
const { increaseHint, hasIncreasedWeight } = await import(base + "services/progressionService.js");
const { seedExercisesIfNeeded } = await import(base + "services/exerciseSeeder.js");
const ex = await import(base + "services/exerciseService.js");
const planService = await import(base + "services/planService.js");
const sessionService = await import(base + "services/sessionService.js");
const { findReference } = await import(base + "services/comparisonService.js");
const { instantiatePreset } = await import(base + "services/presetInstantiationService.js");
const { TRAINING_PLAN_PRESETS } = await import(base + "data/presets.js");

let failures = 0;
const assert = (c, m) => { if (!c) { failures++; console.error("FAIL:", m); } else console.log("ok:", m); };
const sets = (...p) => p.map(([weight, reps], i) => ({ id: "s" + i, weight, reps }));
const ref = (s) => ({ session: { completedAt: "2026-10-01T10:00:00Z" }, performed: { sets: s }, sameDay: true });

// ---------- effektive Wiederholungsspanne ----------
let r = effectiveRepRange(null, null, "Bankdrücken");
assert(r.source === "default" && r.min === 6 && r.max === 10, "no user entry -> default of standard exercise");
r = effectiveRepRange(8, 12, "Bankdrücken");
assert(r.source === "user" && r.min === 8 && r.max === 12, "user entry wins over default");
r = effectiveRepRange(null, 15, "Bankdrücken");
assert(r.source === "user" && r.min === null && r.max === 15, "partial user entry is kept as entered");
assert(effectiveRepRange(null, null, "Meine eigene Übung") === null, "custom exercise without entry -> no range");
assert(effectiveRepRange(null, null, "Unterarmstütz (Plank)") === null, "time based standard exercise -> no rep range");
assert(effectiveRepRange(10, 12, "Meine eigene Übung").source === "user", "custom exercise with entry -> user range");

// ---------- Steigern-Hinweis ----------
const range = { min: 8, max: 10 };
const four = (w, reps) => ref(sets(...reps.map((x) => [w, x])));
let hint = increaseHint({ range, plannedSets: 4 }, four(75, [10, 10, 10, 10]));
assert(hint && hint.lastWeight === 75 && hint.sets === 4, "all planned sets at max reps -> hint, no weight suggestion");
assert(!("suggestedWeight" in hint) && Object.keys(hint).sort().join() === "lastWeight,sets", "hint carries no suggested weight");
assert(increaseHint({ range, plannedSets: 4 }, four(75, [10, 10, 10, 9])) === null, "one set below max -> no hint");
assert(increaseHint({ range, plannedSets: 4 }, four(75, [10, 10, 10])) === null, "fewer sets than planned -> no hint");
assert(increaseHint({ range, plannedSets: 3 }, four(75, [10, 10, 10, 10])) !== null, "more sets than planned is fine");
assert(increaseHint({ range, plannedSets: 4 }, four(75, [12, 11, 10, 10])) !== null, "reps above max count too");
const warm = ref(sets([40, 12], [75, 10], [75, 10], [75, 10]));
assert(increaseHint({ range, plannedSets: 3 }, warm) !== null, "lighter warm-up set is ignored");
assert(increaseHint({ range, plannedSets: 4 }, warm) === null, "warm-up set does not count as a working set");
assert(increaseHint({ range, plannedSets: 3 }, null) === null, "no reference -> no hint");
assert(increaseHint({ range: null, plannedSets: 3 }, four(75, [10, 10, 10])) === null, "no range -> no hint");
assert(increaseHint({ range: { min: 8, max: null }, plannedSets: 3 }, four(75, [10, 10, 10])) === null, "range without upper bound -> no hint");
assert(increaseHint({ range, plannedSets: 3 }, ref(sets([null, 12], [null, 12], [null, 12]))) === null, "bodyweight exercise -> no hint");
assert(hasIncreasedWeight(sets([75, 10], [77.5, 8]), hint) === true, "higher weight entered -> hint done");
assert(hasIncreasedWeight(sets([75, 10], [70, 8]), hint) === false, "same/lower weight -> hint stays");
assert(hasIncreasedWeight(sets([80, 10]), null) === false, "no hint -> not applicable");

// ---------- Notiz je Übung ----------
const exercises = seedExercisesIfNeeded();
const bank = exercises.find((e) => e.name === "Bankdrücken");
const row = exercises.find((e) => e.name === "Langhantelrudern");
assert(ex.setExerciseNote(bank.id, "Sitz Stufe 4") === true && ex.getExerciseNote(storage.loadExercises().find((e) => e.id === bank.id)) === "Sitz Stufe 4", "note saved on a standard exercise");
seedExercisesIfNeeded();
assert(storage.loadExercises().find((e) => e.id === bank.id).note === "Sitz Stufe 4", "re-seeding keeps the note");
assert(ex.setExerciseNote("gibtsnicht", "x") === false, "unknown exercise -> false");
ex.setExerciseNote(bank.id, "");
assert(ex.getExerciseNote(storage.loadExercises().find((e) => e.id === bank.id)) === "", "note can be cleared");

// ---------- Migration alter Plan-Notizen ----------
storage.savePlans([
  { id: "p", name: "P", days: [
    { id: "d1", name: "A", order: 0, planExercises: [
      { id: "a", exerciseId: bank.id, order: 0, targetSets: 3, note: "Sitz Stufe 4" },
      { id: "b", exerciseId: row.id, order: 1, targetSets: 3, note: "" },
    ] },
    { id: "d2", name: "B", order: 1, planExercises: [
      { id: "c", exerciseId: bank.id, order: 0, targetSets: 3, note: "Griff eng" },
      { id: "d", exerciseId: "verschwunden", order: 1, targetSets: 3, note: "bleibt" },
    ] },
  ] },
]);
assert(ex.migratePlanNotesToExercises() === true, "migration reports a change");
const afterEx = storage.loadExercises().find((e) => e.id === bank.id);
assert(afterEx.note === "Sitz Stufe 4 · Griff eng", `notes of the same exercise are joined (got "${afterEx.note}")`);
const pes = storage.loadPlans()[0].days.flatMap((d) => d.planExercises);
assert(pes.filter((p) => p.exerciseId === bank.id).every((p) => !("note" in p)), "plan notes removed after migration");
assert(pes.find((p) => p.id === "d").note === "bleibt", "note of a missing exercise is kept, not lost");
assert(ex.migratePlanNotesToExercises() === false || storage.loadExercises().find((e) => e.id === bank.id).note === "Sitz Stufe 4 · Griff eng", "running it again does not duplicate notes");
assert(storage.loadExercises().find((e) => e.id === bank.id).note === "Sitz Stufe 4 · Griff eng", "idempotent");
// vorhandene Notiz + gleiche Legacy-Notiz -> keine Verdopplung
storage.savePlans([{ id: "p", name: "P", days: [{ id: "d", name: "A", order: 0, planExercises: [{ id: "x", exerciseId: bank.id, order: 0, targetSets: 3, note: "Sitz Stufe 4" }] }] }]);
ex.migratePlanNotesToExercises();
assert(storage.loadExercises().find((e) => e.id === bank.id).note === "Sitz Stufe 4 · Griff eng", "identical legacy note is not appended again");

// ---------- neue Plan-/Session-Daten ----------
storage.savePlans([]); storage.saveSessions([]);
const plan = planService.createPlan("T", 1);
const day = plan.days[0];
planService.addExerciseToDay(plan.id, day.id, bank.id);
const pe0 = planService.getPlan(plan.id).days[0].planExercises[0];
assert(!("note" in pe0) && pe0.targetRepsMin === 6 && pe0.targetRepsMax === 10, "new plan exercise: no note field, default range prefilled");
planService.updateTargetSets(plan.id, day.id, pe0.id, 4);
const session = sessionService.startSession(plan.id, day.id);
assert(session.performedExercises[0].targetSets === 4 && !("note" in session.performedExercises[0]), "session snapshots planned set count, no note");
sessionService.addSet(session.id, session.performedExercises[0].id);
assert(sessionService.getSession(session.id).performedExercises[0].targetSets === 4 && sessionService.getSession(session.id).performedExercises[0].sets.length === 5, "adding a set during training does not change the planned count");
const adHoc = sessionService.addAdHocExercise(session.id, row.id);
assert(adHoc.targetSets === 3 && adHoc.adHoc === true, "ad hoc exercise: 3 planned sets");
const inst = instantiatePreset(TRAINING_PLAN_PRESETS[0], "P2");
assert(inst.days.every((d) => d.planExercises.every((p) => !("note" in p))), "preset plans have no note field");

// ---------- Ende-zu-Ende: Hinweis aus echtem Vergleichstraining ----------
storage.saveSessions([{
  id: "old", planId: plan.id, dayId: day.id, date: "2026-10-01T10:00:00.000Z", completedAt: "2026-10-01T11:00:00.000Z",
  performedExercises: [{ id: "o1", exerciseId: bank.id, order: 0, sets: sets([75, 10], [75, 10], [75, 10], [75, 10]) }],
}]);
const found = findReference(bank.id, { planId: plan.id, dayId: day.id });
const range2 = effectiveRepRange(pe0.targetRepsMin, pe0.targetRepsMax, "Bankdrücken");
assert(increaseHint({ range: range2, plannedSets: 4 }, found)?.lastWeight === 75, "end to end: default range 6-10 + four sets of 10 -> hint");
planService.updateTargetReps(plan.id, day.id, pe0.id, 8, 12);
const p2 = planService.getPlan(plan.id).days[0].planExercises[0];
assert(increaseHint({ range: effectiveRepRange(p2.targetRepsMin, p2.targetRepsMax, "Bankdrücken"), plannedSets: 4 }, found) === null, "user range 8-12: 10 reps no longer reaches the top -> no hint");

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
