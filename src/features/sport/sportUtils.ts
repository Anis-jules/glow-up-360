// Outils de la rubrique Sport : libellés, durées estimées, minuteurs, journal du jour.

import type { TimerPhase } from '@/components/ui';
import { formatDuration, todayKey, WEEKDAYS_SHORT, weekdayOf } from '@/lib/dates';
import { getDayExercises, getWorkoutForDate } from '@/lib/progress';
import type { AppData, DateKey, Exercise, ExerciseKind, SportLogEntry, SportState, Workout, WorkoutType } from '@/lib/types';
import { uid } from '@/lib/utils';

export const WORKOUT_TYPES: { value: WorkoutType; label: string }[] = [
  { value: 'force', label: 'Renforcement' },
  { value: 'cardio', label: 'Cardio' },
  { value: 'mobilite', label: 'Mobilité' },
  { value: 'repos', label: 'Récupération' },
  { value: 'perso', label: 'Personnalisée' },
];

export const WORKOUT_TYPE_LABEL: Record<WorkoutType, string> = Object.fromEntries(
  WORKOUT_TYPES.map((t) => [t.value, t.label]),
) as Record<WorkoutType, string>;

export const EXERCISE_KINDS: { value: ExerciseKind; label: string; hint: string }[] = [
  { value: 'reps', label: 'Répétitions', hint: 'Séries × répétitions' },
  { value: 'time', label: 'Durée', hint: 'Séries × durée' },
  { value: 'interval', label: 'Fractionné', hint: 'Effort et récupération répétés' },
  { value: 'free', label: 'Libre', hint: 'Activité sans comptage' },
];

/** Résumé lisible : « 3 × 10 · repos 60 s », « 8 × (Course 1 min + Marche 2 min) ». */
export function describeExercise(ex: Exercise, withRest = true): string {
  let main = '';
  switch (ex.kind) {
    case 'reps':
      main = ex.sets > 1 ? `${ex.sets} × ${ex.reps}` : `${ex.reps} répétitions`;
      if (ex.perSide) main += ' par côté';
      break;
    case 'time':
      main = ex.sets > 1 ? `${ex.sets} × ${formatDuration(ex.durationSec)}` : formatDuration(ex.durationSec);
      if (ex.perSide) main += ' par côté';
      break;
    case 'interval':
      main = `${ex.sets} × (${ex.workLabel || 'Effort'} ${formatDuration(ex.workSec)} + ${ex.recoverLabel || 'Récupération'} ${formatDuration(ex.recoverSec)})`;
      break;
    case 'free':
      main = ex.durationSec > 0 ? `Environ ${formatDuration(ex.durationSec)}` : 'À ton rythme';
      break;
  }
  const parts = [main];
  if (withRest && ex.restSec > 0 && ex.kind !== 'interval' && ex.kind !== 'free' && ex.sets > 1) {
    parts.push(`repos ${formatDuration(ex.restSec)}`);
  }
  if (ex.optional) parts.push('Facultatif');
  return parts.join(' · ');
}

/** Durée estimée d'un exercice en secondes (repos compris). */
export function estimateExerciseSec(ex: Exercise): number {
  const sides = ex.perSide ? 2 : 1;
  switch (ex.kind) {
    case 'reps':
      return ex.sets * ex.reps * 3 * sides + Math.max(0, ex.sets - 1) * ex.restSec;
    case 'time':
      return ex.sets * ex.durationSec * sides + Math.max(0, ex.sets - 1) * ex.restSec;
    case 'interval':
      return ex.sets * (ex.workSec + ex.recoverSec);
    case 'free':
      return ex.durationSec;
  }
}

export function estimateWorkoutSec(exercises: Exercise[], includeOptional = false): number {
  return exercises.filter((e) => includeOptional || !e.optional).reduce((acc, e) => acc + estimateExerciseSec(e), 0);
}

/** « 25 min » arrondi à la minute (5 min minimum si quelque chose est prévu). */
export function formatEstimate(sec: number): string {
  if (sec <= 0) return 'Durée libre';
  const min = Math.max(5, Math.round(sec / 60 / 5) * 5);
  return `≈ ${min} min`;
}

/** Étapes de minuteur selon le type d'exercice. */
export function buildTimerPhases(ex: Exercise): { phases: TimerPhase[]; title: string } {
  const sides = ex.perSide ? ['côté gauche', 'côté droit'] : [''];
  switch (ex.kind) {
    case 'time': {
      const phases: TimerPhase[] = [];
      for (let s = 1; s <= Math.max(1, ex.sets); s++) {
        for (const side of sides) {
          phases.push({
            label: `Série ${s}${ex.sets > 1 ? `/${ex.sets}` : ''}${side ? ` · ${side}` : ''}`,
            seconds: Math.max(1, ex.durationSec),
            tone: 'work',
          });
        }
        if (s < ex.sets && ex.restSec > 0) phases.push({ label: 'Repos', seconds: ex.restSec, tone: 'rest' });
      }
      return { phases, title: 'Minuteur des séries' };
    }
    case 'interval': {
      const phases: TimerPhase[] = [];
      for (let r = 1; r <= Math.max(1, ex.sets); r++) {
        phases.push({ label: `${ex.workLabel || 'Effort'} ${r}/${ex.sets}`, seconds: Math.max(1, ex.workSec), tone: 'work' });
        if (ex.recoverSec > 0) phases.push({ label: `${ex.recoverLabel || 'Récupération'} ${r}/${ex.sets}`, seconds: ex.recoverSec, tone: 'rest' });
      }
      return { phases, title: 'Minuteur du fractionné' };
    }
    case 'free':
      return ex.durationSec > 0
        ? { phases: [{ label: ex.name, seconds: ex.durationSec, tone: 'neutral' }], title: 'Minuteur' }
        : { phases: [], title: '' };
    case 'reps': {
      if (ex.restSec <= 0 || ex.sets <= 1) return { phases: [], title: '' };
      const phases: TimerPhase[] = [];
      for (let s = 1; s < ex.sets; s++) {
        phases.push({ label: `Repos après la série ${s}`, seconds: ex.restSec, tone: 'rest' });
      }
      return { phases, title: 'Minuteur de repos entre les séries' };
    }
  }
}

/** Jours où une séance est prévue dans le planning : « Mar, Sam ». */
export function daysUsing(sport: SportState, workoutId: string): string[] {
  const out: string[] = [];
  sport.week.forEach((id, i) => {
    if (id === workoutId) out.push(WEEKDAYS_SHORT[i]);
  });
  return out;
}

/** Crée (si besoin) l'entrée du journal de ce jour et la renvoie (à utiliser dans un update). */
export function ensureLog(d: AppData, key: DateKey): SportLogEntry | null {
  const existing = d.sport.log[key];
  const workout = getWorkoutForDate(d.sport, key);
  if (!workout) return existing ?? null;
  const total = getDayExercises(d.sport, key).filter((e) => !e.optional).length;
  if (existing) {
    existing.workoutTitle = workout.title;
    existing.total = total;
    return existing;
  }
  const entry: SportLogEntry = { workoutId: workout.id, workoutTitle: workout.title, done: [], total, note: '' };
  d.sport.log[key] = entry;
  return entry;
}

/** Coche / décoche un exercice pour ce jour. */
export function setExerciseDone(d: AppData, key: DateKey, exerciseId: string, done: boolean) {
  const entry = ensureLog(d, key);
  if (!entry) return;
  const set = new Set(entry.done);
  if (done) set.add(exerciseId);
  else set.delete(exerciseId);
  entry.done = [...set];
  const required = getDayExercises(d.sport, key).filter((e) => !e.optional);
  entry.total = required.length;
  const complete = required.length > 0 && required.every((e) => set.has(e.id));
  if (complete && !entry.finishedAt) entry.finishedAt = new Date().toISOString();
  if (!complete) delete entry.finishedAt;
}

/** Séance complète : tous les exercices obligatoires validés. */
export function isComplete(entry: SportLogEntry | undefined, workout?: Workout | null): boolean {
  if (!entry) return false;
  if (workout && workout.id === entry.workoutId) {
    const required = [...workout.exercises, ...(entry.extras ?? [])].filter((e) => !e.optional);
    if (required.length === 0) return false;
    const done = new Set(entry.done);
    return required.every((e) => done.has(e.id));
  }
  return entry.total > 0 && entry.done.length >= entry.total;
}

export function newExercise(): Exercise {
  return {
    id: uid('e'),
    name: 'Nouvel exercice',
    kind: 'reps',
    sets: 3,
    reps: 10,
    perSide: false,
    durationSec: 30,
    workSec: 60,
    recoverSec: 60,
    workLabel: 'Effort',
    recoverLabel: 'Récupération',
    restSec: 60,
    instructions: '',
    notes: '',
    optional: false,
    progressive: true,
  };
}

export function newWorkout(): Workout {
  return {
    id: uid('w'),
    title: 'Nouvelle séance',
    type: 'perso',
    focus: '',
    notes: '',
    exercises: [],
  };
}

/** Copie d'une séance avec de nouveaux identifiants. */
export function duplicateWorkout(w: Workout): Workout {
  return {
    ...w,
    id: uid('w'),
    title: `${w.title} (copie)`,
    exercises: w.exercises.map((e) => ({ ...e, id: uid('e') })),
  };
}

export const FEELING_LABELS = ['Très difficile', 'Difficile', 'Correct', 'Bien', 'Excellent'];

/**
 * Assigne une séance à un jour du planning (à utiliser dans un update).
 * Si la séance du jour même n'a pas été commencée, l'entrée du journal est retirée pour suivre le nouveau planning.
 * Renvoie false si une séance commencée aujourd'hui a été conservée.
 */
export function assignDay(d: AppData, weekday: number, workoutId: string | null, today: DateKey = todayKey()): boolean {
  const previous = d.sport.week[weekday] ?? null;
  d.sport.week[weekday] = workoutId;
  if (weekdayOf(today) !== weekday) return true;
  const entry = d.sport.log[today];
  if (!entry || entry.workoutId !== previous) return true;
  if (entry.done.length === 0) {
    const extras = entry.extras ?? [];
    const next = workoutId ? d.sport.workouts.find((w) => w.id === workoutId) : undefined;
    if (extras.length && next) {
      // Garder les exercices ajoutés pour aujourd'hui en suivant la nouvelle séance.
      entry.workoutId = next.id;
      entry.workoutTitle = next.title;
      entry.total = [...next.exercises, ...extras].filter((e) => !e.optional).length;
    } else {
      delete d.sport.log[today];
    }
    return true;
  }
  return false;
}

// ───────────────────────── Exercices en plus du jour

/** Référence d'une liste d'exercices : l'id d'une séance, ou « extra:AAAA-MM-JJ » pour les ajouts d'une journée. */
export const EXTRA_PREFIX = 'extra:';
export const extrasRef = (key: DateKey) => `${EXTRA_PREFIX}${key}`;
export const isExtrasRef = (ref: string | null | undefined) => !!ref && ref.startsWith(EXTRA_PREFIX);

/** Liste modifiable désignée par une référence (séance ou ajouts d'une journée). */
export function exerciseList(d: AppData, ref: string): Exercise[] | undefined {
  if (isExtrasRef(ref)) return d.sport.log[ref.slice(EXTRA_PREFIX.length)]?.extras;
  return d.sport.workouts.find((w) => w.id === ref)?.exercises;
}

/** Ajoute un exercice à la journée (crée le journal du jour si besoin). Renvoie son id. */
export function addExtra(d: AppData, key: DateKey, ex: Exercise): string | null {
  const entry = ensureLog(d, key);
  if (!entry) return null;
  const copy: Exercise = { ...ex, id: uid('e'), progressive: false, optional: false };
  entry.extras = [...(entry.extras ?? []), copy];
  entry.total = getDayExercises(d.sport, key).filter((e) => !e.optional).length;
  delete entry.finishedAt;
  return copy.id;
}

/** Retire un exercice ajouté pour la journée. */
export function removeExtra(d: AppData, key: DateKey, exerciseId: string) {
  const entry = d.sport.log[key];
  if (!entry?.extras) return;
  entry.extras = entry.extras.filter((e) => e.id !== exerciseId);
  entry.done = entry.done.filter((id) => id !== exerciseId);
  if (!entry.extras.length) delete entry.extras;
  entry.total = getDayExercises(d.sport, key).filter((e) => !e.optional).length;
}

function idea(name: string, p: Partial<Exercise>): Exercise {
  return { ...newExercise(), id: `idea-${name}`, name, progressive: false, ...p };
}

/** Idées d'exercices à ajouter en plus (au poids du corps, sans matériel). */
export const EXTRA_IDEAS: Exercise[] = [
  idea('Gainage latéral', { kind: 'time', sets: 2, durationSec: 20, perSide: true, restSec: 30,
    instructions: 'Sur un avant-bras, coude sous l’épaule, corps aligné. Monte le bassin et tiens, sans le laisser tomber.' }),
  idea('Mountain climbers', { kind: 'time', sets: 3, durationSec: 30, restSec: 30,
    instructions: 'En position de pompe, ramène un genou vers la poitrine puis l’autre, en alternance rapide. Dos plat.' }),
  idea('Jumping jacks', { kind: 'time', sets: 3, durationSec: 30, restSec: 30,
    instructions: 'Saute en écartant bras et jambes, puis reviens pieds joints. Atterris en douceur sur l’avant du pied.' }),
  idea('Chaise contre le mur', { kind: 'time', sets: 2, durationSec: 30, restSec: 45,
    instructions: 'Dos au mur, descends jusqu’à avoir les genoux à angle droit, au-dessus des chevilles. Tiens.' }),
  idea('Crunchs', { kind: 'reps', sets: 3, reps: 15, restSec: 45,
    instructions: 'Sur le dos, genoux pliés. Enroule le haut du dos en soufflant, sans tirer sur la nuque.' }),
  idea('Burpees', { kind: 'reps', sets: 2, reps: 8, restSec: 60,
    instructions: 'Accroupis, mains au sol, jette les pieds en arrière, reviens, puis saute bras en l’air. Version douce : sans saut.' }),
  idea('Superman', { kind: 'reps', sets: 2, reps: 12, restSec: 45,
    instructions: 'Allongé sur le ventre, bras tendus devant. Lève bras et jambes de quelques centimètres, tiens une seconde.' }),
  idea('Dips adaptés', { kind: 'reps', sets: 2, reps: 8, restSec: 60,
    instructions: 'Mains sur une chaise stable derrière toi, jambes fléchies. Descends jusqu’à 90° aux coudes au maximum, puis remonte.' }),
];

