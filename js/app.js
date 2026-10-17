import { registerRoute, navigate } from "./router.js";
import { seedExercisesIfNeeded } from "./services/exerciseSeeder.js";
import { renderPlans } from "./views/plans.js";
import { renderExercises } from "./views/exercises.js";
import { renderProgress } from "./views/progress.js";

seedExercisesIfNeeded();

registerRoute("plans", renderPlans);
registerRoute("exercises", renderExercises);
registerRoute("progress", renderProgress);

const initialRoute = location.hash.replace("#", "") || "plans";
navigate(initialRoute);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch((err) => {
      console.error("Service worker registration failed", err);
    });
  });
}
