import { ArrowRightLeft, CalendarDays, ChevronRight, Info, Pencil, RotateCcw, Sofa, Trophy } from 'lucide-react';
import { useState } from 'react';
import {
  Button,
  Card,
  CheckRow,
  Chip,
  Field,
  ProgressBar,
  ProgressRing,
  Rating,
  SectionHeader,
  Sheet,
  TextArea,
} from '@/components/ui';
import { addDays, WEEKDAYS, weekdayOf } from '@/lib/dates';
import { confirm } from '@/lib/feedback';
import { applyProgression, getProgressionInfo, getWorkoutForDate } from '@/lib/progress';
import { useData, useUpdate } from '@/lib/store';
import type { DateKey } from '@/lib/types';
import { cx } from '@/lib/utils';
import { ExerciseSheet } from './ExerciseSheet';
import {
  describeExercise,
  ensureLog,
  estimateWorkoutSec,
  FEELING_LABELS,
  formatEstimate,
  setExerciseDone,
  WORKOUT_TYPE_LABEL,
} from './sportUtils';
import { WorkoutEditor } from './WorkoutEditor';

export type SportTab = 'today' | 'week' | 'library' | 'program' | 'history';

export function TodayTab({ today, onGoTo }: { today: DateKey; onGoTo: (t: SportTab) => void }) {
  const data = useData();
  const update = useUpdate();
  const sport = data.sport;
  const [openEx, setOpenEx] = useState<string | null>(null);
  const [choosing, setChoosing] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState<string | null>(null);

  const workout = getWorkoutForDate(sport, today);
  const plannedId = sport.week[weekdayOf(today)] ?? null;
  const entry = sport.log[today];
  const overridden = !!entry && entry.workoutId !== plannedId;
  const info = getProgressionInfo(sport, today);
  const exercises = workout ? workout.exercises.map((e) => applyProgression(e, info.phase)) : [];
  const done = new Set(entry?.done ?? []);
  const required = exercises.filter((e) => !e.optional);
  const doneRequired = required.filter((e) => done.has(e.id)).length;
  const complete = required.length > 0 && doneRequired === required.length;
  const ratio = required.length ? doneRequired / required.length : 0;
  const tomorrow = getWorkoutForDate(sport, addDays(today, 1));

  const chooseWorkout = (id: string) => {
    const w = sport.workouts.find((x) => x.id === id);
    if (!w) return;
    update((d) => {
      if (id === plannedId) {
        delete d.sport.log[today];
        return;
      }
      d.sport.log[today] = {
        workoutId: w.id,
        workoutTitle: w.title,
        done: [],
        total: w.exercises.filter((e) => !e.optional).length,
        note: d.sport.log[today]?.note ?? '',
      };
    });
    setChoosing(false);
  };

  const backToPlan = async () => {
    if (entry && entry.done.length > 0) {
      const ok = await confirm({
        title: 'Revenir au planning ?',
        message: 'Les exercices déjà validés pour la séance choisie seront décochés.',
        confirmLabel: 'Revenir au planning',
      });
      if (!ok) return;
    }
    update((d) => {
      delete d.sport.log[today];
    });
  };

  const progressionChip =
    info.day && info.phase ? (
      <Chip tone="tint">
        Jour {info.day}/{info.length} · {info.phase.name}
      </Chip>
    ) : null;

  return (
    <div className="space-y-5">
      {info.finished && (
        <button
          type="button"
          onClick={() => onGoTo('program')}
          className="flex w-full animate-rise items-center gap-3 rounded-2xl border border-tint/30 bg-tint/10 p-4 text-left"
        >
          <Trophy className="size-5 shrink-0 text-tint" />
          <span className="min-w-0 flex-1 text-sm">
            <span className="font-semibold">Programme de {info.length} jours terminé.</span>{' '}
            <span className="text-ink-2">Consolide tes progrès et lance un nouveau cycle.</span>
          </span>
          <ChevronRight className="size-4 text-ink-3" />
        </button>
      )}

      {workout ? (
        <>
          <Card padding="lg" className="animate-rise">
            <div className="flex items-start gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <Chip tone="tint">{WORKOUT_TYPE_LABEL[workout.type]}</Chip>
                  {progressionChip}
                  {overridden && <Chip>Changée pour aujourd’hui</Chip>}
                </div>
                <h2 className="mt-3 text-[22px] leading-tight font-semibold sm:text-2xl">{workout.title}</h2>
                {workout.focus && <p className="mt-1 text-[15px] text-ink-2">{workout.focus}</p>}
                <p className="mt-1.5 text-[13px] text-ink-3">
                  {exercises.length} exercice{exercises.length > 1 ? 's' : ''} · {formatEstimate(estimateWorkoutSec(exercises))}
                </p>
              </div>
              <ProgressRing value={ratio} size={84} stroke={8}>
                <div className="leading-none">
                  <div className="font-display text-xl font-semibold tabular">
                    {doneRequired}/{required.length}
                  </div>
                  <div className="mt-0.5 text-[10px] text-ink-3">validés</div>
                </div>
              </ProgressRing>
            </div>
            <ProgressBar value={ratio} className="mt-5" />
            <div className="mt-4 flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => setChoosing(true)}>
                <ArrowRightLeft /> Changer de séance aujourd’hui
              </Button>
              {overridden && (
                <Button size="sm" variant="ghost" onClick={backToPlan}>
                  <RotateCcw /> Revenir au planning
                </Button>
              )}
            </div>
          </Card>

          {complete && (
            <Card padding="lg" className="animate-rise border-tint/30">
              <div className="flex items-center gap-3">
                <div className="grid size-11 place-items-center rounded-2xl bg-tint text-tint-ink">
                  <Trophy className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Séance terminée</h3>
                  <p className="text-sm text-ink-2">Bien joué. Prends le temps de t’hydrater et de souffler.</p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-start">
                <div>
                  <span className="mb-1 block text-[13px] font-medium text-ink-2">Ressenti</span>
                  <Rating
                    value={entry?.feeling ?? 0}
                    labels={FEELING_LABELS}
                    onChange={(v) =>
                      update((d) => {
                        const e = ensureLog(d, today);
                        if (e) e.feeling = v || undefined;
                      })
                    }
                  />
                  {!!entry?.feeling && <p className="mt-0.5 text-xs text-ink-3">{FEELING_LABELS[entry.feeling - 1]}</p>}
                </div>
                <Field label="Note du jour">
                  <TextArea
                    minRows={2}
                    value={entry?.note ?? ''}
                    placeholder="Énergie, difficulté, ce que tu veux retenir…"
                    onChange={(e) =>
                      update((d) => {
                        const en = ensureLog(d, today);
                        if (en) en.note = e.target.value;
                      })
                    }
                  />
                </Field>
              </div>
            </Card>
          )}

          <Card padding="md" className="animate-rise" style={{ animationDelay: '60ms' }}>
            <SectionHeader
              title="Exercices"
              subtitle="Touche un exercice pour voir les consignes et le minuteur"
              extra={
                <Button size="sm" variant="ghost" onClick={() => setEditingWorkout(workout.id)}>
                  <Pencil /> <span className="max-sm:sr-only">Modifier</span>
                </Button>
              }
            />
            {exercises.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-ink-3">Cette séance ne contient pas encore d’exercice.</p>
            ) : (
              <div className="-mx-2 divide-y divide-line">
                {exercises.map((ex, i) => (
                  <CheckRow
                    key={ex.id}
                    checked={done.has(ex.id)}
                    onToggle={(v) => update((d) => setExerciseDone(d, today, ex.id, v))}
                    onOpen={() => setOpenEx(ex.id)}
                    title={ex.name}
                    subtitle={describeExercise(ex)}
                    muted={ex.optional}
                    leading={
                      <span className="grid size-6 shrink-0 place-items-center rounded-md bg-ink/[0.05] text-[11px] font-semibold text-ink-3 tabular max-sm:hidden">
                        {i + 1}
                      </span>
                    }
                    trailing={
                      <button
                        type="button"
                        aria-label={`Détail de ${ex.name}`}
                        onClick={() => setOpenEx(ex.id)}
                        className="grid size-8 shrink-0 place-items-center rounded-lg text-ink-3 hover:bg-ink/[0.05] hover:text-ink"
                      >
                        <ChevronRight className="size-4" />
                      </button>
                    }
                  />
                ))}
              </div>
            )}
            {workout.notes && (
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-surface-2 p-3 text-[13px] text-ink-2">
                <Info className="mt-0.5 size-4 shrink-0 text-ink-3" />
                {workout.notes}
              </p>
            )}
          </Card>
        </>
      ) : (
        <Card padding="lg" className="animate-rise text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-tint/12 text-tint">
            <Sofa className="size-7" />
          </div>
          <h2 className="mt-4 text-xl font-semibold">Pas de séance prévue aujourd’hui</h2>
          <p className="mx-auto mt-1.5 max-w-md text-[15px] text-ink-2">
            Le repos fait partie de la progression : c’est pendant la récupération que le corps se renforce. Une marche tranquille reste une belle option.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Button variant="tint" onClick={() => setChoosing(true)}>
              Choisir une séance
            </Button>
            <Button variant="secondary" onClick={() => onGoTo('week')}>
              <CalendarDays /> Voir le planning
            </Button>
          </div>
        </Card>
      )}

      <button
        type="button"
        onClick={() => onGoTo('week')}
        className="flex w-full animate-rise items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-left transition-colors hover:bg-surface-2"
        style={{ animationDelay: '120ms' }}
      >
        <CalendarDays className="size-4 shrink-0 text-ink-3" />
        <span className="min-w-0 flex-1 truncate text-sm text-ink-2">
          Demain ({WEEKDAYS[weekdayOf(addDays(today, 1))].toLowerCase()}) :{' '}
          <span className="font-medium text-ink">{tomorrow ? tomorrow.title : 'repos'}</span>
        </span>
        <ChevronRight className="size-4 text-ink-3" />
      </button>

      <Sheet open={choosing} onClose={() => setChoosing(false)} title="Séance d’aujourd’hui" subtitle="Ce choix ne concerne que cette journée : ton planning ne change pas.">
        <div className="space-y-2">
          {sport.workouts.map((w) => {
            const current = workout?.id === w.id;
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => chooseWorkout(w.id)}
                className={cx(
                  'flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition-colors',
                  current ? 'border-tint/40 bg-tint/10' : 'border-line hover:bg-ink/[0.03]',
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{w.title}</span>
                    {w.id === plannedId && <Chip className="h-5 text-[10px]">Prévue</Chip>}
                  </div>
                  <div className="truncate text-[13px] text-ink-3">
                    {WORKOUT_TYPE_LABEL[w.type]} · {w.exercises.length} exercice{w.exercises.length > 1 ? 's' : ''} ·{' '}
                    {formatEstimate(estimateWorkoutSec(w.exercises))}
                  </div>
                </div>
                {current && <Chip tone="tint">Actuelle</Chip>}
              </button>
            );
          })}
        </div>
      </Sheet>

      <ExerciseSheet workoutId={workout?.id ?? null} exerciseId={openEx} dateKey={today} onClose={() => setOpenEx(null)} />
      <WorkoutEditor workoutId={editingWorkout} onClose={() => setEditingWorkout(null)} />
    </div>
  );
}
