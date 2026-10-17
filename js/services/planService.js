import { loadPlans, savePlans, makeId } from "../storage.js";

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
  day.planExercises.push({
    id: makeId(),
    exerciseId,
    order: day.planExercises.length,
    targetSets: 3,
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

function findDay(plans, planId, dayId) {
  const plan = plans.find((p) => p.id === planId);
  return plan?.days.find((d) => d.id === dayId) ?? null;
}
