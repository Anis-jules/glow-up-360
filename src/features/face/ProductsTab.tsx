import { CalendarDays, Package, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  IconButton,
  ReorderButtons,
  SectionHeader,
  Segmented,
  Select,
  Sheet,
  TextArea,
  TextInput,
  Toggle,
} from '@/components/ui';
import { daysBetween, formatShort, useToday } from '@/lib/dates';
import { removeWithUndo } from '@/lib/feedback';
import { useData, useUpdate } from '@/lib/store';
import type { Product, ProductUsage } from '@/lib/types';
import { cx, moveItem, uid } from '@/lib/utils';

const USAGES: ProductUsage[] = ['matin', 'soir', 'matin et soir', 'ponctuel'];
const USAGE_LABEL: Record<ProductUsage, string> = {
  matin: 'Matin',
  soir: 'Soir',
  'matin et soir': 'Matin et soir',
  ponctuel: 'Ponctuel',
};
const TYPE_SUGGESTIONS = ['Nettoyant', 'Hydratant', 'Protection solaire', 'Sérum', 'Exfoliant', 'Masque', 'Contour des yeux', 'Massage', 'Baume à lèvres'];

function removeProduct(id: string) {
  removeWithUndo('Produit supprimé', (d) => {
    d.face.products = d.face.products.filter((p) => p.id !== id);
    for (const r of d.face.routines) for (const s of r.steps) if (s.productId === id) s.productId = null;
  });
}

function ProductEditor({ id, onClose }: { id: string | null; onClose: () => void }) {
  const data = useData();
  const update = useUpdate();
  const p = id ? data.face.products.find((x) => x.id === id) : undefined;
  const patch = (fn: (p: Product) => void) =>
    update((d) => {
      const x = d.face.products.find((y) => y.id === id);
      if (x) fn(x);
    });
  const linked = p ? data.face.routines.flatMap((r) => r.steps.filter((s) => s.productId === p.id).map((s) => `${r.name} : ${s.title}`)) : [];

  return (
    <Sheet
      open={!!p}
      onClose={onClose}
      title={p?.name || 'Produit'}
      subtitle="Chaque modification est enregistrée automatiquement."
      icon={<Package />}
      footer={
        <>
          <Button
            variant="danger"
            className="mr-auto"
            onClick={() => {
              if (id) removeProduct(id);
              onClose();
            }}
          >
            <Trash2 /> Supprimer
          </Button>
          <Button variant="tint" onClick={onClose}>
            Terminé
          </Button>
        </>
      }
    >
      {p && (
        <div className="space-y-4">
          <Field label="Nom">
            <TextInput value={p.name} onChange={(e) => patch((x) => void (x.name = e.target.value))} placeholder="Ex. Gel nettoyant doux" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Marque">
              <TextInput value={p.brand} onChange={(e) => patch((x) => void (x.brand = e.target.value))} />
            </Field>
            <Field label="Type">
              <TextInput list="face-product-types" value={p.type} onChange={(e) => patch((x) => void (x.type = e.target.value))} />
              <datalist id="face-product-types">
                {TYPE_SUGGESTIONS.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Utilisation">
              <Select value={p.usage} onChange={(e) => patch((x) => void (x.usage = e.target.value as ProductUsage))}>
                {USAGES.map((u) => (
                  <option key={u} value={u}>
                    {USAGE_LABEL[u]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Ouvert le">
              <TextInput type="date" value={p.openedAt} onChange={(e) => patch((x) => void (x.openedAt = e.target.value))} />
            </Field>
          </div>
          <Toggle checked={p.inUse} onChange={(v) => patch((x) => void (x.inUse = v))} label="En cours d’utilisation" />
          <Field label="Notes" hint="Texture, réaction de ta peau, à racheter…">
            <TextArea value={p.notes} onChange={(e) => patch((x) => void (x.notes = e.target.value))} />
          </Field>
          {linked.length > 0 && (
            <div className="rounded-2xl bg-surface-2 p-3 text-sm">
              <div className="mb-1 text-xs font-medium text-ink-3">Utilisé dans</div>
              {linked.map((l) => (
                <div key={l}>{l}</div>
              ))}
            </div>
          )}
        </div>
      )}
    </Sheet>
  );
}

export function ProductsTab() {
  const data = useData();
  const update = useUpdate();
  const today = useToday();
  const [filter, setFilter] = useState<'all' | 'inuse'>('all');
  const [editing, setEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const products = data.face.products;
  const shown = filter === 'inuse' ? products.filter((p) => p.inUse) : products;

  const add = () => {
    const id = uid('p');
    update((d) =>
      void d.face.products.push({ id, name: '', brand: '', type: '', usage: 'matin et soir', notes: '', inUse: true, openedAt: today }),
    );
    setEditId(id);
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Mes produits"
        subtitle={`${products.filter((p) => p.inUse).length} en cours sur ${products.length}`}
        editing={editing}
        onToggleEdit={() => setEditing((e) => !e)}
        onAdd={add}
        addLabel="Produit"
      />
      <Segmented
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: `Tous (${products.length})` },
          { value: 'inuse', label: 'En cours' },
        ]}
      />
      {shown.length === 0 ? (
        <EmptyState icon={<Package />} title="Aucun produit ici" action={<Button variant="tint" onClick={add}><Plus /> Ajouter un produit</Button>}>
          Note tes produits pour savoir ce qui convient à ta peau.
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {shown.map((p, i) => {
            const realIndex = products.indexOf(p);
            const months = p.openedAt ? Math.floor(daysBetween(p.openedAt, today) / 30) : null;
            return (
              <Card
                key={p.id}
                padding="sm"
                interactive={!editing}
                onClick={() => !editing && setEditId(p.id)}
                className={cx('animate-rise p-4', !p.inUse && 'opacity-70')}
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center size-10 shrink-0 rounded-xl bg-tint/12 text-tint">
                    <Package className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{p.name || 'Produit sans nom'}</div>
                    <div className="truncate text-[13px] text-ink-3">{[p.brand, p.type].filter(Boolean).join(' · ') || 'Marque et type à compléter'}</div>
                  </div>
                  {editing && (
                    <div className="-mt-1 -mr-2 flex items-center">
                      <ReorderButtons
                        index={realIndex}
                        count={products.length}
                        onMove={(to) => update((d) => moveItem(d.face.products, realIndex, to))}
                      />
                      <IconButton label="Supprimer" size="icon-sm" onClick={() => removeProduct(p.id)} className="text-danger hover:text-danger">
                        <Trash2 />
                      </IconButton>
                    </div>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <Chip tone="tint">{USAGE_LABEL[p.usage]}</Chip>
                  {p.inUse ? <Chip tone="success">En cours</Chip> : <Chip>De côté</Chip>}
                  {p.openedAt && (
                    <Chip>
                      <CalendarDays /> {formatShort(p.openedAt)}
                      {months !== null && months > 0 ? ` · ${months} mois` : ''}
                    </Chip>
                  )}
                </div>
                {p.notes && <p className="mt-2 line-clamp-2 text-[13px] text-ink-2">{p.notes}</p>}
                {editing && (
                  <Button size="xs" variant="secondary" className="mt-3" onClick={() => setEditId(p.id)}>
                    Modifier
                  </Button>
                )}
              </Card>
            );
          })}
        </div>
      )}
      <p className="text-xs text-ink-3">
        Astuce : la plupart des produits indiquent une durée d’utilisation après ouverture (pictogramme du pot ouvert, « 6M », « 12M »).
      </p>
      <ProductEditor id={editId} onClose={() => setEditId(null)} />
    </div>
  );
}
