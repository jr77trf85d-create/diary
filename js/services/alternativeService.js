import { loadExercises, saveExercises, makeId } from "../storage.js";

export function getAlternatives(exerciseId) {
  const exercises = loadExercises();
  const exercise = exercises.find((e) => e.id === exerciseId);
  const ids = exercise?.alternatives ?? [];
  return exercises.filter((e) => ids.includes(e.id));
}

// Bidirektional: wenn A eine Alternative zu B ist, gilt das auch umgekehrt.
export function addAlternative(exerciseId, candidateId) {
  const exercises = loadExercises();
  const exercise = exercises.find((e) => e.id === exerciseId);
  const candidate = exercises.find((e) => e.id === candidateId);
  if (!exercise || !candidate || exercise.id === candidate.id) return;

  exercise.alternatives = exercise.alternatives ?? [];
  candidate.alternatives = candidate.alternatives ?? [];
  if (!exercise.alternatives.includes(candidate.id)) exercise.alternatives.push(candidate.id);
  if (!candidate.alternatives.includes(exercise.id)) candidate.alternatives.push(exercise.id);

  saveExercises(exercises);
}

export function createAlternative(name, forExerciseId) {
  const exercises = loadExercises();
  const forExercise = exercises.find((e) => e.id === forExerciseId);
  const created = {
    id: makeId(),
    name: name.trim(),
    instructions: "",
    muscleFeedback: "",
    muscleGroup: forExercise?.muscleGroup ?? "sonstige",
    alternatives: forExercise ? [forExercise.id] : [],
  };
  exercises.push(created);

  if (forExercise) {
    forExercise.alternatives = forExercise.alternatives ?? [];
    forExercise.alternatives.push(created.id);
  }

  saveExercises(exercises);
  return created;
}
