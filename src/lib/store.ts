// Magasin unique de l'application.
// - Une seule action générique `update(fn)` : on modifie un brouillon (immer), tout est sauvegardé automatiquement.
// - Persistance dans le localStorage du navigateur (clé « glowup360 »).
// - Après chaque modification, la journée en cours est photographiée dans l'historique.

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { createDefaultData, DATA_VERSION, defaultHabits, upperBodyExercises } from './defaults';
import { todayKey } from './dates';
import { computeDaySummary } from './progress';
import type { AppData } from './types';

export const STORAGE_KEY = 'glowup360';

interface AppStore {
  data: AppData;
  /** Horodatage de la dernière sauvegarde (affiché dans l'interface). */
  savedAt: number;
  /** Modifie les données. La fonction reçoit un brouillon qu'on peut muter librement. */
  update: (fn: (d: AppData) => void) => void;
  /** Remplace toutes les données (import, restauration). */
  replaceAll: (d: AppData) => void;
}

/**
 * Complète des données potentiellement anciennes ou partielles avec les valeurs par défaut,
 * sans jamais écraser ce qui existe. Sert au chargement et à l'import d'une sauvegarde.
 */
export function normalizeData(input: unknown): AppData {
  const base = createDefaultData();
  if (!input || typeof input !== 'object') return base;
  const raw = input as Partial<AppData>;
  const out: AppData = {
    ...base,
    ...raw,
    version: DATA_VERSION,
    settings: { ...base.settings, ...(raw.settings ?? {}) },
    sport: { ...base.sport, ...(raw.sport ?? {}) },
    nutrition: { ...base.nutrition, ...(raw.nutrition ?? {}) },
    face: { ...base.face, ...(raw.face ?? {}) },
    mind: { ...base.mind, ...(raw.mind ?? {}) },
    habits: { ...base.habits, ...(raw.habits ?? {}) },
    reminders: { ...base.reminders, ...(raw.reminders ?? {}) },
    history: { ...(raw.history ?? {}) },
  };
  out.settings.moduleColors = { ...base.settings.moduleColors, ...(raw.settings?.moduleColors ?? {}) };
  out.settings.modulesInProgress = { ...base.settings.modulesInProgress, ...(raw.settings?.modulesInProgress ?? {}) };
  // Cartes du tableau de bord : garder l'ordre de l'utilisateur, ajouter les nouvelles.
  const cards = Array.isArray(raw.settings?.dashboardCards) ? raw.settings!.dashboardCards : base.settings.dashboardCards;
  const known = new Set(cards.map((c) => c.id));
  out.settings.dashboardCards = [...cards, ...base.settings.dashboardCards.filter((c) => !known.has(c.id))];
  out.sport.progression = { ...base.sport.progression, ...(raw.sport?.progression ?? {}) };
  out.nutrition.water = { ...base.nutrition.water, ...(raw.nutrition?.water ?? {}) };
  if (!Array.isArray(out.sport.week) || out.sport.week.length !== 7) out.sport.week = base.sport.week;
  if (!Array.isArray(out.nutrition.plan) || out.nutrition.plan.length !== 7) out.nutrition.plan = base.nutrition.plan;
  if ((raw.version ?? 1) < 2) migrateToV2(out);
  if ((raw.version ?? 1) < 3) migrateToV3(out);
  return out;
}

/**
 * Version 3 : la séance « Haut du corps » devient pompes basiques 3 × 10, gainage 2 × 1 min,
 * pompes diamant 1 × 10 et pompes épaules 1 × 10. Les notes personnelles et les exercices ajoutés
 * par l'utilisateur sont conservés ; seul le journal d'aujourd'hui est remis en cohérence.
 */
function migrateToV3(d: AppData) {
  const w = d.sport.workouts.find((x) => x.id === 'w-upper');
  if (!w) return;
  const notes = new Map(w.exercises.map((e) => [e.id, e.notes]));
  const own = w.exercises.filter((e) => !e.id.startsWith('w-upper-'));
  w.exercises = [...upperBodyExercises().map((e) => ({ ...e, notes: notes.get(e.id) ?? '' })), ...own];
  const entry = d.sport.log[todayKey()];
  if (entry?.workoutId === 'w-upper') {
    const ids = new Set([...w.exercises, ...(entry.extras ?? [])].map((e) => e.id));
    entry.done = entry.done.filter((id) => ids.has(id));
    entry.total = [...w.exercises, ...(entry.extras ?? [])].filter((e) => !e.optional).length;
  }
}

/**
 * Version 2 : retire « Au lit avant 23 h » et « Noter 3 choses positives », ajoute « Séance de sport »
 * et « Ajouter 5 mots en anglais avec traduction ». L'historique des jours passés n'est pas modifié.
 */
function migrateToV2(d: AppData) {
  d.habits.items = d.habits.items.filter((h) => h.id !== 'h-sleep' && h.id !== 'h-gratitude');
  const defaults = defaultHabits().items;
  for (const id of ['h-sport', 'h-english']) {
    if (d.habits.items.some((h) => h.id === id)) continue;
    const pos = defaults.findIndex((h) => h.id === id);
    // Placer la nouvelle habitude juste après celle qui la précède dans le programme d'origine.
    const prevId = defaults[pos - 1]?.id;
    const at = d.habits.items.findIndex((h) => h.id === prevId);
    d.habits.items.splice(at >= 0 ? at + 1 : d.habits.items.length, 0, defaults[pos]);
  }
}

/** Vérifie qu'un objet ressemble à une sauvegarde Glow Up 360°. */
export function looksLikeAppData(input: unknown): input is AppData {
  if (!input || typeof input !== 'object') return false;
  const o = input as Record<string, unknown>;
  return ['settings', 'sport', 'nutrition', 'face', 'mind', 'habits'].every((k) => typeof o[k] === 'object' && o[k] !== null);
}

export const useApp = create<AppStore>()(
  persist(
    immer((set) => ({
      data: createDefaultData(),
      savedAt: Date.now(),
      update: (fn) =>
        set((s) => {
          fn(s.data);
          const today = todayKey();
          s.data.history[today] = computeDaySummary(s.data as AppData, today);
          s.savedAt = Date.now();
        }),
      replaceAll: (d) =>
        set((s) => {
          s.data = normalizeData(d);
          s.savedAt = Date.now();
        }),
    })),
    {
      name: STORAGE_KEY,
      version: DATA_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ data: s.data, savedAt: s.savedAt }),
      merge: (persisted, current) => {
        const p = persisted as Partial<AppStore> | undefined;
        return { ...current, savedAt: p?.savedAt ?? current.savedAt, data: normalizeData(p?.data) };
      },
      migrate: (persisted) => persisted as AppStore,
    },
  ),
);

/** Raccourcis. */
export const useData = () => useApp((s) => s.data);
export const useUpdate = () => useApp((s) => s.update);
export const useSettings = () => useApp((s) => s.data.settings);
