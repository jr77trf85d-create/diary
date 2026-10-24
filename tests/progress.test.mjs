globalThis.localStorage = (() => {
  let store = {};
  return { getItem: (k) => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); }, clear: () => { store = {}; } };
})();
globalThis.window = { crypto: globalThis.crypto };

const base = new URL("../js/", import.meta.url).href;
const storage = await import(base + "storage.js");
const { getProgressHistory, getRecentPerformances } = await import(base + "services/exerciseProgressService.js");
const { formatNumber } = await import(base + "ui/format.js");
const { progressBarHtml } = await import(base + "ui/progressBar.js");

let failures = 0;
const assert = (c, m) => { if (!c) { failures++; console.error("FAIL:", m); } else console.log("ok:", m); };

const sets = (...p) => p.map(([weight, reps], i) => ({ id: "s" + i, weight, reps }));
const mk = (id, date, done, s) => ({
  id, planId: "p", dayId: "d", date, completedAt: done ? date : null,
  performedExercises: [{ id: id + "pe", exerciseId: "E", order: 0, sets: s }],
});

storage.saveSessions([
  mk("a", "2026-10-01T10:00:00.000Z", true, sets([60, 10], [null, null])),
  mk("b", "2026-10-08T10:00:00.000Z", true, sets([65, 8])),
  mk("c", "2026-10-15T10:00:00.000Z", false, sets([200, 1])), // laufendes Training
  mk("d", "2026-10-12T10:00:00.000Z", true, sets([null, null])), // nichts eingetragen
]);

const h = getProgressHistory("E");
assert(h.length === 2 && h[0].maxWeight === 60 && h[1].maxWeight === 65, "history only has completed trainings with data (running training ignored)");
const recent = getRecentPerformances("E", 5);
assert(recent.length === 2 && recent[0].sets[0].weight === 65, "recent trainings newest first, completed only");
assert(recent[1].sets.length === 1, "recent trainings list only filled sets");
assert(getRecentPerformances("E", 1).length === 1, "limit respected");
assert(formatNumber(72.5) === "72,5" && formatNumber(2465) === "2.465" && formatNumber(60) === "60", "German number format");
assert(progressBarHtml(null).includes("Erstes Training"), "no reference -> hint instead of bar");
const bar = progressBarHtml({ mode: "volume", value: 312, target: 480, ratio: 0.65, percent: 65 });
assert(bar.includes("312 von 480 kg") && bar.includes("65 %") && bar.includes("width:65.0%") && !bar.includes("over"), "bar below 100%");
const over = progressBarHtml({ mode: "volume", value: 540, target: 480, ratio: 1.125, percent: 113 });
assert(over.includes("+13 %") && over.includes("width:100.0%") && over.includes("done over"), "bar above 100% stays full and shows the lead");
assert(progressBarHtml({ mode: "reps", value: 9, target: 18, ratio: 0.5, percent: 50 }).includes("9 von 18 Wdh."), "reps mode label");

console.log(failures === 0 ? "\nALL CHECKS PASSED" : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
