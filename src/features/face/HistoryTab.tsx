import { CalendarDays, Check, Flame, HandHeart, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Card, Checkbox, Chip, EmptyState, Field, Rating, Sheet, Stat, TextArea } from '@/components/ui';
import { addDays, capitalize, formatLong, formatRelative, useToday } from '@/lib/dates';
import { snapshotDay } from '@/lib/progress';
import { useData, useUpdate } from '@/lib/store';
import type { DateKey } from '@/lib/types';
import { faceFraction, massageDoneOn, SKIN_LABELS } from './helpers';
import { MonthCalendar, monthDays } from './MonthCalendar';
import { RoutineIcon } from './RoutineTab';

function DaySheet({ day, onClose }: { day: DateKey | null; onClose: () => void }) {
  const data = useData();
  const update = useUpdate();
  const today = useToday();
  const log = day ? data.face.log[day] : undefined;
  const done = new Set(log?.done ?? []);

  const edit = (fn: (l: { done: string[]; note: string; skinFeel?: number }) => void) =>
    day &&
    update((d) => {
      const l = (d.face.log[day] ??= { done: [], note: '' });
      fn(l);
      if (day < today) snapshotDay(d, day);
    });

  return (
    <Sheet
      open={!!day}
      onClose={onClose}
      title={day ? capitalize(formatRelative(day, today)) : ''}
      subtitle={day ? `${Math.round(faceFraction(data.face, day) * 100)} % des étapes obligatoires` : undefined}
      icon={<CalendarDays />}
    >
      {day && (
        <div className="space-y-5">
          {data.face.routines.map((r) => (
            <div key={r.id}>
              <div className="mb-1 flex items-center gap-2 text-sm font-semibold [&_svg]:size-4">
                <RoutineIcon icon={r.icon} className="text-tint" /> {r.name}
              </div>
              {r.steps.map((s) => (
                <label key={s.id} className="flex items-center gap-3 rounded-xl px-1 py-1.5">
                  <Checkbox
                    size="sm"
                    checked={done.has(s.id)}
                    label={s.title}
                    onChange={(v) =>
                      edit((l) => {
                        l.done = v ? [...new Set([...l.done, s.id])] : l.done.filter((x) => x !== s.id);
                      })
                    }
                  />
                  <span className={done.has(s.id) ? 'text-ink' : 'text-ink-2'}>{s.title}</span>
                  {s.optional && <span className="text-xs text-ink-3">facultatif</span>}
                </label>
              ))}
            </div>
          ))}
          <Field label="Ressenti de la peau">
            <Rating value={log?.skinFeel ?? 0} labels={SKIN_LABELS} onChange={(v) => edit((l) => void (l.skinFeel = v || undefined))} />
          </Field>
          <Field label="Note">
            <TextArea minRows={2} value={log?.note ?? ''} onChange={(e) => edit((l) => void (l.note = e.target.value))} />
          </Field>
        </div>
      )}
    </Sheet>
  );
}

export function HistoryTab() {
  const data = useData();
  const today = useToday();
  const [month, setMonth] = useState(today);
  const [day, setDay] = useState<DateKey | null>(null);
  const face = data.face;

  const stats = useMemo(() => {
    // Série de jours avec routine complète
    let streak = 0;
    let k = faceFraction(face, today) >= 1 ? today : addDays(today, -1);
    while (k >= data.createdAt && faceFraction(face, k) >= 1) {
      streak += 1;
      k = addDays(k, -1);
    }
    const days = monthDays(month).filter((d) => d <= today);
    const complete = days.filter((d) => faceFraction(face, d) >= 1).length;
    const massages = days.filter((d) => massageDoneOn(face, d)).length;
    return { streak, complete, massages, daysCount: days.length };
  }, [face, today, month, data.createdAt]);

  const notes = useMemo(
    () =>
      Object.entries(face.log)
        .filter(([, v]) => v.note?.trim() || v.skinFeel)
        .sort(([a], [b]) => (a < b ? 1 : -1))
        .slice(0, 12),
    [face.log],
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-3">
        <Stat label="Série" icon={<Flame />} value={stats.streak} sub={stats.streak > 1 ? 'jours complets' : 'jour complet'} />
        <Stat label="Ce mois-ci" icon={<Check />} value={stats.complete} sub={`sur ${stats.daysCount} jours`} />
        <Stat label="Massages" icon={<HandHeart />} value={stats.massages} sub="ce mois-ci" />
      </div>

      <Card className="animate-rise">
        <MonthCalendar
          month={month}
          onMonthChange={setMonth}
          today={today}
          selected={day}
          onSelect={setDay}
          valueFor={(k) => (k < data.createdAt && !face.log[k] ? null : faceFraction(face, k))}
        />
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-ink-3">
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded bg-ink/[0.06]" /> Rien
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded" style={{ background: 'color-mix(in oklab, var(--tint) 45%, transparent)' }} /> En partie
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-3 rounded bg-tint" /> Routine complète
          </span>
          <span className="ml-auto">Touche un jour pour le détail ou le corriger.</span>
        </div>
      </Card>

      <section>
        <h2 className="mb-3 text-[17px] font-semibold">Ressentis et notes</h2>
        {notes.length === 0 ? (
          <EmptyState icon={<Sparkles />} title="Rien de noté pour l’instant">
            Note le ressenti de ta peau dans l’onglet Routine : tu verras ici son évolution.
          </EmptyState>
        ) : (
          <div className="space-y-2">
            {notes.map(([k, v]) => (
              <button key={k} type="button" onClick={() => setDay(k)} className="card block w-full p-4 text-left transition-colors hover:border-tint/25">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold first-letter:uppercase">{formatLong(k)}</span>
                  {!!v.skinFeel && <Chip tone="tint">{SKIN_LABELS[v.skinFeel - 1]}</Chip>}
                </div>
                {v.note?.trim() && <p className="mt-1 text-sm whitespace-pre-line text-ink-2">{v.note}</p>}
              </button>
            ))}
          </div>
        )}
      </section>

      <DaySheet day={day} onClose={() => setDay(null)} />
    </div>
  );
}
