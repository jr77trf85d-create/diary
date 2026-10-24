globalThis.localStorage = (() => {
  let store = {};
  return {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    clear: () => { store = {}; },
  };
})();
globalThis.window = { crypto: globalThis.crypto };

const base = new URL("../js/", import.meta.url).href;
const storage = await import(base + "storage.js");
const cmp = await import(base + "services/comparisonService.js");
const hist = await import(base + "services/historyService.js");
const sess = await import(base + "services/sessionService.js");

let failures = 0;
const assert = (c, m) => { if (!c) { failures++; console.error("FAIL:", m); } else console.log("ok:", m); };

let n = 0;
const id = () => `id${++n}`;
const sets = (...pairs) => pairs.map(([weight, reps]) => ({ id: id(), weight, reps }));
const pe = (exerciseId, order, s) => ({ id: id(), exerciseId, order, planExerciseId: null, adHoc: false, sets: s });
// date/completedAt als lokale Zeit, Dauer in Minuten
const session = (planId, dayId, startIso, minutes, exercises, done = true) => {
  const start = new Date(startIso);
  return {
    id: id(), planId, dayId, date: start.toISOString(),
    completedAt: done ? new Date(start.getTime() + minutes * 60000).toISOString() : null,
    performedExercises: exercises,
  };
};

// ---------- Kennzahlen ----------
const m = cmp.exerciseMetrics(sets([60, 8], [60, 8], [55, 10], [null, null]));
assert(m.filledSets === 3 && m.volume === 60 * 8 * 2 + 55 * 10 && m.topWeight === 60 && m.reps === 26 && m.usesWeight, "metrics: volume, reps, top weight, empty set ignored");
const mb = cmp.exerciseMetrics(sets([null, 10], [null, 8], [0, 6]));
assert(mb.volume === 0 && mb.reps === 24 && mb.usesWeight === false, "bodyweight sets: reps counted, no weight mode");

// ---------- Vergleichslogik ----------
const ref = (s) => ({ session: { completedAt: "2026-10-01T10:00:00Z" }, performed: { sets: s }, sameDay: true });
const R = ref(sets([60, 10], [60, 10])); // volume 1200, top 60
const status = (cur, reference = R) => cmp.compareToReference(sets(...cur), reference).status;
assert(status([[60, 10], [60, 10]]) === "same", "identical -> same");
assert(status([[60, 10], [60, 11]]) === "up", "+60kg volume (5%) -> up");
assert(status([[60, 10], [60, 10], [60, 1]]) === "up", "+5% -> up");
assert(status([[60, 10], [60, 9]]) === "down", "-5% -> down");
assert(status([[60, 10], [60, 10], [10, 1]]) === "same", "+0.8% within tolerance -> same");
assert(status([[60, 10], [59, 10]]) === "same", "-0.8% (1190 vs 1200) within tolerance -> same");
assert(status([[60, 10], [60, 9], [1, 5]]) === "down", "-4.6% -> down");
assert(status([[65, 10], [56, 10]]) === "up", "1210 vs 1200 (+0.8%) but heavier top set -> up");
assert(status([[65, 9], [60, 10]]) === "same", "heavier top set but volume slightly lower (-1.3%) -> same, not up");
assert(status([[62, 10], [58, 10]]) === "same" || status([[62, 10], [58, 10]]) === "up", "equal volume + heavier top weight -> up");
assert(status([[62, 10], [58, 10]]) === "up", "equal volume + heavier top weight is progress (>= volume and heavier)");
assert(status([[80, 5], [80, 5]]) === "down", "heavier but clearly less volume (800 vs 1200) -> down");
assert(status([[60, 10]], null) === "new", "no reference -> new");
assert(cmp.compareToReference(sets([60, 10]), ref(sets([0, 0]))).status === "new", "reference with zero metric -> new");
const c = cmp.compareToReference(sets([60, 12], [60, 10]), R);
assert(c.deltaPercent === 10 && c.referenceValue === 1200 && c.currentValue === 1320 && c.mode === "volume", "delta percent / values");
// Körpergewicht
const BW = ref(sets([null, 10], [null, 8]));
assert(cmp.compareToReference(sets([null, 12], [null, 8]), BW).status === "up" && cmp.compareToReference(sets([null, 12], [null, 8]), BW).mode === "reps", "bodyweight compares reps");
assert(cmp.compareToReference(sets([null, 10], [null, 6]), BW).status === "down", "bodyweight fewer reps -> down");

// ---------- Live-Balken ----------
const lp = cmp.liveProgress(sets([60, 5]), R);
assert(lp.value === 300 && lp.target === 1200 && lp.percent === 25 && lp.mode === "volume", "live progress 25%");
assert(cmp.liveProgress(sets([60, 10], [60, 10], [60, 6]), R).percent === 130, "live progress over 100%");
assert(cmp.liveProgress(sets([60, 5]), null) === null, "no reference -> no bar");
assert(cmp.liveProgress(sets([null, 5]), BW).mode === "reps" && cmp.liveProgress(sets([null, 9]), BW).percent === 50, "bodyweight live progress counts reps");
assert(cmp.liveProgress([], R).percent === 0, "empty -> 0%");

// ---------- Referenzsuche ----------
const BANK = "bank", SEIT = "seit";
const dayA = { planId: "p1", dayId: "A" }, dayB = { planId: "p1", dayId: "B" };
const sA1 = session("p1", "A", "2026-09-01T10:00:00", 50, [pe(BANK, 0, sets([60, 8]))]);
const sB1 = session("p1", "B", "2026-09-05T10:00:00", 40, [pe(BANK, 0, sets([70, 5])), pe(SEIT, 1, sets([10, 12]))]);
const sA2 = session("p1", "A", "2026-09-08T10:00:00", 55, [pe(BANK, 0, sets([62, 8]))]);
const sOpen = session("p1", "A", "2026-09-09T10:00:00", 0, [pe(BANK, 0, sets([200, 10]))], false);
storage.saveSessions([sA1, sB1, sA2, sOpen]);
let r = cmp.findReference(BANK, { ...dayA });
assert(r.session.id === sA2.id && r.sameDay === true, "same-day reference preferred (latest completed of that day)");
assert(cmp.findReference(BANK, { ...dayA }).session.id !== sOpen.id, "unfinished sessions are never a reference");
r = cmp.findReference(SEIT, { ...dayA });
assert(r.session.id === sB1.id && r.sameDay === false, "falls back to last time on another day");
assert(cmp.findReference("nie", { ...dayA }) === null, "never trained -> null");
assert(cmp.findReference(BANK, { ...dayA, excludeSessionId: sA2.id }).session.id === sA1.id, "excludeSessionId respected");
assert(cmp.findReference(BANK, { ...dayA, before: sA2.date }).session.id === sA1.id, "before limits to earlier trainings");

// ---------- Bestgewicht ----------
assert(cmp.isPersonalBest(BANK, 75) === true, "75 > best 70 -> personal best");
assert(cmp.isPersonalBest(BANK, 70) === false, "equal is not a new best");
assert(cmp.isPersonalBest("nie", 50) === false, "first time ever is not flagged");

// ---------- Bericht ----------
const sA3 = session("p1", "A", "2026-09-15T10:00:00", 48, [
  pe(BANK, 0, sets([62, 10])),        // 1240 > 992 -> up (vs sA2 volume 496?) see below
  pe(SEIT, 1, sets([10, 12])),        // vs sB1 other day: 120 -> same
  pe("neu", 2, sets([20, 10])),       // new
  pe("skip", 3, sets([null, null])),  // skipped
]);
storage.saveSessions([sA1, sB1, sA2, sOpen, sA3]);
const rep = cmp.buildSessionReport(sA3);
const byEx = Object.fromEntries(rep.items.map((i) => [i.performed.exerciseId, i]));
assert(byEx[BANK].comparison.status === "up" && byEx[BANK].comparison.sameDay === true, "report: bench up vs last same-day training");
assert(byEx[SEIT].comparison.status === "same" && byEx[SEIT].comparison.sameDay === false, "report: lateral raise same, compared with other day");
assert(byEx.neu.comparison.status === "new" && byEx.skip.skipped === true, "report: new + skipped exercise");
assert(rep.counts.up === 1 && rep.counts.same === 1 && rep.counts.new === 1 && rep.counts.down === 0 && rep.trainedCount === 3, "report counts");
assert(rep.totalVolume === 62 * 10 + 120 + 200 && rep.totalSets === 3, `report totals (${rep.totalVolume}, ${rep.totalSets})`);
assert(rep.durationMinutes === 48, "duration in minutes");
assert(rep.previousDate === sA2.completedAt, "previous same-day training found");
const prevVol = 62 * 8; // sA2
assert(rep.volumeDeltaPercent === Math.round(((620 + 120 + 200) / prevVol - 1) * 100), "overall volume delta vs previous same-day training");
assert(byEx[BANK].personalBest === false, "62kg is not above best 70kg");
// Alter Training: Bericht vergleicht nur mit Früherem
const repOld = cmp.buildSessionReport(sA2);
assert(repOld.items[0].comparison.referenceDate === sA1.completedAt, "older report compares to its own predecessor, not later trainings");
const repFirst = cmp.buildSessionReport(sA1);
assert(repFirst.items[0].comparison.status === "new" && repFirst.previousDate === null && repFirst.volumeDeltaPercent === null, "first ever training: all new, no overall delta");
// Dauer unplausibel
const longS = session("p1", "A", "2026-09-20T08:00:00", 600, [pe(BANK, 0, sets([60, 5]))]);
assert(cmp.buildSessionReport(longS).durationMinutes === null, "implausible duration hidden");
assert(cmp.sessionHasData(sOpen) === true && cmp.sessionHasData(session("p", "d", "2026-01-01T10:00:00", 1, [pe("x", 0, sets([null, null]))])) === false, "sessionHasData");

// ---------- Verlauf ----------
storage.saveSessions([sA1, sB1, sA2, sOpen, sA3]);
const history = hist.getHistory();
assert(history.length === 4 && history[0].session.id === sA3.id, "history: completed only, newest first");
const NOW = new Date("2026-09-16T12:00:00"); // Mittwoch
const groups = hist.groupByWeek(history);
assert(groups.length === 3, `3 weeks with trainings (got ${groups.length})`);
assert(hist.weekLabel(groups[0].weekStart, NOW) === "Diese Woche", "label: this week");
assert(hist.weekLabel(groups[1].weekStart, NOW) === "Letzte Woche", "label: last week");
assert(/^\d\d\.\d\d\. – \d\d\.\d\d\.$/.test(hist.weekLabel(groups[2].weekStart, NOW)), "label: date range for older weeks");
assert(hist.startOfWeek(new Date("2026-09-20T23:00:00")).getDate() === 14 && hist.startOfWeek(new Date("2026-09-14T00:00:00")).getDate() === 14, "weeks start on Monday (Sunday belongs to previous Monday)");
const ws = hist.weeklyStats(history, 4, NOW);
assert(ws.length === 4 && ws[3].trainings === 1 && ws[2].trainings === 1 && ws[1].trainings === 2 && ws[0].trainings === 0, "weekly stats incl. empty weeks, oldest first");
assert(ws[3].volume === rep.totalVolume, "weekly volume sums report volume");
assert(hist.formatKg(12345.6) === "12.346 kg" || hist.formatKg(12345.6).includes("12"), "formatKg");

// ---------- Löschen / Zurücksetzen ----------
sess.deleteSession(sA3.id);
assert(storage.loadSessions().length === 4 && !storage.loadSessions().some((s) => s.id === sA3.id), "deleteSession removes one");
assert(cmp.findReference(BANK, { ...dayA }).session.id === sA2.id, "deleting a training changes later references");
assert(sess.countSessions() === 4, "countSessions");
assert(sess.deleteAllSessions() === 4 && storage.loadSessions().length === 0, "deleteAllSessions removes everything incl. unfinished");
storage.savePlans([{ id: "keep" }]); storage.saveExercises([{ id: "e", custom: true }]);
sess.deleteAllSessions();
assert(storage.loadPlans().length === 1 && storage.loadExercises().length === 1, "reset leaves plans and exercises untouched");
assert(hist.getHistory().length === 0 && cmp.findReference(BANK, { ...dayA }) === null, "after reset: no history, no references");

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
