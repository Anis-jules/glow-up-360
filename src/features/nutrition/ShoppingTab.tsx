import { Copy, Eraser, Plus, Share2, ShoppingCart, Trash2, Undo2 } from 'lucide-react';
import { useMemo, useRef, useState, type FormEvent } from 'react';
import {
  Button,
  Card,
  Checkbox,
  Chip,
  EmptyState,
  Field,
  IconButton,
  ReorderButtons,
  SectionHeader,
  Sheet,
  TextInput,
} from '@/components/ui';
import { removeWithUndo, toast } from '@/lib/feedback';
import { useData, useUpdate } from '@/lib/store';
import type { ID, ShoppingItem } from '@/lib/types';
import { cx } from '@/lib/utils';
import { addToShopping, copyText, guessCategory } from './helpers';

export function ShoppingTab() {
  const data = useData();
  const update = useUpdate();
  const list = data.nutrition.shopping;
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [category, setCategory] = useState('');
  const [editing, setEditing] = useState(false);
  const [editId, setEditId] = useState<ID | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const remaining = list.filter((i) => !i.checked).length;
  const checkedCount = list.length - remaining;
  const categories = useMemo(() => Array.from(new Set(list.map((i) => i.category).filter(Boolean))), [list]);

  // Regroupement par rayon, dans l'ordre d'apparition.
  const groups = useMemo(() => {
    const map = new Map<string, { item: ShoppingItem; index: number }[]>();
    list.forEach((item, index) => {
      const key = item.category.trim() || 'Divers';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({ item, index });
    });
    return Array.from(map.entries()).map(([cat, items]) => ({
      cat,
      items: editing ? items : [...items].sort((a, b) => Number(a.item.checked) - Number(b.item.checked)),
    }));
  }, [list, editing]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    let n = 0;
    update((d) => void (n = addToShopping(d, [{ name, qty, category: category || undefined }])));
    if (!n) toast(`${name.trim()} est déjà dans ta liste`);
    setName('');
    setQty('');
    inputRef.current?.focus();
  };

  const asText = () => {
    const lines = ['Liste de courses'];
    for (const g of groups) {
      const items = g.items.filter(({ item }) => !item.checked);
      if (!items.length) continue;
      lines.push('', g.cat);
      for (const { item } of items) lines.push(`- ${item.name}${item.qty ? ` (${item.qty})` : ''}`);
    }
    return lines.join('\n');
  };

  const copy = async () => {
    const ok = await copyText(asText());
    toast(ok ? 'Liste copiée' : 'Copie impossible sur ce navigateur', { tone: ok ? 'success' : 'error' });
  };
  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const share = async () => {
    try {
      await navigator.share({ title: 'Liste de courses', text: asText() });
    } catch {
      /* partage annulé */
    }
  };

  /** Déplace un article à l'intérieur de son rayon (échange avec son voisin). */
  const moveWithin = (groupItems: { index: number }[], pos: number, to: number) => {
    const a = groupItems[pos]?.index;
    const b = groupItems[to]?.index;
    if (a === undefined || b === undefined) return;
    update((d) => {
      const arr = d.nutrition.shopping;
      [arr[a], arr[b]] = [arr[b], arr[a]];
    });
  };

  return (
    <div className="space-y-4">
      <Card className="animate-rise">
        <SectionHeader
          icon={<ShoppingCart />}
          title="Liste de courses"
          subtitle={list.length ? `${remaining} à acheter${checkedCount ? ` · ${checkedCount} dans le panier` : ''}` : 'Vide pour l’instant'}
          editing={editing}
          onToggleEdit={() => setEditing((v) => !v)}
        />
        <form onSubmit={submit} className="flex flex-wrap gap-2">
          <TextInput
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ajouter un article…"
            aria-label="Article"
            className="min-w-0 flex-1 basis-full sm:basis-48"
          />
          <TextInput value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Quantité" aria-label="Quantité" className="w-auto min-w-0 flex-1 sm:w-28 sm:flex-none" />
          <TextInput
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder={name.trim() ? guessCategory(name) : 'Rayon'}
            aria-label="Rayon"
            list="shopping-categories"
            className="w-auto min-w-0 flex-1 sm:w-40 sm:flex-none"
          />
          <datalist id="shopping-categories">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <Button type="submit" variant="tint" disabled={!name.trim()} className="h-11">
            <Plus /> Ajouter
          </Button>
        </form>
        {list.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-line pt-4">
            <Button size="sm" variant="secondary" onClick={copy} disabled={!remaining}>
              <Copy /> Copier la liste
            </Button>
            {canShare && (
              <Button size="sm" variant="secondary" onClick={share} disabled={!remaining}>
                <Share2 /> Partager
              </Button>
            )}
            <Button size="sm" variant="ghost" disabled={!checkedCount} onClick={() => update((d) => d.nutrition.shopping.forEach((i) => (i.checked = false)))}>
              <Undo2 /> Tout décocher
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={!checkedCount}
              className="text-danger hover:text-danger"
              onClick={() =>
                removeWithUndo(
                  checkedCount > 1 ? `${checkedCount} articles retirés` : '1 article retiré',
                  (d) => void (d.nutrition.shopping = d.nutrition.shopping.filter((i) => !i.checked)),
                )
              }
            >
              <Eraser /> Retirer les articles cochés
            </Button>
          </div>
        )}
      </Card>

      {list.length === 0 ? (
        <EmptyState icon={<ShoppingCart />} title="Ta liste est vide">
          Ajoute des articles ci-dessus, ou depuis une recette, un repas du planning ou la liste des aliments.
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {groups.map((g, gi) => {
            const left = g.items.filter(({ item }) => !item.checked).length;
            return (
              <Card key={g.cat} padding="sm" className="animate-rise" style={{ animationDelay: `${Math.min(gi, 6) * 40}ms` }}>
                <div className="flex items-center justify-between px-2 pt-1 pb-1.5">
                  <h3 className="text-[15px] font-semibold">{g.cat}</h3>
                  <Chip tone={left ? 'tint' : 'success'}>{left ? `${left} restant${left > 1 ? 's' : ''}` : 'Complet'}</Chip>
                </div>
                <ul>
                  {g.items.map(({ item, index }, pos) => (
                    <li key={item.id} className="flex min-h-12 items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-ink/[0.03]">
                      <Checkbox
                        size="sm"
                        checked={item.checked}
                        label={item.name}
                        onChange={(v) => update((d) => void (d.nutrition.shopping[index].checked = v))}
                      />
                      <button
                        type="button"
                        onClick={() => (editing ? setEditId(item.id) : update((d) => void (d.nutrition.shopping[index].checked = !item.checked)))}
                        className="min-w-0 flex-1 text-left"
                      >
                        <span className={cx('text-[15px]', item.checked && 'text-ink-3 line-through decoration-ink-3/50')}>{item.name}</span>
                        {item.qty && <span className="ml-2 text-[13px] text-ink-3">{item.qty}</span>}
                      </button>
                      {editing && (
                        <>
                          <ReorderButtons index={pos} count={g.items.length} onMove={(to) => moveWithin(g.items, pos, to)} />
                          <IconButton
                            label="Supprimer"
                            size="icon-sm"
                            className="text-ink-3 hover:text-danger"
                            onClick={() => removeWithUndo(`« ${item.name} » retiré`, (d) => void d.nutrition.shopping.splice(index, 1))}
                          >
                            <Trash2 />
                          </IconButton>
                        </>
                      )}
                    </li>
                  ))}
                </ul>
              </Card>
            );
          })}
        </div>
      )}
      {editing && list.length > 0 && <p className="text-[13px] text-ink-3">Touche un article pour modifier son nom, sa quantité ou son rayon.</p>}

      <ShoppingItemSheet itemId={editId} categories={categories} onClose={() => setEditId(null)} />
    </div>
  );
}

function ShoppingItemSheet({ itemId, categories, onClose }: { itemId: ID | null; categories: string[]; onClose: () => void }) {
  const data = useData();
  const update = useUpdate();
  const index = data.nutrition.shopping.findIndex((i) => i.id === itemId);
  const item = index >= 0 ? data.nutrition.shopping[index] : undefined;
  if (!item) return null;
  const edit = (fn: (i: ShoppingItem) => void) =>
    update((d) => {
      const it = d.nutrition.shopping.find((x) => x.id === item.id);
      if (it) fn(it);
    });
  return (
    <Sheet
      open={!!item}
      onClose={onClose}
      icon={<ShoppingCart />}
      title={item.name || 'Article'}
      size="sm"
      footer={
        <>
          <Button
            variant="ghost"
            className="mr-auto text-danger hover:text-danger"
            onClick={() => {
              onClose();
              removeWithUndo(`« ${item.name} » retiré`, (d) => void d.nutrition.shopping.splice(index, 1));
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
        <Field label="Article">
          <TextInput value={item.name} onChange={(e) => edit((i) => void (i.name = e.target.value))} />
        </Field>
        <Field label="Quantité">
          <TextInput value={item.qty} onChange={(e) => edit((i) => void (i.qty = e.target.value))} />
        </Field>
        <Field label="Rayon">
          <TextInput value={item.category} list="shopping-categories-edit" onChange={(e) => edit((i) => void (i.category = e.target.value))} />
          <datalist id="shopping-categories-edit">
            {categories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>
      </div>
    </Sheet>
  );
}
