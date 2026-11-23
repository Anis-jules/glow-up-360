import {
  Bell,
  Brain,
  CalendarClock,
  ChevronRight,
  Droplets,
  Dumbbell,
  Eye,
  EyeOff,
  Flame,
  LayoutGrid,
  ListChecks,
  Moon,
  Plus,
  RefreshCw,
  Salad,
  Sparkles,
  Sun,
  TrendingUp,
  Trophy,
} from 'lucide-react';
import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import {
  BarChart,
  Button,
  Card,
  Checkbox,
  CheckRow,
  Chip,
  IconButton,
  ModuleScope,
  ProgressBar,
  ProgressRing,
  ReorderButtons,
  Sheet,
  TextInput,
  Toggle,
} from '@/components/ui';
import { addMindMinutes, addWater, toggleExercise, toggleFaceStep, toggleHabit, toggleMeal } from '@/lib/actions';
import {
  capitalize,
  formatDuration,
  formatLong,
  nowMinutes,
  timeToMinutes,
  useToday,
  weekDates,
  weekdayOf,
  WEEKDAYS_SHORT,
} from '@/lib/dates';
import { MODULE_ROUTES } from '@/lib/nav';
import {
  computeDaySummary,
  computeStreaks,
  getDaySummary,
  getEffectiveExercises,
  getProgressionInfo,
  getWorkoutForDate,
  MODULE_KEYS,
  MODULE_LABELS,
  motivationFor,
} from '@/lib/progress';
import { useData, useUpdate } from '@/lib/store';
import type { DashboardCardId, Exercise, ModuleKey } from '@/lib/types';
import { cx, moveItem } from '@/lib/utils';

const CARD_LABELS: Record<DashboardCardId, string> = {
  agenda: 'Programme du jour',
  habits: 'Habitudes',
  sport: 'Sport du jour',
  nutrition: 'Nutrition',
  face: 'Routine visage',
  mind: 'Objectifs intellectuels',
  week: 'Résumé de la semaine',
};

const MODULE_ICONS: Record<ModuleKey, typeof Dumbbell> = {
  habits: ListChecks,
  sport: Dumbbell,
  nutrition: Salad,
  face: Sparkles,
  mind: Brain,
};

/** Heure courante en minutes, rafraîchie chaque minute. */
function useNowMinutes(): number {
  const [now, setNow] = useState(nowMinutes);
  useEffect(() => {
    const id = window.setInterval(() => setNow(nowMinutes()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  return now;
}

function exerciseSummary(ex: Exercise): string {
  const side = ex.perSide ? ' par côté' : '';
  switch (ex.kind) {
    case 'reps':
      return `${ex.sets} × ${ex.reps}${side}`;
    case 'time':
      return ex.sets > 1 ? `${ex.sets} × ${formatDuration(ex.durationSec)}` : formatDuration(ex.durationSec);
    case 'interval':
      return `${ex.sets} × (${ex.workLabel} ${formatDuration(ex.workSec)} + ${ex.recoverLabel} ${formatDuration(ex.recoverSec)})`;
    default:
      return ex.durationSec ? `${formatDuration(ex.durationSec)} environ` : 'Libre';
  }
}

export default function DashboardPage() {
  const data = useData();
  const update = useUpdate();
  const today = useToday();
  const navigate = useNavigate();
  const [customize, setCustomize] = useState(false);
  const [msgOffset, setMsgOffset] = useState(0);
  const [nameDraft, setNameDraft] = useState('');

  const summary = computeDaySummary(data, today);
  const streak = useMemo(() => computeStreaks(data, today), [data, today]);
  const hour = new Date().getHours();
  const greeting = hour < 5 ? 'Bonne nuit' : hour < 18 ? 'Bonjour' : 'Bonsoir';
  const name = data.settings.name.trim();
  const success = summary.pct >= data.settings.completionThreshold;
  const wd = weekdayOf(today);
  const remindersToday = data.reminders.items.filter((r) => r.enabled && r.days.includes(wd));

  const cards = data.settings.dashboardCards.filter((c) => c.visible);
  const renderCard = (id: DashboardCardId, delay: number) => {
    const props = { delay };
    switch (id) {
      case 'agenda':
        return <AgendaCard key={id} {...props} />;
      case 'habits':
        return <HabitsCard key={id} {...props} />;
      case 'sport':
        return <SportCard key={id} {...props} />;
      case 'nutrition':
        return <NutritionCard key={id} {...props} />;
      case 'face':
        return <FaceCard key={id} {...props} />;
      case 'mind':
        return <MindCard key={id} {...props} />;
      case 'week':
        return <WeekCard key={id} {...props} />;
    }
  };

  return (
    <ModuleScope>
      <PageHeader
        eyebrow={capitalize(formatLong(today))}
        title={`${greeting}${name ? ` ${name}` : ''}`}
        subtitle={
          <span className="inline-flex items-center gap-1.5">
            <span>{motivationFor(data, today, msgOffset)}</span>
            <button
              type="button"
              onClick={() => setMsgOffset((o) => o + 1)}
              className="rounded-md p-1 text-ink-3 transition-colors hover:bg-ink/[0.06] hover:text-ink"
              aria-label="Autre message"
              title="Autre message"
            >
              <RefreshCw className="size-3.5" />
            </button>
          </span>
        }
        actions={
          <>
            <IconButton label="Rappels" variant="secondary" onClick={() => navigate('/rappels')} className="relative">
              <Bell />
              {remindersToday.length > 0 && (
                <span className="absolute -top-1 -right-1 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-ink tabular">
                  {remindersToday.length}
                </span>
              )}
            </IconButton>
            <Button variant="secondary" onClick={() => setCustomize(true)}>
              <LayoutGrid /> <span className="max-sm:sr-only">Personnaliser</span>
            </Button>
          </>
        }
      />

      {!name && (
        <Card className="mb-5 flex animate-rise flex-wrap items-center gap-3" padding="sm">
          <span className="pl-1 text-sm text-ink-2">Comment veux-tu que l’application t’appelle ?</span>
          <form
            className="flex min-w-0 grow basis-64 gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (nameDraft.trim()) update((d) => void (d.settings.name = nameDraft.trim()));
            }}
          >
            <TextInput value={nameDraft} onChange={(e) => setNameDraft(e.target.value)} placeholder="Ton prénom" className="h-9 min-w-0 flex-1" />
            <Button type="submit" size="sm" variant="primary" className="h-9">
              Valider
            </Button>
          </form>
        </Card>
      )}

      {/* Progression du jour */}
      <Card padding="lg" className="relative mb-5 animate-rise overflow-hidden">
        <div
          className="pointer-events-none absolute -top-24 -right-16 size-72 rounded-full opacity-[0.12] blur-3xl"
          style={{ background: 'var(--accent)' }}
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <ProgressRing value={summary.pct / 100} size={136} stroke={12} className="self-center sm:self-auto">
            <div>
              <div className="font-display text-4xl font-semibold tracking-tight tabular">{summary.pct}%</div>
              <div className="text-xs text-ink-3">aujourd’hui</div>
            </div>
          </ProgressRing>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">Progression du jour</h2>
              {success && (
                <Chip tone="success">
                  <Trophy /> Journée réussie
                </Chip>
              )}
            </div>
            <ProgressBar value={summary.pct / 100} className="mt-3" height={10} />
            <div className="mt-4 flex flex-wrap gap-2">
              {MODULE_KEYS.filter((k) => summary.modules[k] !== undefined).map((k) => {
                const Icon = MODULE_ICONS[k];
                const v = summary.modules[k] ?? 0;
                return (
                  <Link
                    key={k}
                    to={MODULE_ROUTES[k]}
                    style={{ '--tint': `var(--c-${k})` } as CSSProperties}
                    className="inline-flex h-8 items-center gap-1.5 rounded-full bg-tint/10 pr-3 pl-2 text-[13px] font-medium transition-colors hover:bg-tint/18"
                  >
                    <Icon className="size-3.5 text-tint" />
                    {MODULE_LABELS[k]}
                    <span className="text-ink-2 tabular">{Math.round(v * 100)}%</span>
                  </Link>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-2">
              <span className="inline-flex items-center gap-1.5">
                <Flame className="size-4 text-[var(--c-sport)]" />
                Série : <strong className="text-ink tabular">{streak.current}</strong> {streak.current > 1 ? 'jours' : 'jour'}
              </span>
              <span>
                Meilleure : <strong className="text-ink tabular">{streak.best}</strong>
              </span>
              <span>
                <strong className="text-ink tabular">{streak.totalSuccess}</strong> journée{streak.totalSuccess > 1 ? 's' : ''} réussie
                {streak.totalSuccess > 1 ? 's' : ''} au total
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2">{cards.map((c, i) => renderCard(c.id, 60 + i * 50))}</div>

      {cards.length === 0 && (
        <Card className="text-center text-sm text-ink-2">
          Toutes les cartes sont masquées.{' '}
          <button type="button" className="font-medium text-accent" onClick={() => setCustomize(true)}>
            Personnaliser
          </button>
        </Card>
      )}

      <CustomizeSheet open={customize} onClose={() => setCustomize(false)} />
    </ModuleScope>
  );
}

// ───────────────────────── Cartes

function DashCard({
  module,
  title,
  icon,
  to,
  meta,
  children,
  delay,
  className,
}: {
  module?: ModuleKey;
  title: string;
  icon: ReactNode;
  to: string;
  meta?: ReactNode;
  children: ReactNode;
  delay: number;
  className?: string;
}) {
  const navigate = useNavigate();
  return (
    <ModuleScope module={module} className={cx('min-w-0', className)}>
      <Card className="h-full animate-rise" style={{ animationDelay: `${delay}ms` }}>
        <button type="button" onClick={() => navigate(to)} className="group mb-3 flex w-full items-center gap-3 text-left">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-tint/12 text-tint [&_svg]:size-[18px]">{icon}</div>
          <div className="min-w-0 flex-1">
            <div className="font-display text-[16px] font-semibold">{title}</div>
            {meta && <div className="truncate text-[13px] text-ink-3">{meta}</div>}
          </div>
          <ChevronRight className="size-4 text-ink-3 transition-transform group-hover:translate-x-0.5" />
        </button>
        {children}
      </Card>
    </ModuleScope>
  );
}

function AgendaCard({ delay }: { delay: number }) {
  const data = useData();
  const today = useToday();
  const now = useNowMinutes();
  const navigate = useNavigate();
  const wd = weekdayOf(today);
  const workout = getWorkoutForDate(data.sport, today);
  const items = data.reminders.items
    .filter((r) => r.enabled && r.days.includes(wd))
    .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  const nextIndex = items.findIndex((r) => timeToMinutes(r.time) >= now);

  return (
    <DashCard title="Programme du jour" icon={<CalendarClock />} to="/rappels" meta={`${items.length} moment${items.length > 1 ? 's' : ''} prévu${items.length > 1 ? 's' : ''}`} delay={delay}>
      {items.length === 0 ? (
        <p className="text-sm text-ink-2">Aucun rappel aujourd’hui. Tu peux en créer dans Rappels.</p>
      ) : (
        <ol className="relative space-y-0.5">
          {items.map((r, i) => {
            const past = timeToMinutes(r.time) < now;
            const next = i === nextIndex;
            const sub = r.module === 'sport' && workout ? workout.title : r.description;
            return (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => navigate(r.module === 'general' ? '/rappels' : MODULE_ROUTES[r.module])}
                  style={{ '--tint': r.module === 'general' ? 'var(--accent)' : `var(--c-${r.module})` } as CSSProperties}
                  className={cx(
                    'flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-ink/[0.04]',
                    next && 'bg-tint/8',
                  )}
                >
                  <span className={cx('w-11 shrink-0 text-[13px] font-semibold tabular', past ? 'text-ink-3' : 'text-ink')}>{r.time}</span>
                  <span className={cx('size-2 shrink-0 rounded-full bg-tint', past && 'opacity-40')} />
                  <span className="min-w-0 flex-1">
                    <span className={cx('block truncate text-[14px] font-medium', past && 'text-ink-3')}>{r.title}</span>
                    {sub && <span className="block truncate text-xs text-ink-3">{sub}</span>}
                  </span>
                  {next && <Chip tone="tint">À venir</Chip>}
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </DashCard>
  );
}

function HabitsCard({ delay }: { delay: number }) {
  const data = useData();
  const update = useUpdate();
  const today = useToday();
  const wd = weekdayOf(today);
  const list = data.habits.items.filter((h) => !h.archived && h.days.includes(wd));
  const done = new Set(data.habits.log[today] ?? []);
  const count = list.filter((h) => done.has(h.id)).length;
  const shown = list.slice(0, 6);
  return (
    <DashCard module="habits" title="Habitudes à accomplir" icon={<ListChecks />} to="/habitudes" meta={`${count} sur ${list.length}`} delay={delay}>
      {list.length === 0 ? (
        <p className="text-sm text-ink-2">Aucune habitude prévue aujourd’hui.</p>
      ) : (
        <div className="-mx-2">
          {shown.map((h) => (
            <CheckRow
              key={h.id}
              className="min-h-11 py-1"
              checked={done.has(h.id)}
              onToggle={(v) => update((d) => toggleHabit(d, today, h.id, v))}
              leading={<span className="text-lg leading-none">{h.emoji}</span>}
              title={h.title}
            />
          ))}
          {list.length > shown.length && (
            <Link to="/habitudes" className="block px-2 pt-1 text-[13px] font-medium text-tint">
              + {list.length - shown.length} autre{list.length - shown.length > 1 ? 's' : ''}
            </Link>
          )}
        </div>
      )}
    </DashCard>
  );
}

function SportCard({ delay }: { delay: number }) {
  const data = useData();
  const update = useUpdate();
  const today = useToday();
  const navigate = useNavigate();
  const workout = getWorkoutForDate(data.sport, today);
  const exercises = getEffectiveExercises(data.sport, today);
  const prog = getProgressionInfo(data.sport, today);
  const done = new Set(data.sport.log[today]?.done ?? []);
  const required = exercises.filter((e) => !e.optional);
  const count = required.filter((e) => done.has(e.id)).length;

  return (
    <DashCard
      module="sport"
      title="Sport du jour"
      icon={<Dumbbell />}
      to="/sport"
      meta={workout ? `${workout.title}${required.length ? ` · ${count}/${required.length}` : ''}` : 'Repos'}
      delay={delay}
    >
      {!workout ? (
        <p className="text-sm text-ink-2">Rien de prévu aujourd’hui : profite de la récupération.</p>
      ) : (
        <>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {workout.focus && <Chip>{workout.focus}</Chip>}
            {prog.day !== null && prog.phase && (
              <Chip tone="tint">
                Jour {prog.day}/{prog.length} · {prog.phase.name}
              </Chip>
            )}
          </div>
          {required.length > 0 && <ProgressBar value={count / required.length} className="mb-2" height={6} />}
          <ul className="-mx-2">
            {exercises.map((ex) => (
              <li key={ex.id} className="flex min-h-11 items-center gap-3 rounded-xl px-2 py-1 hover:bg-ink/[0.03]">
                <Checkbox size="sm" checked={done.has(ex.id)} onChange={(v) => update((d) => toggleExercise(d, today, ex.id, v))} label={ex.name} />
                <button type="button" onClick={() => navigate('/sport')} className="min-w-0 flex-1 text-left">
                  <span className={cx('block truncate text-[14px] font-medium', done.has(ex.id) && 'text-ink-3 line-through')}>{ex.name}</span>
                </button>
                <span className="shrink-0 text-xs text-ink-3 tabular">{ex.optional ? 'Facultatif' : exerciseSummary(ex)}</span>
              </li>
            ))}
          </ul>
          <Button variant="tint" size="sm" className="mt-3 w-full" onClick={() => navigate('/sport')}>
            {count === 0 ? 'Commencer la séance' : count === required.length ? 'Voir la séance' : 'Continuer la séance'}
          </Button>
        </>
      )}
    </DashCard>
  );
}

function NutritionCard({ delay }: { delay: number }) {
  const data = useData();
  const update = useUpdate();
  const today = useToday();
  const navigate = useNavigate();
  const { slots, plan, water, mealLog } = data.nutrition;
  const dayPlan = plan[weekdayOf(today)] ?? {};
  const meals = mealLog[today] ?? {};
  const ml = water.log[today] ?? 0;
  const eaten = slots.filter((s) => meals[s.id]?.done).length;

  return (
    <DashCard
      module="nutrition"
      title="Objectifs nutritionnels"
      icon={<Salad />}
      to="/nutrition"
      meta={`${eaten}/${slots.length} repas · ${(ml / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} L d’eau`}
      delay={delay}
    >
      <div className="mb-3 flex items-center gap-3 rounded-2xl bg-surface-2 p-3">
        <ProgressRing value={water.goalMl ? ml / water.goalMl : 0} size={52} stroke={6}>
          <Droplets className="size-4 text-tint" />
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold tabular">
            {ml} / {water.goalMl} ml
          </div>
          <div className="text-xs text-ink-3">Hydratation</div>
        </div>
        <Button size="sm" variant="tint" onClick={() => update((d) => addWater(d, today, d.nutrition.water.glassMl))}>
          <Plus /> {water.glassMl} ml
        </Button>
      </div>
      <div className="-mx-2">
        {slots.map((s) => (
          <CheckRow
            key={s.id}
            className="min-h-11 py-1"
            checked={!!meals[s.id]?.done}
            onToggle={(v) => update((d) => toggleMeal(d, today, s.id, v))}
            leading={<span className="text-lg leading-none">{s.emoji}</span>}
            title={dayPlan[s.id]?.title || s.name}
            subtitle={`${s.name} · ${s.time}`}
            onOpen={() => navigate('/nutrition')}
          />
        ))}
      </div>
    </DashCard>
  );
}

function FaceCard({ delay }: { delay: number }) {
  const data = useData();
  const update = useUpdate();
  const today = useToday();
  const done = new Set(data.face.log[today]?.done ?? []);
  const evening = new Date().getHours() >= 15;
  const routines = data.face.routines;
  const required = routines.flatMap((r) => r.steps).filter((s) => !s.optional);
  const count = required.filter((s) => done.has(s.id)).length;

  return (
    <DashCard module="face" title="Routine visage" icon={<Sparkles />} to="/visage" meta={`${count}/${required.length} étapes`} delay={delay}>
      <div className="grid gap-3 sm:grid-cols-2">
        {routines.map((r, i) => {
          const current = routines.length === 2 ? (evening ? i === 1 : i === 0) : false;
          const Icon = r.icon === 'sun' ? Sun : r.icon === 'moon' ? Moon : null;
          return (
            <div key={r.id} className={cx('rounded-2xl p-3', current ? 'bg-tint/8 ring-1 ring-tint/20' : 'bg-surface-2')}>
              <div className="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold">
                {Icon ? <Icon className="size-4 text-tint" /> : <span>{r.icon}</span>}
                {r.name}
                <span className="ml-auto text-xs font-normal text-ink-3 tabular">{r.time}</span>
              </div>
              <ul>
                {r.steps.map((s) => (
                  <li key={s.id} className="flex items-center gap-2 py-1">
                    <Checkbox size="sm" checked={done.has(s.id)} onChange={(v) => update((d) => toggleFaceStep(d, today, s.id, v))} label={s.title} />
                    <span className={cx('min-w-0 flex-1 truncate text-[13px]', done.has(s.id) && 'text-ink-3 line-through', s.optional && !done.has(s.id) && 'text-ink-2')}>
                      {s.title}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </DashCard>
  );
}

function MindCard({ delay }: { delay: number }) {
  const data = useData();
  const update = useUpdate();
  const today = useToday();
  const log = data.mind.log[today] ?? {};
  const goals = data.mind.goals;
  const total = goals.reduce((a, g) => a + Math.min(g.minutes, log[g.id] ?? 0), 0);
  const target = goals.reduce((a, g) => a + g.minutes, 0);

  return (
    <DashCard module="mind" title="Objectifs intellectuels" icon={<Brain />} to="/esprit" meta={`${total} / ${target} min aujourd’hui`} delay={delay}>
      <ul className="space-y-3">
        {goals.map((g) => {
          const m = log[g.id] ?? 0;
          return (
            <li key={g.id} className="flex items-center gap-3">
              <span className="text-lg leading-none">{g.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[14px] font-medium">{g.title}</span>
                  <span className="shrink-0 text-xs text-ink-3 tabular">
                    {m}/{g.minutes} min
                  </span>
                </div>
                <ProgressBar value={g.minutes ? m / g.minutes : 0} height={6} className="mt-1" />
              </div>
              <Button size="xs" variant="secondary" onClick={() => update((d) => addMindMinutes(d, today, g.id, 5))} aria-label={`Ajouter 5 minutes à ${g.title}`}>
                +5
              </Button>
            </li>
          );
        })}
      </ul>
    </DashCard>
  );
}

function WeekCard({ delay }: { delay: number }) {
  const data = useData();
  const today = useToday();
  const days = weekDates(today);
  const summaries = days.map((k) => (k > today ? null : getDaySummary(data, k, today)));
  const past = summaries.filter((s): s is NonNullable<typeof s> => s !== null);
  const avg = past.length ? Math.round(past.reduce((a, s) => a + s.pct, 0) / past.length) : 0;
  const successes = past.filter((s) => s.pct >= data.settings.completionThreshold).length;
  const sessions = days.filter((k) => {
    const e = data.sport.log[k];
    return e && e.total > 0 && e.done.length >= e.total;
  }).length;

  return (
    <DashCard title="Résumé de la semaine" icon={<TrendingUp />} to="/statistiques" meta={`Moyenne ${avg} % · ${successes} journée${successes > 1 ? 's' : ''} réussie${successes > 1 ? 's' : ''}`} delay={delay}>
      <BarChart
        height={110}
        max={100}
        goal={data.settings.completionThreshold}
        format={(v) => `${v} %`}
        bars={days.map((k, i) => ({
          label: WEEKDAYS_SHORT[i],
          value: summaries[i]?.pct ?? 0,
          highlight: k === today,
          title: `${WEEKDAYS_SHORT[i]} : ${summaries[i] ? `${summaries[i]!.pct} %` : 'à venir'}`,
        }))}
      />
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <MiniStat label="Moyenne" value={`${avg} %`} />
        <MiniStat label="Séances" value={String(sessions)} />
        <MiniStat label="Réussies" value={`${successes}/${past.length}`} />
      </div>
    </DashCard>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-2 py-2">
      <div className="font-display text-base font-semibold tabular">{value}</div>
      <div className="text-[11px] text-ink-3">{label}</div>
    </div>
  );
}

// ───────────────────────── Personnalisation

function CustomizeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const data = useData();
  const update = useUpdate();
  const cards = data.settings.dashboardCards;
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Personnaliser le tableau de bord"
      subtitle="Affiche, masque et réorganise les cartes."
      icon={<LayoutGrid />}
      footer={
        <Button variant="primary" onClick={onClose}>
          Terminé
        </Button>
      }
    >
      <ul className="space-y-1">
        {cards.map((c, i) => (
          <li key={c.id} className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-ink/[0.03]">
            {c.visible ? <Eye className="size-4 text-ink-3" /> : <EyeOff className="size-4 text-ink-3" />}
            <span className={cx('min-w-0 flex-1 truncate text-[15px] font-medium', !c.visible && 'text-ink-3')}>{CARD_LABELS[c.id]}</span>
            <ReorderButtons index={i} count={cards.length} onMove={(to) => update((d) => moveItem(d.settings.dashboardCards, i, to))} />
            <Toggle checked={c.visible} onChange={(v) => update((d) => void (d.settings.dashboardCards[i].visible = v))} />
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[13px] text-ink-3">
        Le prénom, les messages de motivation et les couleurs se changent dans{' '}
        <Link to="/parametres" onClick={onClose} className="font-medium text-accent">
          Paramètres
        </Link>
        .
      </p>
    </Sheet>
  );
}
