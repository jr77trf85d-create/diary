import { loadExercises, loadPlans, savePlans, makeId } from "../storage.js";
import { recommendedReps } from "../data/repRanges.js";

export class PresetInstantiationError extends Error {
  constructor(exerciseName) {
    super(`Übung nicht gefunden: ${exerciseName}`);
    this.exerciseName = exerciseName;
  }
}

// Wandelt eine Vorlage in einen echten, danach ganz normal editierbaren Trainingsplan um -
// Übungen werden per Name gegen die vorhandene Übungsdatenbank aufgelöst.
export function instantiatePreset(preset, planName) {
  const exercisesByName = new Map(loadExercises().map((e) => [e.name, e]));

  const days = preset.days.map((presetDay, dayIndex) => {
    const planExercises = presetDay.exercises.map((presetExercise, i) => {
      const exercise = exercisesByName.get(presetExercise.exerciseName);
      if (!exercise) throw new PresetInstantiationError(presetExercise.exerciseName);
      const recommendation = recommendedReps(exercise.name);
      return {
        id: makeId(),
        exerciseId: exercise.id,
        order: i,
        targetSets: presetExercise.numberOfSets,
        targetRepsMin: recommendation?.min ?? null,
        targetRepsMax: recommendation?.max ?? null,
      };
    });
    return { id: makeId(), name: presetDay.name, order: dayIndex, planExercises };
  });

  const plan = {
    id: makeId(),
    name: planName.trim() || preset.name,
    createdAt: new Date().toISOString(),
    days,
  };

  const plans = loadPlans();
  plans.push(plan);
  savePlans(plans);
  return plan;
}
