import { EXERCISE_SEED } from "../data/exerciseSeed.js";
import { loadExercises, saveExercises, makeId } from "../storage.js";

// Legt jede Standardübung an, die noch nicht (per Name) existiert, und korrigiert bei
// bereits vorhandenen Standardübungen die Muskelgruppe. Nie "ist die Liste leer" prüfen -
// sonst bekommen Nutzer mit bereits vorhandenen Übungen später hinzugefügte Standardübungen
// nie nachgeliefert (siehe gleicher Bug in der früheren nativen App).
export function seedExercisesIfNeeded() {
  const existing = loadExercises();
  const byName = new Map(existing.map((e) => [e.name, e]));

  for (const def of EXERCISE_SEED) {
    const current = byName.get(def.name);
    if (current) {
      current.muscleGroup = def.muscleGroup;
    } else {
      const created = {
        id: makeId(),
        name: def.name,
        instructions: def.instructions,
        muscleFeedback: def.muscleFeedback,
        muscleGroup: def.muscleGroup,
      };
      existing.push(created);
      byName.set(created.name, created);
    }
  }

  saveExercises(existing);
  return existing;
}
