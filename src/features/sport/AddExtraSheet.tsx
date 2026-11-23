import { Lightbulb, Plus, Repeat } from 'lucide-react';
import { useState } from 'react';
import { Button, Sheet, Toggle } from '@/components/ui';
import { toast } from '@/lib/feedback';
import { getDayExercises } from '@/lib/progress';
import { useData, useUpdate } from '@/lib/store';
import type { DateKey, Exercise, Workout } from '@/lib/types';
import { uid } from '@/lib/utils';
import { addExtra, describeExercise, ensureLog, EXTRA_IDEAS, extrasRef, newExercise } from './sportUtils';

const norm = (s: string) => s.trim().toLowerCase();

/**
 * Ajouter un exercice à la séance du jour : un de mes exercices, une idée sans matériel, ou une création.
 * Par défaut l'ajout ne vaut que pour la journée ; l'interrupteur l'inscrit aussi dans la séance.
 */
export function AddExtraSheet({
  open,
  onClose,
  today,
  workout,
  onEdit,
}: {
  open: boolean;
  onClose: () => void;
  today: DateKey;
  workout: Workout;
  /** Ouvre l'éditeur sur l'exercice créé (ref = id de séance ou « extra:date »). */
  onEdit: (ref: string, exerciseId: string) => void;
}) {
  const data = useData();
  const update = useUpdate();
  const [permanent, setPermanent] = useState(false);

  const todayNames = new Set(getDayExercises(data.sport, today).map((e) => norm(e.name)));
  const library: Exercise[] = [];
  const seen = new Set<string>();
  // Seulement les exercices de renforcement (pas l'échauffement, la marche ou la mobilité).
  for (const w of data.sport.workouts.filter((x) => x.type === 'force' || x.type === 'perso')) {
    for (const e of w.exercises) {
      const n = norm(e.name);
      if (seen.has(n) || todayNames.has(n) || e.kind === 'interval' || e.kind === 'free') continue;
      seen.add(n);
      library.push(e);
    }
  }
  const ideas = EXTRA_IDEAS.filter((e) => !todayNames.has(norm(e.name)) && !seen.has(norm(e.name)));

  const add = (source: Exercise) => {
    update((d) => {
      if (permanent) {
        const w = d.sport.workouts.find((x) => x.id === workout.id);
        w?.exercises.push({ ...source, id: uid('e'), optional: false });
        if (d.sport.log[today]) ensureLog(d, today); // recalcule le nombre d'exercices du jour
      } else {
        addExtra(d, today, source);
      }
    });
    toast(
      permanent ? `« ${source.name} » ajouté à la séance « ${workout.title} »` : `« ${source.name} » ajouté à ta séance du jour`,
      { tone: 'success' },
    );
    onClose();
  };

  const create = () => {
    const out: { ref: string; id: string | null } = { ref: '', id: null };
    update((d) => {
      if (permanent) {
        const ex = newExercise();
        d.sport.workouts.find((x) => x.id === workout.id)?.exercises.push(ex);
        if (d.sport.log[today]) ensureLog(d, today);
        out.ref = workout.id;
        out.id = ex.id;
      } else {
        out.id = addExtra(d, today, { ...newExercise(), name: 'Mon exercice' });
        out.ref = extrasRef(today);
      }
    });
    onClose();
    if (out.id) onEdit(out.ref, out.id);
  };

  const Row = ({ ex }: { ex: Exercise }) => (
    <button
      type="button"
      onClick={() => add(ex)}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-ink/[0.04]"
    >
      <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-tint/12 text-tint">
        <Plus className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-medium">{ex.name}</span>
        <span className="block truncate text-[13px] text-ink-3">{describeExercise(ex)}</span>
      </span>
    </button>
  );

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Ajouter un exercice"
      subtitle={permanent ? `Il rejoint la séance « ${workout.title} » pour les prochaines fois aussi.` : 'Il s’ajoute à ta séance d’aujourd’hui seulement.'}
      icon={<Plus />}
    >
      <div className="space-y-5">
        <div className="rounded-2xl border border-line px-4">
          <Toggle
            className="py-3"
            label={`Garder dans « ${workout.title} »`}
            description="Sinon, l’exercice ne vaut que pour aujourd’hui."
            checked={permanent}
            onChange={setPermanent}
          />
        </div>

        <Button variant="tint" className="w-full" onClick={create}>
          <Plus /> Créer mon exercice
        </Button>

        {library.length > 0 && (
          <div>
            <h3 className="mb-1 flex items-center gap-1.5 px-1 text-[13px] font-semibold tracking-wide text-ink-3 uppercase">
              <Repeat className="size-3.5" /> Mes exercices
            </h3>
            <div className="-mx-1">
              {library.map((ex) => (
                <Row key={`lib-${ex.id}`} ex={ex} />
              ))}
            </div>
          </div>
        )}

        {ideas.length > 0 && (
          <div>
            <h3 className="mb-1 flex items-center gap-1.5 px-1 text-[13px] font-semibold tracking-wide text-ink-3 uppercase">
              <Lightbulb className="size-3.5" /> Idées sans matériel
            </h3>
            <div className="-mx-1">
              {ideas.map((ex) => (
                <Row key={ex.id} ex={ex} />
              ))}
            </div>
          </div>
        )}

        <p className="text-xs leading-relaxed text-ink-3">
          Valeurs modifiables ensuite en touchant l’exercice. Ajoute à ton rythme : mieux vaut un exercice bien fait que trois bâclés.
        </p>
      </div>
    </Sheet>
  );
}
