import { CalendarPlus, ChefHat, Clock, Heart, Pencil, Plus, ShoppingBasket, Trash2, Users } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Chip,
  EmojiField,
  EmptyState,
  Field,
  IconButton,
  NumberField,
  ReorderButtons,
  SectionHeader,
  Select,
  Sheet,
  TextArea,
  TextInput,
} from '@/components/ui';
import { WEEKDAYS, weekdayOf } from '@/lib/dates';
import { confirm, removeWithUndo, toast } from '@/lib/feedback';
import { useData, useUpdate } from '@/lib/store';
import type { AppData, DateKey, FoodItem, ID, Recipe, Weekday } from '@/lib/types';
import { cx, moveItem, uid } from '@/lib/utils';
import { addToShopping, copyItems, isMealEmpty, shoppingMessage } from './helpers';
import { ItemsEditor } from './ItemsEditor';

const RECIPE_EMOJIS = ['🥗', '🍲', '🥣', '🍳', '🐟', '🥑', '🍓', '🫚', '🥤', '🍝'];

export function RecipesTab({
  openId,
  setOpenId,
  today,
}: {
  openId: ID | null;
  setOpenId: (id: ID | null) => void;
  today: DateKey;
}) {
  const data = useData();
  const update = useUpdate();
  const recipes = data.nutrition.recipes;
  const [filter, setFilter] = useState<string>('all');
  const [editing, setEditing] = useState(false);
  const [editOnOpen, setEditOnOpen] = useState(false);

  const categories = useMemo(
    () => Array.from(new Set(recipes.map((r) => r.category.trim()).filter(Boolean))),
    [recipes],
  );
  const visible = recipes
    .map((r, index) => ({ r, index }))
    .filter(({ r }) => (filter === 'all' ? true : filter === 'fav' ? r.favorite : r.category.trim() === filter));
  const filters = [
    { id: 'all', label: 'Toutes' },
    { id: 'fav', label: 'Favoris' },
    ...categories.map((c) => ({ id: c, label: c })),
  ];

  const addRecipe = () => {
    const id = uid('r');
    update((d) =>
      void d.nutrition.recipes.push({
        id,
        title: 'Nouvelle recette',
        emoji: '🍲',
        category: filter !== 'all' && filter !== 'fav' ? filter : 'Plats',
        prepMin: 15,
        servings: 1,
        ingredients: [],
        steps: [],
        notes: '',
        favorite: filter === 'fav',
      }),
    );
    setEditOnOpen(true);
    setOpenId(id);
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={<ChefHat />}
        title="Mes recettes"
        subtitle={`${recipes.length} recette${recipes.length > 1 ? 's' : ''}`}
        editing={editing}
        onToggleEdit={() => setEditing((v) => !v)}
        onAdd={addRecipe}
        className="mb-0"
      />
      <div className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
        {filters.map((f) => (
          <button
            key={f.id}
            type="button"
            aria-pressed={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={cx(
              'h-8 shrink-0 rounded-full px-3.5 text-[13px] font-medium transition-colors',
              filter === f.id ? 'bg-tint text-tint-ink' : 'bg-ink/[0.05] text-ink-2 hover:text-ink',
            )}
          >
            {f.id === 'fav' && <Heart className="mr-1 inline size-3.5 -translate-y-px" />}
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<ChefHat />}
          title={filter === 'fav' ? 'Aucune recette favorite' : 'Aucune recette ici'}
          action={
            <Button variant="tint" onClick={addRecipe}>
              <Plus /> Ajouter une recette
            </Button>
          }
        >
          {filter === 'fav' ? 'Touche le cœur d’une recette pour la retrouver ici.' : 'Crée ta première recette.'}
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map(({ r, index }, i) => (
            <Card
              key={r.id}
              interactive={!editing}
              padding="none"
              className="flex animate-rise flex-col p-4"
              style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
              onClick={() => !editing && setOpenId(r.id)}
            >
              <div className="flex items-start gap-3">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-tint/10 text-2xl">{r.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="leading-snug font-semibold">{r.title}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-3">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3.5" /> {r.prepMin} min
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Users className="size-3.5" /> {r.servings} pers.
                    </span>
                    {!!r.kcal && (
                      <span className="tabular">
                        ≈ {r.kcal} kcal · {r.protein ?? 0} g prot.{r.servings > 1 ? ' /pers.' : ''}
                      </span>
                    )}
                  </div>
                </div>
                {!editing && (
                  <IconButton
                    label={r.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                    size="icon-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      update((d) => void (d.nutrition.recipes[index].favorite = !r.favorite));
                    }}
                  >
                    <Heart className={cx(r.favorite ? 'fill-tint text-tint' : 'text-ink-3')} />
                  </IconButton>
                )}
              </div>
              <div className="mt-3 flex items-center gap-2">
                {r.category && <Chip>{r.category}</Chip>}
                <span className="text-xs text-ink-3">{r.ingredients.length} ingrédients</span>
              </div>
              {editing && (
                <div className="mt-3 flex items-center justify-between border-t border-line pt-3">
                  <ReorderButtons index={index} count={recipes.length} onMove={(to) => update((d) => moveItem(d.nutrition.recipes, index, to))} />
                  <div className="flex items-center gap-1">
                    <IconButton
                      label="Modifier"
                      size="icon-sm"
                      onClick={() => {
                        setEditOnOpen(true);
                        setOpenId(r.id);
                      }}
                    >
                      <Pencil />
                    </IconButton>
                    <IconButton
                      label="Supprimer"
                      size="icon-sm"
                      className="text-ink-3 hover:text-danger"
                      onClick={() => removeWithUndo(`« ${r.title} » supprimée`, (d) => void d.nutrition.recipes.splice(index, 1))}
                    >
                      <Trash2 />
                    </IconButton>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <RecipeSheet
        recipeId={openId}
        startEditing={editOnOpen}
        today={today}
        onClose={() => {
          setOpenId(null);
          setEditOnOpen(false);
        }}
      />
    </div>
  );
}

function RecipeSheet({
  recipeId,
  startEditing,
  today,
  onClose,
}: {
  recipeId: ID | null;
  startEditing: boolean;
  today: DateKey;
  onClose: () => void;
}) {
  const data = useData();
  const update = useUpdate();
  const index = data.nutrition.recipes.findIndex((r) => r.id === recipeId);
  const recipe = index >= 0 ? data.nutrition.recipes[index] : undefined;
  const [editing, setEditing] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [lastStep, setLastStep] = useState<number | null>(null);
  const [openedFor, setOpenedFor] = useState<ID | null>(null);

  // Ouvre en mode édition quand on vient de créer la recette ou de toucher « Modifier ».
  if (recipeId !== openedFor) {
    setOpenedFor(recipeId);
    setEditing(startEditing);
    setLastStep(null);
  }

  if (!recipe) return null;
  const categories = Array.from(new Set(data.nutrition.recipes.map((r) => r.category).filter(Boolean)));
  const edit = (fn: (r: Recipe) => void) =>
    update((d) => {
      const r = d.nutrition.recipes.find((x) => x.id === recipe.id);
      if (r) fn(r);
    });
  const applyIngredients = (fn: (list: FoodItem[]) => void, undoMessage?: string) => {
    const mut = (d: AppData) => {
      const r = d.nutrition.recipes.find((x) => x.id === recipe.id);
      if (r) fn(r.ingredients);
    };
    if (undoMessage) removeWithUndo(undoMessage, mut);
    else update(mut);
  };

  const toShopping = () => {
    let n = 0;
    update((d) => void (n = addToShopping(d, recipe.ingredients)));
    toast(shoppingMessage(n), { tone: 'success' });
  };

  return (
    <>
      <Sheet
        open={!!recipe}
        onClose={onClose}
        icon={<span className="text-xl leading-none">{recipe.emoji}</span>}
        title={recipe.title || 'Recette sans nom'}
        subtitle={[recipe.category, `${recipe.prepMin} min`, `${recipe.servings} pers.`, recipe.kcal ? `≈ ${recipe.kcal} kcal et ${recipe.protein ?? 0} g de protéines par portion` : ''].filter(Boolean).join(' · ')}
        size="lg"
        footer={
          editing ? (
            <>
              <Button
                variant="ghost"
                className="mr-auto text-danger hover:text-danger"
                onClick={() => {
                  onClose();
                  removeWithUndo(`« ${recipe.title} » supprimée`, (d) => void d.nutrition.recipes.splice(index, 1));
                }}
              >
                <Trash2 /> Supprimer
              </Button>
              <Button variant="primary" onClick={() => setEditing(false)}>
                Terminé
              </Button>
            </>
          ) : (
            <>
              <IconButton label={recipe.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'} variant="secondary" onClick={() => edit((r) => void (r.favorite = !r.favorite))}>
                <Heart className={cx(recipe.favorite && 'fill-tint text-tint')} />
              </IconButton>
              <Button variant="secondary" onClick={() => setEditing(true)} className="mr-auto">
                <Pencil /> Modifier
              </Button>
              <Button variant="secondary" onClick={toShopping} disabled={!recipe.ingredients.length}>
                <ShoppingBasket /> <span className="max-sm:sr-only">Courses</span>
              </Button>
              <Button variant="tint" onClick={() => setPlanOpen(true)}>
                <CalendarPlus /> Planifier
              </Button>
            </>
          )
        }
      >
        {editing ? (
          <div className="space-y-4">
            <Field label="Emoji">
              <EmojiField value={recipe.emoji} onChange={(v) => edit((r) => void (r.emoji = v))} suggestions={RECIPE_EMOJIS} />
            </Field>
            <Field label="Titre">
              <TextInput value={recipe.title} autoFocus={startEditing} onChange={(e) => edit((r) => void (r.title = e.target.value))} />
            </Field>
            <Field label="Catégorie">
              <TextInput value={recipe.category} list="recipe-categories" onChange={(e) => edit((r) => void (r.category = e.target.value))} />
              <datalist id="recipe-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Préparation">
                <NumberField value={recipe.prepMin} onChange={(v) => edit((r) => void (r.prepMin = v))} min={0} max={600} step={5} suffix="min" />
              </Field>
              <Field label="Portions">
                <NumberField value={recipe.servings} onChange={(v) => edit((r) => void (r.servings = v))} min={1} max={20} />
              </Field>
              <Field label="Calories par portion">
                <NumberField value={recipe.kcal ?? 0} onChange={(v) => edit((r) => void (r.kcal = v || undefined))} min={0} max={3000} step={10} suffix="kcal" />
              </Field>
              <Field label="Protéines par portion">
                <NumberField value={recipe.protein ?? 0} onChange={(v) => edit((r) => void (r.protein = v || undefined))} min={0} max={300} suffix="g" />
              </Field>
            </div>
            <div>
              <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Ingrédients</span>
              <ItemsEditor items={recipe.ingredients} apply={applyIngredients} addLabel="Ajouter un ingrédient" namePlaceholder="Ingrédient" />
            </div>
            <div>
              <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Étapes</span>
              <div className="space-y-2">
                {recipe.steps.map((s, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="mt-2.5 grid size-6 shrink-0 place-items-center rounded-full bg-tint/12 text-xs font-semibold text-tint">{i + 1}</span>
                    <TextArea
                      minRows={2}
                      value={s}
                      autoFocus={lastStep === i}
                      onChange={(e) => edit((r) => void (r.steps[i] = e.target.value))}
                      className="min-w-0 flex-1"
                    />
                    <div className="flex flex-col">
                      <ReorderButtons index={i} count={recipe.steps.length} onMove={(to) => edit((r) => moveItem(r.steps, i, to))} className="flex-col" />
                      <IconButton
                        label="Supprimer l’étape"
                        size="icon-sm"
                        className="text-ink-3 hover:text-danger"
                        onClick={() =>
                          removeWithUndo('Étape supprimée', (d) => {
                            const r = d.nutrition.recipes.find((x) => x.id === recipe.id);
                            r?.steps.splice(i, 1);
                          })
                        }
                      >
                        <Trash2 />
                      </IconButton>
                    </div>
                  </div>
                ))}
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-tint hover:text-tint"
                  onClick={() => {
                    setLastStep(recipe.steps.length);
                    edit((r) => void r.steps.push(''));
                  }}
                >
                  <Plus /> Ajouter une étape
                </Button>
              </div>
            </div>
            <Field label="Notes">
              <TextArea minRows={2} value={recipe.notes} onChange={(e) => edit((r) => void (r.notes = e.target.value))} />
            </Field>
          </div>
        ) : (
          <div className="space-y-5">
            <section>
              <h3 className="mb-2 text-[15px] font-semibold">Ingrédients</h3>
              {recipe.ingredients.length === 0 ? (
                <p className="text-sm text-ink-3">Aucun ingrédient pour l’instant.</p>
              ) : (
                <ul className="divide-y divide-line rounded-2xl bg-surface-2 px-4">
                  {recipe.ingredients.map((it) => (
                    <li key={it.id} className="flex justify-between gap-4 py-2.5 text-sm">
                      <span>{it.name}</span>
                      <span className="shrink-0 text-right text-ink-2">{it.qty}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
            <section>
              <h3 className="mb-2 text-[15px] font-semibold">Préparation</h3>
              {recipe.steps.filter((s) => s.trim()).length === 0 ? (
                <p className="text-sm text-ink-3">Aucune étape pour l’instant.</p>
              ) : (
                <ol className="space-y-3">
                  {recipe.steps
                    .filter((s) => s.trim())
                    .map((s, i) => (
                      <li key={i} className="flex gap-3 text-[15px] leading-relaxed">
                        <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-tint text-xs font-semibold text-tint-ink">{i + 1}</span>
                        <span>{s}</span>
                      </li>
                    ))}
                </ol>
              )}
            </section>
            {recipe.notes.trim() && (
              <section className="rounded-2xl border border-tint/20 bg-tint/[0.06] p-4 text-sm leading-relaxed text-ink-2">{recipe.notes}</section>
            )}
          </div>
        )}
      </Sheet>
      <PlanRecipeSheet open={planOpen} onClose={() => setPlanOpen(false)} recipe={recipe} today={today} />
    </>
  );
}

function PlanRecipeSheet({ open, onClose, recipe, today }: { open: boolean; onClose: () => void; recipe: Recipe; today: DateKey }) {
  const data = useData();
  const update = useUpdate();
  const slots = data.nutrition.slots;
  const [wd, setWd] = useState<Weekday>(weekdayOf(today));
  const [slotId, setSlotId] = useState<ID>(slots[0]?.id ?? '');
  const slot = slots.find((s) => s.id === slotId) ?? slots[0];

  const submit = async () => {
    if (!slot) return;
    const existing = data.nutrition.plan[wd]?.[slot.id];
    if (!isMealEmpty(existing) && existing!.recipeId !== recipe.id) {
      const ok = await confirm({
        title: 'Remplacer le repas prévu ?',
        message: `« ${existing!.title || 'Repas sans nom'} » est déjà prévu ${slot.name.toLowerCase()} le ${WEEKDAYS[wd].toLowerCase()}.`,
        confirmLabel: 'Remplacer',
      });
      if (!ok) return;
    }
    update((d) => {
      d.nutrition.plan[wd] ??= {};
      d.nutrition.plan[wd][slot.id] = { title: recipe.title, items: copyItems(recipe.ingredients), notes: '', recipeId: recipe.id };
    });
    toast(`Prévu le ${WEEKDAYS[wd].toLowerCase()} · ${slot.name}`, { tone: 'success' });
    onClose();
  };

  return (
    <Sheet
      open={open}
      onClose={onClose}
      icon={<CalendarPlus />}
      title="Planifier la recette"
      subtitle={`${recipe.emoji} ${recipe.title}`}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="tint" onClick={submit} disabled={!slot}>
            Planifier
          </Button>
        </>
      }
    >
      {slots.length === 0 ? (
        <p className="text-sm text-ink-2">Ajoute d’abord un créneau de repas dans l’onglet Planning.</p>
      ) : (
        <div className="space-y-4">
          <Field label="Jour">
            <Select value={wd} onChange={(e) => setWd(Number(e.target.value) as Weekday)}>
              {WEEKDAYS.map((d, i) => (
                <option key={d} value={i}>
                  {d}
                  {i === weekdayOf(today) ? " (aujourd'hui)" : ''}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Repas">
            <Select value={slot?.id} onChange={(e) => setSlotId(e.target.value)}>
              {slots.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.emoji} {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <p className="text-[13px] text-ink-3">Les ingrédients sont copiés dans le repas : tu pourras les ajuster ensuite.</p>
        </div>
      )}
    </Sheet>
  );
}
