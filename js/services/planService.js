import { loadPlans, savePlans, loadExercises, makeId } from "../storage.js";
import { recommendedReps } from "../data/repRanges.js";

export function getPlans() {
  return loadPlans();
}

export function getPlan(planId) {
  return loadPlans().find((p) => p.id === planId) ?? null;
}

export function createPlan(name, intervalLength) {
  const plans = loadPlans();
  const days = Array.from({ length: intervalLength }, (_, i) => ({
    id: makeId(),
    name: `Tag ${i + 1}`,
    order: i,
    planExercises: [],
  }));
  const plan = {
    id: makeId(),
    name: name.trim() || "Neuer Trainingsplan",
    createdAt: new Date().toISOString(),
    days,
  };
  plans.push(plan);
  savePlans(plans);
  return plan;
}

export function deletePlan(planId) {
  const plans = loadPlans().filter((p) => p.id !== planId);
  savePlans(plans);
}

export function renamePlan(planId, newName) {
  const plans = loadPlans();
  const plan = plans.find((p) => p.id === planId);
  if (!plan) return;
  plan.name = newName.trim() || plan.name;
  savePlans(plans);
}

export function renameDay(planId, dayId, newName) {
  const plans = loadPlans();
  const day = findDay(plans, planId, dayId);
  if (!day) return;
  day.name = newName.trim() || day.name;
  savePlans(plans);
}

export function addExerciseToDay(planId, dayId, exerciseId) {
  const plans = loadPlans();
  const day = findDay(plans, planId, dayId);
  if (!day) return;
  // Wiederholungsziel mit der Empfehlung für Standardübungen vorbelegen (eigene Übungen: leer).
  const exercise = loadExercises().find((e) => e.id === exerciseId);
  const recommendation = exercise ? recommendedReps(exercise.name) : null;
  day.planExercises.push({
    id: makeId(),
    exerciseId,
    order: day.planExercises.length,
    targetSets: 3,
    targetRepsMin: recommendation?.min ?? null,
    targetRepsMax: recommendation?.max ?? null,
  });
  savePlans(plans);
}

export function removeExerciseFromDay(planId, dayId, planExerciseId) {
  const plans = loadPlans();
  const day = findDay(plans, planId, dayId);
  if (!day) return;
  day.planExercises = day.planExercises
    .filter((pe) => pe.id !== planExerciseId)
    .map((pe, i) => ({ ...pe, order: i }));
  savePlans(plans);
}

export function updateTargetSets(planId, dayId, planExerciseId, targetSets) {
  const plans = loadPlans();
  const day = findDay(plans, planId, dayId);
  if (!day) return;
  const planExercise = day.planExercises.find((pe) => pe.id === planExerciseId);
  if (!planExercise) return;
  planExercise.targetSets = Math.max(1, targetSets | 0);
  savePlans(plans);
}

function toRepNumber(value) {
  const n = Number(value);
  return value === null || value === undefined || value === "" || !Number.isFinite(n) || n < 1
    ? null
    : Math.round(n);
}

// Wiederholungsziel (Spanne) je Übung und Trainingstag. Vertauschte Grenzen werden korrigiert.
export function updateTargetReps(planId, dayId, planExerciseId, min, max) {
  const plans = loadPlans();
  const day = findDay(plans, planId, dayId);
  const planExercise = day?.planExercises.find((pe) => pe.id === planExerciseId);
  if (!planExercise) return;
  let lo = toRepNumber(min);
  let hi = toRepNumber(max);
  if (lo !== null && hi !== null && lo > hi) [lo, hi] = [hi, lo];
  planExercise.targetRepsMin = lo;
  planExercise.targetRepsMax = hi;
  savePlans(plans);
}

function findDay(plans, planId, dayId) {
  const plan = plans.find((p) => p.id === planId);
  return plan?.days.find((d) => d.id === dayId) ?? null;
}
