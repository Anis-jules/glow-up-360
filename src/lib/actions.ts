// Actions de suivi quotidien partagées (tableau de bord, habitudes).
// À appeler à l'intérieur d'un update((d) => …).

import { todayKey } from './dates';
import { getWorkoutForDate, snapshotDay } from './progress';
import type { AppData, DateKey, ID } from './types';

function touch(d: AppData, key: DateKey) {
  if (key !== todayKey()) snapshotDay(d, key);
}

function toggleIn(list: ID[], id: ID, value?: boolean): ID[] {
  const has = list.includes(id);
  const next = value ?? !has;
  if (next && !has) return [...list, id];
  if (!next && has) return list.filter((x) => x !== id);
  return list;
}

export function toggleHabit(d: AppData, key: DateKey, habitId: ID, value?: boolean) {
  d.habits.log[key] = toggleIn(d.habits.log[key] ?? [], habitId, value);
  touch(d, key);
}

export function toggleExercise(d: AppData, key: DateKey, exerciseId: ID, value?: boolean) {
  const workout = getWorkoutForDate(d.sport, key);
  if (!workout) return;
  const required = workout.exercises.filter((e) => !e.optional).length;
  const entry = (d.sport.log[key] ??= {
    workoutId: workout.id,
    workoutTitle: workout.title,
    done: [],
    total: required,
    note: '',
  });
  entry.total = required;
  entry.workoutTitle = workout.title;
  entry.done = toggleIn(entry.done, exerciseId, value);
  const requiredIds = workout.exercises.filter((e) => !e.optional).map((e) => e.id);
  if (requiredIds.length && requiredIds.every((id) => entry.done.includes(id))) entry.finishedAt ??= new Date().toISOString();
  else delete entry.finishedAt;
  touch(d, key);
}

export function toggleMeal(d: AppData, key: DateKey, slotId: ID, value?: boolean) {
  const day = (d.nutrition.mealLog[key] ??= {});
  const entry = (day[slotId] ??= { done: false, actual: '', note: '' });
  entry.done = value ?? !entry.done;
  touch(d, key);
}

export function addWater(d: AppData, key: DateKey, ml: number) {
  d.nutrition.water.log[key] = Math.max(0, (d.nutrition.water.log[key] ?? 0) + ml);
  touch(d, key);
}

export function toggleFaceStep(d: AppData, key: DateKey, stepId: ID, value?: boolean) {
  const entry = (d.face.log[key] ??= { done: [], note: '' });
  entry.done = toggleIn(entry.done, stepId, value);
  touch(d, key);
}

export function addMindMinutes(d: AppData, key: DateKey, goalId: ID, minutes: number) {
  const day = (d.mind.log[key] ??= {});
  day[goalId] = Math.max(0, (day[goalId] ?? 0) + minutes);
  touch(d, key);
}

export function setMindMinutes(d: AppData, key: DateKey, goalId: ID, minutes: number) {
  const day = (d.mind.log[key] ??= {});
  day[goalId] = Math.max(0, minutes);
  touch(d, key);
}
