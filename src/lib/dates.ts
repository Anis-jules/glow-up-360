import { useEffect, useState } from 'react';
import type { DateKey, Weekday } from './types';

export const WEEKDAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'] as const;
export const WEEKDAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] as const;
export const WEEKDAYS_LETTER = ['L', 'M', 'M', 'J', 'V', 'S', 'D'] as const;
export const ALL_DAYS: Weekday[] = [0, 1, 2, 3, 4, 5, 6];

const pad = (n: number) => String(n).padStart(2, '0');

export function toKey(d: Date): DateKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromKey(key: DateKey): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function todayKey(): DateKey {
  return toKey(new Date());
}

export function addDays(key: DateKey, n: number): DateKey {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

/** Nombre de jours de a vers b (b - a). */
export function daysBetween(a: DateKey, b: DateKey): number {
  return Math.round((fromKey(b).getTime() - fromKey(a).getTime()) / 86_400_000);
}

export function weekdayOf(key: DateKey | Date): Weekday {
  const d = typeof key === 'string' ? fromKey(key) : key;
  return ((d.getDay() + 6) % 7) as Weekday;
}

/** Lundi de la semaine contenant la date. */
export function startOfWeek(key: DateKey): DateKey {
  return addDays(key, -weekdayOf(key));
}

/** Les 7 dates (lundi → dimanche) de la semaine contenant la date. */
export function weekDates(key: DateKey): DateKey[] {
  const start = startOfWeek(key);
  return ALL_DAYS.map((i) => addDays(start, i));
}

/** Les n dernières dates jusqu'à `end` incluse, de la plus ancienne à la plus récente. */
export function lastNDays(end: DateKey, n: number): DateKey[] {
  return Array.from({ length: n }, (_, i) => addDays(end, i - n + 1));
}

const longFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const longYearFmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
const shortFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
const monthFmt = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' });

/** « lundi 23 novembre » */
export function formatLong(key: DateKey, withYear = false): string {
  return (withYear ? longYearFmt : longFmt).format(fromKey(key));
}

/** « 23 nov. » */
export function formatShort(key: DateKey): string {
  return shortFmt.format(fromKey(key));
}

/** « novembre 2026 » */
export function formatMonth(key: DateKey): string {
  return monthFmt.format(fromKey(key));
}

/** « Aujourd'hui », « Hier » ou la date courte. */
export function formatRelative(key: DateKey, today: DateKey = todayKey()): string {
  const diff = daysBetween(key, today);
  if (diff === 0) return "Aujourd'hui";
  if (diff === 1) return 'Hier';
  if (diff === -1) return 'Demain';
  return formatLong(key);
}

/** Majuscule initiale. */
export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Minutes depuis minuit pour « HH:MM ». */
export function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function nowMinutes(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

/** « 90 » → « 1 min 30 », « 20 » → « 20 s », « 300 » → « 5 min ». */
export function formatDuration(sec: number): string {
  if (sec <= 0) return '0 s';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s} s`;
  if (s === 0) return `${m} min`;
  return `${m} min ${pad(s)}`;
}

/** « 75 » → « 1 h 15 », « 40 » → « 40 min » */
export function formatMinutes(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${pad(m)}`;
}

/** Chrono « 01:05 » */
export function formatClock(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}

/** Date du jour qui se met à jour toute seule à minuit si l'application reste ouverte. */
export function useToday(): DateKey {
  const [today, setToday] = useState(todayKey);
  useEffect(() => {
    const check = () => setToday((prev) => (prev === todayKey() ? prev : todayKey()));
    const id = window.setInterval(check, 30_000);
    document.addEventListener('visibilitychange', check);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', check);
    };
  }, []);
  return today;
}
