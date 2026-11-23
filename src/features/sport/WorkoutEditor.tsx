import { ChevronRight, Copy, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
  Button,
  Chip,
  EmptyState,
  Field,
  IconButton,
  ReorderButtons,
  Select,
  Sheet,
  TextArea,
  TextInput,
} from '@/components/ui';
import { WEEKDAYS, WEEKDAYS_LETTER } from '@/lib/dates';
import { removeWithUndo, toast } from '@/lib/feedback';
import { useData, useUpdate } from '@/lib/store';
import type { Workout, WorkoutType } from '@/lib/types';
import { cx, moveItem } from '@/lib/utils';
import { ExerciseEditor } from './ExerciseEditor';
import {
  assignDay,
  describeExercise,
  duplicateWorkout,
  estimateWorkoutSec,
  formatEstimate,
  newExercise,
  WORKOUT_TYPES,
} from './sportUtils';

/** Supprime une séance (avec annulation) et la retire du planning. */
export function deleteWorkout(w: Workout) {
  removeWithUndo(`Séance « ${w.title} » supprimée`, (d) => {
    d.sport.workouts = d.sport.workouts.filter((x) => x.id !== w.id);
    d.sport.week = d.sport.week.map((id) => (id === w.id ? null : id));
  });
}

/** Éditeur de séance : titre, type, jours prévus, exercices. Modifications enregistrées en direct. */
export function WorkoutEditor({ workoutId, onClose }: { workoutId: string | null; onClose: () => void }) {
  const data = useData();
  const update = useUpdate();
  const workout = workoutId ? data.sport.workouts.find((w) => w.id === workoutId) : undefined;
  const [editingEx, setEditingEx] = useState<string | null>(null);

  const set = <K extends keyof Workout>(key: K, value: Workout[K]) =>
    update((d) => {
      const w = d.sport.workouts.find((x) => x.id === workoutId);
      if (w) w[key] = value;
    });

  const toggleDay = (i: number) => {
    let kept = true;
    update((d) => {
      kept = assignDay(d, i, d.sport.week[i] === workoutId ? null : workoutId);
    });
    if (!kept) toast('La séance déjà commencée aujourd’hui est conservée ; le changement vaut pour les semaines suivantes.');
  };

  const addExercise = () => {
    const ex = newExercise();
    update((d) => {
      d.sport.workouts.find((x) => x.id === workoutId)?.exercises.push(ex);
    });
    setEditingEx(ex.id);
  };

  return (
    <>
      <Sheet
        open={!!workout}
        onClose={onClose}
        size="lg"
        title={workout?.title || 'Séance'}
        subtitle={workout ? `${workout.exercises.length} exercice${workout.exercises.length > 1 ? 's' : ''} · ${formatEstimate(estimateWorkoutSec(workout.exercises))}` : undefined}
        footer={
          workout && (
            <>
              <Button
                variant="danger"
                className="mr-auto"
                onClick={() => {
                  onClose();
                  deleteWorkout(workout);
                }}
              >
                <Trash2 /> Supprimer
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  const copy = duplicateWorkout(workout);
                  update((d) => void d.sport.workouts.push(copy));
                  toast('Séance dupliquée', { tone: 'success' });
                  onClose();
                }}
              >
                <Copy /> Dupliquer
              </Button>
              <Button variant="tint" onClick={onClose}>
                Terminé
              </Button>
            </>
          )
        }
      >
        {workout && (
          <div className="space-y-5">
            <Field label="Nom de la séance">
              <TextInput value={workout.title} onChange={(e) => set('title', e.target.value)} />
            </Field>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Type">
                <Select value={workout.type} onChange={(e) => set('type', e.target.value as WorkoutType)}>
                  {WORKOUT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Objectif ou zones travaillées">
                <TextInput value={workout.focus} onChange={(e) => set('focus', e.target.value)} placeholder="Ex. Gainage et dos" />
              </Field>
            </div>

            <div>
              <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Jours prévus dans la semaine</span>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAYS_LETTER.map((l, i) => {
                  const on = data.sport.week[i] === workout.id;
                  const other = !on && data.sport.week[i] ? data.sport.workouts.find((w) => w.id === data.sport.week[i]) : null;
                  return (
                    <button
                      key={i}
                      type="button"
                      aria-pressed={on}
                      title={`${WEEKDAYS[i]}${other ? ` (actuellement : ${other.title})` : ''}`}
                      onClick={() => toggleDay(i)}
                      className={cx(
                        'grid size-10 place-items-center rounded-full text-sm font-semibold transition-colors',
                        on ? 'bg-tint text-tint-ink' : 'bg-surface-2 text-ink-2 hover:bg-ink/[0.08]',
                        other && 'ring-1 ring-ink/15 ring-inset',
                      )}
                    >
                      {l}
                    </button>
                  );
                })}
              </div>
              <p className="mt-1.5 text-xs text-ink-3">
                Un jour déjà occupé (cerclé) prendra cette séance à la place de l’autre.
              </p>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[13px] font-medium text-ink-2">Exercices</span>
                <Button size="sm" variant="ghost" className="text-tint hover:text-tint" onClick={addExercise}>
                  <Plus /> Ajouter un exercice
                </Button>
              </div>
              {workout.exercises.length === 0 ? (
                <EmptyState title="Aucun exercice" action={<Button variant="tint" size="sm" onClick={addExercise}><Plus /> Ajouter</Button>}>
                  Ajoute les mouvements de ta séance.
                </EmptyState>
              ) : (
                <ul className="divide-y divide-line rounded-2xl border border-line">
                  {workout.exercises.map((ex, i) => (
                    <li key={ex.id} className="flex items-center gap-1 py-1.5 pr-1 pl-3">
                      <button type="button" onClick={() => setEditingEx(ex.id)} className="min-w-0 flex-1 py-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-[15px] font-medium">{ex.name || 'Sans nom'}</span>
                          {ex.progressive && <Chip tone="tint" className="h-5 px-2 text-[10px]">30 j</Chip>}
                        </div>
                        <div className="truncate text-[13px] text-ink-3">{describeExercise(ex)}</div>
                      </button>
                      <ReorderButtons
                        index={i}
                        count={workout.exercises.length}
                        onMove={(to) =>
                          update((d) => {
                            const w = d.sport.workouts.find((x) => x.id === workout.id);
                            if (w) moveItem(w.exercises, i, to);
                          })
                        }
                      />
                      <IconButton
                        label={`Supprimer ${ex.name}`}
                        size="icon-sm"
                        onClick={() =>
                          removeWithUndo(`« ${ex.name} » supprimé`, (d) => {
                            const w = d.sport.workouts.find((x) => x.id === workout.id);
                            if (w) w.exercises = w.exercises.filter((x) => x.id !== ex.id);
                          })
                        }
                      >
                        <Trash2 />
                      </IconButton>
                      <IconButton label={`Modifier ${ex.name}`} size="icon-sm" onClick={() => setEditingEx(ex.id)}>
                        <ChevronRight />
                      </IconButton>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <Field label="Notes de séance">
              <TextArea value={workout.notes} minRows={2} onChange={(e) => set('notes', e.target.value)} placeholder="Matériel, lieu, conseils…" />
            </Field>
          </div>
        )}
      </Sheet>
      <ExerciseEditor workoutId={workoutId} exerciseId={editingEx} onClose={() => setEditingEx(null)} />
    </>
  );
}
