const KEYS = {
  exercises: "diary.exercises",
  plans: "diary.plans",
  sessions: "diary.sessions",
};

export function makeId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return "id-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
}

function load(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadExercises() {
  return load(KEYS.exercises);
}

export function saveExercises(exercises) {
  save(KEYS.exercises, exercises);
}

export function loadPlans() {
  return load(KEYS.plans);
}

export function savePlans(plans) {
  save(KEYS.plans, plans);
}

export function loadSessions() {
  return load(KEYS.sessions);
}

export function saveSessions(sessions) {
  save(KEYS.sessions, sessions);
}
