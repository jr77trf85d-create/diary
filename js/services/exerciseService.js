import { loadExercises, saveExercises, loadPlans, savePlans, makeId } from "../storage.js";
import { MUSCLE_GROUPS } from "../data/muscleGroups.js";

export class ExerciseValidationError extends Error {
  constructor(code) {
    super(code);
    this.code = code; // "empty" | "duplicate"
  }
}

// Vom Nutzer angelegte Übungen tragen das Flag `custom: true`, damit sie in der Oberfläche
// als "Eigene" erkennbar sind und nur sie bearbeitet/gelöscht werden können.
export function isCustomExercise(exercise) {
  return exercise?.custom === true;
}

function sameName(a, b) {
  return a.trim().toLocaleLowerCase("de") === b.trim().toLocaleLowerCase("de");
}

function validName(name, exercises, ignoreId) {
  const trimmed = (name ?? "").trim();
  if (!trimmed) throw new ExerciseValidationError("empty");
  if (exercises.some((e) => e.id !== ignoreId && sameName(e.name, trimmed))) {
    throw new ExerciseValidationError("duplicate");
  }
  return trimmed;
}

function validGroup(id) {
  return MUSCLE_GROUPS.some((g) => g.id === id) ? id : "sonstige";
}

export function addCustomExercise({ name, instructions = "", muscleGroup = "sonstige" }) {
  const exercises = loadExercises();
  const created = {
    id: makeId(),
    name: validName(name, exercises, null),
    instructions: instructions.trim(),
    muscleFeedback: "",
    muscleGroup: validGroup(muscleGroup),
    alternatives: [],
    custom: true,
  };
  exercises.push(created);
  saveExercises(exercises);
  return created;
}

export function updateCustomExercise(exerciseId, { name, instructions = "", muscleGroup = "sonstige" }) {
  const exercises = loadExercises();
  const exercise = exercises.find((e) => e.id === exerciseId);
  if (!isCustomExercise(exercise)) return null;

  exercise.name = validName(name, exercises, exerciseId);
  exercise.instructions = instructions.trim();
  exercise.muscleGroup = validGroup(muscleGroup);
  saveExercises(exercises);
  return exercise;
}

// Entfernt die Übung auch aus Trainingsplänen und aus den Alternativ-Verknüpfungen anderer
// Übungen. Bereits aufgezeichnete Trainingsdaten bleiben unangetastet.
export function deleteCustomExercise(exerciseId) {
  const exercises = loadExercises();
  const exercise = exercises.find((e) => e.id === exerciseId);
  if (!isCustomExercise(exercise)) return false;

  const remaining = exercises
    .filter((e) => e.id !== exerciseId)
    .map((e) =>
      e.alternatives?.includes(exerciseId)
        ? { ...e, alternatives: e.alternatives.filter((id) => id !== exerciseId) }
        : e
    );
  saveExercises(remaining);

  const plans = loadPlans();
  for (const plan of plans) {
    for (const day of plan.days) {
      day.planExercises = day.planExercises
        .filter((pe) => pe.exerciseId !== exerciseId)
        .map((pe, i) => ({ ...pe, order: i }));
    }
  }
  savePlans(plans);
  return true;
}

// Dauerhafte Notiz zu einer Übung (z. B. Sitzeinstellung), gilt in allen Plänen und Trainings.
// Funktioniert für Standard- und eigene Übungen.
export function setExerciseNote(exerciseId, note) {
  const exercises = loadExercises();
  const exercise = exercises.find((e) => e.id === exerciseId);
  if (!exercise) return false;
  exercise.note = String(note ?? "");
  saveExercises(exercises);
  return true;
}

export function getExerciseNote(exercise) {
  return (exercise?.note ?? "").trim();
}

// Früher gab es Notizen je Übung und Trainingstag im Plan. Es gibt jetzt nur noch eine Notiz je
// Übung: bestehende Plan-Notizen werden in die Übung übernommen (verschiedene Notizen derselben
// Übung werden mit " · " verbunden) und aus dem Plan entfernt. Läuft bei jedem Start und ist
// wiederholbar, ohne Notizen zu verdoppeln.
export function migratePlanNotesToExercises() {
  const plans = loadPlans();
  const exercises = loadExercises();
  const byId = new Map(exercises.map((e) => [e.id, e]));
  let changed = false;

  for (const plan of plans) {
    for (const day of plan.days) {
      for (const pe of day.planExercises) {
        const legacy = (pe.note ?? "").trim();
        if (!legacy) {
          if ("note" in pe) {
            delete pe.note;
            changed = true;
          }
          continue;
        }
        const exercise = byId.get(pe.exerciseId);
        if (!exercise) continue;
        const current = (exercise.note ?? "").trim();
        if (!current) exercise.note = legacy;
        else if (!current.includes(legacy)) exercise.note = `${current} · ${legacy}`;
        delete pe.note;
        changed = true;
      }
    }
  }

  if (changed) {
    saveExercises(exercises);
    savePlans(plans);
  }
  return changed;
}
