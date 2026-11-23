import { CalendarDays, Check, Circle } from 'lucide-react';
import type { ReactNode } from 'react';
import { Chip, ProgressBar, ProgressRing, Sheet } from '@/components/ui';
import { capitalize, formatLong, formatMinutes, useToday, weekdayOf } from '@/lib/dates';
import { getDaySummary, getWorkoutForDate, MODULE_KEYS, MODULE_LABELS } from '@/lib/progress';
import { useData } from '@/lib/store';
import type { DateKey } from '@/lib/types';
import { cx } from '@/lib/utils';
import { goalMinutes, isSessionComplete } from './statsUtils';

function Block({ title, color, children }: { title: string; color: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-surface-2 p-4">
      <h3 className="mb-2 flex items-center gap-2 text-[15px] font-semibold">
        <span className="size-2.5 rounded-full" style={{ background: color }} />
        {title}
      </h3>
      {children}
    </section>
  );
}

function Line({ done, children }: { done: boolean; children: ReactNode }) {
  return (
    <li className="flex items-center gap-2 py-0.5 text-sm">
      {done ? <Check className="size-4 shrink-0 text-success" /> : <Circle className="size-4 shrink-0 text-ink/25" />}
      <span className={cx('min-w-0 truncate', !done && 'text-ink-2')}>{children}</span>
    </li>
  );
}

/** Détail d'une journée : progression par rubrique et ce qui a été fait. */
export function DayDetailSheet({ dayKey, onClose }: { dayKey: DateKey | null; onClose: () => void }) {
  const data = useData();
  const today = useToday();
  const k = dayKey;
  const summary = k ? getDaySummary(data, k, today) : null;
  const threshold = data.settings.completionThreshold;

  let body: ReactNode = null;
  if (k && summary) {
    const wd = weekdayOf(k);
    const habits = data.habits.items.filter((h) => !h.archived && h.days.includes(wd));
    const habitsDone = new Set(data.habits.log[k] ?? []);
    const workout = getWorkoutForDate(data.sport, k);
    const sportEntry = data.sport.log[k];
    const meals = data.nutrition.mealLog[k] ?? {};
    const water = data.nutrition.water.log[k] ?? 0;
    const faceSteps = data.face.routines.flatMap((r) => r.steps.map((s) => ({ ...s, routine: r.name })));
    const faceDone = new Set(data.face.log[k]?.done ?? []);
    const faceEntry = data.face.log[k];

    body = (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <ProgressRing value={summary.pct / 100} size={92} stroke={9}>
            <span className="font-display text-xl font-semibold tabular">{summary.pct} %</span>
          </ProgressRing>
          <div className="min-w-0 flex-1 space-y-2">
            {summary.pct >= threshold ? (
              <Chip tone="success">
                <Check /> Journée réussie
              </Chip>
            ) : (
              <Chip>Seuil : {threshold} %</Chip>
            )}
            {MODULE_KEYS.filter((m) => summary.modules[m] !== undefined).map((m) => (
              <div key={m} className="flex items-center gap-2 text-xs">
                <span className="w-16 shrink-0 text-ink-2">{MODULE_LABELS[m]}</span>
                <ProgressBar value={summary.modules[m] ?? 0} color={`var(--c-${m})`} height={6} className="min-w-0 flex-1" />
                <span className="w-9 shrink-0 text-right tabular text-ink-3">{Math.round((summary.modules[m] ?? 0) * 100)} %</span>
              </div>
            ))}
          </div>
        </div>

        <Block title="Habitudes" color="var(--c-habits)">
          {habits.length ? (
            <ul>
              {habits.map((h) => (
                <Line key={h.id} done={habitsDone.has(h.id)}>
                  {h.emoji} {h.title}
                </Line>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-3">Aucune habitude prévue ce jour-là.</p>
          )}
        </Block>

        <Block title="Sport" color="var(--c-sport)">
          {workout || sportEntry ? (
            <div className="text-sm">
              <div className="font-medium">
                {sportEntry?.workoutTitle ?? workout?.title}
                {isSessionComplete(data, k) && <span className="ml-2 text-success">· terminée</span>}
              </div>
              {workout && (
                <ul className="mt-1">
                  {workout.exercises.map((e) => (
                    <Line key={e.id} done={!!sportEntry?.done.includes(e.id)}>
                      {e.name}
                      {e.optional ? ' (facultatif)' : ''}
                    </Line>
                  ))}
                </ul>
              )}
              {sportEntry?.feeling ? <p className="mt-1 text-ink-3">Ressenti : {sportEntry.feeling}/5</p> : null}
              {sportEntry?.note ? <p className="mt-1 text-ink-2 italic">« {sportEntry.note} »</p> : null}
            </div>
          ) : (
            <p className="text-sm text-ink-3">Pas de séance prévue.</p>
          )}
        </Block>

        <Block title="Nutrition" color="var(--c-nutrition)">
          <ul>
            {data.nutrition.slots.map((s) => (
              <Line key={s.id} done={!!meals[s.id]?.done}>
                {s.emoji} {s.name}
                {meals[s.id]?.actual ? ` · ${meals[s.id].actual}` : ''}
              </Line>
            ))}
          </ul>
          <div className="mt-2 flex items-center gap-2 text-xs text-ink-2">
            <span className="shrink-0">Eau</span>
            <ProgressBar value={data.nutrition.water.goalMl ? water / data.nutrition.water.goalMl : 0} color="var(--c-nutrition)" height={6} className="min-w-0 flex-1" />
            <span className="shrink-0 tabular">
              {(water / 1000).toLocaleString('fr-FR')} L / {(data.nutrition.water.goalMl / 1000).toLocaleString('fr-FR')} L
            </span>
          </div>
        </Block>

        <Block title="Visage" color="var(--c-face)">
          <ul>
            {faceSteps.map((s) => (
              <Line key={s.id} done={faceDone.has(s.id)}>
                {s.routine} · {s.title}
                {s.optional ? ' (facultatif)' : ''}
              </Line>
            ))}
          </ul>
          {faceEntry?.skinFeel ? <p className="mt-1 text-sm text-ink-3">Ressenti de la peau : {faceEntry.skinFeel}/5</p> : null}
          {faceEntry?.note ? <p className="mt-1 text-sm text-ink-2 italic">« {faceEntry.note} »</p> : null}
        </Block>

        <Block title="Esprit" color="var(--c-mind)">
          <ul className="space-y-1.5">
            {data.mind.goals.map((g) => {
              const min = goalMinutes(data, k, g.id);
              return (
                <li key={g.id} className="flex items-center gap-2 text-sm">
                  <span className="w-5 shrink-0 text-center">{g.emoji}</span>
                  <span className="min-w-0 flex-1 truncate">{g.title}</span>
                  <span className={cx('shrink-0 tabular', min >= g.minutes ? 'text-success' : 'text-ink-3')}>
                    {formatMinutes(min)} / {formatMinutes(g.minutes)}
                  </span>
                </li>
              );
            })}
          </ul>
        </Block>

        {k < today && (
          <p className="text-xs text-ink-3">
            Le pourcentage d’un jour passé est celui enregistré ce jour-là ; le détail utilise tes listes actuelles.
          </p>
        )}
      </div>
    );
  }

  return (
    <Sheet
      open={!!k}
      onClose={onClose}
      icon={<CalendarDays />}
      title={k ? capitalize(formatLong(k, true)) : ''}
      subtitle={k === today ? 'Aujourd’hui, en cours' : undefined}
    >
      {body}
    </Sheet>
  );
}
