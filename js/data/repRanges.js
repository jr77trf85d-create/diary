// Empfohlene Wiederholungsbereiche je Standardübung (orientiert an gängiger Trainingspraxis:
// schwere Grundübungen eher niedrig, Isolations- und Wadenübungen eher hoch). Für Übungen,
// die über Zeit oder Strecke statt Wiederholungen gesteuert werden, steht nur ein Text.
const REP_RANGES = {
  // Brust
  "Bankdrücken": [6, 10],
  "Schrägbankdrücken": [8, 12],
  "Negativ-Bankdrücken": [8, 12],
  "Kurzhantel-Bankdrücken": [8, 12],
  "Kurzhantel-Fliegende": [10, 15],
  "Dips (Brust)": [8, 12],
  "Butterfly (Maschine)": [10, 15],
  "Liegestütze": [10, 20],
  "Kabelüberzüge (Cable Crossover)": [10, 15],
  "Schrägbank-Kurzhantel-Fliegende": [10, 15],
  "Plyometrische Liegestütze": [5, 10],
  "Smith-Machine Bankdrücken": [8, 12],

  // Rücken
  "Kreuzheben": [3, 6],
  "Klimmzüge": [6, 12],
  "Klimmzüge im Untergriff": [6, 12],
  "Latzug": [8, 12],
  "Langhantelrudern": [6, 10],
  "Kurzhantelrudern (einarmig)": [8, 12],
  "Kabelrudern (sitzend)": [8, 12],
  "Rückenstrecker (Hyperextension)": [10, 15],
  "Sumo-Kreuzheben": [3, 6],
  "T-Bar-Rudern": [8, 12],
  "Kabelzug einarmig (stehend)": [10, 15],
  "Good Mornings": [8, 12],

  // Schultern
  "Schulterdrücken": [6, 10],
  "Seitheben": [12, 20],
  "Frontheben": [10, 15],
  "Reverse Butterfly / Face Pulls": [12, 20],
  "Arnold Press": [8, 12],
  "Schulterdrücken (Maschine)": [8, 12],
  "Kabel-Seitheben": [12, 20],
  "Cuban Press": [10, 15],
  "Aufrechtes Rudern": [10, 15],

  // Bizeps
  "Bizepscurls": [8, 12],
  "Hammercurls": [8, 12],
  "Konzentrationscurls": [10, 15],
  "Kabel-Bizepscurls": [10, 15],
  "21s (Bizeps)": [21, 21],
  "Scott-Curls": [8, 12],
  "Reverse Curls": [10, 15],

  // Trizeps
  "Trizepsdrücken (Kabel)": [10, 15],
  "Trizepsdips": [8, 12],
  "Enges Bankdrücken": [6, 10],
  "Überkopf-Trizepsstrecken": [10, 15],
  "Skullcrusher": [8, 12],
  "Trizeps-Kickbacks": [12, 15],
  "Diamant-Liegestütze": [8, 15],

  // Unterarme
  "Handgelenkscurls": [12, 20],
  "Reverse Wrist Curls": [12, 20],
  "Farmer's Walk": { text: "20 bis 40 Meter pro Durchgang" },

  // Quadrizeps
  "Kniebeugen": [6, 10],
  "Beinpresse": [8, 12],
  "Ausfallschritte": [8, 12],
  "Beinstrecker": [10, 15],
  "Frontkniebeugen": [6, 10],
  "Hackenschmidt-Kniebeugen": [8, 12],
  "Bulgarian Split Squat": [8, 12],
  "Goblet Squat": [10, 15],

  // Beinbizeps
  "Rumänisches Kreuzheben": [8, 12],
  "Beinbeuger": [10, 15],
  "Nordic Hamstring Curl": [4, 8],
  "Einbeiniger Beinbeuger": [10, 15],

  // Gesäß
  "Hüftstrecker (Hip Thrust)": [8, 12],
  "Kickbacks am Kabel": [12, 15],
  "Hüftabduktion (Maschine)": [12, 20],
  "Hüftadduktion (Maschine)": [12, 20],

  // Waden
  "Wadenheben": [12, 20],
  "Wadenheben sitzend": [12, 20],
  "Wadenheben an der Beinpresse": [12, 20],

  // Bauch/Core
  "Crunches": [15, 20],
  "Unterarmstütz (Plank)": { text: "30 bis 60 Sekunden halten" },
  "Beinheben": [10, 15],
  "Russian Twists": [15, 20],
  "Kabel-Crunches": [10, 15],
  "Ab Wheel Rollout": [8, 12],
  "Bergsteiger (Mountain Climbers)": { text: "30 bis 45 Sekunden" },
  "Seitstütz (Side Plank)": { text: "20 bis 45 Sekunden pro Seite" },
};

export const REP_RANGE_NAMES = Object.keys(REP_RANGES);

// -> { min, max, text } oder null (z. B. für eigene Übungen). min/max sind null, wenn die
// Übung nicht über Wiederholungen gesteuert wird - dann gibt es nur den Hinweistext.
export function recommendedReps(exerciseName) {
  const entry = REP_RANGES[exerciseName];
  if (!entry) return null;
  if (Array.isArray(entry)) {
    const [min, max] = entry;
    return {
      min,
      max,
      text: min === max ? `${min} Wiederholungen pro Satz` : `${min} bis ${max} Wiederholungen pro Satz`,
    };
  }
  return { min: null, max: null, text: entry.text };
}

export function formatRepTarget(min, max) {
  if (min == null && max == null) return "";
  if (min == null) return String(max);
  if (max == null || min === max) return String(min);
  return `${min}–${max}`;
}

// Anzuzeigende Wiederholungsspanne einer Übung: zuerst die eigene Eintragung (Plan), sonst die
// Empfehlung der Standardübung. Eigene Übungen ohne Eintrag haben keine Spanne (null).
// -> { min, max, source: "user" | "default" } oder null
export function effectiveRepRange(userMin, userMax, exerciseName) {
  if (userMin != null || userMax != null) {
    return { min: userMin ?? null, max: userMax ?? null, source: "user" };
  }
  const recommended = recommendedReps(exerciseName);
  if (recommended && (recommended.min != null || recommended.max != null)) {
    return { min: recommended.min, max: recommended.max, source: "default" };
  }
  return null;
}
