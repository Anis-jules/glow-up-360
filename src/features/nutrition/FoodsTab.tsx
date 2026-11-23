import { Apple, Heart, Pencil, Plus, ShoppingBasket, Sparkles, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Chip,
  EmojiField,
  EmptyState,
  Field,
  IconButton,
  ReorderButtons,
  SectionHeader,
  Segmented,
  Sheet,
  TextArea,
  TextInput,
} from '@/components/ui';
import { removeWithUndo, toast } from '@/lib/feedback';
import { useData, useUpdate } from '@/lib/store';
import type { Food, ID } from '@/lib/types';
import { cx, moveItem, uid } from '@/lib/utils';
import { addToShopping } from './helpers';

const FOOD_EMOJIS = ['🥦', '🍋', '🫐', '🥚', '🥑', '🐟', '🌰', '🥛', '🌾', '🫒', '🫘', '🍠'];

export function FoodsTab() {
  const data = useData();
  const update = useUpdate();
  const foods = data.nutrition.foods;
  const [editing, setEditing] = useState(false);
  const [view, setView] = useState<'all' | 'fav'>('all');
  const [editId, setEditId] = useState<ID | null>(null);
  const [isNew, setIsNew] = useState(false);
  const visible = foods.map((f, index) => ({ f, index })).filter(({ f }) => view === 'all' || f.favorite);

  const addFood = () => {
    const id = uid('f');
    update((d) =>
      void d.nutrition.foods.push({ id, name: '', emoji: '🥗', category: 'Légumes', benefits: '', tip: '', favorite: view === 'fav' }),
    );
    setIsNew(true);
    setEditId(id);
  };

  const toShopping = (f: Food) => {
    let n = 0;
    update((d) => void (n = addToShopping(d, [{ name: f.name }])));
    toast(n ? `${f.name} ajouté aux courses` : `${f.name} est déjà dans ta liste`, { tone: n ? 'success' : 'default' });
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={<Apple />}
        title="Aliments recommandés"
        subtitle="Des alliés du quotidien, à varier selon tes goûts"
        editing={editing}
        onToggleEdit={() => setEditing((v) => !v)}
        onAdd={addFood}
        className="mb-0"
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          options={[
            { value: 'all', label: `Tous · ${foods.length}` },
            { value: 'fav', label: `Favoris · ${foods.filter((f) => f.favorite).length}` },
          ]}
          value={view}
          onChange={setView}
        />
        <p className="text-[13px] text-ink-3">Repères généraux, pas une prescription.</p>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          icon={<Apple />}
          title={view === 'fav' ? 'Aucun favori' : 'Aucun aliment'}
          action={
            <Button variant="tint" onClick={addFood}>
              <Plus /> Ajouter un aliment
            </Button>
          }
        >
          {view === 'fav' ? 'Touche le cœur d’un aliment pour le retrouver ici.' : 'Ajoute les aliments que tu aimes et qui te font du bien.'}
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {visible.map(({ f, index }, i) => (
            <Card
              key={f.id}
              padding="none"
              className={cx('flex animate-rise flex-col p-4', editing && 'cursor-pointer')}
              style={{ animationDelay: `${Math.min(i, 8) * 35}ms` }}
              onClick={() => editing && setEditId(f.id)}
            >
              <div className="flex items-start gap-3">
                <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-tint/10 text-2xl">{f.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold">{f.name || 'Aliment sans nom'}</div>
                  {f.category && <Chip className="mt-1">{f.category}</Chip>}
                </div>
                {!editing && (
                  <div className="-mt-1 -mr-1 flex">
                    <IconButton label={f.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'} size="icon-sm" onClick={() => update((d) => void (d.nutrition.foods[index].favorite = !f.favorite))}>
                      <Heart className={cx(f.favorite ? 'fill-tint text-tint' : 'text-ink-3')} />
                    </IconButton>
                    <IconButton label="Ajouter aux courses" size="icon-sm" onClick={() => toShopping(f)} disabled={!f.name.trim()}>
                      <ShoppingBasket className="text-ink-3" />
                    </IconButton>
                  </div>
                )}
              </div>
              {f.benefits && <p className="mt-3 text-[14px] leading-relaxed text-ink-2">{f.benefits}</p>}
              {f.tip && (
                <p className="mt-2 flex gap-2 rounded-xl bg-surface-2 px-3 py-2 text-[13px] leading-snug text-ink-2">
                  <Sparkles className="mt-0.5 size-3.5 shrink-0 text-tint" />
                  <span>{f.tip}</span>
                </p>
              )}
              {editing && (
                <div className="mt-3 flex items-center justify-between border-t border-line pt-3" onClick={(e) => e.stopPropagation()}>
                  <ReorderButtons index={index} count={foods.length} onMove={(to) => update((d) => moveItem(d.nutrition.foods, index, to))} />
                  <div className="flex items-center gap-1">
                    <IconButton label="Modifier" size="icon-sm" onClick={() => setEditId(f.id)}>
                      <Pencil />
                    </IconButton>
                    <IconButton
                      label="Supprimer"
                      size="icon-sm"
                      className="text-ink-3 hover:text-danger"
                      onClick={() => removeWithUndo(`« ${f.name || 'Aliment'} » supprimé`, (d) => void d.nutrition.foods.splice(index, 1))}
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

      <FoodEditorSheet
        foodId={editId}
        isNew={isNew}
        onClose={() => {
          setEditId(null);
          setIsNew(false);
        }}
      />
    </div>
  );
}

function FoodEditorSheet({ foodId, isNew, onClose }: { foodId: ID | null; isNew: boolean; onClose: () => void }) {
  const data = useData();
  const update = useUpdate();
  const foods = data.nutrition.foods;
  const index = foods.findIndex((f) => f.id === foodId);
  const food = index >= 0 ? foods[index] : undefined;
  const categories = useMemo(() => Array.from(new Set(foods.map((f) => f.category).filter(Boolean))), [foods]);
  if (!food) return null;
  const edit = (fn: (f: Food) => void) =>
    update((d) => {
      const f = d.nutrition.foods.find((x) => x.id === food.id);
      if (f) fn(f);
    });

  return (
    <Sheet
      open={!!food}
      onClose={onClose}
      icon={<span className="text-xl leading-none">{food.emoji}</span>}
      title={isNew ? 'Nouvel aliment' : food.name || 'Aliment'}
      footer={
        <>
          <Button
            variant="ghost"
            className="mr-auto text-danger hover:text-danger"
            onClick={() => {
              onClose();
              removeWithUndo(`« ${food.name || 'Aliment'} » supprimé`, (d) => void d.nutrition.foods.splice(index, 1));
            }}
          >
            <Trash2 /> Supprimer
          </Button>
          <Button variant="primary" onClick={onClose}>
            Terminé
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Emoji">
          <EmojiField value={food.emoji} onChange={(v) => edit((f) => void (f.emoji = v))} suggestions={FOOD_EMOJIS} />
        </Field>
        <Field label="Nom">
          <TextInput value={food.name} autoFocus={isNew} placeholder="Par exemple : Kiwi" onChange={(e) => edit((f) => void (f.name = e.target.value))} />
        </Field>
        <Field label="Catégorie">
          <TextInput value={food.category} list="food-categories" onChange={(e) => edit((f) => void (f.category = e.target.value))} />
          <datalist id="food-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
        <Field label="Pourquoi il m’intéresse">
          <TextArea minRows={3} value={food.benefits} onChange={(e) => edit((f) => void (f.benefits = e.target.value))} />
        </Field>
        <Field label="Astuce">
          <TextArea minRows={2} value={food.tip} onChange={(e) => edit((f) => void (f.tip = e.target.value))} />
        </Field>
      </div>
    </Sheet>
  );
}
