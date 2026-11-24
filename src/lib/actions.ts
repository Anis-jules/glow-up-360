// Actions de suivi quotidien partagées (tableau de bord, habitudes).
// À appeler à l'intérieur d'un update((d) => …).

import { startOfWeek, todayKey } from './dates';
import { getDayExercises, getWorkoutForDate, snapshotDay } from './progress';
import type { AppData, DateKey, FaceSlot, ID } from './types';

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
  const requiredIds = getDayExercises(d.sport, key).filter((e) => !e.optional).map((e) => e.id);
  const required = requiredIds.length;
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

/** Fixe la quantité d'eau bue ce jour-là (ml). */
export function setWater(d: AppData, key: DateKey, ml: number) {
  d.nutrition.water.log[key] = Math.max(0, Math.round(ml));
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

/** Coche un exercice du visage (matin ou soir) pour la journée. */
export function toggleFaceTraining(d: AppData, key: DateKey, slot: FaceSlot, value?: boolean) {
  const list = d.sport.faceTraining.log[key] ?? [];
  const has = list.includes(slot);
  const next = value ?? !has;
  d.sport.faceTraining.log[key] = next ? (has ? list : [...list, slot]) : list.filter((s) => s !== slot);
  touch(d, key);
}

/** Soin hebdomadaire : fait (ou non) pour la semaine de cette date. */
export function isWeeklyDone(d: AppData, key: DateKey, careId: ID): boolean {
  const care = d.face.weekly.find((c) => c.id === careId);
  return !!care?.log[startOfWeek(key)];
}

export function toggleWeekly(d: AppData, key: DateKey, careId: ID, value?: boolean) {
  const care = d.face.weekly.find((c) => c.id === careId);
  if (!care) return;
  const week = startOfWeek(key);
  const next = value ?? !care.log[week];
  if (next) care.log[week] = key;
  else delete care.log[week];
}
