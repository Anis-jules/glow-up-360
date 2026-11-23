import { addDays, timeToMinutes, WEEKDAYS, WEEKDAYS_SHORT, weekdayOf } from '@/lib/dates';
import { MODULE_ROUTES } from '@/lib/nav';
import { MODULE_LABELS } from '@/lib/progress';
import type { DateKey, ModuleKey, Reminder } from '@/lib/types';

export type ReminderModule = ModuleKey | 'general';

export const REMINDER_MODULES: { value: ReminderModule; label: string }[] = [
  { value: 'general', label: 'Général' },
  { value: 'habits', label: MODULE_LABELS.habits },
  { value: 'sport', label: MODULE_LABELS.sport },
  { value: 'nutrition', label: MODULE_LABELS.nutrition },
  { value: 'face', label: MODULE_LABELS.face },
  { value: 'mind', label: MODULE_LABELS.mind },
];

export function moduleLabel(m: ReminderModule): string {
  return REMINDER_MODULES.find((x) => x.value === m)?.label ?? 'Général';
}

export function moduleColor(m: ReminderModule): string {
  return m === 'general' ? 'var(--accent)' : `var(--c-${m})`;
}

/** Route interne ouverte par un rappel. */
export function reminderRoute(m: ReminderModule): string {
  return m === 'general' ? '/statistiques' : MODULE_ROUTES[m];
}

/** « Tous les jours », « En semaine », « Le week-end », « Lun, Mer, Ven ». */
export function daysSummary(days: number[]): string {
  const s = [...days].sort();
  if (s.length === 7) return 'Tous les jours';
  if (s.length === 0) return 'Aucun jour';
  if (s.join() === '0,1,2,3,4') return 'En semaine';
  if (s.join() === '5,6') return 'Le week-end';
  if (s.length === 1) return `Chaque ${WEEKDAYS[s[0]].toLowerCase()}`;
  return s.map((d) => WEEKDAYS_SHORT[d]).join(', ');
}

export function isQuotidien(days: number[]): boolean {
  return days.length === 7;
}

/** Prochaine occurrence : « aujourd'hui à 18:00 », « demain à 07:00 », « jeudi à 18:00 ». */
export function nextOccurrence(r: Reminder, today: DateKey, nowMin: number): string | null {
  if (!r.enabled || !r.days.length) return null;
  const t = timeToMinutes(r.time);
  for (let i = 0; i < 8; i++) {
    const k = addDays(today, i);
    if (!r.days.includes(weekdayOf(k))) continue;
    if (i === 0 && t <= nowMin) continue;
    const when = i === 0 ? 'aujourd’hui' : i === 1 ? 'demain' : WEEKDAYS[weekdayOf(k)].toLowerCase();
    return `${when} à ${r.time}`;
  }
  return null;
}

export function sortByTime(list: Reminder[]): Reminder[] {
  return [...list].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time) || a.title.localeCompare(b.title));
}
