import { Check, Info, Pencil, TrendingUp, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { Button, Chip, Field, SequenceTimer, Sheet, TextArea } from '@/components/ui';
import { formatDuration } from '@/lib/dates';
import { toast } from '@/lib/feedback';
import { applyProgression, getProgressionInfo } from '@/lib/progress';
import { useData, useUpdate } from '@/lib/store';
import type { DateKey } from '@/lib/types';
import { ExerciseEditor } from './ExerciseEditor';
import { buildTimerPhases, describeExercise, setExerciseDone } from './sportUtils';

/** Détail d'un exercice du jour : consignes, minuteur, notes, validation. */
export function ExerciseSheet({
  workoutId,
  exerciseId,
  dateKey,
  onClose,
}: {
  workoutId: string | null;
  exerciseId: string | null;
  dateKey: DateKey;
  onClose: () => void;
}) {
  const data = useData();
  const update = useUpdate();
  const [editing, setEditing] = useState(false);
  const workout = workoutId ? data.sport.workouts.find((w) => w.id === workoutId) : undefined;
  const base = workout?.exercises.find((e) => e.id === exerciseId);
  const { phase } = getProgressionInfo(data.sport, dateKey);
  const ex = base ? applyProgression(base, phase) : undefined;
  const done = !!(exerciseId && data.sport.log[dateKey]?.done.includes(exerciseId));
  const changed = !!(base && ex && describeExercise(base, false) !== describeExercise(ex, false));
  const timer = ex ? buildTimerPhases(ex) : { phases: [], title: '' };

  const setDone = (v: boolean) => {
    if (!exerciseId) return;
    update((d) => setExerciseDone(d, dateKey, exerciseId, v));
    if (v) {
      toast(`${base?.name ?? 'Exercice'} validé`, { tone: 'success' });
      onClose();
    }
  };

  return (
    <>
      <Sheet
        open={!!ex && !editing}
        onClose={onClose}
        size="lg"
        title={ex?.name}
        subtitle={ex ? describeExercise(ex) : undefined}
        footer={
          ex && (
            <>
              <Button variant="ghost" className="mr-auto" onClick={() => setEditing(true)}>
                <Pencil /> Modifier
              </Button>
              {done ? (
                <Button variant="secondary" onClick={() => setDone(false)}>
                  <Undo2 /> Annuler la validation
                </Button>
              ) : (
                <Button variant="tint" size="lg" onClick={() => setDone(true)}>
                  <Check /> Valider l’exercice
                </Button>
              )}
            </>
          )
        }
      >
        {ex && base && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {done && (
                <Chip tone="success">
                  <Check /> Validé aujourd’hui
                </Chip>
              )}
              {ex.kind !== 'interval' && ex.kind !== 'free' && ex.sets > 1 && ex.restSec > 0 && (
                <Chip>Repos {formatDuration(ex.restSec)} entre les séries</Chip>
              )}
              {ex.optional && <Chip>Facultatif</Chip>}
            </div>

            {changed && phase && (
              <div className="flex items-start gap-3 rounded-2xl bg-tint/10 p-3.5">
                <TrendingUp className="mt-0.5 size-4 shrink-0 text-tint" />
                <div className="text-[13px] leading-relaxed text-ink-2">
                  <span className="font-semibold text-ink">Phase {phase.name}</span> : aujourd’hui{' '}
                  <span className="font-medium text-ink">{describeExercise(ex, false)}</span> au lieu de{' '}
                  {describeExercise(base, false)}.
                </div>
              </div>
            )}

            {ex.instructions ? (
              <div>
                <h3 className="mb-1.5 text-[13px] font-semibold tracking-wide text-ink-3 uppercase">Consignes</h3>
                <p className="text-[15px] leading-relaxed whitespace-pre-line text-ink-2">{ex.instructions}</p>
              </div>
            ) : (
              <p className="flex items-center gap-2 text-sm text-ink-3">
                <Info className="size-4" /> Pas encore de consignes : ajoute-les avec « Modifier ».
              </p>
            )}

            {timer.phases.length > 0 && (
              <div>
                <h3 className="mb-2 text-[13px] font-semibold tracking-wide text-ink-3 uppercase">{timer.title}</h3>
                <SequenceTimer
                  phases={timer.phases}
                  finishLabel={ex.kind === 'reps' ? 'Repos terminés' : 'Bravo !'}
                  onFinish={() => {
                    if (ex.kind !== 'reps' && !done) toast('Minuteur terminé : tu peux valider l’exercice.');
                  }}
                />
                {ex.kind === 'reps' && (
                  <p className="mt-2 text-center text-xs text-ink-3">Lance le minuteur après chaque série pour respecter ton repos.</p>
                )}
              </div>
            )}

            <Field label="Mes notes" hint="Enregistrées sur l’exercice, visibles à chaque séance.">
              <TextArea
                value={base.notes}
                minRows={2}
                placeholder="Ressenti, variante, charge…"
                onChange={(e) =>
                  update((d) => {
                    const target = d.sport.workouts.find((w) => w.id === workoutId)?.exercises.find((x) => x.id === exerciseId);
                    if (target) target.notes = e.target.value;
                  })
                }
              />
            </Field>

            <p className="text-xs leading-relaxed text-ink-3">
              Écoute ton corps : en cas de douleur (et pas seulement de fatigue musculaire), arrête l’exercice.
            </p>
          </div>
        )}
      </Sheet>
      <ExerciseEditor
        workoutId={editing ? workoutId : null}
        exerciseId={editing ? exerciseId : null}
        onClose={() => setEditing(false)}
      />
    </>
  );
}
