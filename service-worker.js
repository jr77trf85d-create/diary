const CACHE_NAME = "diary-cache-v7";
const CORE_ASSETS = [
  "./",
  "index.html",
  "manifest.json",
  "styles/theme.css",
  "js/app.js",
  "js/router.js",
  "js/storage.js",
  "js/data/muscleGroups.js",
  "js/data/exerciseSeed.js",
  "js/data/presets.js",
  "js/data/repRanges.js",
  "js/services/exerciseSeeder.js",
  "js/services/exerciseFilter.js",
  "js/services/planService.js",
  "js/services/sessionService.js",
  "js/services/alternativeService.js",
  "js/services/presetInstantiationService.js",
  "js/services/exerciseProgressService.js",
  "js/services/exerciseService.js",
  "js/services/backupService.js",
  "js/ui/modal.js",
  "js/ui/charts.js",
  "js/views/plans.js",
  "js/views/exercises.js",
  "js/views/exercisePicker.js",
  "js/views/alternativePicker.js",
  "js/views/activeSession.js",
  "js/views/progress.js",
  "js/views/more.js",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  // cache: "reload" holt die Dateien wirklich neu vom Server statt aus dem HTTP-Cache des
  // Browsers (GitHub Pages cached ca. 10 Minuten) - sonst landet beim Update eine veraltete
  // Version im Offline-Speicher.
  const requests = CORE_ASSETS.map((url) => new Request(url, { cache: "reload" }));
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(requests)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const networkFetch = fetch(event.request, { cache: "no-cache" })
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
