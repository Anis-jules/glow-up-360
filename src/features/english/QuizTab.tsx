import { ArrowRight, CalendarClock, Check, History, Lock, RotateCcw, Target, Trophy, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button, Card, Chip, ProgressBar, SectionHeader, Sheet } from '@/components/ui';
import { addDays, formatLong, formatShort, startOfWeek, useToday, weekdayOf } from '@/lib/dates';
import { sounds } from '@/lib/sound';
import { useData, useUpdate } from '@/lib/store';
import type { EnglishQuiz } from '@/lib/types';
import { cx } from '@/lib/utils';
import { buildQuestions, quizItems, quizStatus, sundayOf, type Question } from './quiz';

// ───────────────────────── Déroulé d'un quiz (une question à la fois)

function QuizRunner({
  questions,
  startIndex = 0,
  onAnswer,
  onComplete,
}: {
  questions: Question[];
  startIndex?: number;
  onAnswer: (q: Question, ok: boolean, given: string) => void;
  onComplete: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const [picked, setPicked] = useState<string | null>(null);
  const timer = useRef<number>(0);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const q = questions[index];
  if (!q) return null;
  const last = index === questions.length - 1;
  const ok = picked !== null && picked === q.answer;

  const next = () => {
    window.clearTimeout(timer.current);
    setPicked(null);
    if (last) onComplete();
    else setIndex((i) => i + 1);
  };

  const pick = (option: string) => {
    if (picked !== null) return;
    setPicked(option);
    const good = option === q.answer;
    onAnswer(q, good, option);
    if (good) {
      sounds.phase();
      timer.current = window.setTimeout(next, 650);
    }
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[13px] text-ink-3 tabular">
        <span>
          Question {index + 1} / {questions.length}
        </span>
        <span>{q.label}</span>
      </div>
      <ProgressBar value={index / questions.length} height={6} />
      <div className="mt-6 text-center">
        <div className="text-xs font-semibold tracking-wide text-ink-3 uppercase">{q.label}</div>
        <div className="mt-2 font-display text-2xl leading-snug font-semibold break-words sm:text-3xl" lang={q.kind === 'word-fr' ? 'fr' : 'en'}>
          {q.prompt}
        </div>
        {q.hint && <div className="mt-1 text-sm text-ink-3">{q.hint}</div>}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {q.options.map((o) => {
          const isAnswer = o === q.answer;
          const isPicked = o === picked;
          return (
            <button
              key={o}
              type="button"
              onClick={() => pick(o)}
              disabled={picked !== null}
              className={cx(
                'flex min-h-13 items-center justify-between gap-2 rounded-2xl border-2 px-4 py-3 text-left text-[15px] font-medium transition-colors',
                picked === null && 'border-line bg-surface hover:border-tint/50 hover:bg-tint/5',
                picked !== null && isAnswer && 'border-success bg-success/10',
                picked !== null && isPicked && !isAnswer && 'border-danger bg-danger/10',
                picked !== null && !isAnswer && !isPicked && 'border-line opacity-50',
              )}
            >
              <span className="min-w-0 break-words">{o}</span>
              {picked !== null && isAnswer && <Check className="size-5 shrink-0 text-success" />}
              {picked !== null && isPicked && !isAnswer && <X className="size-5 shrink-0 text-danger" />}
            </button>
          );
        })}
      </div>
      <div className="mt-5 min-h-11 text-center">
        {picked !== null && !ok && (
          <div className="animate-pop-in">
            <p className="mb-3 text-sm text-ink-2">
              Bonne réponse : <strong className="text-ink">{q.answer}</strong>
            </p>
            <Button variant="tint" onClick={next}>
              {last ? 'Voir le résultat' : 'Question suivante'} <ArrowRight />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/** Entraînement libre (aucun enjeu) : utilisé par la conjugaison et le quiz. */
export function PracticeSheet({ questions, onClose, title }: { questions: Question[] | null; onClose: () => void; title: string }) {
  const [round, setRound] = useState(0);
  const [score, setScore] = useState({ correct: 0, done: false });
  const total = questions?.length ?? 0;
  useEffect(() => {
    setScore({ correct: 0, done: false });
    setRound(0);
  }, [questions]);

  return (
    <Sheet open={!!questions} onClose={onClose} size="lg" title={title} subtitle="Pour t’exercer : ne compte pas dans le quiz de la semaine." icon={<Target />}>
      {questions && !score.done && (
        <QuizRunner
          key={round}
          questions={questions}
          onAnswer={(_, ok) => ok && setScore((s) => ({ ...s, correct: s.correct + 1 }))}
          onComplete={() => setScore((s) => ({ ...s, done: true }))}
        />
      )}
      {questions && score.done && (
        <div className="py-6 text-center">
          <div className="font-display text-5xl font-semibold tabular">{Math.round((score.correct / Math.max(1, total)) * 100)} %</div>
          <p className="mt-2 text-ink-2">
            {score.correct} bonne{score.correct > 1 ? 's' : ''} réponse{score.correct > 1 ? 's' : ''} sur {total}
          </p>
          <div className="mt-5 flex justify-center gap-2">
            <Button variant="secondary" onClick={onClose}>
              Fermer
            </Button>
            <Button
              variant="tint"
              onClick={() => {
                setScore({ correct: 0, done: false });
                setRound((r) => r + 1);
              }}
            >
              <RotateCcw /> Recommencer
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}

// ───────────────────────── Onglet Quiz

export function QuizTab() {
  const data = useData();
  const update = useUpdate();
  const today = useToday();
  const status = quizStatus(data, today);
  const rec = status?.record;
  const [open, setOpen] = useState(false);
  const [practice, setPractice] = useState<Question[] | null>(null);
  // Questions de la tentative affichée : figées au démarrage, gardées jusqu'au dernier écran de correction.
  const [active, setActive] = useState<{ key: string; questions: Question[]; startIndex: number } | null>(null);

  const start = () => {
    if (!status) return;
    const current = rec?.current;
    const attempt = current?.attempt ?? (rec?.attempts ?? 0) + 1;
    const items = current?.items ?? [...status.items];
    const questions = buildQuestions(data.english, items, `${status.week}#${attempt}`);
    update((d) => {
      const r = (d.english.quizzes[status.week] ??= { attempts: 0, best: 0, lastErrors: [] });
      if (!r.current) r.current = { attempt, items, index: 0, correct: 0, wrong: [] };
    });
    setActive({ key: `${status.week}-${attempt}`, questions, startIndex: current?.index ?? 0 });
    setOpen(true);
  };

  const answer = (q: Question, ok: boolean, given: string) => {
    if (!status || !active) return;
    const questions = active.questions;
    const total = questions.length;
    update((d) => {
      const r = d.english.quizzes[status.week];
      const cur = r?.current;
      if (!r || !cur) return;
      cur.index += 1;
      if (ok) cur.correct += 1;
      else cur.wrong.push({ key: q.key, given });
      if (cur.index >= total) {
        const score = Math.round((cur.correct / total) * 100);
        r.attempts = cur.attempt;
        r.best = Math.max(r.best, score);
        r.lastErrors = cur.wrong.map((w) => {
          const qq = questions.find((x) => x.key === w.key);
          return { prompt: qq ? `${qq.label} : ${qq.prompt}` : w.key, answer: qq?.answer ?? '', given: w.given };
        });
        if (cur.correct === total) r.passedAt = new Date().toISOString();
        r.current = null;
      }
    });
  };

  const practiceAll = () => {
    const items = quizItems(data.english, today);
    if (!items.length) return;
    setPractice(buildQuestions(data.english, items, `practice-${Date.now()}`));
  };

  const nextSaturday = weekdayOf(today) < 5 ? addDays(startOfWeek(today), 5) : addDays(startOfWeek(today), 12);
  const history = Object.entries(data.english.quizzes).sort((a, b) => (a[0] < b[0] ? 1 : -1));

  return (
    <div className="space-y-5">
      <Card padding="lg" className="animate-rise">
        {!status ? (
          <Empty nextSaturday={nextSaturday} />
        ) : status.passed ? (
          <Passed rec={rec!} week={status.week} nextSaturday={nextSaturday} />
        ) : (
          <Pending status={status} rec={rec} onStart={start} />
        )}
        <Rules />
      </Card>

      <Card padding="md" className="animate-rise" style={{ animationDelay: '60ms' }}>
        <SectionHeader title="S’entraîner" subtitle="Sur tout ce que tu as appris, autant que tu veux, sans enjeu" icon={<Target />} />
        <Button variant="secondary" onClick={practiceAll} disabled={!quizItems(data.english, today).length}>
          <Target /> Lancer un entraînement
        </Button>
      </Card>

      {history.length > 0 && (
        <Card padding="md" className="animate-rise" style={{ animationDelay: '90ms' }}>
          <SectionHeader title="Mes quiz" icon={<History />} />
          <ul className="divide-y divide-line">
            {history.map(([week, r]) => (
              <li key={week} className="flex items-center gap-3 py-2.5">
                <span className={cx('grid size-8 shrink-0 place-items-center rounded-lg', r.passedAt ? 'bg-success/15 text-success' : 'bg-ink/[0.06] text-ink-3')}>
                  {r.passedAt ? <Check className="size-4" /> : <Lock className="size-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14px] font-medium">Semaine du {formatShort(week)}</span>
                  <span className="block text-xs text-ink-3">
                    {r.passedAt ? `Validée le ${formatLong(r.passedAt.slice(0, 10))}` : 'Pas encore validée'} · {r.attempts} essai{r.attempts > 1 ? 's' : ''} · meilleur score {r.best} %
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Sheet
        open={open && !!status}
        onClose={() => {
          setOpen(false);
          setActive(null);
        }}
        size="lg"
        title={status ? `Quiz de la semaine du ${formatShort(status.week)}` : 'Quiz'}
        subtitle="100 % pour valider · tu peux fermer et reprendre plus tard"
        icon={<Trophy />}
      >
        {active ? (
          <QuizRunner key={active.key} questions={active.questions} startIndex={active.startIndex} onAnswer={answer} onComplete={() => setActive(null)} />
        ) : (
          rec && <Result rec={rec} onRetry={start} onClose={() => setOpen(false)} />
        )}
      </Sheet>

      <PracticeSheet questions={practice} onClose={() => setPractice(null)} title="Entraînement" />
    </div>
  );
}

function Empty({ nextSaturday }: { nextSaturday: string }) {
  return (
    <div className="flex items-start gap-4">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-tint/12 text-tint">
        <CalendarClock className="size-6" />
      </span>
      <div className="min-w-0">
        <h2 className="text-lg font-semibold">Ton premier quiz arrive le {formatLong(nextSaturday)}</h2>
        <p className="mt-1 text-sm text-ink-2">
          Note des mots, ajoute des verbes irréguliers et étudie un point de conjugaison : tout entrera dans le quiz du week-end.
        </p>
      </div>
    </div>
  );
}

function Passed({ rec, week, nextSaturday }: { rec: EnglishQuiz; week: string; nextSaturday: string }) {
  return (
    <div className="flex items-start gap-4">
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-success/15 text-success">
        <Trophy className="size-6" />
      </span>
      <div className="min-w-0">
        <h2 className="text-lg font-semibold">Semaine du {formatShort(week)} validée</h2>
        <p className="mt-1 text-sm text-ink-2">
          100 % en {rec.attempts} essai{rec.attempts > 1 ? 's' : ''}. Prochain quiz le {formatLong(nextSaturday)}, sur tout ce que tu auras appris d’ici là.
        </p>
      </div>
    </div>
  );
}

function Pending({ status, rec, onStart }: { status: NonNullable<ReturnType<typeof quizStatus>>; rec?: EnglishQuiz; onStart: () => void }) {
  const run = rec?.current;
  return (
    <div>
      <div className="flex items-start gap-4">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-tint text-tint-ink">
          {status.overdue ? <Lock className="size-6" /> : <Trophy className="size-6" />}
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">
            {status.overdue ? 'Quiz de la semaine passée à réussir' : `Quiz de la semaine du ${formatShort(status.week)}`}
          </h2>
          <p className="mt-1 text-sm text-ink-2">
            {status.questionCount} questions sur tout ce que tu as appris jusqu’au {formatLong(sundayOf(status.week))}.
            {status.overdue && ' Les nouvelles suggestions reprennent dès qu’il est réussi.'}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Chip>{rec?.attempts ?? 0} essai{(rec?.attempts ?? 0) > 1 ? 's' : ''}</Chip>
            {!!rec?.best && <Chip>Meilleur score {rec.best} %</Chip>}
          </div>
        </div>
      </div>
      <Button variant="tint" size="lg" className="mt-4 w-full sm:w-auto" onClick={onStart}>
        {run ? `Reprendre (question ${run.index + 1} / ${status.questionCount})` : (rec?.attempts ?? 0) > 0 ? 'Retenter le quiz' : 'Commencer le quiz'} <ArrowRight />
      </Button>
      {!run && rec && rec.lastErrors.length > 0 && <Errors rec={rec} />}
    </div>
  );
}

function Errors({ rec }: { rec: EnglishQuiz }) {
  return (
    <div className="mt-5">
      <h3 className="mb-2 text-[13px] font-semibold tracking-wide text-ink-3 uppercase">À revoir avant de retenter ({rec.lastErrors.length})</h3>
      <ul className="space-y-1.5">
        {rec.lastErrors.map((e, i) => (
          <li key={i} className="rounded-xl bg-surface-2 px-3 py-2 text-[14px]">
            <span className="block text-ink-2">{e.prompt}</span>
            <span className="block">
              <span className="font-semibold text-success">{e.answer}</span>
              {e.given && <span className="text-ink-3"> · ta réponse : {e.given}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Result({ rec, onRetry, onClose }: { rec: EnglishQuiz; onRetry: () => void; onClose: () => void }) {
  const passed = !!rec.passedAt;
  return (
    <div className="py-4 text-center">
      <div className={cx('mx-auto grid size-16 place-items-center rounded-3xl', passed ? 'bg-success/15 text-success' : 'bg-tint/12 text-tint')}>
        {passed ? <Trophy className="size-8" /> : <RotateCcw className="size-8" />}
      </div>
      <h2 className="mt-3 text-xl font-semibold">{passed ? 'Semaine validée !' : 'Presque : il faut 100 %'}</h2>
      <p className="mt-1 text-ink-2">
        {passed
          ? `Score parfait, en ${rec.attempts} essai${rec.attempts > 1 ? 's' : ''}. Les nouvelles suggestions continuent.`
          : `${rec.lastErrors.length} erreur${rec.lastErrors.length > 1 ? 's' : ''} sur cet essai. Revois-les, puis retente : les essais sont illimités.`}
      </p>
      {!passed && (
        <div className="mx-auto max-w-md text-left">
          <Errors rec={rec} />
        </div>
      )}
      <div className="mt-5 flex justify-center gap-2">
        <Button variant="secondary" onClick={onClose}>
          Fermer
        </Button>
        {!passed && (
          <Button variant="tint" onClick={onRetry}>
            <RotateCcw /> Retenter
          </Button>
        )}
      </div>
    </div>
  );
}

function Rules() {
  return (
    <ul className="mt-5 grid grid-cols-1 gap-2 border-t border-line pt-4 text-[13px] text-ink-2 sm:grid-cols-3">
      <li className="flex gap-2">
        <Check className="mt-0.5 size-4 shrink-0 text-tint" /> Un quiz chaque week-end, sur la totalité de ce que tu as appris.
      </li>
      <li className="flex gap-2">
        <Check className="mt-0.5 size-4 shrink-0 text-tint" /> 100 % de bonnes réponses pour valider, essais illimités.
      </li>
      <li className="flex gap-2">
        <Check className="mt-0.5 size-4 shrink-0 text-tint" /> Pas validé le lundi : les nouvelles suggestions attendent.
      </li>
    </ul>
  );
}
