import { NotebookPen, Plus, Search, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button, Card, EmptyState, Field, IconButton, Sheet, TextArea, TextInput } from '@/components/ui';
import { capitalize, formatRelative, useToday } from '@/lib/dates';
import { removeWithUndo } from '@/lib/feedback';
import { useApp, useData, useUpdate } from '@/lib/store';
import type { JournalEntry } from '@/lib/types';
import { cx, uid } from '@/lib/utils';
import { CategoryChip, CategorySelect, matchCategory } from './shared';

function parseTags(raw: string): string[] {
  return [...new Set(raw.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean))];
}

function EntryEditor({ id, onClose }: { id: string | null; onClose: () => void }) {
  const data = useData();
  const update = useUpdate();
  const e = id ? data.mind.journal.find((x) => x.id === id) : undefined;
  const [tagsText, setTagsText] = useState<string | null>(null);
  const patch = (fn: (e: JournalEntry) => void) =>
    update((d) => {
      const x = d.mind.journal.find((y) => y.id === id);
      if (x) fn(x);
    });

  const close = () => {
    // Une note laissée vide est retirée sans bruit.
    const cur = useApp.getState().data.mind.journal.find((x) => x.id === id);
    if (cur && !cur.title.trim() && !cur.content.trim()) {
      update((d) => void (d.mind.journal = d.mind.journal.filter((x) => x.id !== id)));
    }
    setTagsText(null);
    onClose();
  };

  return (
    <Sheet
      open={!!e}
      onClose={close}
      title="Journal de connaissances"
      subtitle="Ce que tu as appris, avec tes mots. Enregistré automatiquement."
      icon={<NotebookPen />}
      size="lg"
      footer={
        <>
          <Button
            variant="danger"
            className="mr-auto"
            onClick={() => {
              removeWithUndo('Note supprimée', (d) => void (d.mind.journal = d.mind.journal.filter((x) => x.id !== id)));
              setTagsText(null);
              onClose();
            }}
          >
            <Trash2 /> Supprimer
          </Button>
          <Button variant="tint" onClick={close}>
            Terminé
          </Button>
        </>
      }
    >
      {e && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Date">
              <TextInput type="date" value={e.date} onChange={(ev) => ev.target.value && patch((x) => void (x.date = ev.target.value))} />
            </Field>
            <Field label="Catégorie">
              <CategorySelect value={e.categoryId ?? ''} categories={data.mind.categories} onChange={(v) => patch((x) => void (x.categoryId = v || null))} />
            </Field>
          </div>
          <Field label="Titre">
            <TextInput value={e.title} placeholder="Ex. Le biais de confirmation" onChange={(ev) => patch((x) => void (x.title = ev.target.value))} />
          </Field>
          <Field label="Ce que j’ai appris">
            <TextArea
              minRows={7}
              value={e.content}
              placeholder="Résume l’idée principale, un exemple, et comment tu pourrais l’utiliser."
              onChange={(ev) => patch((x) => void (x.content = ev.target.value))}
            />
          </Field>
          <Field label="Étiquettes" hint="Séparées par des virgules : biais, mémoire, stoïcisme…">
            <TextInput
              value={tagsText ?? e.tags.join(', ')}
              onChange={(ev) => {
                setTagsText(ev.target.value);
                const tags = parseTags(ev.target.value);
                patch((x) => void (x.tags = tags));
              }}
            />
          </Field>
        </div>
      )}
    </Sheet>
  );
}

export function JournalTab() {
  const data = useData();
  const update = useUpdate();
  const today = useToday();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('');
  const [tag, setTag] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const journal = data.mind.journal;

  const tags = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of journal) for (const t of e.tags) m.set(t, (m.get(t) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [journal]);

  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = journal
      .filter((e) => matchCategory(cat, e.categoryId))
      .filter((e) => !tag || e.tags.includes(tag))
      .filter((e) => !needle || `${e.title} ${e.content} ${e.tags.join(' ')}`.toLowerCase().includes(needle))
      .sort((a, b) => (a.date === b.date ? (a.createdAt < b.createdAt ? 1 : -1) : a.date < b.date ? 1 : -1));
    const out: { date: string; items: JournalEntry[] }[] = [];
    for (const e of list) {
      const last = out[out.length - 1];
      if (last?.date === e.date) last.items.push(e);
      else out.push({ date: e.date, items: [e] });
    }
    return out;
  }, [journal, q, cat, tag]);

  const add = () => {
    const id = uid('j');
    update(
      (d) =>
        void d.mind.journal.unshift({
          id,
          date: today,
          title: '',
          content: '',
          categoryId: cat && cat !== 'none' ? cat : null,
          tags: tag ? [tag] : [],
          createdAt: new Date().toISOString(),
        }),
    );
    setEditId(id);
  };

  const filtering = !!(q || cat || tag);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-semibold">Journal de connaissances</h2>
          <p className="text-[13px] text-ink-3">
            {journal.length} note{journal.length > 1 ? 's' : ''} · ce que tu écris, tu le retiens mieux.
          </p>
        </div>
        <Button variant="tint" onClick={add}>
          <Plus /> Nouvelle note
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_14rem]">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-3" />
          <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher dans mes notes" className="pl-10" />
          {q && (
            <IconButton label="Effacer la recherche" size="icon-sm" onClick={() => setQ('')} className="absolute top-1/2 right-1.5 -translate-y-1/2">
              <X />
            </IconButton>
          )}
        </div>
        <CategorySelect value={cat} onChange={setCat} categories={data.mind.categories} allLabel="Toutes les catégories" />
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map(([t, n]) => (
            <button
              key={t}
              type="button"
              aria-pressed={tag === t}
              onClick={() => setTag(tag === t ? null : t)}
              className={cx(
                'h-7 rounded-full px-3 text-xs font-medium transition-colors',
                tag === t ? 'bg-tint text-tint-ink' : 'bg-ink/[0.06] text-ink-2 hover:bg-ink/10',
              )}
            >
              #{t} <span className="opacity-60">{n}</span>
            </button>
          ))}
        </div>
      )}

      {groups.length === 0 ? (
        <EmptyState
          icon={<NotebookPen />}
          title={filtering ? 'Aucune note ne correspond' : 'Ton journal est vide'}
          action={
            filtering ? (
              <Button
                variant="secondary"
                onClick={() => {
                  setQ('');
                  setCat('');
                  setTag(null);
                }}
              >
                Effacer les filtres
              </Button>
            ) : (
              <Button variant="tint" onClick={add}>
                <Plus /> Écrire ma première note
              </Button>
            )
          }
        >
          {filtering ? 'Essaie un autre mot ou une autre catégorie.' : 'Chaque jour, note en quelques lignes une idée apprise. C’est ta mémoire de long terme.'}
        </EmptyState>
      ) : (
        groups.map((g) => (
          <section key={g.date} className="animate-rise">
            <h3 className="mb-2 text-[13px] font-semibold text-ink-3">{capitalize(formatRelative(g.date, today))}</h3>
            <div className="space-y-2">
              {g.items.map((e) => (
                <Card key={e.id} interactive onClick={() => setEditId(e.id)} className="min-w-0">
                  <div className="font-semibold">{e.title || 'Sans titre'}</div>
                  {e.content && <p className="mt-1 line-clamp-3 text-sm leading-relaxed whitespace-pre-line text-ink-2">{e.content}</p>}
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    {e.categoryId && <CategoryChip id={e.categoryId} />}
                    {e.tags.map((t) => (
                      <span key={t} className="text-xs text-ink-3">
                        #{t}
                      </span>
                    ))}
                  </div>
                </Card>
              ))}
            </div>
          </section>
        ))
      )}
      <EntryEditor id={editId} onClose={() => setEditId(null)} />
    </div>
  );
}
