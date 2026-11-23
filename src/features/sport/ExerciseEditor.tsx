import { CalendarDays, Trash2 } from 'lucide-react';
import {
  Button,
  DurationField,
  Field,
  NumberField,
  Segmented,
  Sheet,
  TextArea,
  TextInput,
  Toggle,
} from '@/components/ui';
import { removeWithUndo } from '@/lib/feedback';
import { useData, useUpdate } from '@/lib/store';
import type { AppData, Exercise, ExerciseKind } from '@/lib/types';
import { daysUsing, describeExercise, EXERCISE_KINDS } from './sportUtils';

function findEx(d: AppData, workoutId: string, exerciseId: string): Exercise | undefined {
  return d.sport.workouts.find((w) => w.id === workoutId)?.exercises.find((e) => e.id === exerciseId);
}

/** Éditeur complet d'un exercice : chaque modification est enregistrée immédiatement. */
export function ExerciseEditor({
  workoutId,
  exerciseId,
  onClose,
}: {
  workoutId: string | null;
  exerciseId: string | null;
  onClose: () => void;
}) {
  const data = useData();
  const update = useUpdate();
  const workout = workoutId ? data.sport.workouts.find((w) => w.id === workoutId) : undefined;
  const ex = workout && exerciseId ? workout.exercises.find((e) => e.id === exerciseId) : undefined;
  const open = !!ex;

  const set = <K extends keyof Exercise>(key: K, value: Exercise[K]) =>
    update((d) => {
      const e = workoutId && exerciseId ? findEx(d, workoutId, exerciseId) : undefined;
      if (e) e[key] = value;
    });

  const days = workout ? daysUsing(data.sport, workout.id) : [];

  return (
    <Sheet
      open={open}
      onClose={onClose}
      size="lg"
      title={ex?.name || 'Exercice'}
      subtitle={ex ? describeExercise(ex) : undefined}
      footer={
        ex && (
          <>
            <Button
              variant="danger"
              className="mr-auto"
              onClick={() => {
                const wId = workoutId!;
                const eId = ex.id;
                onClose();
                removeWithUndo(`« ${ex.name} » supprimé`, (d) => {
                  const w = d.sport.workouts.find((x) => x.id === wId);
                  if (w) w.exercises = w.exercises.filter((x) => x.id !== eId);
                });
              }}
            >
              <Trash2 /> Supprimer
            </Button>
            <Button variant="tint" onClick={onClose}>
              Terminé
            </Button>
          </>
        )
      }
    >
      {ex && workout && (
        <div className="space-y-5">
          {days.length > 1 && (
            <div className="flex items-start gap-2.5 rounded-xl bg-tint/10 p-3 text-[13px] text-ink-2">
              <CalendarDays className="mt-0.5 size-4 shrink-0 text-tint" />
              <span>
                La séance « {workout.title} » est prévue {days.join(', ')}. Tes changements s’appliquent à tous ces jours.
              </span>
            </div>
          )}

          <Field label="Nom">
            <TextInput value={ex.name} onChange={(e) => set('name', e.target.value)} placeholder="Ex. Pompes" />
          </Field>

          <div>
            <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Type</span>
            <Segmented<ExerciseKind>
              options={EXERCISE_KINDS.map((k) => ({ value: k.value, label: k.label }))}
              value={ex.kind}
              onChange={(v) => set('kind', v)}
              className="flex w-full flex-wrap [&>button]:flex-1"
            />
            <p className="mt-1 text-xs text-ink-3">{EXERCISE_KINDS.find((k) => k.value === ex.kind)?.hint}</p>
          </div>

          {ex.kind === 'reps' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="Séries">
                <NumberField value={ex.sets} min={1} max={20} onChange={(v) => set('sets', v)} ariaLabel="Séries" />
              </Field>
              <Field label="Répétitions">
                <NumberField value={ex.reps} min={1} max={200} onChange={(v) => set('reps', v)} ariaLabel="Répétitions" />
              </Field>
            </div>
          )}

          {ex.kind === 'time' && (
            <>
              <Field label="Séries">
                <NumberField value={ex.sets} min={1} max={20} onChange={(v) => set('sets', v)} ariaLabel="Séries" />
              </Field>
              <Field label="Durée d’une série">
                <DurationField value={ex.durationSec} onChange={(v) => set('durationSec', Math.max(5, v))} />
              </Field>
            </>
          )}

          {ex.kind === 'interval' && (
            <>
              <Field label="Nombre de répétitions du bloc">
                <NumberField value={ex.sets} min={1} max={50} onChange={(v) => set('sets', v)} ariaLabel="Répétitions du bloc" />
              </Field>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2 rounded-2xl bg-surface-2/60 p-3">
                  <Field label="Libellé de l’effort">
                    <TextInput value={ex.workLabel} onChange={(e) => set('workLabel', e.target.value)} placeholder="Course" />
                  </Field>
                  <DurationField value={ex.workSec} onChange={(v) => set('workSec', Math.max(5, v))} />
                </div>
                <div className="space-y-2 rounded-2xl bg-surface-2/60 p-3">
                  <Field label="Libellé de la récupération">
                    <TextInput value={ex.recoverLabel} onChange={(e) => set('recoverLabel', e.target.value)} placeholder="Marche" />
                  </Field>
                  <DurationField value={ex.recoverSec} onChange={(v) => set('recoverSec', v)} />
                </div>
              </div>
            </>
          )}

          {ex.kind === 'free' && (
            <Field label="Durée indicative" hint="Laisse 0 pour une activité sans durée.">
              <DurationField value={ex.durationSec} onChange={(v) => set('durationSec', v)} />
            </Field>
          )}

          {(ex.kind === 'reps' || ex.kind === 'time') && (
            <>
              <Field label="Repos entre les séries">
                <DurationField value={ex.restSec} onChange={(v) => set('restSec', v)} />
              </Field>
              <Toggle
                label="Par côté"
                description="Les valeurs s’entendent pour chaque jambe ou chaque bras."
                checked={ex.perSide}
                onChange={(v) => set('perSide', v)}
              />
            </>
          )}

          <Field label="Consignes" hint="Comment bien exécuter le mouvement.">
            <TextArea value={ex.instructions} onChange={(e) => set('instructions', e.target.value)} placeholder="Position, respiration, points d’attention…" />
          </Field>

          <Field label="Mes notes">
            <TextArea value={ex.notes} minRows={2} onChange={(e) => set('notes', e.target.value)} placeholder="Ressenti, charge utilisée, variante…" />
          </Field>

          <div className="divide-y divide-line rounded-2xl border border-line px-4">
            <Toggle
              className="py-3"
              label="Facultatif"
              description="Ne compte pas dans la progression du jour."
              checked={ex.optional}
              onChange={(v) => set('optional', v)}
            />
            <Toggle
              className="py-3"
              label="Suit le programme 30 jours"
              description="Les valeurs augmentent selon la phase en cours."
              checked={ex.progressive}
              onChange={(v) => set('progressive', v)}
            />
          </div>
        </div>
      )}
    </Sheet>
  );
}
