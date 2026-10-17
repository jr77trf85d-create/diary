import { loadExercises, loadSessions } from "../storage.js";
import { showExerciseDetail, escapeHtml } from "./exercises.js";

export function renderProgress(container, setTitle) {
  setTitle("Verlauf", null);

  const exercises = loadExercises();
  const exerciseById = new Map(exercises.map((e) => [e.id, e]));
  const lastTrainedAt = new Map();

  for (const session of loadSessions()) {
    for (const pe of session.performedExercises) {
      const hasData = pe.sets.some((s) => s.weight != null || s.reps != null);
      if (!hasData) continue;
      const current = lastTrainedAt.get(pe.exerciseId);
      if (!current || new Date(session.date) > new Date(current)) {
        lastTrainedAt.set(pe.exerciseId, session.date);
      }
    }
  }

  const trained = Array.from(lastTrainedAt.entries())
    .map(([exerciseId, date]) => ({ exercise: exerciseById.get(exerciseId), date }))
    .filter((e) => e.exercise)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  if (trained.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <div style="font-size:40px;">📈</div>
        <h3>Noch kein Trainingsverlauf</h3>
        <p>Sobald du eine Trainingseinheit abgeschlossen hast, erscheinen hier deine Übungen mit Fortschritts-Charts.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = trained
    .map(
      ({ exercise, date }) => `
    <div class="list-row" data-exercise-id="${exercise.id}" style="cursor:pointer;">
      <div class="list-row-main" style="font-weight:600;">
        ${escapeHtml(exercise.name)}
        <div class="list-row-sub">Zuletzt trainiert: ${formatDate(date)}</div>
      </div>
      <span class="chevron">›</span>
    </div>
  `
    )
    .join("");

  container.querySelectorAll("[data-exercise-id]").forEach((row) => {
    row.addEventListener("click", () => {
      const exercise = exerciseById.get(row.dataset.exerciseId);
      if (exercise) showExerciseDetail(exercise);
    });
  });
}

function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}
