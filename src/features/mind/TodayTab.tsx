import { BookOpen, Check, Lightbulb, Minus, Pencil, Plus, Timer, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import {
  BarChart,
  Button,
  Card,
  Chip,
  EmojiField,
  EmptyState,
  Field,
  IconButton,
  NumberField,
  ProgressBar,
  ProgressRing,
  ReorderButtons,
  SectionHeader,
  SequenceTimer,
  Sheet,
  TextArea,
  TextInput,
  type TimerPhase,
} from '@/components/ui';
import { formatMinutes, lastNDays, WEEKDAYS_SHORT, weekdayOf, useToday } from '@/lib/dates';
import { removeWithUndo, toast } from '@/lib/feedback';
import { useData, useUpdate } from '@/lib/store';
import type { MindGoal } from '@/lib/types';
import { cx, moveItem, uid } from '@/lib/utils';
import { InfoCardEditor } from '../face/InfoCardEditor';
import { addGoalMinutes, setBookStatus } from './shared';

const EMOJIS = ['📖', '🎓', '🧩', '✍️', '🎧', '🗣️', '♟️', '🧠', '💡', '📰'];

function GoalEditor({ id, onClose }: { id: string | null; onClose: () => void }) {
  const data = useData();
  const update = useUpdate();
  const g = id ? data.mind.goals.find((x) => x.id === id) : undefined;
  const patch = (fn: (g: MindGoal) => void) =>
    update((d) => {
      const x = d.mind.goals.find((y) => y.id === id);
      if (x) fn(x);
    });
  return (
    <Sheet
      open={!!g}
      onClose={onClose}
      title="Objectif quotidien"
      subtitle="Chaque modification est enregistrée automatiquement."
      footer={
        <>
          <Button
            variant="danger"
            className="mr-auto"
            onClick={() => {
              removeWithUndo('Objectif supprimé', (d) => void (d.mind.goals = d.mind.goals.filter((x) => x.id !== id)));
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
      {g && (
        <div className="space-y-4">
          <Field label="Nom">
            <TextInput value={g.title} onChange={(e) => patch((x) => void (x.title = e.target.value))} />
          </Field>
          <Field label="Temps visé chaque jour">
            <NumberField value={g.minutes} min={1} max={240} step={5} suffix="min" onChange={(v) => patch((x) => void (x.minutes = v))} />
          </Field>
          <Field label="Emoji">
            <EmojiField value={g.emoji} suggestions={EMOJIS} onChange={(v) => patch((x) => void (x.emoji = v))} />
          </Field>
          <Field label="Description">
            <TextArea minRows={2} value={g.description} onChange={(e) => patch((x) => void (x.description = e.target.value))} />
          </Field>
        </div>
      )}
    </Sheet>
  );
}

function TimerSheet({ goal, done, onClose }: { goal: MindGoal | null; done: number; onClose: () => void }) {
  const update = useUpdate();
  const today = useToday();
  const remaining = goal ? Math.max(0, goal.minutes - done) : 0;
  const [minutes, setMinutes] = useState<number | null>(null);
  const mins = minutes ?? (remaining > 0 ? remaining : goal?.minutes ?? 10);
  const phases = useMemo<TimerPhase[]>(() => (goal ? [{ label: goal.title, seconds: mins * 60, tone: 'work' }] : []), [goal, mins]);
  const goalId = goal?.id;

  const onFinish = useCallback(() => {
    if (!goalId) return;
    update((d) => addGoalMinutes(d, today, goalId, mins));
    toast(`${mins} min ajoutées. Bravo !`, { tone: 'success' });
  }, [goalId, mins, today, update]);

  const onStop = useCallback(
    (sec: number) => {
      if (!goalId) return;
      const m = Math.round(sec / 60);
      if (m <= 0) {
        toast('Moins d’une minute : rien n’a été ajouté.');
        return;
      }
      update((d) => addGoalMinutes(d, today, goalId, m));
      toast(`${m} min ajoutées.`, { tone: 'success' });
    },
    [goalId, today, update],
  );

  return (
    <Sheet
      open={!!goal}
      onClose={() => {
        setMinutes(null);
        onClose();
      }}
      title={goal ? `${goal.emoji} ${goal.title}` : ''}
      subtitle={goal ? `${done} / ${goal.minutes} min aujourd’hui` : undefined}
    >
      {goal && (
        <div className="space-y-4">
          <Field label="Durée de la séance">
            <NumberField value={mins} min={1} max={180} step={5} suffix="min" onChange={setMinutes} />
          </Field>
          <SequenceTimer phases={phases} onFinish={onFinish} onStop={onStop} finishLabel="Séance terminée" />
          <p className="text-center text-xs text-ink-3">
            À la fin, les minutes sont ajoutées automatiquement. Le carré arrête la séance et enregistre le temps déjà passé.
          </p>
        </div>
      )}
    </Sheet>
  );
}

function GoalCard({
  goal,
  minutes,
  editing,
  index,
  count,
  onEdit,
  onTimer,
}: {
  goal: MindGoal;
  minutes: number;
  editing: boolean;
  index: number;
  count: number;
  onEdit: () => void;
  onTimer: () => void;
}) {
  const update = useUpdate();
  const today = useToday();
  const reached = minutes >= goal.minutes;
  const add = (delta: number) => update((d) => addGoalMinutes(d, today, goal.id, delta));

  return (
    <Card className="flex animate-rise flex-col" style={{ animationDelay: `${index * 50}ms` }}>
      <div className="flex items-start gap-3">
        <div className={cx('flex items-center justify-center size-11 shrink-0 rounded-2xl text-xl', reached ? 'bg-tint/20' : 'bg-tint/10')}>
          {goal.emoji || '✨'}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-[16px] font-semibold">{goal.title || 'Objectif'}</h3>
          <p className="line-clamp-2 text-[13px] text-ink-3">{goal.description}</p>
        </div>
        {editing ? (
          <div className="-mt-1 -mr-2 flex shrink-0 items-center">
            <ReorderButtons index={index} count={count} onMove={(to) => update((d) => moveItem(d.mind.goals, index, to))} />
            <IconButton label="Modifier" size="icon-sm" onClick={onEdit}>
              <Pencil />
            </IconButton>
          </div>
        ) : (
          <ProgressRing value={goal.minutes ? minutes / goal.minutes : 0} size={58} stroke={6}>
            {reached ? (
              <Check className="size-5 text-tint" strokeWidth={3} />
            ) : (
              <span className="text-[13px] font-semibold tabular">{minutes}</span>
            )}
          </ProgressRing>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="min-w-0 text-[13px] text-ink-2 tabular">
          <span className="font-semibold text-ink">{minutes}</span> / {goal.minutes} min
          {reached && (
            <Chip tone="success" className="ml-2">
              Atteint
            </Chip>
          )}
        </div>
        {!editing && (
          <div className="flex items-center gap-1">
            <IconButton label="Retirer 5 minutes" size="icon-sm" variant="secondary" onClick={() => add(-5)} disabled={minutes <= 0}>
              <Minus />
            </IconButton>
            <IconButton label="Ajouter 5 minutes" size="icon-sm" variant="secondary" onClick={() => add(5)}>
              <Plus />
            </IconButton>
            <IconButton label="Lancer un minuteur" size="icon-sm" variant="secondary" onClick={onTimer}>
              <Timer />
            </IconButton>
            <Button
              size="sm"
              variant={reached ? 'secondary' : 'tint'}
              onClick={() => update((d) => addGoalMinutes(d, today, goal.id, reached ? -minutes : goal.minutes - minutes))}
            >
              {reached ? 'Annuler' : 'Fait'}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

function CurrentBook({ onGoBooks }: { onGoBooks: () => void }) {
  const data = useData();
  const update = useUpdate();
  const today = useToday();
  const book = data.mind.books.find((b) => b.status === 'en-cours');
  const next = data.mind.books.find((b) => b.status === 'a-lire');
  const patch = (id: string, fn: (b: (typeof data.mind.books)[number]) => void) =>
    update((d) => {
      const b = d.mind.books.find((x) => x.id === id);
      if (b) fn(b);
    });

  return (
    <Card className="animate-rise" style={{ animationDelay: '120ms' }}>
      <SectionHeader
        title="Livre en cours"
        icon={<BookOpen />}
        extra={
          <Button size="sm" variant="ghost" onClick={onGoBooks}>
            Mes livres
          </Button>
        }
      />
      {book ? (
        <div>
          <div className="font-semibold">{book.title}</div>
          {book.author && <div className="text-sm text-ink-3">{book.author}</div>}
          {book.pagesTotal > 0 && (
            <div className="mt-3">
              <ProgressBar value={book.pagesRead / book.pagesTotal} />
              <div className="mt-1 text-xs text-ink-3 tabular">
                {book.pagesRead} / {book.pagesTotal} pages · {Math.round((book.pagesRead / book.pagesTotal) * 100)} %
              </div>
            </div>
          )}
          <div className="mt-3 flex flex-wrap items-end gap-2">
            <Field label="Page actuelle" className="w-44">
              <NumberField
                value={book.pagesRead}
                min={0}
                max={book.pagesTotal > 0 ? book.pagesTotal : 99999}
                step={1}
                onChange={(v) => patch(book.id, (b) => void (b.pagesRead = v))}
              />
            </Field>
            <Button
              variant="secondary"
              onClick={() =>
                patch(book.id, (b) => void (b.pagesRead = b.pagesTotal > 0 ? Math.min(b.pagesTotal, b.pagesRead + 10) : b.pagesRead + 10))
              }
            >
              +10 pages
            </Button>
            <Button
              variant="tint"
              onClick={() => {
                patch(book.id, (b) => setBookStatus(b, 'lu', today));
                toast(`« ${book.title} » terminé. Pense à noter ce que tu en retiens dans ton journal.`, { tone: 'success', duration: 5000 });
              }}
            >
              <Check /> Je l’ai fini
            </Button>
          </div>
        </div>
      ) : next ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm text-ink-3">Aucun livre en cours. Prochain sur ta liste :</div>
            <div className="truncate font-semibold">{next.title}</div>
          </div>
          <Button variant="tint" onClick={() => patch(next.id, (b) => setBookStatus(b, 'en-cours', today))}>
            Commencer
          </Button>
        </div>
      ) : (
        <EmptyState title="Aucun livre en cours" action={<Button variant="tint" onClick={onGoBooks}>Ajouter un livre</Button>} />
      )}
    </Card>
  );
}

function Practices() {
  const data = useData();
  const update = useUpdate();
  const [editing, setEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const list = data.mind.practices;
  const current = editId ? list.find((c) => c.id === editId) ?? null : null;
  const add = () => {
    const id = uid('pr');
    update((d) => void d.mind.practices.push({ id, title: 'Nouvelle idée', body: '' }));
    setEditId(id);
  };
  const remove = (id: string) =>
    removeWithUndo('Idée supprimée', (d) => void (d.mind.practices = d.mind.practices.filter((c) => c.id !== id)));

  return (
    <Card className="animate-rise" style={{ animationDelay: '160ms' }}>
      <SectionHeader
        title="Idées logique et mémoire"
        subtitle="Pioche une idée pour tes 10 minutes."
        icon={<Lightbulb />}
        editing={editing}
        onToggleEdit={() => setEditing((e) => !e)}
        onAdd={add}
      />
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {list.map((c, i) => (
          <div
            key={c.id}
            role={editing ? undefined : 'button'}
            tabIndex={editing ? undefined : 0}
            onClick={() => !editing && setEditId(c.id)}
            onKeyDown={(e) => !editing && e.key === 'Enter' && setEditId(c.id)}
            className={cx('rounded-xl bg-surface-2 p-3', !editing && 'cursor-pointer transition-colors hover:bg-ink/[0.06]')}
          >
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1 text-sm font-semibold">{c.title}</div>
              {editing && (
                <div className="-my-1 -mr-1 flex items-center">
                  <ReorderButtons index={i} count={list.length} onMove={(to) => update((d) => moveItem(d.mind.practices, i, to))} />
                  <IconButton label="Modifier" size="icon-sm" onClick={() => setEditId(c.id)}>
                    <Pencil />
                  </IconButton>
                  <IconButton label="Supprimer" size="icon-sm" onClick={() => remove(c.id)} className="text-danger hover:text-danger">
                    <Trash2 />
                  </IconButton>
                </div>
              )}
            </div>
            <p className="mt-0.5 text-[13px] leading-relaxed text-ink-2">{c.body}</p>
          </div>
        ))}
      </div>
      <InfoCardEditor
        card={current}
        heading="Modifier l’idée"
        onClose={() => setEditId(null)}
        onChange={(p) =>
          update((d) => {
            const c = d.mind.practices.find((x) => x.id === editId);
            if (c) Object.assign(c, p);
          })
        }
        onDelete={() => {
          if (editId) remove(editId);
          setEditId(null);
        }}
      />
    </Card>
  );
}

export function TodayTab({ onGoBooks }: { onGoBooks: () => void }) {
  const data = useData();
  const update = useUpdate();
  const today = useToday();
  const [editing, setEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [timerId, setTimerId] = useState<string | null>(null);
  const goals = data.mind.goals;
  const log = data.mind.log[today] ?? {};
  const target = goals.reduce((a, g) => a + g.minutes, 0);
  const done = goals.reduce((a, g) => a + (log[g.id] ?? 0), 0);
  const capped = goals.reduce((a, g) => a + Math.min(g.minutes, log[g.id] ?? 0), 0);
  const reached = goals.filter((g) => (log[g.id] ?? 0) >= g.minutes).length;
  const timerGoal = timerId ? goals.find((g) => g.id === timerId) ?? null : null;

  const week = lastNDays(today, 7).map((k) => {
    const l = data.mind.log[k] ?? {};
    return { label: WEEKDAYS_SHORT[weekdayOf(k)], value: Object.values(l).reduce((a, b) => a + b, 0), highlight: k === today };
  });

  const add = () => {
    const id = uid('g');
    update((d) => void d.mind.goals.push({ id, title: 'Nouvel objectif', minutes: 10, emoji: '💡', description: '' }));
    setEditId(id);
  };

  return (
    <div className="space-y-6">
      <Card className="animate-rise" padding="lg">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <ProgressRing value={target ? capped / target : 0} size={112} stroke={10}>
            <div>
              <div className="font-display text-2xl font-semibold tabular">{done}</div>
              <div className="text-[11px] text-ink-3">sur {target} min</div>
            </div>
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold">
              {reached === goals.length && goals.length > 0 ? 'Tous tes objectifs sont atteints' : `${formatMinutes(done)} d’esprit en éveil aujourd’hui`}
            </h2>
            <p className="mt-0.5 text-sm text-ink-2">
              {reached} objectif{reached > 1 ? 's' : ''} atteint{reached > 1 ? 's' : ''} sur {goals.length}. Un peu chaque jour vaut mieux que beaucoup une fois.
            </p>
            <BarChart bars={week} height={56} goal={target} className="mt-3 max-w-sm" format={(v) => `${v} min`} />
          </div>
        </div>
      </Card>

      <section>
        <SectionHeader
          title="Objectifs du jour"
          subtitle={editing ? 'Ajuste les temps, l’ordre et les intitulés.' : 'Touche + pour ajouter du temps, ou lance un minuteur.'}
          editing={editing}
          onToggleEdit={() => setEditing((e) => !e)}
          onAdd={add}
          addLabel="Objectif"
        />
        {goals.length === 0 ? (
          <EmptyState title="Aucun objectif" action={<Button variant="tint" onClick={add}><Plus /> Ajouter un objectif</Button>}>
            Crée tes objectifs quotidiens : lecture, langue, logique…
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {goals.map((g, i) => (
              <GoalCard
                key={g.id}
                goal={g}
                minutes={log[g.id] ?? 0}
                editing={editing}
                index={i}
                count={goals.length}
                onEdit={() => setEditId(g.id)}
                onTimer={() => setTimerId(g.id)}
              />
            ))}
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <CurrentBook onGoBooks={onGoBooks} />
        <Practices />
      </div>

      <GoalEditor id={editId} onClose={() => setEditId(null)} />
      <TimerSheet goal={timerGoal} done={timerGoal ? log[timerGoal.id] ?? 0 : 0} onClose={() => setTimerId(null)} />
    </div>
  );
}
