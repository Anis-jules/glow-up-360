import { Check, ChevronRight, Pencil } from 'lucide-react';
import { useState } from 'react';
import { Button, Card, Chip, Select, Sheet } from '@/components/ui';
import { formatShort, WEEKDAYS, weekDates } from '@/lib/dates';
import { toast } from '@/lib/feedback';
import { applyProgression, getProgressionInfo, getWorkoutForDate } from '@/lib/progress';
import { useData, useUpdate } from '@/lib/store';
import type { DateKey } from '@/lib/types';
import { cx } from '@/lib/utils';
import {
  assignDay,
  describeExercise,
  estimateWorkoutSec,
  formatEstimate,
  isComplete,
  WORKOUT_TYPE_LABEL,
} from './sportUtils';
import { WorkoutEditor } from './WorkoutEditor';

/** Planning de la semaine : une séance par jour, modifiable. */
export function WeekTab({ today }: { today: DateKey }) {
  const data = useData();
  const update = useUpdate();
  const sport = data.sport;
  const dates = weekDates(today);
  const [preview, setPreview] = useState<{ workoutId: string; date: DateKey } | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  const previewWorkout = preview ? sport.workouts.find((w) => w.id === preview.workoutId) : undefined;
  const previewPhase = preview ? getProgressionInfo(sport, preview.date).phase : null;

  const change = (i: number, id: string) => {
    let kept = true;
    update((d) => {
      kept = assignDay(d, i, id || null, today);
    });
    if (!kept) toast('La séance déjà commencée aujourd’hui est conservée ; le changement vaut pour les semaines suivantes.');
  };

  const plannedCount = sport.week.filter(Boolean).length;

  return (
    <div className="space-y-4">
      <p className="animate-rise text-sm text-ink-2">
        {plannedCount} jour{plannedCount > 1 ? 's' : ''} avec une séance. Choisis la séance de chaque jour, ou « Repos ». Touche un jour pour voir son contenu.
      </p>
      <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
        {dates.map((date, i) => {
          const plannedId = sport.week[i];
          const planned = plannedId ? sport.workouts.find((w) => w.id === plannedId) : undefined;
          const shown = date <= today ? getWorkoutForDate(sport, date) : planned;
          const isToday = date === today;
          const isPast = date < today;
          const entry = sport.log[date];
          const complete = isComplete(entry, shown);
          const started = !!entry && entry.done.length > 0 && !complete;
          const phase = getProgressionInfo(sport, date).phase;
          const exercises = shown ? shown.exercises.map((e) => applyProgression(e, phase)) : [];
          return (
            <Card
              key={date}
              padding="sm"
              className={cx('animate-rise', isToday && 'border-tint/40 ring-1 ring-tint/25')}
              style={{ animationDelay: `${i * 35}ms` }}
            >
              <div className="flex items-center gap-3">
                <div className={cx('w-12 shrink-0 rounded-xl py-1.5 text-center', isToday ? 'bg-tint text-tint-ink' : 'bg-surface-2')}>
                  <div className={cx('text-[11px] font-semibold uppercase', isToday ? 'opacity-90' : 'text-ink-3')}>
                    {WEEKDAYS[i].slice(0, 3)}
                  </div>
                  <div className="font-display text-lg leading-tight font-semibold tabular">{Number(date.slice(8))}</div>
                </div>
                <button
                  type="button"
                  disabled={!shown}
                  onClick={() => shown && setPreview({ workoutId: shown.id, date })}
                  className="min-w-0 flex-1 text-left disabled:cursor-default"
                >
                  <div className="flex items-center gap-2">
                    <span className={cx('truncate text-[15px] font-medium', !shown && 'text-ink-3')}>
                      {shown ? shown.title : 'Repos'}
                    </span>
                    {isToday && <Chip tone="tint" className="h-5 text-[10px]">Aujourd’hui</Chip>}
                  </div>
                  <div className="truncate text-[13px] text-ink-3">
                    {shown
                      ? `${WORKOUT_TYPE_LABEL[shown.type]} · ${exercises.length} exercice${exercises.length > 1 ? 's' : ''} · ${formatEstimate(estimateWorkoutSec(exercises))}`
                      : 'Aucune séance prévue'}
                  </div>
                </button>
                {complete ? (
                  <span className="grid size-7 shrink-0 place-items-center rounded-full bg-tint text-tint-ink" title="Séance complète">
                    <Check className="size-4" strokeWidth={3} />
                  </span>
                ) : started ? (
                  <Chip className="shrink-0">
                    {entry!.done.length}/{entry!.total}
                  </Chip>
                ) : isPast && shown ? (
                  <span className="shrink-0 text-xs text-ink-3">Passé</span>
                ) : shown ? (
                  <ChevronRight className="size-4 shrink-0 text-ink-3" />
                ) : null}
              </div>
              <Select
                aria-label={`Séance du ${WEEKDAYS[i].toLowerCase()}`}
                value={plannedId ?? ''}
                onChange={(e) => change(i, e.target.value)}
                className="mt-2.5"
              >
                <option value="">Repos (rien de prévu)</option>
                {sport.workouts.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.title}
                  </option>
                ))}
              </Select>
            </Card>
          );
        })}
      </div>

      <Sheet
        open={!!previewWorkout}
        onClose={() => setPreview(null)}
        title={previewWorkout?.title}
        subtitle={
          preview && previewWorkout
            ? `${WEEKDAYS[dates.indexOf(preview.date)] ?? ''} ${formatShort(preview.date)} · ${WORKOUT_TYPE_LABEL[previewWorkout.type]}`
            : undefined
        }
        footer={
          previewWorkout && (
            <Button
              variant="tint"
              onClick={() => {
                const id = previewWorkout.id;
                setPreview(null);
                setEditing(id);
              }}
            >
              <Pencil /> Modifier la séance
            </Button>
          )
        }
      >
        {previewWorkout && (
          <div className="space-y-4">
            {previewWorkout.focus && <p className="text-[15px] text-ink-2">{previewWorkout.focus}</p>}
            <ol className="divide-y divide-line rounded-2xl border border-line">
              {previewWorkout.exercises.map((e, i) => {
                const eff = applyProgression(e, previewPhase);
                return (
                  <li key={e.id} className="flex gap-3 p-3">
                    <span className="grid size-6 shrink-0 place-items-center rounded-md bg-tint/12 text-[11px] font-semibold text-tint tabular">
                      {i + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="font-medium">{e.name}</div>
                      <div className="text-[13px] text-ink-3">{describeExercise(eff)}</div>
                      {e.instructions && <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{e.instructions}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
            {previewWorkout.notes && <p className="rounded-xl bg-surface-2 p-3 text-[13px] text-ink-2">{previewWorkout.notes}</p>}
          </div>
        )}
      </Sheet>
      <WorkoutEditor workoutId={editing} onClose={() => setEditing(null)} />
    </div>
  );
}
