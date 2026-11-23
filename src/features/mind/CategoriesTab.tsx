import { FolderOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import {
  Button,
  Card,
  ColorField,
  EmojiField,
  EmptyState,
  Field,
  IconButton,
  ReorderButtons,
  SectionHeader,
  Sheet,
  TextInput,
} from '@/components/ui';
import { confirm, removeWithUndo } from '@/lib/feedback';
import { useData, useUpdate } from '@/lib/store';
import type { AppData, Category } from '@/lib/types';
import { moveItem, PALETTE, uid } from '@/lib/utils';
import { categoryStyle } from './shared';

const EMOJIS = ['🧠', '🏛️', '📜', '🌍', '🔬', '💻', '💶', '📈', '🗣️', '🎨', '🎵', '🩺', '⚖️', '🧭'];

function usage(data: AppData, id: string) {
  return {
    books: data.mind.books.filter((b) => b.categoryId === id).length,
    topics: data.mind.topics.filter((t) => t.categoryId === id).length,
    notes: data.mind.journal.filter((j) => j.categoryId === id).length,
  };
}

function usageText(u: { books: number; topics: number; notes: number }) {
  const parts = [
    u.books && `${u.books} livre${u.books > 1 ? 's' : ''}`,
    u.topics && `${u.topics} sujet${u.topics > 1 ? 's' : ''}`,
    u.notes && `${u.notes} note${u.notes > 1 ? 's' : ''}`,
  ].filter(Boolean);
  return parts.length ? parts.join(' · ') : 'Rien de lié pour l’instant';
}

async function removeCategory(data: AppData, c: Category) {
  const u = usage(data, c.id);
  const linked = u.books + u.topics + u.notes;
  if (linked > 0) {
    const ok = await confirm({
      title: `Supprimer « ${c.name} » ?`,
      message: `${usageText(u)} passeront en « Sans catégorie ». Rien d’autre n’est supprimé.`,
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (!ok) return false;
  }
  removeWithUndo('Catégorie supprimée', (d) => {
    d.mind.categories = d.mind.categories.filter((x) => x.id !== c.id);
    for (const b of d.mind.books) if (b.categoryId === c.id) b.categoryId = null;
    for (const t of d.mind.topics) if (t.categoryId === c.id) t.categoryId = null;
    for (const j of d.mind.journal) if (j.categoryId === c.id) j.categoryId = null;
  });
  return true;
}

function CategoryEditor({ id, onClose }: { id: string | null; onClose: () => void }) {
  const data = useData();
  const update = useUpdate();
  const c = id ? data.mind.categories.find((x) => x.id === id) : undefined;
  const patch = (fn: (c: Category) => void) =>
    update((d) => {
      const x = d.mind.categories.find((y) => y.id === id);
      if (x) fn(x);
    });
  return (
    <Sheet
      open={!!c}
      onClose={onClose}
      title="Catégorie"
      subtitle="Chaque modification est enregistrée automatiquement."
      footer={
        <>
          <Button
            variant="danger"
            className="mr-auto"
            onClick={async () => {
              if (c && (await removeCategory(data, c))) onClose();
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
      {c && (
        <div className="space-y-4">
          <div className="flex justify-center">
            <span className="inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium" style={categoryStyle(c.color)}>
              {c.emoji} {c.name || 'Catégorie'}
            </span>
          </div>
          <Field label="Nom">
            <TextInput value={c.name} onChange={(e) => patch((x) => void (x.name = e.target.value))} />
          </Field>
          <Field label="Emoji">
            <EmojiField value={c.emoji} suggestions={EMOJIS} onChange={(v) => patch((x) => void (x.emoji = v))} />
          </Field>
          <Field label="Couleur">
            <ColorField value={c.color} onChange={(v) => patch((x) => void (x.color = v))} />
          </Field>
        </div>
      )}
    </Sheet>
  );
}

export function CategoriesTab() {
  const data = useData();
  const update = useUpdate();
  const [editing, setEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const cats = data.mind.categories;

  const add = () => {
    const id = uid('c');
    update((d) => void d.mind.categories.push({ id, name: 'Nouvelle catégorie', emoji: '💡', color: PALETTE[d.mind.categories.length % PALETTE.length] }));
    setEditId(id);
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Catégories"
        subtitle="Pour ranger tes livres, sujets et notes."
        editing={editing}
        onToggleEdit={() => setEditing((e) => !e)}
        onAdd={add}
        addLabel="Catégorie"
      />
      {cats.length === 0 ? (
        <EmptyState icon={<FolderOpen />} title="Aucune catégorie" action={<Button variant="tint" onClick={add}><Plus /> Créer une catégorie</Button>} />
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {cats.map((c, i) => {
            const u = usage(data, c.id);
            return (
              <Card
                key={c.id}
                padding="sm"
                interactive={!editing}
                onClick={() => !editing && setEditId(c.id)}
                className="flex min-w-0 animate-rise items-center gap-3"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl text-xl" style={categoryStyle(c.color)}>
                  {c.emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{c.name || 'Sans nom'}</div>
                  <div className="truncate text-xs text-ink-3">{usageText(u)}</div>
                </div>
                {editing && (
                  <div className="-mr-1 flex shrink-0 items-center">
                    <ReorderButtons index={i} count={cats.length} onMove={(to) => update((d) => moveItem(d.mind.categories, i, to))} />
                    <IconButton label="Modifier" size="icon-sm" onClick={() => setEditId(c.id)}>
                      <Pencil />
                    </IconButton>
                    <IconButton label="Supprimer" size="icon-sm" onClick={() => void removeCategory(data, c)} className="text-danger hover:text-danger">
                      <Trash2 />
                    </IconButton>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
      <CategoryEditor id={editId} onClose={() => setEditId(null)} />
    </div>
  );
}
