import { BookOpen, Plus, Star, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import {
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  IconButton,
  NumberField,
  ProgressBar,
  Rating,
  ReorderButtons,
  SectionHeader,
  Segmented,
  Sheet,
  TextArea,
  TextInput,
} from '@/components/ui';
import { formatLong, useToday } from '@/lib/dates';
import { removeWithUndo } from '@/lib/feedback';
import { useData, useUpdate } from '@/lib/store';
import type { Book, BookStatus } from '@/lib/types';
import { uid } from '@/lib/utils';
import { CategoryChip, CategorySelect, matchCategory, setBookStatus, STATUS_LABEL, STATUS_ORDER } from './shared';

function removeBook(id: string) {
  removeWithUndo('Livre supprimé', (d) => void (d.mind.books = d.mind.books.filter((b) => b.id !== id)));
}

function BookEditor({ id, onClose }: { id: string | null; onClose: () => void }) {
  const data = useData();
  const update = useUpdate();
  const today = useToday();
  const b = id ? data.mind.books.find((x) => x.id === id) : undefined;
  const patch = (fn: (b: Book) => void) =>
    update((d) => {
      const x = d.mind.books.find((y) => y.id === id);
      if (x) fn(x);
    });

  return (
    <Sheet
      open={!!b}
      onClose={onClose}
      title={b?.title || 'Nouveau livre'}
      subtitle="Chaque modification est enregistrée automatiquement."
      icon={<BookOpen />}
      footer={
        <>
          <Button
            variant="danger"
            className="mr-auto"
            onClick={() => {
              if (id) removeBook(id);
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
      {b && (
        <div className="space-y-4">
          <Field label="Titre">
            <TextInput value={b.title} placeholder="Titre du livre" onChange={(e) => patch((x) => void (x.title = e.target.value))} />
          </Field>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Auteur ou autrice">
              <TextInput value={b.author} onChange={(e) => patch((x) => void (x.author = e.target.value))} />
            </Field>
            <Field label="Catégorie">
              <CategorySelect
                value={b.categoryId ?? ''}
                categories={data.mind.categories}
                onChange={(v) => patch((x) => void (x.categoryId = v || null))}
              />
            </Field>
          </div>
          <Field label="Statut">
            <Segmented<BookStatus>
              value={b.status}
              onChange={(s) => patch((x) => setBookStatus(x, s, today))}
              options={(['a-lire', 'en-cours', 'lu'] as BookStatus[]).map((s) => ({ value: s, label: STATUS_LABEL[s] }))}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Pages lues">
              <NumberField
                value={b.pagesRead}
                min={0}
                max={b.pagesTotal > 0 ? b.pagesTotal : 99999}
                onChange={(v) => patch((x) => void (x.pagesRead = v))}
              />
            </Field>
            <Field label="Pages au total">
              <NumberField
                value={b.pagesTotal}
                min={0}
                max={99999}
                step={10}
                onChange={(v) =>
                  patch((x) => {
                    x.pagesTotal = v;
                    if (v > 0 && x.pagesRead > v) x.pagesRead = v;
                  })
                }
              />
            </Field>
          </div>
          <Field label="Mon appréciation">
            <Rating value={b.rating} onChange={(v) => patch((x) => void (x.rating = v))} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Commencé le">
              <TextInput type="date" value={b.startedAt ?? ''} onChange={(e) => patch((x) => void (x.startedAt = e.target.value || undefined))} />
            </Field>
            <Field label="Terminé le">
              <TextInput type="date" value={b.finishedAt ?? ''} onChange={(e) => patch((x) => void (x.finishedAt = e.target.value || undefined))} />
            </Field>
          </div>
          <Field label="Notes" hint="Idées clés, citations, ce que tu veux appliquer.">
            <TextArea minRows={4} value={b.notes} onChange={(e) => patch((x) => void (x.notes = e.target.value))} />
          </Field>
        </div>
      )}
    </Sheet>
  );
}

function BookCard({ book, onOpen, trailing }: { book: Book; onOpen: () => void; trailing?: ReactNode }) {
  const cats = useData().mind.categories;
  const color = cats.find((c) => c.id === book.categoryId)?.color ?? 'var(--tint)';
  return (
    <Card padding="none" interactive onClick={onOpen} className="flex min-w-0 overflow-hidden">
      <div className="w-1.5 shrink-0" style={{ background: color }} aria-hidden />
      <div className="min-w-0 flex-1 p-4">
        <div className="flex items-start gap-2">
          <div className="min-w-0 flex-1">
            <div className="truncate font-semibold">{book.title || 'Sans titre'}</div>
            <div className="truncate text-[13px] text-ink-3">{book.author || 'Auteur inconnu'}</div>
          </div>
          {trailing}
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <Chip tone={book.status === 'en-cours' ? 'tint' : book.status === 'lu' ? 'success' : 'neutral'}>{STATUS_LABEL[book.status]}</Chip>
          <CategoryChip id={book.categoryId} />
          {book.rating > 0 && (
            <span className="inline-flex items-center gap-0.5 text-xs text-ink-2">
              <Star className="size-3.5 fill-tint text-tint" /> {book.rating}/5
            </span>
          )}
        </div>
        {book.pagesTotal > 0 && book.status !== 'a-lire' && (
          <div className="mt-3">
            <ProgressBar value={book.pagesRead / book.pagesTotal} height={6} />
            <div className="mt-1 text-[11px] text-ink-3 tabular">
              {book.pagesRead} / {book.pagesTotal} pages
            </div>
          </div>
        )}
        {book.status === 'lu' && book.finishedAt && <div className="mt-2 text-[11px] text-ink-3">Terminé le {formatLong(book.finishedAt)}</div>}
      </div>
    </Card>
  );
}

export function BooksTab() {
  const data = useData();
  const update = useUpdate();
  const [status, setStatus] = useState<'all' | BookStatus>('all');
  const [cat, setCat] = useState('');
  const [editing, setEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const books = data.mind.books;
  const filtered = books.filter((b) => (status === 'all' || b.status === status) && matchCategory(cat, b.categoryId));
  const count = (s: BookStatus) => books.filter((b) => b.status === s).length;

  const add = () => {
    const id = uid('b');
    update(
      (d) =>
        void d.mind.books.push({
          id,
          title: '',
          author: '',
          categoryId: cat && cat !== 'none' ? cat : null,
          status: status === 'all' ? 'a-lire' : status,
          pagesTotal: 0,
          pagesRead: 0,
          notes: '',
          rating: 0,
        }),
    );
    setEditId(id);
  };

  /** Déplace un livre avant / après le livre voisin du même statut. */
  const move = (id: string, dir: -1 | 1) =>
    update((d) => {
      const list = d.mind.books;
      const i = list.findIndex((b) => b.id === id);
      if (i < 0) return;
      const same = list.map((b, k) => ({ b, k })).filter(({ b }) => b.status === list[i].status);
      const pos = same.findIndex(({ k }) => k === i);
      const other = same[pos + dir];
      if (!other) return;
      [list[i], list[other.k]] = [list[other.k], list[i]];
    });

  const groups: { status: BookStatus; items: Book[] }[] =
    status === 'all'
      ? STATUS_ORDER.map((s) => ({ status: s, items: filtered.filter((b) => b.status === s) })).filter((g) => g.items.length)
      : [{ status, items: filtered }];

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Ma bibliothèque"
        subtitle={`${count('lu')} lu${count('lu') > 1 ? 's' : ''} · ${count('en-cours')} en cours · ${count('a-lire')} à lire`}
        editing={editing}
        onToggleEdit={() => setEditing((e) => !e)}
        onAdd={add}
        addLabel="Livre"
      />
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          value={status}
          onChange={setStatus}
          options={[
            { value: 'all', label: 'Tous' },
            { value: 'en-cours', label: 'En cours' },
            { value: 'a-lire', label: 'À lire' },
            { value: 'lu', label: 'Lus' },
          ]}
        />
        <CategorySelect value={cat} onChange={setCat} categories={data.mind.categories} allLabel="Toutes les catégories" className="w-full sm:w-56" />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<BookOpen />} title="Aucun livre ici" action={<Button variant="tint" onClick={add}><Plus /> Ajouter un livre</Button>}>
          Ajoute les livres que tu lis ou que tu veux lire.
        </EmptyState>
      ) : (
        groups.map((g) => (
          <section key={g.status} className="animate-rise">
            {status === 'all' && <h3 className="mb-2 text-[13px] font-semibold tracking-wide text-ink-3 uppercase">{STATUS_LABEL[g.status]}</h3>}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {g.items.map((b, i) => (
                <BookCard
                  key={b.id}
                  book={b}
                  onOpen={() => setEditId(b.id)}
                  trailing={
                    editing ? (
                      <div className="-mt-1 -mr-2 flex shrink-0 items-center" onClick={(e) => e.stopPropagation()}>
                        <ReorderButtons index={i} count={g.items.length} onMove={(to) => move(b.id, to < i ? -1 : 1)} />
                        <IconButton label="Supprimer" size="icon-sm" onClick={() => removeBook(b.id)} className="text-danger hover:text-danger">
                          <Trash2 />
                        </IconButton>
                      </div>
                    ) : undefined
                  }
                />
              ))}
            </div>
          </section>
        ))
      )}
      <BookEditor id={editId} onClose={() => setEditId(null)} />
    </div>
  );
}

