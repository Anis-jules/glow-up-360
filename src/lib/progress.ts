// Calculs de progression : séance du jour, progression sur 30 jours, pourcentage quotidien, séries.

import { addDays, daysBetween, startOfWeek, todayKey, weekdayOf } from './dates';
import type {
  AppData,
  DateKey,
  DaySummary,
  Exercise,
  ModuleKey,
  ProgressionPhase,
  SportState,
  Workout,
} from './types';

export const MODULE_KEYS: ModuleKey[] = ['habits', 'sport', 'nutrition', 'face', 'mind'];

export const MODULE_LABELS: Record<ModuleKey, string> = {
  habits: 'Habitudes',
  sport: 'Sport',
  nutrition: 'Nutrition',
  face: 'Visage',
  mind: 'Esprit',
};

// ───────────────────────── Sport

/** Séance du jour : celle choisie pour cette date si l'utilisateur l'a changée, sinon celle du planning. */
export function getWorkoutForDate(sport: SportState, key: DateKey): Workout | null {
  const id = sport.log[key]?.workoutId ?? sport.week[weekdayOf(key)] ?? null;
  return id ? sport.workouts.find((w) => w.id === id) ?? null : null;
}

export interface ProgressionInfo {
  /** Jour du programme (1 = premier jour), null si pas encore commencé. */
  day: number | null;
  phase: ProgressionPhase | null;
  finished: boolean;
  length: number;
}

export function getProgressionInfo(sport: SportState, key: DateKey): ProgressionInfo {
  const { enabled, startDate, phases, lengthDays } = sport.progression;
  const length = lengthDays || 30;
  if (!enabled) return { day: null, phase: null, finished: false, length };
  const day = daysBetween(startDate, key) + 1;
  if (day < 1) return { day: null, phase: null, finished: false, length };
  if (day > length) return { day, phase: null, finished: true, length };
  const phase = phases.find((p) => day >= p.fromDay && day <= p.toDay) ?? null;
  return { day, phase, finished: false, length };
}

/** Valeurs effectives d'un exercice après application de la phase en cours. */
export function applyProgression(ex: Exercise, phase: ProgressionPhase | null): Exercise {
  if (!phase || !ex.progressive) return ex;
  const out = { ...ex };
  if (ex.kind === 'reps') {
    out.reps = Math.max(1, ex.reps + phase.repsDelta);
    out.sets = Math.max(1, ex.sets + phase.setsDelta);
  } else if (ex.kind === 'time') {
    out.durationSec = Math.max(5, ex.durationSec + phase.timeDeltaSec);
    out.sets = Math.max(1, ex.sets + phase.setsDelta);
  } else if (ex.kind === 'interval') {
    out.workSec = Math.max(15, ex.workSec + phase.workDeltaSec);
    out.recoverSec = Math.max(30, ex.recoverSec + phase.recoverDeltaSec);
  }
  return out;
}

/** Exercices de la séance du jour avec la progression appliquée. */
export function getEffectiveExercises(sport: SportState, key: DateKey): Exercise[] {
  const w = getWorkoutForDate(sport, key);
  if (!w) return [];
  const { phase } = getProgressionInfo(sport, key);
  return w.exercises.map((e) => applyProgression(e, phase));
}

// ───────────────────────── Progression quotidienne

export type ModuleFractions = Partial<Record<ModuleKey, number>>;

/** Avancement de chaque rubrique (0 à 1) ; une rubrique sans rien de prévu ce jour-là est absente. */
export function moduleFractions(data: AppData, key: DateKey): ModuleFractions {
  const out: ModuleFractions = {};
  const wd = weekdayOf(key);

  // Habitudes
  const scheduled = data.habits.items.filter((h) => !h.archived && h.days.includes(wd));
  if (scheduled.length) {
    const done = new Set(data.habits.log[key] ?? []);
    out.habits = scheduled.filter((h) => done.has(h.id)).length / scheduled.length;
  }

  // Sport
  const workout = getWorkoutForDate(data.sport, key);
  if (workout) {
    const required = workout.exercises.filter((e) => !e.optional);
    if (required.length) {
      const done = new Set(data.sport.log[key]?.done ?? []);
      out.sport = required.filter((e) => done.has(e.id)).length / required.length;
    }
  }

  // Nutrition : moitié repas suivis, moitié hydratation
  const { slots, mealLog, water } = data.nutrition;
  const waterFrac = water.goalMl > 0 ? Math.min(1, (water.log[key] ?? 0) / water.goalMl) : null;
  const meals = mealLog[key] ?? {};
  const mealFrac = slots.length ? slots.filter((s) => meals[s.id]?.done).length / slots.length : null;
  const parts = [mealFrac, waterFrac].filter((v): v is number => v !== null);
  if (parts.length) out.nutrition = parts.reduce((a, b) => a + b, 0) / parts.length;

  // Visage : étapes obligatoires des routines
  const steps = data.face.routines.flatMap((r) => r.steps).filter((s) => !s.optional);
  if (steps.length) {
    const done = new Set(data.face.log[key]?.done ?? []);
    out.face = steps.filter((s) => done.has(s.id)).length / steps.length;
  }

  // Esprit : chaque objectif plafonné à 100 %
  const goals = data.mind.goals.filter((g) => g.minutes > 0);
  if (goals.length) {
    const log = data.mind.log[key] ?? {};
    out.mind = goals.reduce((acc, g) => acc + Math.min(1, (log[g.id] ?? 0) / g.minutes), 0) / goals.length;
  }

  for (const k of MODULE_KEYS) if (!data.settings.modulesInProgress[k]) delete out[k];
  return out;
}

export function computeDaySummary(data: AppData, key: DateKey): DaySummary {
  const modules = moduleFractions(data, key);
  const values = Object.values(modules);
  const pct = values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) : 0;
  return { pct, modules };
}

/** Résumé d'une journée : calculé en direct pour aujourd'hui, photographié pour les jours passés. */
export function getDaySummary(data: AppData, key: DateKey, today: DateKey = todayKey()): DaySummary {
  if (key >= today) return computeDaySummary(data, key);
  return data.history[key] ?? computeDaySummary(data, key);
}

/** À appeler dans un update quand on modifie une journée passée. */
export function snapshotDay(data: AppData, key: DateKey): void {
  data.history[key] = computeDaySummary(data, key);
}

// ───────────────────────── Séries

export interface StreakInfo {
  current: number;
  best: number;
  /** Total de journées réussies depuis le début : il ne diminue jamais. */
  totalSuccess: number;
  /** Jokers utilisés cette semaine. */
  jokersUsedThisWeek: number;
  todayDone: boolean;
}

/**
 * Série flexible : une journée sous le seuil peut être couverte par un joker (N par semaine).
 * Une journée pas encore terminée (aujourd'hui) ne casse jamais la série.
 */
export function computeStreaks(data: AppData, today: DateKey = todayKey()): StreakInfo {
  const threshold = data.settings.completionThreshold;
  const jokers = Math.max(0, data.settings.jokersPerWeek);
  const start = data.createdAt < today ? data.createdAt : today;
  const total = daysBetween(start, today) + 1;
  const success = (k: DateKey) => getDaySummary(data, k, today).pct >= threshold;

  // Parcours chronologique pour la meilleure série et le total.
  let best = 0;
  let run = 0;
  let totalSuccess = 0;
  const jokerUsage = new Map<DateKey, number>();
  for (let i = 0; i < total; i++) {
    const k = addDays(start, i);
    if (k === today && !success(k)) break;
    const week = startOfWeek(k);
    if (success(k)) {
      run += 1;
      totalSuccess += 1;
    } else if (run > 0 && (jokerUsage.get(week) ?? 0) < jokers) {
      jokerUsage.set(week, (jokerUsage.get(week) ?? 0) + 1);
    } else {
      run = 0;
    }
    best = Math.max(best, run);
  }

  // Série actuelle : en remontant depuis hier (ou aujourd'hui s'il est déjà réussi).
  const todayDone = success(today);
  let current = todayDone ? 1 : 0;
  const usage = new Map<DateKey, number>();
  for (let k = addDays(today, -1); k >= start; k = addDays(k, -1)) {
    const week = startOfWeek(k);
    if (success(k)) {
      current += 1;
    } else if ((usage.get(week) ?? 0) < jokers) {
      usage.set(week, (usage.get(week) ?? 0) + 1);
    } else {
      break;
    }
  }
  best = Math.max(best, current);

  return {
    current,
    best,
    totalSuccess,
    jokersUsedThisWeek: usage.get(startOfWeek(today)) ?? 0,
    todayDone,
  };
}

/** Message de motivation du jour, personnalisé. */
export function motivationFor(data: AppData, key: DateKey, offset = 0): string {
  const list = data.settings.motivations.filter((m) => m.trim());
  if (!list.length) return '';
  const seed = daysBetween('2026-01-01', key) + offset;
  const msg = list[((seed % list.length) + list.length) % list.length];
  const name = data.settings.name.trim();
  return msg
    .replace(/(,?)\s*\{name\}/g, (_m, comma: string) => (name ? `${comma} ${name}` : ''))
    .replace(/\s+([.!?,])/g, '$1')
    .trim();
}
