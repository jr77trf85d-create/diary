export const MUSCLE_GROUPS = [
  { id: "brust", label: "Brust" },
  { id: "ruecken", label: "Rücken" },
  { id: "schultern", label: "Schultern" },
  { id: "bizeps", label: "Bizeps" },
  { id: "trizeps", label: "Trizeps" },
  { id: "unterarme", label: "Unterarme" },
  { id: "quadrizeps", label: "Quadrizeps" },
  { id: "beinbizeps", label: "Beinbizeps" },
  { id: "gesaess", label: "Gesäß" },
  { id: "waden", label: "Waden" },
  { id: "bauch", label: "Bauch/Core" },
  { id: "sonstige", label: "Sonstige" },
];

const LABEL_BY_ID = Object.fromEntries(MUSCLE_GROUPS.map((g) => [g.id, g.label]));

export function muscleGroupLabel(id) {
  return LABEL_BY_ID[id] ?? LABEL_BY_ID.sonstige;
}
