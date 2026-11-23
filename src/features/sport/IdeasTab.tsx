import { CalendarPlus, ChevronRight, Lightbulb, Plus } from 'lucide-react';
import { useState } from 'react';
import { Button, Card, Chip, Field, Select, Sheet } from '@/components/ui';
import { formatShort } from '@/lib/dates';
import { toast } from '@/lib/feedback';
import { getWorkoutForDate } from '@/lib/progress';
import { useData, useUpdate } from '@/lib/store';
import type { DateKey, Exercise } from '@/lib/types';
import { cx, uid } from '@/lib/utils';
import { IDEA_GROUPS } from './ideas';
import { addExtra, describeExercise, ensureLog } from './sportUtils';

/** Banque d'idées d'exercices maison : à consulter, à ajouter au jour ou à une séance. */
export function IdeasTab({ today }: { today: DateKey }) {
  const [group, setGroup] = useState<string>('all');
  const [open, setOpen] = useState<Exercise | null>(null);
  const groups = group === 'all' ? IDEA_GROUPS : IDEA_GROUPS.filter((g) => g.id === group);
  const total = IDEA_GROUPS.reduce((a, g) => a + g.ideas.length, 0);

  return (
    <div className="space-y-5">
      <div className="flex animate-rise items-start gap-3 rounded-2xl bg-tint/10 p-4">
        <Lightbulb className="mt-0.5 size-5 shrink-0 text-tint" />
        <p className="text-sm leading-relaxed text-ink-2">
          <span className="font-semibold text-ink">{total} idées d’exercices à faire chez toi</span>, sans matériel (une chaise ou une
          marche au plus). Touche un exercice pour voir comment le faire et l’ajouter à ta séance du jour.
        </p>
      </div>

      <div className="scrollbar-none -mx-4 flex animate-rise gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {[{ id: 'all', title: 'Tout', emoji: '✨' }, ...IDEA_GROUPS].map((g) => (
          <button
            key={g.id}
            type="button"
            aria-pressed={group === g.id}
            onClick={() => setGroup(g.id)}
            className={cx(
              'flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-medium transition-colors',
              group === g.id ? 'bg-tint text-tint-ink' : 'bg-ink/[0.05] text-ink-2 hover:text-ink',
            )}
          >
            <span>{g.emoji}</span>
            {g.title}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
        {groups.map((g, gi) => (
          <Card key={g.id} padding="md" className="animate-rise" style={{ animationDelay: `${60 + gi * 40}ms` }}>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xl">{g.emoji}</span>
              <h2 className="min-w-0 flex-1 truncate text-[17px] font-semibold">{g.title}</h2>
              <Chip>{g.ideas.length}</Chip>
            </div>
            <div className="-mx-2 divide-y divide-line">
              {g.ideas.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => setOpen(ex)}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-ink/[0.03]"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] font-medium">{ex.name}</span>
                    <span className="block truncate text-[13px] text-ink-3">{describeExercise(ex)}</span>
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-ink-3" />
                </button>
              ))}
            </div>
          </Card>
        ))}
      </div>

      <IdeaSheet idea={open} today={today} onClose={() => setOpen(null)} />
    </div>
  );
}

function IdeaSheet({ idea, today, onClose }: { idea: Exercise | null; today: DateKey; onClose: () => void }) {
  const data = useData();
  const update = useUpdate();
  const [target, setTarget] = useState('');
  const todayWorkout = getWorkoutForDate(data.sport, today);
  const workouts = data.sport.workouts;
  const targetId = target || todayWorkout?.id || workouts[0]?.id || '';

  const addToday = () => {
    if (!idea) return;
    update((d) => void addExtra(d, today, idea));
    toast(`« ${idea.name} » ajouté à ta séance du jour`, { tone: 'success' });
    onClose();
  };

  const addToWorkout = () => {
    const w = workouts.find((x) => x.id === targetId);
    if (!idea || !w) return;
    update((d) => {
      d.sport.workouts.find((x) => x.id === w.id)?.exercises.push({ ...idea, id: uid('e') });
      if (d.sport.log[today]?.workoutId === w.id) ensureLog(d, today);
    });
    toast(`« ${idea.name} » ajouté à la séance « ${w.title} »`, { tone: 'success' });
    onClose();
  };

  return (
    <Sheet open={!!idea} onClose={onClose} size="lg" title={idea?.name} subtitle={idea ? describeExercise(idea) : undefined} icon={<Lightbulb />}>
      {idea && (
        <div className="space-y-5">
          <div>
            <h3 className="mb-1.5 text-[13px] font-semibold tracking-wide text-ink-3 uppercase">Comment faire</h3>
            <p className="text-[15px] leading-relaxed text-ink-2">{idea.instructions}</p>
          </div>

          <div className="rounded-2xl bg-surface-2 p-4">
            <div className="text-sm font-semibold">Aujourd’hui ({formatShort(today)})</div>
            <p className="mt-0.5 text-[13px] text-ink-3">
              {todayWorkout ? `En plus de ta séance « ${todayWorkout.title} », pour aujourd’hui seulement.` : 'Pas de séance prévue aujourd’hui : choisis-en une dans l’onglet Aujourd’hui pour pouvoir ajouter un exercice.'}
            </p>
            <Button variant="tint" className="mt-3 w-full" onClick={addToday} disabled={!todayWorkout}>
              <Plus /> Ajouter à ma séance du jour
            </Button>
          </div>

          {workouts.length > 0 && (
            <div className="rounded-2xl border border-line p-4">
              <div className="text-sm font-semibold">Dans une séance, pour les prochaines fois</div>
              <Field className="mt-3">
                <Select value={targetId} onChange={(e) => setTarget(e.target.value)}>
                  {workouts.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.title}
                    </option>
                  ))}
                </Select>
              </Field>
              <Button variant="secondary" className="mt-3 w-full" onClick={addToWorkout}>
                <CalendarPlus /> Ajouter à cette séance
              </Button>
            </div>
          )}

          <p className="text-xs leading-relaxed text-ink-3">
            Les valeurs sont des repères pour débuter : ajuste-les ensuite en touchant l’exercice. En cas de douleur, arrête.
          </p>
        </div>
      )}
    </Sheet>
  );
}
