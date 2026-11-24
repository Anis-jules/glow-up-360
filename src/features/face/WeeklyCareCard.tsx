import { Check, Clock, Pencil, ShieldAlert, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { Button, Card, Chip, DayPicker, EmojiField, Field, NumberField, TextArea, TextInput } from '@/components/ui';
import { toggleWeekly } from '@/lib/actions';
import { formatRelative, startOfWeek, useToday, WEEKDAYS, weekdayOf } from '@/lib/dates';
import { removeWithUndo, toast } from '@/lib/feedback';
import { useData, useUpdate } from '@/lib/store';
import type { AppData, FoodItem, WeeklyCare } from '@/lib/types';
import { ItemsEditor } from '../nutrition/ItemsEditor';

function daysText(days: number[]): string {
  if (days.length === 2 && days.includes(5) && days.includes(6)) return 'le week-end';
  if (days.length === 7) return 'n’importe quel jour';
  return days.map((d) => WEEKDAYS[d].toLowerCase()).join(', ');
}

/** Soins à faire une fois par semaine (masque au riz du week-end…). */
export function WeeklyCareSection() {
  const data = useData();
  if (!data.face.weekly.length) return null;
  return (
    <section className="space-y-4">
      {data.face.weekly.map((care) => (
        <WeeklyCareCard key={care.id} care={care} />
      ))}
    </section>
  );
}

function WeeklyCareCard({ care }: { care: WeeklyCare }) {
  const update = useUpdate();
  const today = useToday();
  const [editing, setEditing] = useState(false);
  const doneOn = care.log[startOfWeek(today)];
  const isDay = care.days.includes(weekdayOf(today));

  const set = (fn: (c: WeeklyCare) => void) =>
    update((d) => {
      const c = d.face.weekly.find((x) => x.id === care.id);
      if (c) fn(c);
    });
  const find = (d: AppData) => d.face.weekly.find((x) => x.id === care.id);

  return (
    <Card padding="lg" className="animate-rise" style={{ animationDelay: '90ms' }}>
      <div className="mb-3 flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-tint/12 text-xl">{care.emoji}</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] leading-snug font-semibold">{care.title}</h2>
          <p className="text-[13px] text-ink-3">
            Une fois par semaine, {daysText(care.days)} · {care.durationMin} min de pose
          </p>
        </div>
        <Button size="sm" variant={editing ? 'tint' : 'ghost'} onClick={() => setEditing((e) => !e)} aria-pressed={editing}>
          {editing ? <Check /> : <Pencil />}
          <span className="max-sm:sr-only">{editing ? 'Terminé' : 'Modifier'}</span>
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {doneOn ? (
          <Chip tone="success">
            <Check /> Fait cette semaine ({formatRelative(doneOn, today).toLowerCase()})
          </Chip>
        ) : isDay ? (
          <Chip tone="tint">
            <Clock /> À faire ce week-end
          </Chip>
        ) : (
          <Chip>Prévu {daysText(care.days)}</Chip>
        )}
        <div className="ml-auto">
          {doneOn ? (
            <Button size="sm" variant="secondary" onClick={() => update((d) => toggleWeekly(d, today, care.id, false))}>
              <Undo2 /> Annuler
            </Button>
          ) : (
            <Button
              size="sm"
              variant="tint"
              onClick={() => {
                update((d) => toggleWeekly(d, today, care.id, true));
                toast('Masque noté pour cette semaine', { tone: 'success' });
              }}
            >
              <Check /> Fait cette semaine
            </Button>
          )}
        </div>
      </div>

      {editing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[auto_minmax(0,1fr)]">
            <Field label="Emoji">
              <EmojiField value={care.emoji} onChange={(v) => set((c) => void (c.emoji = v))} />
            </Field>
            <Field label="Nom">
              <TextInput value={care.title} onChange={(e) => set((c) => void (c.title = e.target.value))} />
            </Field>
          </div>
          <Field label="Jours où il est proposé">
            <DayPicker value={care.days} onChange={(v) => set((c) => void (c.days = v))} />
          </Field>
          <Field label="Temps de pose (minutes)">
            <NumberField value={care.durationMin} min={1} max={120} onChange={(v) => set((c) => void (c.durationMin = v))} suffix="min" />
          </Field>
          <Field label="Ingrédients">
            <ItemsEditor
              items={care.ingredients}
              addLabel="Ajouter un ingrédient"
              namePlaceholder="Ingrédient"
              apply={(fn, msg) =>
                msg
                  ? removeWithUndo(msg, (d) => {
                      const c = find(d);
                      if (c) fn(c.ingredients as FoodItem[]);
                    })
                  : update((d) => {
                      const c = find(d);
                      if (c) fn(c.ingredients as FoodItem[]);
                    })
              }
            />
          </Field>
          <Field label="Préparation" hint="Une étape par ligne.">
            <TextArea value={care.steps.join('\n')} minRows={4} onChange={(e) => set((c) => void (c.steps = e.target.value.split('\n')))} />
          </Field>
          <Field label="Application" hint="Une étape par ligne.">
            <TextArea value={care.application.join('\n')} minRows={5} onChange={(e) => set((c) => void (c.application = e.target.value.split('\n')))} />
          </Field>
          <Field label="Précautions">
            <TextArea value={care.notes} minRows={3} onChange={(e) => set((c) => void (c.notes = e.target.value))} />
          </Field>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div className="space-y-5">
            <div>
              <h3 className="mb-2 text-[13px] font-semibold tracking-wide text-ink-3 uppercase">Ingrédients</h3>
              <ul className="space-y-1.5">
                {care.ingredients.map((i) => (
                  <li key={i.id} className="flex items-baseline justify-between gap-3 rounded-lg bg-surface-2 px-3 py-2 text-[14px]">
                    <span className="min-w-0">{i.name}</span>
                    <span className="shrink-0 text-ink-3">{i.qty}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-2 text-[13px] font-semibold tracking-wide text-ink-3 uppercase">Préparation</h3>
              <Steps list={care.steps} />
            </div>
          </div>
          <div className="space-y-5">
            <div>
              <h3 className="mb-2 text-[13px] font-semibold tracking-wide text-ink-3 uppercase">Comment l’appliquer</h3>
              <Steps list={care.application} />
            </div>
            {care.notes && (
              <div className="flex items-start gap-3 rounded-2xl border border-tint/25 bg-tint/8 p-3.5 text-[13px] leading-relaxed text-ink-2">
                <ShieldAlert className="mt-0.5 size-4 shrink-0 text-tint" />
                <span>{care.notes}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

function Steps({ list }: { list: string[] }) {
  const steps = list.filter((s) => s.trim());
  return (
    <ol className="space-y-2.5">
      {steps.map((s, i) => (
        <li key={i} className="flex gap-3 text-[14px] leading-relaxed text-ink-2">
          <span className="grid size-6 shrink-0 place-items-center rounded-full bg-tint/12 text-xs font-semibold text-tint tabular">{i + 1}</span>
          <span className="min-w-0 pt-0.5">{s}</span>
        </li>
      ))}
    </ol>
  );
}
