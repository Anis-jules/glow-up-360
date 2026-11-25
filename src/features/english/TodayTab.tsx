import { ArrowRight, BookOpenCheck, Briefcase, Check, Lock, Plus, RefreshCw, Settings2, Trophy } from 'lucide-react';
import { useState } from 'react';
import { Button, Card, Chip, Field, IconButton, NumberField, ProgressRing, SectionHeader, Sheet } from '@/components/ui';
import { formatLong, useToday } from '@/lib/dates';
import { addWord, syncEnglishHabit, toggleVerb, wordsOn } from '@/lib/english';
import { toast } from '@/lib/feedback';
import { useData, useUpdate } from '@/lib/store';
import type { ID } from '@/lib/types';
import { AddWordForm } from './AddWordForm';
import { TENSES } from './content/tenses';
import { IRREGULAR_VERBS } from './content/verbs';
import { businessSuggestions, quizStatus, sundayOf } from './quiz';
import { WordRow, WordSheet } from './WordsTab';

export type EnglishTab = 'today' | 'conjugaison' | 'quiz' | 'mots';

export function TodayTab({ onGoTo }: { onGoTo: (t: EnglishTab) => void }) {
  const data = useData();
  const today = useToday();
  const status = quizStatus(data, today);
  const paused = !!status?.overdue;

  return (
    <div className="space-y-5">
      {status && !status.passed && <QuizBanner overdue={status.overdue} count={status.questionCount} week={status.week} onGo={() => onGoTo('quiz')} />}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <TodayWords />
        <div className="space-y-5">
          <BusinessSuggestions paused={paused} />
          <VerbOfTheDay paused={paused} />
          <TenseOfTheWeek onGo={() => onGoTo('conjugaison')} />
        </div>
      </div>
    </div>
  );
}

function QuizBanner({ overdue, count, week, onGo }: { overdue: boolean; count: number; week: string; onGo: () => void }) {
  return (
    <button
      type="button"
      onClick={onGo}
      className="flex w-full animate-rise items-center gap-3 rounded-2xl border border-tint/30 bg-tint/10 p-4 text-left transition-colors hover:bg-tint/15"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-tint text-tint-ink">
        {overdue ? <Lock className="size-5" /> : <Trophy className="size-5" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{overdue ? 'Quiz de la semaine passée à réussir' : 'Le quiz de la semaine est ouvert'}</span>
        <span className="block text-[13px] text-ink-2">
          {count} questions sur tout ce que tu as appris jusqu’au {formatLong(sundayOf(week))}. 100 % pour valider, essais illimités.
          {overdue && ' Les nouvelles suggestions reprennent dès qu’il est réussi.'}
        </span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-tint" />
    </button>
  );
}

function TodayWords() {
  const data = useData();
  const today = useToday();
  const [editing, setEditing] = useState<ID | null>(null);
  const [goalOpen, setGoalOpen] = useState(false);
  const goal = Math.max(1, data.english.dailyGoal);
  const todays = wordsOn(data, today);
  return (
    <Card padding="lg" className="animate-rise">
      <div className="mb-4 flex items-center gap-4">
        <ProgressRing value={todays.length / goal} size={64} stroke={7}>
          <span className="font-display text-base font-semibold tabular">
            {todays.length}/{goal}
          </span>
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-semibold">Mes mots du jour</h2>
          <p className="text-[13px] text-ink-3">
            {todays.length >= goal ? 'Objectif atteint, bravo. Tu peux en ajouter d’autres.' : `Encore ${goal - todays.length} à noter, avec leur traduction.`}
          </p>
        </div>
        <IconButton label="Objectif du jour" variant="ghost" onClick={() => setGoalOpen(true)}>
          <Settings2 />
        </IconButton>
      </div>
      <AddWordForm dateKey={today} />
      {todays.length > 0 && (
        <ul className="mt-4 divide-y divide-line">
          {todays.map((w) => (
            <WordRow key={w.id} word={w} onOpen={() => setEditing(w.id)} />
          ))}
        </ul>
      )}
      <WordSheet id={editing} onClose={() => setEditing(null)} />
      <GoalSheet open={goalOpen} onClose={() => setGoalOpen(false)} />
    </Card>
  );
}

function Paused({ what }: { what: string }) {
  return (
    <p className="flex items-start gap-2 rounded-xl bg-surface-2 p-3 text-[13px] text-ink-2">
      <Lock className="mt-0.5 size-4 shrink-0 text-ink-3" />
      Nouveaux {what} en pause : réussis d’abord le quiz de la semaine passée à 100 %.
    </p>
  );
}

function BusinessSuggestions({ paused }: { paused: boolean }) {
  const data = useData();
  const update = useUpdate();
  const today = useToday();
  const [offset, setOffset] = useState(0);
  const list = businessSuggestions(data.english, today, 5, offset);

  return (
    <Card padding="md" className="animate-rise" style={{ animationDelay: '60ms' }}>
      <SectionHeader
        title="Mots business du jour"
        subtitle="À utiliser au travail : un geste pour les ajouter"
        icon={<Briefcase />}
        extra={
          !paused && list.length > 0 ? (
            <IconButton label="Autres idées" size="icon-sm" onClick={() => setOffset((o) => o + 1)}>
              <RefreshCw />
            </IconButton>
          ) : undefined
        }
      />
      {paused ? (
        <Paused what="mots business" />
      ) : list.length === 0 ? (
        <p className="text-sm text-ink-2">Tu as déjà ajouté tous les mots business proposés. Bravo.</p>
      ) : (
        <ul className="divide-y divide-line">
          {list.map((b) => (
            <li key={b.en} className="flex items-start gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-baseline gap-x-2">
                  <span className="text-[15px] font-semibold" lang="en">
                    {b.en}
                  </span>
                  <span className="text-[14px] text-ink-2">{b.fr}</span>
                </div>
                <div className="mt-0.5 text-[13px] text-ink-3 italic" lang="en">
                  {b.example}
                </div>
                <Chip className="mt-1.5 h-5 text-[11px]">{b.theme}</Chip>
              </div>
              <Button
                size="sm"
                variant="tint"
                onClick={() => {
                  update((d) => void addWord(d, today, b.en, b.fr, { note: b.example, source: 'business', theme: b.theme }));
                  toast(`« ${b.en} » ajouté à tes mots du jour`, { tone: 'success' });
                }}
              >
                <Plus /> <span className="max-sm:sr-only">Ajouter</span>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function VerbOfTheDay({ paused }: { paused: boolean }) {
  const data = useData();
  const update = useUpdate();
  const today = useToday();
  const learned = new Set(data.english.verbs.map((v) => v.id));
  const next = IRREGULAR_VERBS.find((v) => !learned.has(v.base));
  const addedToday = data.english.verbs.filter((v) => v.date === today).length;

  return (
    <Card padding="md" className="animate-rise" style={{ animationDelay: '90ms' }}>
      <SectionHeader
        title="Verbe irrégulier du jour"
        subtitle={`${learned.size} / ${IRREGULAR_VERBS.length} dans tes révisions${addedToday ? ` · ${addedToday} aujourd’hui` : ''}`}
        icon={<BookOpenCheck />}
      />
      {paused ? (
        <Paused what="verbes" />
      ) : !next ? (
        <p className="text-sm text-ink-2">Tous les verbes irréguliers sont dans tes révisions. Impressionnant.</p>
      ) : (
        <div className="rounded-2xl bg-surface-2 p-4">
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              ['Base', `to ${next.base}`],
              ['Prétérit', next.past],
              ['Participe', next.participle],
            ].map(([label, value]) => (
              <div key={label} className="min-w-0 rounded-xl bg-surface px-2 py-2.5">
                <div className="text-[11px] font-medium tracking-wide text-ink-3 uppercase">{label}</div>
                <div className="mt-0.5 truncate font-display text-[15px] font-semibold" lang="en">
                  {value}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-center text-[13px] text-ink-2">{next.fr}</p>
          <Button
            variant="tint"
            className="mt-3 w-full"
            onClick={() => {
              update((d) => toggleVerb(d, next.base, today, true));
              toast(`« to ${next.base} » ajouté à tes révisions`, { tone: 'success' });
            }}
          >
            <Check /> Je l’ai appris, l’ajouter au quiz
          </Button>
        </div>
      )}
    </Card>
  );
}

function TenseOfTheWeek({ onGo }: { onGo: () => void }) {
  const data = useData();
  const studied = new Set(data.english.tenses.map((t) => t.id));
  const next = TENSES.find((t) => !studied.has(t.id));
  return (
    <button
      type="button"
      onClick={onGo}
      className="flex w-full animate-rise items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-left transition-colors hover:bg-surface-2"
      style={{ animationDelay: '120ms' }}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-xs font-semibold tracking-wide text-ink-3 uppercase">Conjugaison</span>
        <span className="block truncate text-[15px] font-medium">
          {next ? `À étudier : ${next.title}` : 'Tous les points de conjugaison sont étudiés'}
        </span>
        <span className="block text-[13px] text-ink-3">
          {studied.size} / {TENSES.length} points étudiés
        </span>
      </span>
      <ArrowRight className="size-4 shrink-0 text-ink-3" />
    </button>
  );
}

function GoalSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const data = useData();
  const update = useUpdate();
  const today = useToday();
  return (
    <Sheet open={open} onClose={onClose} size="sm" title="Objectif du jour" icon={<Settings2 />} footer={<Button variant="tint" onClick={onClose}>Terminé</Button>}>
      <Field label="Mots à noter chaque jour" hint="L’habitude « mots en anglais » se coche toute seule quand l’objectif est atteint.">
        <NumberField
          value={data.english.dailyGoal}
          min={1}
          max={50}
          onChange={(v) =>
            update((d) => {
              d.english.dailyGoal = v;
              syncEnglishHabit(d, today);
            })
          }
          suffix="mots"
        />
      </Field>
    </Sheet>
  );
}
