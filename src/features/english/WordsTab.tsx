import { Briefcase, Eye, Languages, Search, Shuffle, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button, Card, Chip, EmptyState, Field, SectionHeader, Segmented, Sheet, TextArea, TextInput } from '@/components/ui';
import { capitalize, formatRelative, useToday } from '@/lib/dates';
import { editWord, removeWord } from '@/lib/english';
import { removeWithUndo } from '@/lib/feedback';
import { useData, useUpdate } from '@/lib/store';
import type { EnglishWord, ID } from '@/lib/types';

export function WordRow({ word, onOpen }: { word: EnglishWord; onOpen: () => void }) {
  return (
    <li>
      <button type="button" onClick={onOpen} className="flex w-full items-baseline gap-3 rounded-xl px-1 py-2.5 text-left hover:bg-ink/[0.03]">
        <span className="flex min-w-0 flex-1 items-baseline gap-1.5">
          <span className="truncate text-[15px] font-semibold" lang="en">
            {word.en}
          </span>
          {word.source === 'business' && <Briefcase className="size-3 shrink-0 text-ink-3" aria-label="Business" />}
        </span>
        <span className="min-w-0 flex-1 truncate text-right text-[15px] text-ink-2">{word.fr || '…'}</span>
      </button>
    </li>
  );
}

export function WordsTab() {
  const [editing, setEditing] = useState<ID | null>(null);
  const data = useData();
  return (
    <div className="space-y-5">
      <Review words={data.english.words} />
      <AllWords onOpen={setEditing} />
      <WordSheet id={editing} onClose={() => setEditing(null)} />
    </div>
  );
}

/** Révision libre : une carte au hasard, on devine la traduction puis on la révèle. */
function Review({ words }: { words: EnglishWord[] }) {
  const [direction, setDirection] = useState<'en' | 'fr'>('en');
  const [index, setIndex] = useState(() => Math.floor(Math.random() * 1000));
  const [shown, setShown] = useState(false);
  const usable = words.filter((w) => w.en && w.fr);

  const next = () => {
    setShown(false);
    if (usable.length > 1) {
      let n = index;
      while (n % usable.length === index % usable.length) n = Math.floor(Math.random() * 100000);
      setIndex(n);
    }
  };

  const word = usable.length ? usable[index % usable.length] : null;
  return (
    <Card padding="lg" className="animate-rise">
      <SectionHeader
        title="Réviser"
        subtitle={usable.length ? `${usable.length} mot${usable.length > 1 ? 's' : ''}` : 'Tes mots apparaîtront ici'}
        icon={<Shuffle />}
        extra={
          <Segmented
            options={[
              { value: 'en', label: 'EN → FR' },
              { value: 'fr', label: 'FR → EN' },
            ]}
            value={direction}
            onChange={(v) => {
              setDirection(v);
              setShown(false);
            }}
          />
        }
      />
      {!word ? (
        <p className="rounded-xl bg-surface-2 p-4 text-center text-sm text-ink-2">Ajoute des mots avec leur traduction pour commencer à réviser.</p>
      ) : (
        <div className="flex flex-col items-center rounded-2xl bg-surface-2 px-4 py-8 text-center">
          <div className="text-xs font-semibold tracking-wide text-ink-3 uppercase">{direction === 'en' ? 'Anglais' : 'Français'}</div>
          <div className="mt-1 font-display text-3xl font-semibold break-words" lang={direction === 'en' ? 'en' : 'fr'}>
            {direction === 'en' ? word.en : word.fr}
          </div>
          <div className="mt-5 min-h-12">
            {shown ? (
              <>
                <div className="text-xs font-semibold tracking-wide text-ink-3 uppercase">{direction === 'en' ? 'Français' : 'Anglais'}</div>
                <div className="mt-1 text-xl font-medium text-tint">{direction === 'en' ? word.fr : word.en}</div>
                {word.note && <div className="mt-2 text-[13px] text-ink-3 italic">{word.note}</div>}
              </>
            ) : (
              <Button variant="secondary" onClick={() => setShown(true)}>
                <Eye /> Voir la traduction
              </Button>
            )}
          </div>
          <Button variant="tint" className="mt-5" onClick={next} disabled={usable.length < 2}>
            <Shuffle /> Mot suivant
          </Button>
          <div className="mt-2 text-[11px] text-ink-3">Noté {formatRelative(word.date).toLowerCase()}</div>
        </div>
      )}
    </Card>
  );
}

function AllWords({ onOpen }: { onOpen: (id: ID) => void }) {
  const data = useData();
  const today = useToday();
  const [q, setQ] = useState('');
  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = data.english.words.filter((w) => !needle || w.en.toLowerCase().includes(needle) || w.fr.toLowerCase().includes(needle));
    const byDate = new Map<string, EnglishWord[]>();
    for (const w of list) byDate.set(w.date, [...(byDate.get(w.date) ?? []), w]);
    return [...byDate.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [data.english.words, q]);
  const business = data.english.words.filter((w) => w.source === 'business').length;

  return (
    <Card padding="lg" className="animate-rise" style={{ animationDelay: '60ms' }}>
      <SectionHeader
        title="Tous mes mots"
        subtitle={`${data.english.words.length} au total${business ? `, dont ${business} business` : ''}`}
        extra={business > 0 ? <Chip><Briefcase /> business</Chip> : undefined}
      />
      {data.english.words.length > 0 && (
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" />
          <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher un mot ou une traduction" className="pl-9" />
        </div>
      )}
      {data.english.words.length === 0 ? (
        <EmptyState icon={<Languages />} title="Aucun mot pour l’instant">
          Note tes mots du jour dans l’onglet Aujourd’hui : ils s’ajoutent ici, classés par date.
        </EmptyState>
      ) : groups.length === 0 ? (
        <p className="py-6 text-center text-sm text-ink-3">Aucun mot ne correspond à « {q} ».</p>
      ) : (
        <div className="space-y-5">
          {groups.map(([date, words]) => (
            <div key={date}>
              <div className="mb-1 flex items-baseline justify-between px-1">
                <span className="text-[13px] font-semibold text-ink-2">{capitalize(formatRelative(date, today))}</span>
                <span className="text-xs text-ink-3 tabular">{words.length}</span>
              </div>
              <ul className="divide-y divide-line rounded-2xl bg-surface-2 px-3">
                {words.map((w) => (
                  <WordRow key={w.id} word={w} onOpen={() => onOpen(w.id)} />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

export function WordSheet({ id, onClose }: { id: ID | null; onClose: () => void }) {
  const data = useData();
  const update = useUpdate();
  const word = id ? data.english.words.find((w) => w.id === id) : undefined;
  const set = (patch: Partial<Omit<EnglishWord, 'id'>>) => update((d) => editWord(d, id!, patch));
  return (
    <Sheet
      open={!!word}
      onClose={onClose}
      title={word?.en || 'Mot'}
      subtitle="Chaque modification est enregistrée."
      icon={<Languages />}
      footer={
        word && (
          <>
            <Button
              variant="danger"
              className="mr-auto"
              onClick={() => {
                const wid = word.id;
                onClose();
                removeWithUndo(`« ${word.en} » supprimé`, (d) => removeWord(d, wid));
              }}
            >
              <Trash2 /> Supprimer
            </Button>
            <Button variant="tint" onClick={onClose}>
              Terminé
            </Button>
          </>
        )
      }
    >
      {word && (
        <div className="space-y-4">
          <Field label="En anglais">
            <TextInput value={word.en} lang="en" autoCapitalize="none" onChange={(e) => set({ en: e.target.value })} />
          </Field>
          <Field label="Traduction">
            <TextInput value={word.fr} onChange={(e) => set({ fr: e.target.value })} />
          </Field>
          <Field label="Exemple ou note">
            <TextArea minRows={2} value={word.note} placeholder="Une phrase d’exemple, la prononciation…" onChange={(e) => set({ note: e.target.value })} />
          </Field>
          <Field label="Date">
            <TextInput type="date" value={word.date} onChange={(e) => e.target.value && set({ date: e.target.value })} />
          </Field>
        </div>
      )}
    </Sheet>
  );
}
