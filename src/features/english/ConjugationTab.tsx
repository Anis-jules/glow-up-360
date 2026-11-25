import { BookOpenCheck, Check, ChevronDown, GraduationCap, Plus, Search, Target } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Button, Card, Chip, SectionHeader, Segmented, TextInput } from '@/components/ui';
import { useToday } from '@/lib/dates';
import { toggleTense, toggleVerb } from '@/lib/english';
import { toast } from '@/lib/feedback';
import { useData, useUpdate } from '@/lib/store';
import { cx } from '@/lib/utils';
import { TENSES, type Tense } from './content/tenses';
import { IRREGULAR_VERBS } from './content/verbs';
import { seededRandom, shuffle, type Question } from './quiz';
import { PracticeSheet } from './QuizTab';

export function ConjugationTab() {
  const data = useData();
  const studied = new Set(data.english.tenses.map((t) => t.id));
  const nextId = TENSES.find((t) => !studied.has(t.id))?.id;
  const [open, setOpen] = useState<string | null>(nextId ?? null);
  const [practice, setPractice] = useState<Question[] | null>(null);

  return (
    <div className="space-y-5">
      <section>
        <SectionHeader
          title="Points de conjugaison"
          subtitle={`${studied.size} / ${TENSES.length} étudiés · un point étudié entre dans le quiz de la semaine`}
          icon={<GraduationCap />}
        />
        <div className="space-y-3">
          {TENSES.map((t, i) => (
            <TenseCard
              key={t.id}
              tense={t}
              index={i}
              studied={studied.has(t.id)}
              suggested={t.id === nextId}
              open={open === t.id}
              onToggleOpen={() => setOpen((o) => (o === t.id ? null : t.id))}
              onPractice={() => setPractice(practiceFor(t))}
            />
          ))}
        </div>
      </section>
      <VerbsTable />
      <PracticeSheet questions={practice} onClose={() => setPractice(null)} title="Entraînement" />
    </div>
  );
}

/** Les 6 questions d'un point, mélangées (entraînement libre, sans enjeu). */
function practiceFor(t: Tense): Question[] {
  const r = seededRandom(`${t.id}-${Date.now()}`);
  return shuffle(
    t.questions.map((q, i) => ({
      key: `p:${t.id}:${i}`,
      kind: 'grammar' as const,
      label: t.title,
      prompt: q.sentence,
      options: shuffle([...q.options], r),
      answer: q.options[0],
    })),
    r,
  );
}

function TenseCard({
  tense,
  index,
  studied,
  suggested,
  open,
  onToggleOpen,
  onPractice,
}: {
  tense: Tense;
  index: number;
  studied: boolean;
  suggested: boolean;
  open: boolean;
  onToggleOpen: () => void;
  onPractice: () => void;
}) {
  const update = useUpdate();
  const today = useToday();
  return (
    <Card padding="none" className={cx('animate-rise overflow-hidden', suggested && 'border-tint/40')} style={{ animationDelay: `${index * 30}ms` }}>
      <button type="button" onClick={onToggleOpen} className="flex w-full items-center gap-3 p-4 text-left sm:px-5" aria-expanded={open}>
        <span className={cx('grid size-8 shrink-0 place-items-center rounded-lg text-sm font-semibold tabular', studied ? 'bg-tint text-tint-ink' : 'bg-ink/[0.06] text-ink-2')}>
          {studied ? <Check className="size-4" /> : index + 1}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{tense.title}</span>
          <span className="block truncate text-[13px] text-ink-3">{tense.subtitle}</span>
        </span>
        {suggested && !studied && <Chip tone="tint" className="max-sm:hidden">À étudier</Chip>}
        <ChevronDown className={cx('size-4 shrink-0 text-ink-3 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="space-y-4 border-t border-line px-4 pt-4 pb-5 sm:px-5">
          <div>
            <h3 className="mb-1.5 text-[13px] font-semibold tracking-wide text-ink-3 uppercase">Construction</h3>
            <ul className="space-y-1.5">
              {tense.structure.map((s) => (
                <li key={s} className="rounded-lg bg-surface-2 px-3 py-2 text-[14px]">
                  {s}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="mb-1.5 text-[13px] font-semibold tracking-wide text-ink-3 uppercase">Quand l’utiliser</h3>
            <ul className="space-y-1 text-[14px] text-ink-2">
              {tense.usage.map((u) => (
                <li key={u} className="flex gap-2">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-tint" />
                  <span>{u}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-[13px] text-ink-3">
              Mots repères : <span className="text-ink-2 italic">{tense.signals}</span>
            </p>
          </div>
          <div>
            <h3 className="mb-1.5 text-[13px] font-semibold tracking-wide text-ink-3 uppercase">Exemples</h3>
            <ul className="space-y-2">
              {tense.examples.map((e) => (
                <li key={e.en} className="text-[14px]">
                  <span className="font-medium" lang="en">
                    {e.en}
                  </span>
                  <span className="block text-ink-3">{e.fr}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={onPractice}>
              <Target /> S’entraîner (6 questions)
            </Button>
            {studied ? (
              <Button variant="ghost" onClick={() => update((d) => toggleTense(d, tense.id, today, false))}>
                Retirer des points étudiés
              </Button>
            ) : (
              <Button
                variant="tint"
                onClick={() => {
                  update((d) => toggleTense(d, tense.id, today, true));
                  toast(`« ${tense.title} » ajouté au quiz de la semaine`, { tone: 'success' });
                }}
              >
                <Check /> Je l’ai étudié
              </Button>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

function VerbsTable() {
  const data = useData();
  const update = useUpdate();
  const today = useToday();
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'mine'>('all');
  const learned = new Set(data.english.verbs.map((v) => v.id));
  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return IRREGULAR_VERBS.filter(
      (v) =>
        (filter === 'all' || learned.has(v.base)) &&
        (!needle || [v.base, v.past, v.participle, v.fr].some((x) => x.toLowerCase().includes(needle))),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, filter, data.english.verbs]);

  return (
    <Card padding="lg" className="animate-rise">
      <SectionHeader
        title="Verbes irréguliers"
        subtitle={`${learned.size} / ${IRREGULAR_VERBS.length} dans tes révisions (et donc dans le quiz)`}
        icon={<BookOpenCheck />}
        extra={
          <Segmented
            options={[
              { value: 'all', label: 'Tous' },
              { value: 'mine', label: 'Les miens' },
            ]}
            value={filter}
            onChange={setFilter}
          />
        }
      />
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" />
        <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chercher un verbe (anglais ou français)" className="pl-9" />
      </div>
      <div className="overflow-hidden rounded-2xl border border-line">
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_2.5rem] gap-2 bg-surface-2 px-3 py-2 text-[11px] font-semibold tracking-wide text-ink-3 uppercase">
          <span>Base</span>
          <span>Prétérit</span>
          <span>Participe</span>
          <span />
        </div>
        <ul className="divide-y divide-line">
          {list.map((v) => {
            const mine = learned.has(v.base);
            return (
              <li key={v.base} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_2.5rem] items-center gap-2 px-3 py-2">
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-semibold" lang="en">
                    {v.base}
                  </span>
                  <span className="block truncate text-[11px] text-ink-3">{v.fr}</span>
                </span>
                <span className="truncate text-[14px]" lang="en">
                  {v.past}
                </span>
                <span className="truncate text-[14px]" lang="en">
                  {v.participle}
                </span>
                <button
                  type="button"
                  aria-label={mine ? `Retirer ${v.base} des révisions` : `Ajouter ${v.base} aux révisions`}
                  title={mine ? 'Dans tes révisions' : 'Ajouter à tes révisions'}
                  onClick={() => update((d) => toggleVerb(d, v.base, today, !mine))}
                  className={cx(
                    'grid size-8 place-items-center rounded-lg transition-colors',
                    mine ? 'bg-tint text-tint-ink' : 'bg-ink/[0.05] text-ink-2 hover:bg-tint/15 hover:text-tint',
                  )}
                >
                  {mine ? <Check className="size-4" /> : <Plus className="size-4" />}
                </button>
              </li>
            );
          })}
        </ul>
        {list.length === 0 && <p className="p-4 text-center text-sm text-ink-3">Aucun verbe.</p>}
      </div>
    </Card>
  );
}
