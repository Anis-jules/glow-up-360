// Moteur du quiz d'anglais.
// - Chaque semaine (lundi → dimanche) a son quiz, ouvert le samedi et le dimanche.
// - Il porte sur la TOTALITÉ de ce qui existe jusqu'au dimanche : mots notés (avec traduction),
//   verbes irréguliers ajoutés, points de conjugaison étudiés.
// - La semaine n'est validée qu'avec 100 % de bonnes réponses ; les essais sont illimités.
// - Tant que le quiz de la semaine passée n'est pas réussi, les nouvelles suggestions sont en pause.
// Les questions sont tirées avec une graine (semaine + numéro d'essai) : une tentative interrompue
// se reprend à l'identique.

import { addDays, startOfWeek, weekdayOf } from '@/lib/dates';
import type { AppData, DateKey, EnglishQuiz, EnglishState } from '@/lib/types';
import { BUSINESS_WORDS } from './content/business';
import { findTense } from './content/tenses';
import { findVerb, type IrregularVerb } from './content/verbs';

export type QuestionKind = 'word-en' | 'word-fr' | 'verb-past' | 'verb-pp' | 'grammar';

export interface Question {
  key: string;
  kind: QuestionKind;
  /** Consigne courte (« Traduis en français »…). */
  label: string;
  prompt: string;
  hint?: string;
  options: string[];
  answer: string;
}

// ───────────────────────── Hasard reproductible

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function seededRandom(seed: string): () => number {
  let a = hash(seed);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(list: T[], random: () => number): T[] {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const norm = (s: string) => s.trim().toLowerCase();

function unique(list: string[]): string[] {
  const seen = new Set<string>();
  return list.filter((x) => {
    const k = norm(x);
    if (!k || seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// ───────────────────────── Semaines

export const sundayOf = (week: DateKey) => addDays(week, 6);

/** Semaine dont le quiz est attendu : celle en cours le week-end, sinon la précédente. */
export function dueWeek(today: DateKey): DateKey {
  return weekdayOf(today) >= 5 ? startOfWeek(today) : addDays(startOfWeek(today), -7);
}

/** Tout ce qui entre dans le quiz jusqu'à une date (incluse). */
export function quizItems(e: EnglishState, until: DateKey): string[] {
  return [
    ...e.words.filter((w) => w.date <= until && w.en.trim() && w.fr.trim()).map((w) => `w:${w.id}`),
    ...e.verbs.filter((v) => v.date <= until && findVerb(v.id)).map((v) => `v:${v.id}`),
    ...e.tenses.filter((t) => t.date <= until && findTense(t.id)).map((t) => `t:${t.id}`),
  ];
}

export interface QuizStatus {
  week: DateKey;
  items: string[];
  record?: EnglishQuiz;
  passed: boolean;
  /** La semaine est finie et le quiz n'est pas réussi : les suggestions sont en pause. */
  overdue: boolean;
  /** Nombre de questions d'une tentative. */
  questionCount: number;
}

export function quizStatus(data: AppData, today: DateKey): QuizStatus | null {
  const week = dueWeek(today);
  const items = quizItems(data.english, sundayOf(week));
  if (!items.length) return null;
  const record = data.english.quizzes[week];
  const passed = !!record?.passedAt;
  return {
    week,
    items,
    record,
    passed,
    overdue: !passed && weekdayOf(today) < 5,
    questionCount: countQuestions(items),
  };
}

/** Un mot = 1 question, un verbe = 1, un point de conjugaison = 3. */
export function countQuestions(items: string[]): number {
  return items.reduce((n, k) => n + (k.startsWith('t:') ? 3 : 1), 0);
}

// ───────────────────────── Questions

function regularize(base: string): string {
  if (base.endsWith('e')) return `${base}d`;
  if (/[^aeiou]y$/.test(base)) return `${base.slice(0, -1)}ied`;
  return `${base}ed`;
}

function ingForm(base: string): string {
  if (base.endsWith('ie')) return `${base.slice(0, -2)}ying`;
  if (base.endsWith('e') && !base.endsWith('ee') && base !== 'be') return `${base.slice(0, -1)}ing`;
  return `${base}ing`;
}

function verbOptions(v: IrregularVerb, form: 'past' | 'participle', random: () => number): string[] {
  const answer = form === 'past' ? v.past : v.participle;
  const other = form === 'past' ? v.participle : v.past;
  const candidates = unique([other, regularize(v.base), v.base, ingForm(v.base), `${v.base}s`]).filter((x) => norm(x) !== norm(answer));
  return shuffle([answer, ...candidates.slice(0, 3)], random);
}

function pick(pool: string[], n: number, random: () => number): string[] {
  return shuffle(pool, random).slice(0, n);
}

export function buildQuestions(e: EnglishState, items: string[], seed: string): Question[] {
  const random = seededRandom(seed);
  const words = new Map(e.words.map((w) => [w.id, w]));
  const poolFr = unique([...e.words.map((w) => w.fr), ...BUSINESS_WORDS.map((b) => b.fr)]);
  const poolEn = unique([...e.words.map((w) => w.en), ...BUSINESS_WORDS.map((b) => b.en)]);
  const out: Question[] = [];

  for (const item of items) {
    const sep = item.indexOf(':');
    const kind = item.slice(0, sep);
    const id = item.slice(sep + 1);

    if (kind === 'w') {
      const w = words.get(id);
      if (!w) continue;
      const toFr = random() < 0.5;
      const answer = toFr ? w.fr : w.en;
      const pool = (toFr ? poolFr : poolEn).filter((x) => norm(x) !== norm(answer));
      out.push({
        key: `${item}:${toFr ? 'fr' : 'en'}`,
        kind: toFr ? 'word-en' : 'word-fr',
        label: toFr ? 'Traduis en français' : 'Traduis en anglais',
        prompt: toFr ? w.en : w.fr,
        options: shuffle([answer, ...pick(pool, 3, random)], random),
        answer,
      });
    } else if (kind === 'v') {
      const v = findVerb(id);
      if (!v) continue;
      const form = random() < 0.5 ? 'past' : 'participle';
      out.push({
        key: `${item}:${form}`,
        kind: form === 'past' ? 'verb-past' : 'verb-pp',
        label: form === 'past' ? 'Prétérit de' : 'Participe passé de',
        prompt: `to ${v.base}`,
        hint: v.fr,
        options: verbOptions(v, form, random),
        answer: form === 'past' ? v.past : v.participle,
      });
    } else if (kind === 't') {
      const t = findTense(id);
      if (!t) continue;
      const chosen = shuffle(
        t.questions.map((_, i) => i),
        random,
      ).slice(0, 3);
      for (const i of chosen) {
        const q = t.questions[i];
        out.push({
          key: `${item}:${i}`,
          kind: 'grammar',
          label: t.title,
          prompt: q.sentence,
          options: shuffle([...q.options], random),
          answer: q.options[0],
        });
      }
    }
  }
  return shuffle(out, random);
}

// ───────────────────────── Suggestions du jour

/** Mots business proposés aujourd'hui : toujours les mêmes pour une journée donnée, jamais déjà notés. */
export function businessSuggestions(e: EnglishState, today: DateKey, count: number, offset = 0) {
  const known = new Set(e.words.map((w) => norm(w.en)));
  const order = shuffle(BUSINESS_WORDS, seededRandom(`business-${today}`));
  const available = order.filter((b) => !known.has(norm(b.en)));
  const start = available.length ? (offset * count) % available.length : 0;
  return [...available.slice(start), ...available.slice(0, start)].slice(0, count);
}
