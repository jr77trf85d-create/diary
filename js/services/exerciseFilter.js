export function filterExercises(exercises, searchText, muscleGroup) {
  const trimmed = (searchText ?? "").trim().toLowerCase();
  return exercises.filter((exercise) => {
    const matchesGroup = !muscleGroup || exercise.muscleGroup === muscleGroup;
    const matchesSearch = trimmed === "" || exercise.name.toLowerCase().includes(trimmed);
    return matchesGroup && matchesSearch;
  });
}
