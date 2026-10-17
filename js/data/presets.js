// Klassische, an aktueller Trainingsforschung orientierte Split-Vorlagen, 1:1 aus der
// nativen App übernommen. Alle referenzierten Übungsnamen müssen exakt mit den Namen in
// exerciseSeed.js übereinstimmen (siehe verify-Skripte).
export const TRAINING_PLAN_PRESETS = [
  {
    id: "full-body-ab",
    name: "Ganzkörper A/B",
    summary:
      "Zwei abwechselnde Ganzkörper-Workouts, typischerweise 3x pro Woche trainiert. Jede Muskelgruppe wird sehr häufig beansprucht - ideal für Einsteiger und um Bewegungsmuster oft zu üben.",
    days: [
      {
        name: "Ganzkörper A",
        exercises: [
          { exerciseName: "Kniebeugen", numberOfSets: 4 },
          { exerciseName: "Bankdrücken", numberOfSets: 4 },
          { exerciseName: "Langhantelrudern", numberOfSets: 3 },
          { exerciseName: "Schulterdrücken", numberOfSets: 3 },
          { exerciseName: "Bizepscurls", numberOfSets: 3 },
        ],
      },
      {
        name: "Ganzkörper B",
        exercises: [
          { exerciseName: "Kreuzheben", numberOfSets: 4 },
          { exerciseName: "Schrägbankdrücken", numberOfSets: 4 },
          { exerciseName: "Latzug", numberOfSets: 3 },
          { exerciseName: "Beinpresse", numberOfSets: 3 },
          { exerciseName: "Trizepsdrücken (Kabel)", numberOfSets: 3 },
        ],
      },
    ],
    muscleGrowthRating: 4,
    complexityRating: 2,
    timeInvestmentRating: 3,
  },
  {
    id: "upper-lower",
    name: "Oberkörper/Unterkörper",
    summary:
      "Klassischer 2er-Split, meist 4x pro Woche trainiert (2x Oberkörper, 2x Unterkörper). Gilt als eine der forschungsseitig am besten abgesicherten Aufteilungen für Muskelaufbau bei guter Erholung zwischen den Einheiten.",
    days: [
      {
        name: "Oberkörper",
        exercises: [
          { exerciseName: "Bankdrücken", numberOfSets: 4 },
          { exerciseName: "Langhantelrudern", numberOfSets: 4 },
          { exerciseName: "Schulterdrücken", numberOfSets: 3 },
          { exerciseName: "Latzug", numberOfSets: 3 },
          { exerciseName: "Bizepscurls", numberOfSets: 3 },
          { exerciseName: "Trizepsdrücken (Kabel)", numberOfSets: 3 },
        ],
      },
      {
        name: "Unterkörper",
        exercises: [
          { exerciseName: "Kniebeugen", numberOfSets: 4 },
          { exerciseName: "Rumänisches Kreuzheben", numberOfSets: 3 },
          { exerciseName: "Beinpresse", numberOfSets: 3 },
          { exerciseName: "Beinbeuger", numberOfSets: 3 },
          { exerciseName: "Wadenheben", numberOfSets: 3 },
        ],
      },
    ],
    muscleGrowthRating: 5,
    complexityRating: 3,
    timeInvestmentRating: 4,
  },
  {
    id: "push-pull-legs",
    name: "Push/Pull/Legs",
    summary:
      "Bewährter 3er-Split nach Bewegungsmustern getrennt (Drücken/Ziehen/Beine). Flexibel 3x oder 6x pro Woche trainierbar, mit viel Raum für Übungsvielfalt.",
    days: [
      {
        name: "Push",
        exercises: [
          { exerciseName: "Bankdrücken", numberOfSets: 4 },
          { exerciseName: "Schrägbankdrücken", numberOfSets: 3 },
          { exerciseName: "Schulterdrücken", numberOfSets: 3 },
          { exerciseName: "Seitheben", numberOfSets: 3 },
          { exerciseName: "Trizepsdrücken (Kabel)", numberOfSets: 3 },
        ],
      },
      {
        name: "Pull",
        exercises: [
          { exerciseName: "Klimmzüge", numberOfSets: 4 },
          { exerciseName: "Langhantelrudern", numberOfSets: 3 },
          { exerciseName: "Kabelrudern (sitzend)", numberOfSets: 3 },
          { exerciseName: "Reverse Butterfly / Face Pulls", numberOfSets: 3 },
          { exerciseName: "Bizepscurls", numberOfSets: 3 },
        ],
      },
      {
        name: "Legs",
        exercises: [
          { exerciseName: "Kniebeugen", numberOfSets: 4 },
          { exerciseName: "Rumänisches Kreuzheben", numberOfSets: 3 },
          { exerciseName: "Beinpresse", numberOfSets: 3 },
          { exerciseName: "Beinbeuger", numberOfSets: 3 },
          { exerciseName: "Wadenheben", numberOfSets: 3 },
        ],
      },
    ],
    muscleGrowthRating: 4,
    complexityRating: 3,
    timeInvestmentRating: 4,
  },
  {
    id: "upper-lower-4day",
    name: "4er Split (Oberkörper/Unterkörper A/B)",
    summary:
      "Erweiterung des Upper/Lower-Splits mit zwei unterschiedlichen Varianten je Muskelgruppe - mehr Übungsvielfalt bei gleicher Trainingsfrequenz pro Muskelgruppe.",
    days: [
      {
        name: "Oberkörper A",
        exercises: [
          { exerciseName: "Bankdrücken", numberOfSets: 4 },
          { exerciseName: "Langhantelrudern", numberOfSets: 3 },
          { exerciseName: "Schulterdrücken", numberOfSets: 3 },
          { exerciseName: "Latzug", numberOfSets: 3 },
          { exerciseName: "Hammercurls", numberOfSets: 3 },
        ],
      },
      {
        name: "Unterkörper A",
        exercises: [
          { exerciseName: "Kniebeugen", numberOfSets: 4 },
          { exerciseName: "Beinbeuger", numberOfSets: 3 },
          { exerciseName: "Wadenheben", numberOfSets: 3 },
          { exerciseName: "Ausfallschritte", numberOfSets: 3 },
        ],
      },
      {
        name: "Oberkörper B",
        exercises: [
          { exerciseName: "Schrägbankdrücken", numberOfSets: 4 },
          { exerciseName: "Kabelrudern (sitzend)", numberOfSets: 3 },
          { exerciseName: "Seitheben", numberOfSets: 3 },
          { exerciseName: "Klimmzüge", numberOfSets: 3 },
          { exerciseName: "Trizepsdips", numberOfSets: 3 },
        ],
      },
      {
        name: "Unterkörper B",
        exercises: [
          { exerciseName: "Rumänisches Kreuzheben", numberOfSets: 4 },
          { exerciseName: "Beinpresse", numberOfSets: 3 },
          { exerciseName: "Beinstrecker", numberOfSets: 3 },
          { exerciseName: "Hüftstrecker (Hip Thrust)", numberOfSets: 3 },
        ],
      },
    ],
    muscleGrowthRating: 4,
    complexityRating: 3,
    timeInvestmentRating: 4,
  },
  {
    id: "bro-split",
    name: "5er Split (Brust/Rücken/Schulter/Arme/Beine)",
    summary:
      "Klassischer Bodybuilding-Split mit einer Muskelgruppe pro Tag und hohem Volumen je Einheit. Beliebt und motivierend, laut aktueller Forschung bei gleicher Wochenlast aber tendenziell etwas weniger effizient als häufigeres Training pro Muskelgruppe.",
    days: [
      {
        name: "Brust",
        exercises: [
          { exerciseName: "Bankdrücken", numberOfSets: 4 },
          { exerciseName: "Schrägbankdrücken", numberOfSets: 3 },
          { exerciseName: "Kurzhantel-Fliegende", numberOfSets: 3 },
          { exerciseName: "Dips (Brust)", numberOfSets: 3 },
        ],
      },
      {
        name: "Rücken",
        exercises: [
          { exerciseName: "Klimmzüge", numberOfSets: 4 },
          { exerciseName: "Langhantelrudern", numberOfSets: 3 },
          { exerciseName: "Kabelrudern (sitzend)", numberOfSets: 3 },
          { exerciseName: "Rückenstrecker (Hyperextension)", numberOfSets: 3 },
        ],
      },
      {
        name: "Schulter",
        exercises: [
          { exerciseName: "Schulterdrücken", numberOfSets: 4 },
          { exerciseName: "Seitheben", numberOfSets: 3 },
          { exerciseName: "Frontheben", numberOfSets: 3 },
          { exerciseName: "Reverse Butterfly / Face Pulls", numberOfSets: 3 },
        ],
      },
      {
        name: "Arme",
        exercises: [
          { exerciseName: "Bizepscurls", numberOfSets: 3 },
          { exerciseName: "Hammercurls", numberOfSets: 3 },
          { exerciseName: "Trizepsdrücken (Kabel)", numberOfSets: 3 },
          { exerciseName: "Enges Bankdrücken", numberOfSets: 3 },
        ],
      },
      {
        name: "Beine",
        exercises: [
          { exerciseName: "Kniebeugen", numberOfSets: 4 },
          { exerciseName: "Beinpresse", numberOfSets: 3 },
          { exerciseName: "Beinbeuger", numberOfSets: 3 },
          { exerciseName: "Wadenheben", numberOfSets: 3 },
        ],
      },
    ],
    muscleGrowthRating: 3,
    complexityRating: 2,
    timeInvestmentRating: 5,
  },
];
