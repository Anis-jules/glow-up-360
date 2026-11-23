import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button, IconButton, ReorderButtons, TextInput } from '@/components/ui';
import type { FoodItem } from '@/lib/types';
import { moveItem, uid } from '@/lib/utils';

/**
 * Liste éditable d'aliments (nom + quantité).
 * `apply(fn)` modifie la liste dans le magasin ; avec un message, la suppression peut être annulée.
 */
export function ItemsEditor({
  items,
  apply,
  addLabel = 'Ajouter un aliment',
  namePlaceholder = 'Aliment',
}: {
  items: FoodItem[];
  apply: (fn: (list: FoodItem[]) => void, undoMessage?: string) => void;
  addLabel?: string;
  namePlaceholder?: string;
}) {
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={it.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-line p-2 sm:flex-nowrap sm:border-0 sm:p-0">
          <TextInput
            value={it.name}
            autoFocus={it.id === lastAdded}
            placeholder={namePlaceholder}
            aria-label="Nom"
            onChange={(e) => apply((list) => void (list[i].name = e.target.value))}
            className="min-w-0 basis-full sm:basis-auto sm:flex-1"
          />
          <TextInput
            value={it.qty}
            placeholder="Quantité"
            aria-label="Quantité"
            onChange={(e) => apply((list) => void (list[i].qty = e.target.value))}
            className="w-auto min-w-0 flex-1 sm:w-32 sm:flex-none"
          />
          <ReorderButtons index={i} count={items.length} onMove={(to) => apply((list) => moveItem(list, i, to))} />
          <IconButton
            label="Supprimer"
            size="icon-sm"
            className="text-ink-3 hover:text-danger"
            onClick={() => apply((list) => void list.splice(i, 1), `« ${it.name || 'Aliment'} » retiré`)}
          >
            <Trash2 />
          </IconButton>
        </div>
      ))}
      <Button
        size="sm"
        variant="ghost"
        className="text-tint hover:text-tint"
        onClick={() => {
          const id = uid('fi');
          setLastAdded(id);
          apply((list) => void list.push({ id, name: '', qty: '' }));
        }}
      >
        <Plus /> {addLabel}
      </Button>
    </div>
  );
}
