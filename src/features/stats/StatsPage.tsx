import {
  Award,
  BarChart3,
  BookOpen,
  Brain,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Flame,
  History,
  ListChecks,
  Target,
  Trophy,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { BarChart, Button, Card, Chip, IconButton, ModuleScope, ProgressBar, SectionHeader, Segmented, Stat } from '@/components/ui';
import {
  addDays,
  capitalize,
  formatLong,
  formatMinutes,
  formatMonth,
  formatRelative,
  formatShort,
  lastNDays,
  useToday,
  weekDates,
  WEEKDAYS_SHORT,
} from '@/lib/dates';
import { computeStreaks, getDaySummary, getProgressionInfo, MODULE_KEYS, MODULE_LABELS } from '@/lib/progress';
import { useData } from '@/lib/store';
import type { DateKey } from '@/lib/types';
import { cx } from '@/lib/utils';
import { DayDetailSheet } from './DayDetailSheet';
import { MonthCalendar } from './MonthCalendar';
import { addMonths, habitsStats, mindMinutes, monthDates, pctOf, readingGoal, sportStats, sum } from './statsUtils';

type Period = 'week' | 'month';

function plural(n: number, one: string, many = `${one}s`) {
  return n > 1 ? many : one;
}

export default function StatsPage() {
  const data = useData();
  const today = useToday();
  const [period, setPeriod] = useState<Period>('week');
  const [anchor, setAnchor] = useState<DateKey>(today);
  const [openDay, setOpenDay] = useState<DateKey | null>(null);
  const threshold = data.settings.completionThreshold;

  const dates = useMemo(() => (period === 'week' ? weekDates(anchor) : monthDates(anchor)), [period, anchor]);
  const counted = dates.filter((k) => k <= today && k >= data.createdAt);
  const isCurrent = dates.includes(today);
  const canGoBack = dates[0] > data.createdAt;

  const summaries = useMemo(() => {
    const m = new Map<DateKey, ReturnType<typeof getDaySummary>>();
    for (const k of dates) if (k <= today && k >= data.createdAt) m.set(k, getDaySummary(data, k, today));
    return m;
  }, [data, dates, today]);

  const streaks = useMemo(() => computeStreaks(data, today), [data, today]);

  const move = (dir: -1 | 1) => setAnchor((a) => (period === 'week' ? addDays(a, 7 * dir) : addMonths(a, dir)));
  const periodLabel =
    period === 'week' ? `Du ${formatShort(dates[0])} au ${formatShort(dates[6])}` : capitalize(formatMonth(dates[0]));

  // Chiffres clés
  const habits = habitsStats(data, counted);
  const sport = sportStats(data, counted);
  const reading = readingGoal(data);
  const readingMin = reading ? sum(counted.map((k) => data.mind.log[k]?.[reading.id] ?? 0)) : 0;
  const learningMin = sum(counted.map((k) => mindMinutes(data, k)));
  const avgPct = counted.length ? Math.round(sum(counted.map((k) => summaries.get(k)?.pct ?? 0)) / counted.length) : 0;
  const successDays = counted.filter((k) => (summaries.get(k)?.pct ?? 0) >= threshold).length;

  // Moyenne par rubrique
  const moduleAvg = MODULE_KEYS.map((m) => {
    const vals = counted.map((k) => summaries.get(k)?.modules[m]).filter((v): v is number => v !== undefined);
    return { m, value: vals.length ? sum(vals) / vals.length : null };
  }).filter((x) => x.value !== null) as { m: (typeof MODULE_KEYS)[number]; value: number }[];

  const label = (k: DateKey, i: number) => (period === 'week' ? WEEKDAYS_SHORT[i] : String(Number(k.slice(8))));
  const goalMindTotal = sum(data.mind.goals.map((g) => g.minutes));

  const pctBars = dates.map((k, i) => ({
    label: label(k, i),
    value: summaries.get(k)?.pct ?? 0,
    title: `${formatLong(k)} : ${summaries.get(k)?.pct ?? 0} %`,
    highlight: k === today,
  }));
  const mindBars = dates.map((k, i) => ({
    label: label(k, i),
    value: summaries.has(k) ? mindMinutes(data, k) : 0,
    title: `${formatLong(k)} : ${formatMinutes(mindMinutes(data, k))}`,
    highlight: k === today,
  }));
  const waterBars = dates.map((k, i) => ({
    label: label(k, i),
    value: summaries.has(k) ? data.nutrition.water.log[k] ?? 0 : 0,
    title: `${formatLong(k)} : ${((data.nutrition.water.log[k] ?? 0) / 1000).toLocaleString('fr-FR')} L`,
    highlight: k === today,
  }));
  const selectDay = (i: number) => {
    const k = dates[i];
    if (k <= today && k >= data.createdAt) setOpenDay(k);
  };

  // Message de série, sans culpabiliser
  const jokers = data.settings.jokersPerWeek;
  const streakMessage = streaks.todayDone
    ? 'Objectif du jour atteint. Tu peux être fier de toi.'
    : streaks.current > 0
      ? `Ta série continue : atteins ${threshold} % aujourd’hui pour l’allonger.`
      : streaks.totalSuccess > 0
        ? `Une pause ne remet rien à zéro : tes ${streaks.totalSuccess} ${plural(streaks.totalSuccess, 'journée réussie', 'journées réussies')} restent acquises. La suivante peut commencer aujourd’hui.`
        : `Ta première journée réussie t’attend : atteins ${threshold} % aujourd’hui.`;

  // Objectifs
  const booksRead = data.mind.books.filter((b) => b.status === 'lu').length;
  const booksReading = data.mind.books.filter((b) => b.status === 'en-cours');
  const topics = data.mind.topics;
  const topicsAvg = topics.length ? Math.round(sum(topics.map((t) => t.progress)) / topics.length) : 0;
  const prog = getProgressionInfo(data.sport, today);

  // Historique des 14 derniers jours
  const recent = lastNDays(today, 14)
    .reverse()
    .filter((k) => k >= data.createdAt);

  return (
    <ModuleScope>
      <PageHeader
        icon={<BarChart3 />}
        eyebrow="Ta progression"
        title="Statistiques"
        actions={
          <Segmented<Period>
            value={period}
            onChange={(p) => {
              setPeriod(p);
              setAnchor(today);
            }}
            options={[
              { value: 'week', label: 'Semaine' },
              { value: 'month', label: 'Mois' },
            ]}
          />
        }
      />

      <div className="mb-5 flex animate-rise items-center gap-2">
        <IconButton label="Période précédente" variant="secondary" size="icon-sm" disabled={!canGoBack} onClick={() => move(-1)}>
          <ChevronLeft />
        </IconButton>
        <div className="min-w-0 flex-1 truncate text-center text-[15px] font-semibold sm:flex-none sm:px-2 sm:text-left">{periodLabel}</div>
        <IconButton label="Période suivante" variant="secondary" size="icon-sm" disabled={isCurrent} onClick={() => move(1)}>
          <ChevronRight />
        </IconButton>
        {!isCurrent && (
          <Button size="sm" variant="ghost" onClick={() => setAnchor(today)} className="max-sm:hidden">
            Revenir à aujourd’hui
          </Button>
        )}
      </div>

      {counted.length === 0 ? (
        <Card className="animate-rise text-sm text-ink-2">Aucune donnée sur cette période : ton espace a commencé le {formatLong(data.createdAt, true)}.</Card>
      ) : (
        <>
          {/* Série */}
          <Card className="mb-4 animate-rise overflow-hidden">
            <div className="flex flex-wrap items-center gap-5">
              <div className="flex min-w-0 items-center gap-4">
                <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-tint text-tint-ink">
                  <Flame className="size-7" />
                </div>
                <div className="min-w-0">
                  <div className="font-display text-3xl font-semibold tracking-tight tabular">
                    {streaks.current} <span className="text-base font-medium text-ink-2">{plural(streaks.current, 'jour')} d’affilée</span>
                  </div>
                  <p className="text-sm text-ink-2">{streakMessage}</p>
                </div>
              </div>
              <div className="grid min-w-0 flex-1 grid-cols-2 gap-2 sm:max-w-sm sm:min-w-64">
                <div className="rounded-xl bg-surface-2 px-3 py-2.5">
                  <div className="flex items-center gap-1.5 text-xs text-ink-3">
                    <Trophy className="size-3.5" /> Meilleure série
                  </div>
                  <div className="font-display text-xl font-semibold tabular">{streaks.best}</div>
                </div>
                <div className="rounded-xl bg-surface-2 px-3 py-2.5">
                  <div className="flex items-center gap-1.5 text-xs text-ink-3">
                    <Award className="size-3.5" /> Journées réussies
                  </div>
                  <div className="font-display text-xl font-semibold tabular">{streaks.totalSuccess}</div>
                </div>
              </div>
            </div>
            <p className="mt-4 border-t border-line pt-3 text-xs text-ink-3">
              {jokers > 0
                ? `${jokers} ${plural(jokers, 'joker')} par semaine : une journée sous ${threshold} % ne casse pas ta série. Cette semaine : ${streaks.jokersUsedThisWeek} ${plural(streaks.jokersUsedThisWeek, 'utilisé')}.`
                : 'Aucun joker : tu peux en ajouter dans Paramètres, onglet Progression.'}{' '}
              Le total de journées réussies ne diminue jamais.
            </p>
          </Card>

          {/* Chiffres clés */}
          <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <ModuleScope module="habits" className="min-w-0">
              <Stat
                className="h-full animate-rise"
                icon={<ListChecks />}
                label="Habitudes"
                value={`${pctOf(habits.done, habits.total)} %`}
                sub={`réalisées · ${habits.done} sur ${habits.total}`}
              />
            </ModuleScope>
            <ModuleScope module="sport" className="min-w-0">
              <Stat
                className="h-full animate-rise"
                icon={<Dumbbell />}
                label="Séances"
                value={sport.completed}
                sub={`complètes sur ${sport.planned} ${plural(sport.planned, 'prévue')}`}
              />
            </ModuleScope>
            <ModuleScope module="mind" className="min-w-0">
              <Stat
                className="h-full animate-rise"
                icon={<BookOpen />}
                label={reading?.title ?? 'Lecture'}
                value={formatMinutes(readingMin)}
                sub={reading ? `objectif ${formatMinutes(reading.minutes * counted.length)}` : undefined}
              />
            </ModuleScope>
            <ModuleScope module="mind" className="min-w-0">
              <Stat
                className="h-full animate-rise"
                icon={<Brain />}
                label="Apprentissage"
                value={formatMinutes(learningMin)}
                sub="toutes activités d’esprit"
              />
            </ModuleScope>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
            <div className="min-w-0 space-y-4">
              <Card className="animate-rise">
                <SectionHeader
                  icon={<Target />}
                  title="Progression quotidienne"
                  subtitle={`Moyenne ${avgPct} % · ${successDays} ${plural(successDays, 'journée réussie', 'journées réussies')}`}
                />
                <BarChart bars={pctBars} max={100} goal={threshold} height={150} showValues format={(v) => `${v}`} onSelect={selectDay} />
                <p className="mt-2 text-xs text-ink-3">Pointillés : seuil de réussite ({threshold} %). Touche une barre pour le détail du jour.</p>
              </Card>

              <Card className="animate-rise">
                <SectionHeader title="Par rubrique" subtitle="Moyenne sur la période" />
                {moduleAvg.length ? (
                  <ul className="space-y-3">
                    {moduleAvg.map(({ m, value }) => (
                      <li key={m} className="flex items-center gap-3">
                        <span className="w-20 shrink-0 text-sm text-ink-2">{MODULE_LABELS[m]}</span>
                        <ProgressBar value={value} color={`var(--c-${m})`} height={10} className="min-w-0 flex-1" />
                        <span className="w-11 shrink-0 text-right text-sm font-medium tabular">{Math.round(value * 100)} %</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-ink-3">Rien à afficher pour l’instant.</p>
                )}
              </Card>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ModuleScope module="mind" className="min-w-0">
                  <Card className="h-full animate-rise">
                    <SectionHeader title="Minutes d’esprit" subtitle={`${formatMinutes(learningMin)} sur la période`} />
                    <BarChart bars={mindBars} goal={goalMindTotal || undefined} height={110} format={(v) => `${v} min`} onSelect={selectDay} />
                  </Card>
                </ModuleScope>
                <ModuleScope module="nutrition" className="min-w-0">
                  <Card className="h-full animate-rise">
                    <SectionHeader
                      title="Eau bue"
                      subtitle={`Objectif ${(data.nutrition.water.goalMl / 1000).toLocaleString('fr-FR')} L par jour`}
                    />
                    <BarChart
                      bars={waterBars}
                      goal={data.nutrition.water.goalMl}
                      height={110}
                      format={(v) => `${(v / 1000).toLocaleString('fr-FR')} L`}
                      onSelect={selectDay}
                    />
                  </Card>
                </ModuleScope>
              </div>
            </div>

            <div className="min-w-0 space-y-4">
              <Card className="animate-rise">
                <SectionHeader icon={<CalendarDays />} title="Calendrier" />
                <MonthCalendar onSelect={setOpenDay} />
              </Card>

              <Card className="animate-rise">
                <SectionHeader icon={<Trophy />} title="Mes objectifs" />
                <div className="space-y-4 text-sm">
                  <ModuleScope module="sport">
                    <div>
                      <Link to="/sport" className="block rounded-xl hover:opacity-90">
                        <div className="mb-1.5 flex items-center justify-between gap-2">
                          <span className="font-medium">Programme 30 jours</span>
                          <span className="shrink-0 text-ink-3">
                            {!data.sport.progression.enabled
                              ? 'désactivé'
                              : prog.finished
                                ? 'terminé'
                                : prog.day
                                  ? `jour ${prog.day} / ${prog.length}`
                                  : 'pas commencé'}
                          </span>
                        </div>
                        <ProgressBar value={prog.finished ? 1 : prog.day ? prog.day / prog.length : 0} />
                        {prog.phase && <div className="mt-1 text-xs text-ink-3">Phase : {prog.phase.name}</div>}
                      </Link>
                    </div>
                  </ModuleScope>
                  <ModuleScope module="mind" className="space-y-4">
                    <div>
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className="font-medium">Livres</span>
                        <span className="shrink-0 text-ink-3">
                          {booksRead} {plural(booksRead, 'lu')} · {booksReading.length} en cours
                        </span>
                      </div>
                      {booksReading.length ? (
                        <ul className="space-y-2">
                          {booksReading.slice(0, 4).map((b) => (
                            <li key={b.id}>
                              <div className="flex items-center justify-between gap-2 text-[13px]">
                                <span className="min-w-0 truncate">{b.title}</span>
                                <span className="shrink-0 text-ink-3 tabular">
                                  {b.pagesTotal > 0 ? `${b.pagesRead} / ${b.pagesTotal} p.` : 'en cours'}
                                </span>
                              </div>
                              {b.pagesTotal > 0 && <ProgressBar value={b.pagesRead / b.pagesTotal} height={6} className="mt-1" />}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-[13px] text-ink-3">Aucun livre en cours.</p>
                      )}
                    </div>
                    <div>
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className="font-medium">Sujets d’apprentissage</span>
                        <span className="shrink-0 text-ink-3">
                          {topics.length} · {topicsAvg} % en moyenne
                        </span>
                      </div>
                      <ProgressBar value={topicsAvg / 100} />
                    </div>
                  </ModuleScope>
                </div>
              </Card>

              <Card className="animate-rise">
                <SectionHeader icon={<History />} title="Historique quotidien" subtitle="Les 14 derniers jours" />
                <ul className="-mx-2">
                  {recent.map((k) => {
                    const s = getDaySummary(data, k, today);
                    return (
                      <li key={k}>
                        <button
                          type="button"
                          onClick={() => setOpenDay(k)}
                          className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-ink/[0.03]"
                        >
                          <span className="w-24 shrink-0 truncate text-[13px] font-medium first-letter:uppercase">
                            {formatRelative(k, today)}
                          </span>
                          <span className="flex min-w-0 flex-1 items-center gap-1">
                            {MODULE_KEYS.filter((m) => s.modules[m] !== undefined).map((m) => (
                              <span
                                key={m}
                                title={`${MODULE_LABELS[m]} : ${Math.round((s.modules[m] ?? 0) * 100)} %`}
                                className="size-2.5 shrink-0 rounded-full"
                                style={{
                                  background: `color-mix(in oklab, var(--c-${m}) ${Math.round(20 + (s.modules[m] ?? 0) * 80)}%, transparent)`,
                                }}
                              />
                            ))}
                          </span>
                          <span className={cx('w-12 shrink-0 text-right text-sm font-semibold tabular', s.pct >= threshold ? 'text-success' : 'text-ink-2')}>
                            {s.pct} %
                          </span>
                          {s.pct >= threshold && <Chip tone="success" className="max-sm:hidden">Réussie</Chip>}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </div>
          </div>
        </>
      )}

      <DayDetailSheet dayKey={openDay} onClose={() => setOpenDay(null)} />
    </ModuleScope>
  );
}
