// Mots d'anglais du jour. À appeler dans un update((d) => …).

import { todayKey } from './dates';
import { snapshotDay } from './progress';
import type { AppData, DateKey, EnglishWord, ID } from './types';
import { uid } from './utils';

/** Habitude cochée automatiquement quand l'objectif de mots du jour est atteint. */
export const ENGLISH_HABIT_ID = 'h-english';

export function wordsOn(data: AppData, key: DateKey): EnglishWord[] {
  return data.english.words.filter((w) => w.date === key);
}

/** Coche ou décoche l'habitude « 5 mots en anglais » selon le nombre de mots notés ce jour-là. */
export function syncEnglishHabit(d: AppData, key: DateKey) {
  if (!d.habits.items.some((h) => h.id === ENGLISH_HABIT_ID)) return;
  const reached = wordsOn(d, key).length >= Math.max(1, d.english.dailyGoal);
  const list = d.habits.log[key] ?? [];
  const has = list.includes(ENGLISH_HABIT_ID);
  if (reached && !has) d.habits.log[key] = [...list, ENGLISH_HABIT_ID];
  if (!reached && has) d.habits.log[key] = list.filter((id) => id !== ENGLISH_HABIT_ID);
  if (key !== todayKey()) snapshotDay(d, key);
}

export function addWord(
  d: AppData,
  key: DateKey,
  en: string,
  fr: string,
  extra: { note?: string; source?: 'business'; theme?: string } = {},
): ID | null {
  const e = en.trim();
  const f = fr.trim();
  if (!e) return null;
  const id = uid('w');
  d.english.words.push({ id, en: e, fr: f, date: key, note: extra.note ?? '', ...(extra.source ? { source: extra.source } : {}), ...(extra.theme ? { theme: extra.theme } : {}) });
  syncEnglishHabit(d, key);
  return id;
}

/** Ajoute ou retire un verbe irrégulier de mes révisions (il entre alors dans le quiz). */
export function toggleVerb(d: AppData, base: string, key: DateKey, on: boolean) {
  const has = d.english.verbs.some((v) => v.id === base);
  if (on && !has) d.english.verbs.push({ id: base, date: key });
  if (!on && has) d.english.verbs = d.english.verbs.filter((v) => v.id !== base);
}

/** Marque un point de conjugaison comme étudié (il entre alors dans le quiz). */
export function toggleTense(d: AppData, id: string, key: DateKey, on: boolean) {
  const has = d.english.tenses.some((t) => t.id === id);
  if (on && !has) d.english.tenses.push({ id, date: key });
  if (!on && has) d.english.tenses = d.english.tenses.filter((t) => t.id !== id);
}

export function removeWord(d: AppData, id: ID) {
  const w = d.english.words.find((x) => x.id === id);
  if (!w) return;
  d.english.words = d.english.words.filter((x) => x.id !== id);
  syncEnglishHabit(d, w.date);
}

/** Modifie un mot ; si sa date change, les deux journées sont recalculées. */
export function editWord(d: AppData, id: ID, patch: Partial<Omit<EnglishWord, 'id'>>) {
  const w = d.english.words.find((x) => x.id === id);
  if (!w) return;
  const before = w.date;
  Object.assign(w, patch);
  syncEnglishHabit(d, w.date);
  if (before !== w.date) syncEnglishHabit(d, before);
}
