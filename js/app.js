import { registerRoute, navigate } from "./router.js";
import { seedExercisesIfNeeded } from "./services/exerciseSeeder.js";
import { renderPlans } from "./views/plans.js";
import { renderExercises } from "./views/exercises.js";
import { renderProgress } from "./views/progress.js";
import { renderMore } from "./views/more.js";
import { migratePlanNotesToExercises } from "./services/exerciseService.js";

seedExercisesIfNeeded();
// Notizen je Plan-Übung (frühere Version) in die Notiz der Übung überführen.
migratePlanNotesToExercises();

// Bittet das Gerät, den Speicher dauerhaft zu behalten (schützt vor automatischem Aufräumen).
navigator.storage?.persist?.().catch(() => {});

registerRoute("plans", renderPlans);
registerRoute("exercises", renderExercises);
registerRoute("progress", renderProgress);
registerRoute("more", renderMore);

const initialRoute = location.hash.replace("#", "") || "plans";
navigate(initialRoute);

function showUpdateBanner() {
  if (document.getElementById("update-banner")) return;
  const banner = document.createElement("div");
  banner.id = "update-banner";
  banner.className = "update-banner";
  banner.innerHTML = `<span>Neue Version verfügbar</span><button class="btn-primary" type="button">Neu laden</button>`;
  banner.querySelector("button").addEventListener("click", () => location.reload());
  document.body.appendChild(banner);
}

if ("serviceWorker" in navigator) {
  // Ein Wechsel des aktiven Service Workers nach dem Start bedeutet: eine neue App-Version
  // wurde geladen. Beim allerersten Installieren (kein vorheriger Worker) kein Hinweis.
  const hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (hadController) showUpdateBanner();
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch((err) => {
      console.error("Service worker registration failed", err);
    });
  });
}
