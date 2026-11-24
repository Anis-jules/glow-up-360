import { CalendarDays, ChevronRight, Copy, ShoppingBasket, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
  Button,
  Card,
  Chip,
  EmojiField,
  EmptyState,
  IconButton,
  ReorderButtons,
  SectionHeader,
  Sheet,
  TextInput,
  TimeField,
} from '@/components/ui';
import { WEEKDAYS, WEEKDAYS_SHORT, weekdayOf } from '@/lib/dates';
import { confirm, removeWithUndo, toast } from '@/lib/feedback';
import { useData, useUpdate } from '@/lib/store';
import type { DateKey, ID, Weekday } from '@/lib/types';
import { cx, moveItem, uid } from '@/lib/utils';
import { addToShopping, copyItems, isMealEmpty, shoppingMessage } from './helpers';
import { MealEditorSheet } from './MealSheets';

const SLOT_EMOJIS = ['🥣', '🥗', '🍎', '🍽️', '🥤', '🍵', '🥪', '🍌'];

export function PlanTab({ today, onOpenRecipe }: { today: DateKey; onOpenRecipe: (id: ID) => void }) {
  const data = useData();
  const update = useUpdate();
  const { slots, plan, recipes } = data.nutrition;
  const todayWd = weekdayOf(today);
  const [wd, setWd] = useState<Weekday>(todayWd);
  const [editing, setEditing] = useState(false);
  const [editSlot, setEditSlot] = useState<ID | null>(null);
  const [copyOpen, setCopyOpen] = useState(false);
  const [newSlotId, setNewSlotId] = useState<ID | null>(null);
  const day = plan[wd] ?? {};
  const dayItems = slots.flatMap((s) => day[s.id]?.items ?? []);
  const dayKcal = slots.reduce((a, s) => a + (day[s.id]?.kcal ?? 0), 0);
  const dayProtein = slots.reduce((a, s) => a + (day[s.id]?.protein ?? 0), 0);

  return (
    <div className="space-y-4">
      {/* Sélecteur de jour */}
      <div className="grid animate-rise grid-cols-7 gap-1 rounded-2xl bg-ink/[0.045] p-1" role="tablist" aria-label="Jour de la semaine">
        {WEEKDAYS_SHORT.map((label, i) => (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={wd === i}
            onClick={() => setWd(i as Weekday)}
            className={cx(
              'relative flex h-11 flex-col items-center justify-center rounded-xl text-[13px] font-medium transition-[background-color,color,box-shadow]',
              wd === i ? 'bg-surface text-ink shadow-sm' : 'text-ink-2 hover:text-ink',
            )}
          >
            {label}
            {i === todayWd && <span className={cx('absolute bottom-1 size-1 rounded-full', wd === i ? 'bg-tint' : 'bg-ink-3')} />}
          </button>
        ))}
      </div>

      <Card className="animate-rise [animation-delay:60ms]">
        <SectionHeader
          icon={<CalendarDays />}
          title={`Repas du ${WEEKDAYS[wd].toLowerCase()}`}
          subtitle={
            editing
              ? 'Créneaux : nom, heure, ordre'
              : dayKcal
                ? `≈ ${dayKcal.toLocaleString('fr-FR')} kcal · ${dayProtein} g de protéines (objectif ${data.nutrition.program.kcal.toLocaleString('fr-FR')} kcal · ${data.nutrition.program.protein} g)`
                : wd === todayWd
                  ? 'Aujourd’hui'
                  : 'Touche un repas pour le modifier'
          }
          editing={editing}
          onToggleEdit={() => setEditing((v) => !v)}
          onAdd={() => {
            const id = uid('s');
            setEditing(true);
            setNewSlotId(id);
            update((d) => void d.nutrition.slots.push({ id, name: 'Nouveau créneau', time: '10:00', emoji: '🍽️' }));
          }}
          addLabel="Créneau"
        />

        {slots.length === 0 ? (
          <EmptyState icon={<CalendarDays />} title="Aucun créneau de repas">
            Ajoute un créneau (petit-déjeuner, déjeuner…) avec le bouton Créneau.
          </EmptyState>
        ) : editing ? (
          <div className="space-y-2">
            {slots.map((slot, i) => (
              <div key={slot.id} className="rounded-2xl border border-line p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <TextInput
                    value={slot.name}
                    autoFocus={slot.id === newSlotId}
                    aria-label="Nom du créneau"
                    onChange={(e) => update((d) => void (d.nutrition.slots[i].name = e.target.value))}
                    className="min-w-0 flex-1 basis-40"
                  />
                  <TimeField value={slot.time} onChange={(v) => update((d) => void (d.nutrition.slots[i].time = v))} className="w-28" />
                  <ReorderButtons index={i} count={slots.length} onMove={(to) => update((d) => moveItem(d.nutrition.slots, i, to))} />
                  <IconButton
                    label="Supprimer le créneau"
                    size="icon-sm"
                    className="text-ink-3 hover:text-danger"
                    onClick={() =>
                      removeWithUndo(`Créneau « ${slot.name} » supprimé`, (d) => {
                        d.nutrition.slots.splice(i, 1);
                        for (const p of d.nutrition.plan) delete p[slot.id];
                      })
                    }
                  >
                    <Trash2 />
                  </IconButton>
                </div>
                <div className="mt-2">
                  <EmojiField
                    value={slot.emoji}
                    onChange={(v) => update((d) => void (d.nutrition.slots[i].emoji = v))}
                    suggestions={SLOT_EMOJIS}
                  />
                </div>
              </div>
            ))}
            <p className="pt-1 text-[13px] text-ink-3">Les créneaux sont communs à tous les jours. Supprimer un créneau retire aussi ses repas prévus.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {slots.map((slot) => {
              const meal = day[slot.id];
              const empty = isMealEmpty(meal);
              const recipe = meal?.recipeId ? recipes.find((r) => r.id === meal.recipeId) : undefined;
              return (
                <button
                  key={slot.id}
                  type="button"
                  onClick={() => setEditSlot(slot.id)}
                  className="flex w-full items-start gap-3 rounded-2xl border border-line p-3 text-left transition-colors hover:border-tint/30 hover:bg-tint/[0.03]"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-tint/10 text-xl">{slot.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-medium text-ink-3">
                      {slot.name} · {slot.time}
                    </div>
                    <div className={cx('mt-0.5 font-medium', empty && 'text-ink-3')}>{empty ? 'Rien de prévu, touche pour ajouter' : meal!.title || 'Repas sans nom'}</div>
                    {!empty && meal!.items.length > 0 && (
                      <div className="mt-1 line-clamp-2 text-[13px] text-ink-2">
                        {meal!.items.map((it) => [it.name, it.qty].filter(Boolean).join(' ')).join(' · ')}
                      </div>
                    )}
                    {(recipe || (!empty && meal?.kcal)) && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {!empty && !!meal?.kcal && (
                          <Chip>
                            ≈ {meal.kcal} kcal · {meal.protein ?? 0} g prot.
                          </Chip>
                        )}
                        {recipe && (
                          <Chip tone="tint">
                            {recipe.emoji} Recette
                          </Chip>
                        )}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="mt-3 size-4 shrink-0 text-ink-3" />
                </button>
              );
            })}
          </div>
        )}

        {!editing && slots.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
            <Button size="sm" variant="secondary" onClick={() => setCopyOpen(true)}>
              <Copy /> Copier ce jour vers…
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={dayItems.length === 0}
              onClick={() => {
                let n = 0;
                update((d) => void (n = addToShopping(d, dayItems)));
                toast(shoppingMessage(n), { tone: 'success' });
              }}
            >
              <ShoppingBasket /> Ajouter les aliments aux courses
            </Button>
          </div>
        )}
      </Card>

      <MealEditorSheet open={!!editSlot} onClose={() => setEditSlot(null)} weekday={wd} slotId={editSlot} onOpenRecipe={onOpenRecipe} />
      <CopyDaySheet open={copyOpen} onClose={() => setCopyOpen(false)} source={wd} />
    </div>
  );
}

function CopyDaySheet({ open, onClose, source }: { open: boolean; onClose: () => void; source: Weekday }) {
  const data = useData();
  const update = useUpdate();
  const [targets, setTargets] = useState<Weekday[]>([]);

  const submit = async () => {
    if (!targets.length) return;
    const overwrite = targets.filter((t) => data.nutrition.slots.some((s) => !isMealEmpty(data.nutrition.plan[t]?.[s.id])));
    if (overwrite.length) {
      const ok = await confirm({
        title: 'Remplacer les repas prévus ?',
        message: `Les repas déjà prévus le ${overwrite.map((t) => WEEKDAYS[t].toLowerCase()).join(', ')} seront remplacés par ceux du ${WEEKDAYS[source].toLowerCase()}.`,
        confirmLabel: 'Remplacer',
      });
      if (!ok) return;
    }
    update((d) => {
      const src = d.nutrition.plan[source] ?? {};
      for (const t of targets) {
        const copy: typeof src = {};
        for (const [slotId, meal] of Object.entries(src)) copy[slotId] = { ...meal, items: copyItems(meal.items) };
        d.nutrition.plan[t] = copy;
      }
    });
    toast(`Repas du ${WEEKDAYS[source].toLowerCase()} copiés`, { tone: 'success' });
    setTargets([]);
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      icon={<Copy />}
      title={`Copier le ${WEEKDAYS[source].toLowerCase()}`}
      subtitle="Choisis les jours qui recevront les mêmes repas"
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="tint" onClick={submit} disabled={!targets.length}>
            Copier
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-2">
        {WEEKDAYS.map((label, i) => {
          const d = i as Weekday;
          const on = targets.includes(d);
          return (
            <button
              key={label}
              type="button"
              disabled={d === source}
              aria-pressed={on}
              onClick={() => setTargets((t) => (on ? t.filter((x) => x !== d) : [...t, d]))}
              className={cx(
                'h-11 rounded-xl text-sm font-medium transition-colors disabled:opacity-35',
                on ? 'bg-tint text-tint-ink' : 'bg-surface-2 text-ink hover:bg-ink/[0.07]',
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
      <button
        type="button"
        className="mt-3 text-sm font-medium text-tint"
        onClick={() => setTargets(([0, 1, 2, 3, 4, 5, 6] as Weekday[]).filter((d) => d !== source))}
      >
        Tous les autres jours
      </button>
    </Sheet>
  );
}
