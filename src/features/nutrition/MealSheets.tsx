import { BookOpen, Check, Eraser, Pencil, ShoppingBasket } from 'lucide-react';
import { Button, Field, Rating, Select, Sheet, TextArea, TextInput } from '@/components/ui';
import { WEEKDAYS, todayKey, weekdayOf } from '@/lib/dates';
import { removeWithUndo, toast } from '@/lib/feedback';
import { snapshotDay } from '@/lib/progress';
import { useData, useUpdate } from '@/lib/store';
import type { DateKey, FoodItem, ID, MealLog, Weekday } from '@/lib/types';
import { cx } from '@/lib/utils';
import { addToShopping, copyItems, ensureMealLog, ensurePlannedMeal, isMealEmpty, MEAL_FEELINGS, shoppingMessage } from './helpers';
import { ItemsEditor } from './ItemsEditor';

/** Suivi d'un repas pour une date : mangé, ce que j'ai réellement mangé, ressenti, note. */
export function MealLogSheet({
  open,
  onClose,
  dateKey,
  slotId,
  onEditPlan,
  onOpenRecipe,
}: {
  open: boolean;
  onClose: () => void;
  dateKey: DateKey;
  slotId: ID | null;
  onEditPlan: (wd: Weekday, slotId: ID) => void;
  onOpenRecipe: (id: ID) => void;
}) {
  const data = useData();
  const update = useUpdate();
  const slot = data.nutrition.slots.find((s) => s.id === slotId);
  if (!slot) return null;
  const wd = weekdayOf(dateKey);
  const meal = data.nutrition.plan[wd]?.[slot.id];
  const log = data.nutrition.mealLog[dateKey]?.[slot.id];
  const recipe = meal?.recipeId ? data.nutrition.recipes.find((r) => r.id === meal.recipeId) : undefined;
  const done = !!log?.done;

  const setLog = (fn: (l: MealLog) => void) =>
    update((d) => {
      fn(ensureMealLog(d, dateKey, slot.id));
      if (dateKey < todayKey()) snapshotDay(d, dateKey);
    });

  return (
    <Sheet
      open={open}
      onClose={onClose}
      icon={<span className="text-xl leading-none">{slot.emoji}</span>}
      title={slot.name}
      subtitle={`Prévu vers ${slot.time}`}
      footer={
        <>
          <Button variant="ghost" onClick={() => onEditPlan(wd, slot.id)} className="mr-auto">
            <Pencil /> Modifier le repas prévu
          </Button>
          <Button variant="primary" onClick={onClose}>
            Fermer
          </Button>
        </>
      }
    >
      <button
        type="button"
        onClick={() => setLog((l) => void (l.done = !l.done))}
        className={cx(
          'flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[15px] font-semibold transition-colors active:scale-[0.99]',
          done ? 'bg-tint text-tint-ink' : 'bg-tint/12 text-tint hover:bg-tint/18',
        )}
      >
        <Check className="size-5" />
        {done ? 'Repas suivi' : 'Marquer comme mangé'}
      </button>

      <div className="mt-4 rounded-2xl bg-surface-2 p-4">
        <div className="text-xs font-medium tracking-wide text-ink-3 uppercase">Prévu</div>
        {isMealEmpty(meal) ? (
          <div className="mt-1.5 text-sm text-ink-2">
            Rien de prévu pour ce créneau.{' '}
            <button type="button" className="font-medium text-tint" onClick={() => onEditPlan(wd, slot.id)}>
              Prévoir un repas
            </button>
          </div>
        ) : (
          <>
            {meal!.title && <div className="mt-1 font-semibold">{meal!.title}</div>}
            {meal!.items.length > 0 && (
              <ul className="mt-2 space-y-1 text-sm">
                {meal!.items.map((it) => (
                  <li key={it.id} className="flex justify-between gap-3">
                    <span className="text-ink">{it.name}</span>
                    <span className="shrink-0 text-ink-3">{it.qty}</span>
                  </li>
                ))}
              </ul>
            )}
            {meal!.notes && <p className="mt-2 text-sm text-ink-2">{meal!.notes}</p>}
            {recipe && (
              <Button size="sm" variant="outline" className="mt-3" onClick={() => onOpenRecipe(recipe.id)}>
                <BookOpen /> Voir la recette {recipe.emoji}
              </Button>
            )}
          </>
        )}
      </div>

      <div className="mt-5 space-y-4">
        <Field label="Ce que j’ai réellement mangé" hint="Laisse vide si tu as suivi le plan.">
          <TextArea
            minRows={2}
            value={log?.actual ?? ''}
            placeholder="Par exemple : salade de pâtes à la place du riz"
            onChange={(e) => setLog((l) => void (l.actual = e.target.value))}
          />
        </Field>
        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Ressenti après le repas</span>
          <div className="flex flex-wrap items-center gap-2">
            <Rating value={log?.feeling ?? 0} labels={MEAL_FEELINGS} onChange={(v) => setLog((l) => void (l.feeling = v || undefined))} />
            {log?.feeling ? <span className="text-sm text-ink-2">{MEAL_FEELINGS[log.feeling - 1]}</span> : null}
          </div>
        </div>
        <Field label="Note">
          <TextArea
            minRows={2}
            value={log?.note ?? ''}
            placeholder="Énergie, faim, contexte…"
            onChange={(e) => setLog((l) => void (l.note = e.target.value))}
          />
        </Field>
      </div>
    </Sheet>
  );
}

/** Éditeur du repas prévu pour un jour de la semaine et un créneau. */
export function MealEditorSheet({
  open,
  onClose,
  weekday,
  slotId,
  onOpenRecipe,
}: {
  open: boolean;
  onClose: () => void;
  weekday: Weekday;
  slotId: ID | null;
  onOpenRecipe?: (id: ID) => void;
}) {
  const data = useData();
  const update = useUpdate();
  const slot = data.nutrition.slots.find((s) => s.id === slotId);
  if (!slot) return null;
  const meal = data.nutrition.plan[weekday]?.[slot.id];
  const recipes = data.nutrition.recipes;
  const recipe = meal?.recipeId ? recipes.find((r) => r.id === meal.recipeId) : undefined;

  const edit = (fn: (m: NonNullable<typeof meal>) => void) => update((d) => fn(ensurePlannedMeal(d, weekday, slot.id)));
  const applyItems = (fn: (list: FoodItem[]) => void, undoMessage?: string) => {
    const mut = (d: Parameters<typeof ensurePlannedMeal>[0]) => fn(ensurePlannedMeal(d, weekday, slot.id).items);
    if (undoMessage) removeWithUndo(undoMessage, mut);
    else update(mut);
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      icon={<span className="text-xl leading-none">{slot.emoji}</span>}
      title={`${slot.name} du ${WEEKDAYS[weekday].toLowerCase()}`}
      subtitle={`Prévu chaque ${WEEKDAYS[weekday].toLowerCase()} vers ${slot.time}`}
      size="lg"
      footer={
        <>
          {!isMealEmpty(meal) && (
            <Button
              variant="ghost"
              className="mr-auto text-danger hover:text-danger"
              onClick={() => {
                removeWithUndo('Repas vidé', (d) => void delete d.nutrition.plan[weekday][slot.id]);
              }}
            >
              <Eraser /> Vider
            </Button>
          )}
          {meal && meal.items.length > 0 && (
            <Button
              variant="secondary"
              onClick={() => {
                let n = 0;
                update((d) => void (n = addToShopping(d, meal.items)));
                toast(shoppingMessage(n), { tone: 'success' });
              }}
            >
              <ShoppingBasket /> <span className="max-sm:sr-only">Ajouter aux courses</span>
            </Button>
          )}
          <Button variant="primary" onClick={onClose}>
            Fermer
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Nom du repas">
          <TextInput value={meal?.title ?? ''} placeholder="Par exemple : bowl saumon et quinoa" onChange={(e) => edit((m) => void (m.title = e.target.value))} />
        </Field>
        <Field label="Recette liée">
          <Select
            value={meal?.recipeId ?? ''}
            onChange={(e) => edit((m) => void (m.recipeId = e.target.value || null))}
          >
            <option value="">Aucune</option>
            {recipes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.emoji} {r.title}
              </option>
            ))}
          </Select>
        </Field>
        {recipe && (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="tint"
              onClick={() =>
                edit((m) => {
                  m.items = copyItems(recipe.ingredients);
                  if (!m.title.trim()) m.title = recipe.title;
                })
              }
            >
              Reprendre les ingrédients de la recette
            </Button>
            {onOpenRecipe && (
              <Button size="sm" variant="outline" onClick={() => onOpenRecipe(recipe.id)}>
                <BookOpen /> Voir la recette
              </Button>
            )}
          </div>
        )}
        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Aliments et quantités</span>
          <ItemsEditor items={meal?.items ?? []} apply={applyItems} />
        </div>
        <Field label="Notes">
          <TextArea minRows={2} value={meal?.notes ?? ''} placeholder="Astuce, variante, préparation à l’avance…" onChange={(e) => edit((m) => void (m.notes = e.target.value))} />
        </Field>
      </div>
    </Sheet>
  );
}
