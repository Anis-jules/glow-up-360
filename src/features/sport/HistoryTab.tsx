import { CalendarCheck, Check, Dumbbell, Flame, History, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import { BarChart, Button, Card, CheckRow, Chip, EmptyState, Field, Rating, SectionHeader, Sheet, Stat, TextArea } from '@/components/ui';
import { addDays, formatRelative, formatShort, startOfWeek } from '@/lib/dates';
import { applyProgression, getProgressionInfo, snapshotDay } from '@/lib/progress';
import { useData, useUpdate } from '@/lib/store';
import type { DateKey } from '@/lib/types';
import { cx } from '@/lib/utils';
import { describeExercise, ensureLog, FEELING_LABELS, isComplete, setExerciseDone } from './sportUtils';

export function HistoryTab({ today }: { today: DateKey }) {
  const data = useData();
  const update = useUpdate();
  const sport = data.sport;
  const [openKey, setOpenKey] = useState<DateKey | null>(null);
  const [limit, setLimit] = useState(20);

  const entries = useMemo(
    () =>
      Object.entries(sport.log)
        .filter(([k, e]) => k < today || (k === today && e.done.length > 0))
        .sort(([a], [b]) => (a < b ? 1 : -1))
        .map(([key, entry]) => {
          const workout = sport.workouts.find((w) => w.id === entry.workoutId) ?? null;
          return { key, entry, workout, complete: isComplete(entry, workout) };
        }),
    [sport.log, sport.workouts, today],
  );

  const month = today.slice(0, 7);
  const completeMonth = entries.filter((e) => e.complete && e.key.startsWith(month)).length;
  const completeTotal = entries.filter((e) => e.complete).length;
  const exercisesDone = entries.reduce((acc, e) => acc + e.entry.done.length, 0);
  const feelings = entries.map((e) => e.entry.feeling ?? 0).filter((f) => f > 0);
  const avgFeeling = feelings.length ? feelings.reduce((a, b) => a + b, 0) / feelings.length : 0;

  const plannedPerWeek = sport.week.filter((id) => {
    const w = id ? sport.workouts.find((x) => x.id === id) : null;
    return !!w && w.exercises.some((e) => !e.optional);
  }).length;

  const weeks = useMemo(() => {
    const thisWeek = startOfWeek(today);
    return Array.from({ length: 8 }, (_, i) => {
      const start = addDays(thisWeek, (i - 7) * 7);
      const end = addDays(start, 6);
      const count = entries.filter((e) => e.complete && e.key >= start && e.key <= end).length;
      return { label: formatShort(start).replace('.', ''), value: count, highlight: i === 7, title: `Semaine du ${formatShort(start)} : ${count} séance${count > 1 ? 's' : ''} complète${count > 1 ? 's' : ''}` };
    });
  }, [entries, today]);

  const open = openKey ? entries.find((e) => e.key === openKey) : undefined;
  const openPhase = openKey ? getProgressionInfo(sport, openKey).phase : null;

  return (
    <div className="space-y-5">
      <div className="grid animate-rise grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Complètes ce mois" value={completeMonth} icon={<CalendarCheck />} />
        <Stat label="Complètes au total" value={completeTotal} icon={<Flame />} />
        <Stat label="Exercices validés" value={exercisesDone} icon={<Dumbbell />} />
        <Stat
          label="Ressenti moyen"
          value={avgFeeling ? avgFeeling.toFixed(1).replace('.', ',') : '–'}
          sub={avgFeeling ? FEELING_LABELS[Math.round(avgFeeling) - 1] : 'Note tes séances terminées'}
          icon={<Star />}
        />
      </div>

      <Card padding="md" className="animate-rise" style={{ animationDelay: '60ms' }}>
        <SectionHeader title="Séances complètes par semaine" subtitle={`8 dernières semaines · objectif ${plannedPerWeek} par semaine (pointillés)`} />
        <BarChart bars={weeks} goal={plannedPerWeek || undefined} showValues height={150} />
      </Card>

      <Card padding="md" className="animate-rise" style={{ animationDelay: '100ms' }}>
        <SectionHeader title="Journal des séances" subtitle="Touche une journée pour voir le détail" icon={<History />} />
        {entries.length === 0 ? (
          <EmptyState icon={<History />} title="Pas encore d’historique">
            Valide tes premiers exercices dans l’onglet « Aujourd’hui » : chaque séance apparaîtra ici.
          </EmptyState>
        ) : (
          <>
            <ul className="-mx-2 divide-y divide-line">
              {entries.slice(0, limit).map(({ key, entry, complete }) => (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => setOpenKey(key)}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-ink/[0.03]"
                  >
                    <span
                      className={cx(
                        'grid size-9 shrink-0 place-items-center rounded-xl',
                        complete ? 'bg-tint text-tint-ink' : 'bg-surface-2 text-ink-3',
                      )}
                    >
                      {complete ? <Check className="size-4" strokeWidth={3} /> : <Dumbbell className="size-4" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-medium">{entry.workoutTitle}</span>
                      <span className="block truncate text-[13px] text-ink-3">
                        {formatRelative(key, today)}
                        {entry.note ? ` · ${entry.note}` : ''}
                      </span>
                    </span>
                    {!!entry.feeling && (
                      <span className="flex shrink-0 items-center gap-0.5 text-xs text-ink-3 tabular">
                        <Star className="size-3.5 fill-tint text-tint" /> {entry.feeling}
                      </span>
                    )}
                    <Chip tone={complete ? 'tint' : 'neutral'} className="shrink-0 tabular">
                      {Math.min(entry.done.length, entry.total || entry.done.length)}/{entry.total}
                    </Chip>
                  </button>
                </li>
              ))}
            </ul>
            {entries.length > limit && (
              <Button variant="ghost" className="mt-2 w-full" onClick={() => setLimit((l) => l + 20)}>
                Afficher plus
              </Button>
            )}
          </>
        )}
      </Card>

      <Sheet
        open={!!open}
        onClose={() => setOpenKey(null)}
        title={open?.entry.workoutTitle}
        subtitle={open ? `${formatRelative(open.key, today)}${open.complete ? ' · séance complète' : ''}` : undefined}
      >
        {open && (
          <div className="space-y-5">
            {open.workout ? (
              <div className="-mx-2 divide-y divide-line">
                {[...open.workout.exercises, ...(open.entry.extras ?? [])].map((e) => {
                  const eff = applyProgression(e, openPhase);
                  return (
                    <CheckRow
                      key={e.id}
                      checked={open.entry.done.includes(e.id)}
                      onToggle={(v) =>
                        update((d) => {
                          setExerciseDone(d, open.key, e.id, v);
                          if (open.key < today) snapshotDay(d, open.key);
                        })
                      }
                      title={e.name}
                      subtitle={describeExercise(eff)}
                      muted={e.optional}
                    />
                  );
                })}
              </div>
            ) : (
              <p className="rounded-xl bg-surface-2 p-3 text-sm text-ink-2">
                Cette séance a été supprimée de ta bibliothèque. {open.entry.done.length} exercice
                {open.entry.done.length > 1 ? 's' : ''} validé{open.entry.done.length > 1 ? 's' : ''} sur {open.entry.total}.
              </p>
            )}
            <div>
              <span className="mb-1 block text-[13px] font-medium text-ink-2">Ressenti</span>
              <Rating
                value={open.entry.feeling ?? 0}
                labels={FEELING_LABELS}
                onChange={(v) =>
                  update((d) => {
                    const e = d.sport.log[open.key] ?? ensureLog(d, open.key);
                    if (e) e.feeling = v || undefined;
                  })
                }
              />
            </div>
            <Field label="Note">
              <TextArea
                minRows={2}
                value={open.entry.note}
                placeholder="Ce que tu veux retenir de cette séance…"
                onChange={(ev) =>
                  update((d) => {
                    const e = d.sport.log[open.key];
                    if (e) e.note = ev.target.value;
                  })
                }
              />
            </Field>
          </div>
        )}
      </Sheet>
    </div>
  );
}
