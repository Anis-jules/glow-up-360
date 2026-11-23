import { Copy, Dumbbell, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button, Card, Chip, EmptyState, IconButton, ReorderButtons, SectionHeader } from '@/components/ui';
import { toast } from '@/lib/feedback';
import { useData, useUpdate } from '@/lib/store';
import { cx, moveItem } from '@/lib/utils';
import {
  daysUsing,
  duplicateWorkout,
  estimateWorkoutSec,
  formatEstimate,
  newWorkout,
  WORKOUT_TYPE_LABEL,
} from './sportUtils';
import { deleteWorkout, WorkoutEditor } from './WorkoutEditor';

/** Bibliothèque des séances : programme initial et séances personnelles. */
export function LibraryTab() {
  const data = useData();
  const update = useUpdate();
  const sport = data.sport;
  const [editMode, setEditMode] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);

  const add = () => {
    const w = newWorkout();
    update((d) => void d.sport.workouts.push(w));
    setEditing(w.id);
  };

  return (
    <div>
      <SectionHeader
        title="Mes séances"
        subtitle={`${sport.workouts.length} séance${sport.workouts.length > 1 ? 's' : ''} · touche une séance pour la modifier`}
        editing={editMode}
        onToggleEdit={() => setEditMode((v) => !v)}
        onAdd={add}
        addLabel="Ajouter une séance"
      />
      {sport.workouts.length === 0 ? (
        <EmptyState
          icon={<Dumbbell />}
          title="Aucune séance"
          action={
            <Button variant="tint" onClick={add}>
              <Plus /> Créer ma première séance
            </Button>
          }
        >
          Crée tes propres séances, puis place-les dans ton planning de la semaine.
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {sport.workouts.map((w, i) => {
            const days = daysUsing(sport, w.id);
            return (
              <Card
                key={w.id}
                interactive={!editMode}
                padding="md"
                className="flex animate-rise flex-col"
                style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}
                onClick={() => !editMode && setEditing(w.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <Chip tone="tint">{WORKOUT_TYPE_LABEL[w.type]}</Chip>
                  {editMode && (
                    <div className="-mt-1 -mr-1 flex items-center">
                      <ReorderButtons
                        index={i}
                        count={sport.workouts.length}
                        onMove={(to) => update((d) => moveItem(d.sport.workouts, i, to))}
                      />
                      <IconButton
                        label={`Dupliquer ${w.title}`}
                        size="icon-sm"
                        onClick={() => {
                          update((d) => void d.sport.workouts.splice(i + 1, 0, duplicateWorkout(w)));
                          toast('Séance dupliquée', { tone: 'success' });
                        }}
                      >
                        <Copy />
                      </IconButton>
                      <IconButton label={`Supprimer ${w.title}`} size="icon-sm" onClick={() => deleteWorkout(w)}>
                        <Trash2 />
                      </IconButton>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  className="mt-3 text-left"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditing(w.id);
                  }}
                >
                  <h3 className="text-[17px] font-semibold">{w.title}</h3>
                  {w.focus && <p className="mt-0.5 line-clamp-2 text-[13px] text-ink-2">{w.focus}</p>}
                </button>
                <div className="mt-auto pt-3 text-[13px] text-ink-3">
                  {w.exercises.length} exercice{w.exercises.length > 1 ? 's' : ''} · {formatEstimate(estimateWorkoutSec(w.exercises))}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {days.length ? (
                    days.map((d) => (
                      <span key={d} className="rounded-md bg-tint/12 px-1.5 py-0.5 text-[11px] font-semibold text-tint">
                        {d}
                      </span>
                    ))
                  ) : (
                    <span className={cx('text-[11px] text-ink-3')}>Pas dans le planning</span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <WorkoutEditor workoutId={editing} onClose={() => setEditing(null)} />
    </div>
  );
}
