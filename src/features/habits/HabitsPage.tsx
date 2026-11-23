import { Archive, ArchiveRestore, ListChecks, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  Button,
  Card,
  Checkbox,
  CheckRow,
  Chip,
  DayPicker,
  EmojiField,
  EmptyState,
  Field,
  IconButton,
  ModuleScope,
  ProgressRing,
  ReorderButtons,
  SectionHeader,
  Segmented,
  Sheet,
  TextArea,
  TextInput,
} from '@/components/ui';
import { toggleHabit } from '@/lib/actions';
import {
  addDays,
  capitalize,
  formatLong,
  formatRelative,
  lastNDays,
  useToday,
  weekDates,
  weekdayOf,
  WEEKDAYS,
  WEEKDAYS_LETTER,
  WEEKDAYS_SHORT,
} from '@/lib/dates';
import { removeWithUndo } from '@/lib/feedback';
import { useData, useUpdate } from '@/lib/store';
import type { AppData, DateKey, Habit, HabitMoment, ID, Weekday } from '@/lib/types';
import { cx, moveItem, uid } from '@/lib/utils';

const MOMENTS: { id: HabitMoment; label: string }[] = [
  { id: 'matin', label: 'Matin' },
  { id: 'journee', label: 'Journée' },
  { id: 'soir', label: 'Soir' },
  { id: 'libre', label: 'Quand tu veux' },
];

const EMOJIS = ['💧', '🚶', '🧘', '📵', '✨', '🌙', '🗓️', '🍎', '📖', '🦷', '☀️', '💊'];

function daysLabel(days: Habit['days']): string {
  if (days.length === 7) return 'Tous les jours';
  if (days.length === 0) return 'Aucun jour';
  if (days.length === 5 && [0, 1, 2, 3, 4].every((d) => days.includes(d as Weekday))) return 'En semaine';
  if (days.length === 2 && days.includes(5) && days.includes(6)) return 'Le week-end';
  return days.map((d) => WEEKDAYS_SHORT[d]).join(', ');
}

/** Série d'une habitude : jours prévus consécutifs cochés (un jour non prévu ne casse rien). */
function habitStreak(data: AppData, habit: Habit, today: DateKey): number {
  let n = 0;
  const doneToday = (data.habits.log[today] ?? []).includes(habit.id);
  if (doneToday) n = 1;
  for (let i = 1; i < 400; i++) {
    const k = addDays(today, -i);
    if (k < data.createdAt) break;
    if (!habit.days.includes(weekdayOf(k))) continue;
    if ((data.habits.log[k] ?? []).includes(habit.id)) n += 1;
    else break;
  }
  return n;
}

function dayFraction(data: AppData, key: DateKey): number | null {
  const wd = weekdayOf(key);
  const scheduled = data.habits.items.filter((h) => !h.archived && h.days.includes(wd));
  if (!scheduled.length) return null;
  const done = new Set(data.habits.log[key] ?? []);
  return scheduled.filter((h) => done.has(h.id)).length / scheduled.length;
}

export default function HabitsPage() {
  const data = useData();
  const update = useUpdate();
  const today = useToday();
  const [selected, setSelected] = useState<DateKey>(today);
  const [editing, setEditing] = useState(false);
  const [openId, setOpenId] = useState<ID | null>(null);
  const [view, setView] = useState<'jour' | 'semaine'>('jour');

  const day = selected > today ? today : selected;
  const wd = weekdayOf(day);
  const active = data.habits.items.filter((h) => !h.archived);
  const archived = data.habits.items.filter((h) => h.archived);
  const scheduled = active.filter((h) => h.days.includes(wd));
  const others = active.filter((h) => !h.days.includes(wd));
  const doneSet = new Set(data.habits.log[day] ?? []);
  const doneCount = scheduled.filter((h) => doneSet.has(h.id)).length;
  const week = weekDates(today);

  const streaks = useMemo(() => {
    const m = new Map<ID, number>();
    for (const h of data.habits.items) if (!h.archived) m.set(h.id, habitStreak(data, h, today));
    return m;
  }, [data, today]);

  const addHabit = () => {
    const id = uid('h');
    update((d) => {
      d.habits.items.push({ id, title: 'Nouvelle habitude', emoji: '✨', days: [0, 1, 2, 3, 4, 5, 6], moment: 'libre', note: '', archived: false });
    });
    setOpenId(id);
  };

  const toggle = (id: ID, v: boolean) => update((d) => toggleHabit(d, day, id, v));

  return (
    <ModuleScope module="habits">
      <PageHeader
        icon={<ListChecks />}
        eyebrow={capitalize(formatLong(today))}
        title="Habitudes"
        subtitle={scheduled.length ? `${doneCount} sur ${scheduled.length} ${day === today ? 'aujourd’hui' : formatRelative(day, today).toLowerCase()}` : 'Rien de prévu ce jour-là'}
        actions={
          <>
            <Segmented
              options={[
                { value: 'jour', label: 'Jour' },
                { value: 'semaine', label: 'Semaine' },
              ]}
              value={view}
              onChange={setView}
            />
            <Button variant="tint" onClick={addHabit}>
              <Plus /> Nouvelle habitude
            </Button>
          </>
        }
      />

      {/* Semaine en cours : choisir un jour pour rattraper un oubli */}
      <div className="mb-5 grid animate-rise grid-cols-7 gap-1.5 sm:gap-2">
        {week.map((k, i) => {
          const frac = dayFraction(data, k);
          const future = k > today;
          const isSel = k === day;
          return (
            <button
              key={k}
              type="button"
              disabled={future}
              onClick={() => setSelected(k)}
              className={cx(
                'flex flex-col items-center gap-1.5 rounded-2xl py-2.5 transition-colors disabled:opacity-40',
                isSel ? 'bg-tint/12' : 'hover:bg-ink/[0.04]',
              )}
            >
              <span className={cx('text-[11px] font-medium', k === today ? 'text-tint' : 'text-ink-3')}>
                {WEEKDAYS_SHORT[i]}
              </span>
              <ProgressRing value={frac ?? 0} size={34} stroke={4}>
                <span className="text-[11px] font-semibold tabular">{Number(k.slice(8))}</span>
              </ProgressRing>
            </button>
          );
        })}
      </div>

      {view === 'semaine' ? (
        <WeekGrid data={data} today={today} onToggle={(k, id, v) => update((d) => toggleHabit(d, k, id, v))} onOpen={setOpenId} />
      ) : (
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="animate-rise" style={{ animationDelay: '60ms' }}>
            <SectionHeader
              title={day === today ? 'Aujourd’hui' : capitalize(formatLong(day))}
              subtitle={day !== today ? 'Tu peux cocher un oubli de cette semaine.' : undefined}
              editing={editing}
              onToggleEdit={() => setEditing((e) => !e)}
              onAdd={addHabit}
            />
            {editing ? (
              <EditList data={data} onOpen={setOpenId} />
            ) : scheduled.length === 0 ? (
              <EmptyState icon={<ListChecks />} title="Aucune habitude prévue" action={<Button onClick={addHabit}><Plus /> Ajouter</Button>}>
                Ajoute une habitude ou choisis ses jours dans son détail.
              </EmptyState>
            ) : (
              <div className="space-y-4">
                {MOMENTS.map((m) => {
                  const list = scheduled.filter((h) => h.moment === m.id);
                  if (!list.length) return null;
                  return (
                    <div key={m.id}>
                      <div className="mb-1 px-2 text-xs font-semibold tracking-wide text-ink-3 uppercase">{m.label}</div>
                      {list.map((h) => {
                        const s = streaks.get(h.id) ?? 0;
                        return (
                          <CheckRow
                            key={h.id}
                            checked={doneSet.has(h.id)}
                            onToggle={(v) => toggle(h.id, v)}
                            leading={<span className="text-xl leading-none">{h.emoji}</span>}
                            title={h.title}
                            subtitle={h.note || undefined}
                            onOpen={() => setOpenId(h.id)}
                            trailing={s >= 2 ? <Chip tone="tint">{s} j</Chip> : undefined}
                          />
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
            {!editing && others.length > 0 && (
              <details className="group mt-4 border-t border-line pt-3">
                <summary className="cursor-pointer list-none px-2 text-[13px] font-medium text-ink-3 hover:text-ink-2">
                  Pas prévues ce jour-là ({others.length}) · en bonus
                </summary>
                <div className="mt-1">
                  {others.map((h) => (
                    <CheckRow
                      key={h.id}
                      muted
                      checked={doneSet.has(h.id)}
                      onToggle={(v) => toggle(h.id, v)}
                      leading={<span className="text-xl leading-none opacity-70">{h.emoji}</span>}
                      title={h.title}
                      subtitle={daysLabel(h.days)}
                      onOpen={() => setOpenId(h.id)}
                    />
                  ))}
                </div>
              </details>
            )}
          </Card>

          <div className="space-y-5">
            <Card className="animate-rise" style={{ animationDelay: '120ms' }}>
              <div className="flex items-center gap-4">
                <ProgressRing value={scheduled.length ? doneCount / scheduled.length : 0} size={84} stroke={8}>
                  <span className="font-display text-lg font-semibold tabular">
                    {scheduled.length ? Math.round((doneCount / scheduled.length) * 100) : 0}%
                  </span>
                </ProgressRing>
                <div className="min-w-0">
                  <div className="font-semibold">{day === today ? 'Ta journée' : capitalize(formatRelative(day, today))}</div>
                  <p className="mt-0.5 text-sm text-ink-2">
                    {doneCount === scheduled.length && scheduled.length > 0
                      ? 'Tout est coché. Bravo.'
                      : doneCount === 0
                        ? 'Une seule habitude suffit pour lancer la journée.'
                        : `Encore ${scheduled.length - doneCount}, sans pression.`}
                  </p>
                </div>
              </div>
            </Card>
            {archived.length > 0 && (
              <Card className="animate-rise" style={{ animationDelay: '180ms' }}>
                <SectionHeader title="Archivées" subtitle="En pause, leur historique est conservé." icon={<Archive />} />
                {archived.map((h) => (
                  <div key={h.id} className="flex items-center gap-3 rounded-xl px-2 py-2">
                    <span className="text-xl opacity-60">{h.emoji}</span>
                    <span className="min-w-0 flex-1 truncate text-sm text-ink-2">{h.title}</span>
                    <IconButton label="Réactiver" size="icon-sm" onClick={() => update((d) => void (d.habits.items.find((x) => x.id === h.id)!.archived = false))}>
                      <ArchiveRestore />
                    </IconButton>
                  </div>
                ))}
              </Card>
            )}
          </div>
        </div>
      )}

      <HabitSheet id={openId} onClose={() => setOpenId(null)} />
    </ModuleScope>
  );
}

function EditList({ data, onOpen }: { data: AppData; onOpen: (id: ID) => void }) {
  const update = useUpdate();
  const items = data.habits.items;
  return (
    <div className="space-y-1">
      {items.map((h, i) => (
        <div key={h.id} className={cx('flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-ink/[0.03]', h.archived && 'opacity-50')}>
          <span className="text-xl">{h.emoji}</span>
          <button type="button" onClick={() => onOpen(h.id)} className="min-w-0 flex-1 text-left">
            <div className="truncate text-[15px] font-medium">{h.title}</div>
            <div className="truncate text-xs text-ink-3">
              {daysLabel(h.days)} · {MOMENTS.find((m) => m.id === h.moment)?.label}
              {h.archived && ' · archivée'}
            </div>
          </button>
          <ReorderButtons index={i} count={items.length} onMove={(to) => update((d) => moveItem(d.habits.items, i, to))} />
          <IconButton
            label="Supprimer"
            size="icon-sm"
            className="text-danger hover:bg-danger/10 hover:text-danger"
            onClick={() => removeWithUndo(`« ${h.title} » supprimée`, (d) => void d.habits.items.splice(i, 1))}
          >
            <Trash2 />
          </IconButton>
        </div>
      ))}
    </div>
  );
}

function WeekGrid({
  data,
  today,
  onToggle,
  onOpen,
}: {
  data: AppData;
  today: DateKey;
  onToggle: (key: DateKey, id: ID, v: boolean) => void;
  onOpen: (id: ID) => void;
}) {
  const week = weekDates(today);
  const items = data.habits.items.filter((h) => !h.archived);
  return (
    <Card padding="sm" className="animate-rise overflow-hidden">
      <div className="grid grid-cols-[minmax(0,1fr)_repeat(7,2.25rem)] items-center gap-y-1 sm:grid-cols-[minmax(0,1fr)_repeat(7,2.75rem)]">
        <div />
        {week.map((k, i) => (
          <div key={k} className={cx('text-center text-[11px] font-semibold', k === today ? 'text-tint' : 'text-ink-3')}>
            {WEEKDAYS_LETTER[i]}
          </div>
        ))}
        {items.map((h) => (
          <div key={h.id} className="contents">
            <button type="button" onClick={() => onOpen(h.id)} className="flex min-w-0 items-center gap-2 px-2 py-1.5 text-left">
              <span className="text-lg">{h.emoji}</span>
              <span className="truncate text-sm font-medium">{h.title}</span>
            </button>
            {week.map((k, i) => {
              const planned = h.days.includes(i as Weekday);
              const done = (data.habits.log[k] ?? []).includes(h.id);
              const future = k > today;
              return (
                <div key={k} className="grid place-items-center">
                  {future ? (
                    <span className={cx('size-2 rounded-full', planned ? 'bg-ink/15' : 'bg-transparent')} />
                  ) : planned || done ? (
                    <Checkbox size="sm" checked={done} onChange={(v) => onToggle(k, h.id, v)} label={`${h.title}, ${WEEKDAYS[i]}`} />
                  ) : (
                    <span className="text-xs text-ink-3/50">·</span>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
      {items.length === 0 && <p className="p-4 text-sm text-ink-3">Aucune habitude active.</p>}
    </Card>
  );
}

function HabitSheet({ id, onClose }: { id: ID | null; onClose: () => void }) {
  const data = useData();
  const update = useUpdate();
  const today = useToday();
  const index = data.habits.items.findIndex((h) => h.id === id);
  const habit = index >= 0 ? data.habits.items[index] : null;
  const set = (fn: (h: Habit) => void) =>
    update((d) => {
      const h = d.habits.items.find((x) => x.id === id);
      if (h) fn(h);
    });

  const days = lastNDays(today, 28);
  const planned = habit ? days.filter((k) => habit.days.includes(weekdayOf(k)) && k >= data.createdAt) : [];
  const doneCount = habit ? planned.filter((k) => (data.habits.log[k] ?? []).includes(habit.id)).length : 0;

  return (
    <Sheet
      open={!!habit}
      onClose={onClose}
      title={habit ? `${habit.emoji} ${habit.title}` : ''}
      subtitle="Chaque modification est enregistrée."
      footer={
        habit && (
          <>
            <Button
              variant="danger"
              className="mr-auto"
              onClick={() => {
                onClose();
                removeWithUndo(`« ${habit.title} » supprimée`, (d) => void d.habits.items.splice(index, 1));
              }}
            >
              <Trash2 /> Supprimer
            </Button>
            <Button variant="secondary" onClick={() => set((h) => void (h.archived = !h.archived))}>
              {habit.archived ? <ArchiveRestore /> : <Archive />} {habit.archived ? 'Réactiver' : 'Archiver'}
            </Button>
            <Button variant="tint" onClick={onClose}>
              Fermer
            </Button>
          </>
        )
      }
    >
      {habit && (
        <div className="space-y-4">
          <Field label="Nom">
            <TextInput value={habit.title} onChange={(e) => set((h) => void (h.title = e.target.value))} />
          </Field>
          <Field label="Emoji">
            <EmojiField value={habit.emoji} onChange={(v) => set((h) => void (h.emoji = v))} suggestions={EMOJIS} />
          </Field>
          <Field label="Jours prévus">
            <DayPicker value={habit.days} onChange={(v) => set((h) => void (h.days = v))} />
          </Field>
          <Field label="Moment de la journée">
            <Segmented
              options={MOMENTS.map((m) => ({ value: m.id, label: m.label }))}
              value={habit.moment}
              onChange={(v) => set((h) => void (h.moment = v))}
              className="flex-wrap"
            />
          </Field>
          <Field label="Note">
            <TextArea minRows={2} value={habit.note} placeholder="Pourquoi c’est important pour toi, une astuce…" onChange={(e) => set((h) => void (h.note = e.target.value))} />
          </Field>
          <div className="rounded-2xl bg-surface-2 p-4">
            <div className="mb-3 flex items-baseline justify-between">
              <div className="text-sm font-semibold">4 dernières semaines</div>
              <div className="text-xs text-ink-3 tabular">
                {doneCount}/{planned.length} jours prévus
              </div>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {days.map((k) => {
                const isPlanned = habit.days.includes(weekdayOf(k)) && k >= data.createdAt;
                const done = (data.habits.log[k] ?? []).includes(habit.id);
                return (
                  <div
                    key={k}
                    title={`${formatLong(k)}${done ? ' : fait' : isPlanned ? ' : pas fait' : ' : non prévu'}`}
                    className={cx(
                      'aspect-square rounded-md',
                      done ? 'bg-tint' : isPlanned ? 'bg-ink/[0.08]' : 'bg-transparent ring-1 ring-ink/[0.06] ring-inset',
                      k === today && 'ring-2 ring-tint/60',
                    )}
                  />
                );
              })}
            </div>
          </div>
        </div>
      )}
    </Sheet>
  );
}
