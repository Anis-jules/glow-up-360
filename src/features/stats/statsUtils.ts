import { addDays, fromKey, toKey, weekdayOf } from '@/lib/dates';
import { getWorkoutForDate } from '@/lib/progress';
import type { AppData, DateKey } from '@/lib/types';

export function monthStart(key: DateKey): DateKey {
  return `${key.slice(0, 7)}-01`;
}

export function addMonths(key: DateKey, n: number): DateKey {
  const d = fromKey(monthStart(key));
  d.setMonth(d.getMonth() + n);
  return toKey(d);
}

/** Toutes les dates du mois contenant `key`. */
export function monthDates(key: DateKey): DateKey[] {
  const start = monthStart(key);
  const out: DateKey[] = [];
  for (let k = start; k.slice(0, 7) === start.slice(0, 7); k = addDays(k, 1)) out.push(k);
  return out;
}

/** Habitudes prévues et cochées sur un ensemble de jours (avec la liste actuelle d'habitudes). */
export function habitsStats(data: AppData, days: DateKey[]): { done: number; total: number } {
  let done = 0;
  let total = 0;
  for (const k of days) {
    const wd = weekdayOf(k);
    const scheduled = data.habits.items.filter((h) => !h.archived && h.days.includes(wd));
    const log = new Set(data.habits.log[k] ?? []);
    total += scheduled.length;
    done += scheduled.filter((h) => log.has(h.id)).length;
  }
  return { done, total };
}

/** Séance du jour entièrement réalisée (tous les exercices obligatoires validés). */
export function isSessionComplete(data: AppData, key: DateKey): boolean {
  const entry = data.sport.log[key];
  if (!entry) return false;
  const w = data.sport.workouts.find((x) => x.id === entry.workoutId);
  if (w) {
    const required = [...w.exercises, ...(entry.extras ?? [])].filter((e) => !e.optional).map((e) => e.id);
    if (!required.length) return entry.done.length > 0;
    return required.every((id) => entry.done.includes(id));
  }
  return entry.total > 0 ? entry.done.length >= entry.total : entry.done.length > 0;
}

/** Une séance avec au moins un exercice obligatoire était prévue ce jour-là. */
export function isSessionPlanned(data: AppData, key: DateKey): boolean {
  const w = getWorkoutForDate(data.sport, key);
  return !!w && w.exercises.some((e) => !e.optional);
}

export function sportStats(data: AppData, days: DateKey[]): { completed: number; planned: number } {
  let completed = 0;
  let planned = 0;
  for (const k of days) {
    if (isSessionPlanned(data, k)) planned += 1;
    if (isSessionComplete(data, k)) completed += 1;
  }
  return { completed, planned: Math.max(planned, completed) };
}

/** Objectif de lecture : « g-read » s'il existe, sinon le premier objectif. */
export function readingGoal(data: AppData) {
  return data.mind.goals.find((g) => g.id === 'g-read') ?? data.mind.goals[0] ?? null;
}

export function mindMinutes(data: AppData, key: DateKey): number {
  return Object.values(data.mind.log[key] ?? {}).reduce((a, b) => a + (b || 0), 0);
}

export function goalMinutes(data: AppData, key: DateKey, goalId: string): number {
  return data.mind.log[key]?.[goalId] ?? 0;
}

export function sum(list: number[]): number {
  return list.reduce((a, b) => a + b, 0);
}

export function pctOf(done: number, total: number): number {
  return total > 0 ? Math.round((done / total) * 100) : 0;
}
