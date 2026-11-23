import { AlertTriangle, ArrowRight, ChevronRight, Plus, RotateCcw, Sparkles, Trash2, Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  Button,
  Card,
  Chip,
  Field,
  IconButton,
  NumberField,
  ProgressBar,
  ReorderButtons,
  SectionHeader,
  Sheet,
  TextArea,
  TextInput,
  Toggle,
} from '@/components/ui';
import { addDays, formatLong, formatShort } from '@/lib/dates';
import { confirm, removeWithUndo, toast } from '@/lib/feedback';
import { applyProgression, getProgressionInfo } from '@/lib/progress';
import { useData, useUpdate } from '@/lib/store';
import type { DateKey, ProgressionPhase } from '@/lib/types';
import { cx, moveItem, uid } from '@/lib/utils';
import { describeExercise } from './sportUtils';

function signed(n: number, unit = ''): string {
  if (n === 0) return `±0${unit}`;
  return `${n > 0 ? '+' : '−'}${Math.abs(n)}${unit}`;
}

function phaseSummary(p: ProgressionPhase): string[] {
  const out: string[] = [];
  if (p.repsDelta) out.push(`${signed(p.repsDelta)} rép.`);
  if (p.setsDelta) out.push(`${signed(p.setsDelta)} série${Math.abs(p.setsDelta) > 1 ? 's' : ''}`);
  if (p.timeDeltaSec) out.push(`${signed(p.timeDeltaSec, ' s')} par série`);
  if (p.workDeltaSec) out.push(`Effort ${signed(p.workDeltaSec, ' s')}`);
  if (p.recoverDeltaSec) out.push(`Récup ${signed(p.recoverDeltaSec, ' s')}`);
  return out.length ? out : ['Valeurs de base'];
}

/** Phase la plus exigeante (sert à consolider les progrès en fin de cycle). */
function peakPhase(phases: ProgressionPhase[]): ProgressionPhase | null {
  let best: ProgressionPhase | null = null;
  let bestScore = -Infinity;
  for (const p of phases) {
    const score = p.repsDelta * 10 + p.setsDelta * 30 + p.timeDeltaSec + p.workDeltaSec;
    if (score > bestScore) {
      best = p;
      bestScore = score;
    }
  }
  return best;
}

export function ProgramTab({ today }: { today: DateKey }) {
  const data = useData();
  const update = useUpdate();
  const sport = data.sport;
  const prog = sport.progression;
  const info = getProgressionInfo(sport, today);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const selected = prog.phases.find((p) => p.id === selectedId) ?? info.phase ?? prog.phases[0] ?? null;
  const editingPhase = prog.phases.find((p) => p.id === editingId);

  const uncovered = useMemo(() => {
    const out: number[] = [];
    for (let day = 1; day <= prog.lengthDays; day++) {
      if (!prog.phases.some((p) => day >= p.fromDay && day <= p.toDay)) out.push(day);
    }
    return out;
  }, [prog.phases, prog.lengthDays]);

  /** Aperçu : exercices progressifs des séances du planning, avant → après. */
  const preview = useMemo(() => {
    if (!selected) return [];
    const planned = new Set(sport.week.filter(Boolean));
    const workouts = [...sport.workouts].sort((a, b) => Number(planned.has(b.id)) - Number(planned.has(a.id)));
    return workouts
      .map((w) => ({
        workout: w,
        rows: w.exercises
          .filter((e) => e.progressive)
          .map((e) => ({ ex: e, before: describeExercise(e, false), after: describeExercise(applyProgression(e, selected), false) }))
          .filter((r) => r.before !== r.after),
      }))
      .filter((g) => g.rows.length > 0);
  }, [selected, sport.workouts, sport.week]);

  const setProg = (fn: (p: typeof prog) => void) => update((d) => fn(d.sport.progression));

  const restartToday = async () => {
    if (info.day && info.day > 1) {
      const ok = await confirm({
        title: 'Recommencer le programme aujourd’hui ?',
        message: 'Le jour 1 devient aujourd’hui. Ton historique de séances est conservé.',
        confirmLabel: 'Recommencer',
      });
      if (!ok) return;
    }
    setProg((p) => void (p.startDate = today));
    toast('Programme relancé : jour 1 aujourd’hui', { tone: 'success' });
  };

  const consolidate = async () => {
    const peak = peakPhase(prog.phases);
    if (!peak) return;
    const ok = await confirm({
      title: 'Consolider mes progrès ?',
      message: `Les valeurs de base des exercices progressifs prennent celles de la phase « ${peak.name} » (${phaseSummary(peak).join(', ')}). Un nouveau cycle de ${prog.lengthDays} jours démarre aujourd’hui à partir de ce niveau.`,
      confirmLabel: 'Consolider et relancer',
    });
    if (!ok) return;
    update((d) => {
      for (const w of d.sport.workouts) {
        w.exercises = w.exercises.map((e) => {
          if (!e.progressive) return e;
          const eff = applyProgression(e, peak);
          return { ...e, reps: eff.reps, sets: eff.sets, durationSec: eff.durationSec, workSec: eff.workSec, recoverSec: eff.recoverSec };
        });
      }
      d.sport.progression.startDate = today;
    });
    toast('Progrès consolidés, nouveau cycle lancé', { tone: 'success' });
  };

  const addPhase = () => {
    const last = prog.phases.reduce((m, p) => Math.max(m, p.toDay), 0);
    const phase: ProgressionPhase = {
      id: uid('p'),
      name: 'Nouvelle phase',
      fromDay: last + 1,
      toDay: last + 7,
      repsDelta: 0,
      setsDelta: 0,
      timeDeltaSec: 0,
      workDeltaSec: 0,
      recoverDeltaSec: 0,
      description: '',
    };
    update((d) => {
      d.sport.progression.phases.push(phase);
      if (phase.toDay > d.sport.progression.lengthDays) d.sport.progression.lengthDays = phase.toDay;
    });
    setEditingId(phase.id);
  };

  const setPhase = <K extends keyof ProgressionPhase>(key: K, value: ProgressionPhase[K]) =>
    update((d) => {
      const p = d.sport.progression.phases.find((x) => x.id === editingId);
      if (p) p[key] = value;
    });

  const endDate = addDays(prog.startDate, prog.lengthDays - 1);

  return (
    <div className="space-y-5">
      {info.finished && prog.enabled && (
        <Card padding="lg" className="animate-rise border-tint/30">
          <div className="flex items-start gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-tint text-tint-ink">
              <Trophy className="size-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">Cycle de {prog.lengthDays} jours terminé</h2>
              <p className="mt-0.5 text-sm text-ink-2">
                Tu peux repartir de ton nouveau niveau (« Consolider mes progrès ») ou refaire le même cycle.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="tint" onClick={consolidate}>
                  <Sparkles /> Consolider mes progrès
                </Button>
                <Button variant="secondary" onClick={restartToday}>
                  <RotateCcw /> Nouveau cycle
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      <Card padding="lg" className="animate-rise">
        <Toggle
          label="Programme progressif sur 30 jours"
          description="La difficulté augmente par paliers, avec des jours de récupération."
          checked={prog.enabled}
          onChange={(v) => setProg((p) => void (p.enabled = v))}
        />
        {prog.enabled && (
          <div className="mt-5 space-y-5">
            <div>
              <div className="flex items-end justify-between gap-3">
                <div>
                  <div className="font-display text-3xl font-semibold tracking-tight tabular">
                    {info.day === null ? 'Bientôt' : info.finished ? 'Terminé' : `Jour ${info.day}`}
                    {!info.finished && info.day !== null && <span className="text-lg text-ink-3"> / {prog.lengthDays}</span>}
                  </div>
                  <div className="text-sm text-ink-2">
                    {info.day === null
                      ? `Début le ${formatLong(prog.startDate)}`
                      : info.phase
                        ? `Phase ${info.phase.name}`
                        : info.finished
                          ? `Terminé le ${formatShort(endDate)}`
                          : 'Aucune phase pour ce jour'}
                  </div>
                </div>
                <div className="text-right text-xs text-ink-3">
                  Du {formatShort(prog.startDate)}
                  <br />
                  au {formatShort(endDate)}
                </div>
              </div>
              <ProgressBar value={info.day ? Math.min(1, info.day / prog.lengthDays) : 0} className="mt-3" />
            </div>

            {/* Frise des phases */}
            <div>
              <div className="flex h-9 gap-1">
                {prog.phases.map((p) => {
                  const len = Math.max(1, p.toDay - p.fromDay + 1);
                  const current = info.phase?.id === p.id;
                  const past = info.day !== null && (info.finished || p.toDay < info.day);
                  const isSel = selected?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedId(p.id)}
                      title={`${p.name} : jours ${p.fromDay} à ${p.toDay}`}
                      style={{ flexGrow: len, flexBasis: 0 }}
                      className={cx(
                        'min-w-0 truncate rounded-lg px-1.5 text-[11px] font-semibold transition-[background-color,box-shadow]',
                        current ? 'bg-tint text-tint-ink' : past ? 'bg-tint/35 text-ink' : 'bg-tint/12 text-ink-2',
                        isSel && 'ring-2 ring-ink/40 ring-offset-2 ring-offset-surface',
                      )}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
              <div className="mt-1.5 flex justify-between text-[11px] text-ink-3 tabular">
                <span>J1</span>
                <span>J{prog.lengthDays}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
              <Field label="Date de départ (jour 1)">
                <TextInput
                  type="date"
                  value={prog.startDate}
                  onChange={(e) => e.target.value && setProg((p) => void (p.startDate = e.target.value))}
                />
              </Field>
              <Button variant="secondary" size="lg" className="h-11 rounded-xl" onClick={restartToday}>
                <RotateCcw /> Recommencer aujourd’hui
              </Button>
            </div>
            <Field label="Durée du cycle" hint="30 jours par défaut.">
              <NumberField
                value={prog.lengthDays}
                min={7}
                max={180}
                suffix="jours"
                onChange={(v) => setProg((p) => void (p.lengthDays = v))}
                className="max-w-56"
              />
            </Field>
            <p className="rounded-xl bg-surface-2 p-3 text-[13px] leading-relaxed text-ink-2">
              Les jours de récupération de ton planning (récupération active le jeudi, repos le dimanche) font partie du programme : la progression se fait aussi pendant le repos.
            </p>
          </div>
        )}
      </Card>

      {prog.enabled && (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <Card padding="md" className="animate-rise" style={{ animationDelay: '60ms' }}>
            <SectionHeader
              title="Phases"
              subtitle="Touche une phase pour voir son effet"
              editing={editMode}
              onToggleEdit={() => setEditMode((v) => !v)}
              onAdd={addPhase}
            />
            {uncovered.length > 0 && (
              <p className="mb-3 flex items-start gap-2 rounded-xl bg-danger/10 p-3 text-[13px] text-danger">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                {uncovered.length} jour{uncovered.length > 1 ? 's' : ''} sans phase (valeurs de base appliquées) : J{uncovered[0]}
                {uncovered.length > 1 ? ` à J${uncovered[uncovered.length - 1]}` : ''}.
              </p>
            )}
            <ul className="space-y-2">
              {prog.phases.map((p, i) => {
                const current = info.phase?.id === p.id;
                const isSel = selected?.id === p.id;
                return (
                  <li
                    key={p.id}
                    className={cx(
                      'flex items-start gap-2 rounded-2xl border p-3 transition-colors',
                      isSel ? 'border-tint/40 bg-tint/[0.07]' : 'border-line',
                    )}
                  >
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => (editMode ? setEditingId(p.id) : setSelectedId(p.id))}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{p.name}</span>
                        <span className="text-xs text-ink-3 tabular">
                          J{p.fromDay} à J{p.toDay}
                        </span>
                        {current && <Chip tone="tint" className="h-5 text-[10px]">En cours</Chip>}
                      </div>
                      {p.description && <p className="mt-0.5 text-[13px] text-ink-2">{p.description}</p>}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {phaseSummary(p).map((s) => (
                          <span key={s} className="rounded-md bg-ink/[0.05] px-1.5 py-0.5 text-[11px] font-medium text-ink-2">
                            {s}
                          </span>
                        ))}
                      </div>
                    </button>
                    {editMode ? (
                      <div className="flex items-center">
                        <ReorderButtons
                          index={i}
                          count={prog.phases.length}
                          onMove={(to) => update((d) => moveItem(d.sport.progression.phases, i, to))}
                        />
                        <IconButton
                          label={`Supprimer ${p.name}`}
                          size="icon-sm"
                          onClick={() =>
                            removeWithUndo(`Phase « ${p.name} » supprimée`, (d) => {
                              d.sport.progression.phases = d.sport.progression.phases.filter((x) => x.id !== p.id);
                            })
                          }
                        >
                          <Trash2 />
                        </IconButton>
                      </div>
                    ) : (
                      <IconButton label={`Modifier ${p.name}`} size="icon-sm" onClick={() => setEditingId(p.id)}>
                        <ChevronRight />
                      </IconButton>
                    )}
                  </li>
                );
              })}
            </ul>
            {prog.phases.length === 0 && (
              <Button variant="tint" className="w-full" onClick={addPhase}>
                <Plus /> Ajouter une phase
              </Button>
            )}
          </Card>

          <Card padding="md" className="animate-rise" style={{ animationDelay: '100ms' }}>
            <SectionHeader
              title={selected ? `Effet de « ${selected.name} »` : 'Effet de la phase'}
              subtitle="Valeurs de base → valeurs de la phase"
            />
            {preview.length === 0 ? (
              <p className="py-6 text-center text-sm text-ink-3">
                {selected ? 'Cette phase garde les valeurs de base.' : 'Aucune phase sélectionnée.'}
              </p>
            ) : (
              <div className="space-y-4">
                {preview.map(({ workout, rows }) => (
                  <div key={workout.id}>
                    <div className="mb-1 text-[12px] font-semibold tracking-wide text-ink-3 uppercase">{workout.title}</div>
                    <ul className="divide-y divide-line">
                      {rows.map(({ ex, before, after }) => (
                        <li key={ex.id} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 py-2 text-sm">
                          <span className="min-w-28 font-medium">{ex.name}</span>
                          <span className="text-ink-3">{before}</span>
                          <ArrowRight className="size-3.5 text-tint" />
                          <span className="font-semibold text-tint">{after}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      <Sheet
        open={!!editingPhase}
        onClose={() => setEditingId(null)}
        title={editingPhase?.name || 'Phase'}
        subtitle={editingPhase ? `Jours ${editingPhase.fromDay} à ${editingPhase.toDay}` : undefined}
        footer={
          editingPhase && (
            <>
              <Button
                variant="danger"
                className="mr-auto"
                onClick={() => {
                  const p = editingPhase;
                  setEditingId(null);
                  removeWithUndo(`Phase « ${p.name} » supprimée`, (d) => {
                    d.sport.progression.phases = d.sport.progression.phases.filter((x) => x.id !== p.id);
                  });
                }}
              >
                <Trash2 /> Supprimer
              </Button>
              <Button variant="tint" onClick={() => setEditingId(null)}>
                Terminé
              </Button>
            </>
          )
        }
      >
        {editingPhase && (
          <div className="space-y-4">
            <Field label="Nom">
              <TextInput value={editingPhase.name} onChange={(e) => setPhase('name', e.target.value)} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Du jour">
                <NumberField value={editingPhase.fromDay} min={1} max={365} onChange={(v) => setPhase('fromDay', v)} ariaLabel="Premier jour" />
              </Field>
              <Field label="Au jour">
                <NumberField
                  value={editingPhase.toDay}
                  min={editingPhase.fromDay}
                  max={365}
                  onChange={(v) => setPhase('toDay', v)}
                  ariaLabel="Dernier jour"
                />
              </Field>
            </div>
            <p className="text-[13px] text-ink-3">
              Les écarts s’ajoutent aux valeurs de base des exercices qui suivent le programme (une valeur négative allège).
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Répétitions">
                <NumberField value={editingPhase.repsDelta} min={-50} max={100} onChange={(v) => setPhase('repsDelta', v)} suffix="rép." />
              </Field>
              <Field label="Séries">
                <NumberField value={editingPhase.setsDelta} min={-10} max={10} onChange={(v) => setPhase('setsDelta', v)} />
              </Field>
              <Field label="Durée par série (exercices en durée)">
                <NumberField value={editingPhase.timeDeltaSec} min={-600} max={600} step={5} onChange={(v) => setPhase('timeDeltaSec', v)} suffix="s" />
              </Field>
              <Field label="Effort du fractionné">
                <NumberField value={editingPhase.workDeltaSec} min={-600} max={1200} step={15} onChange={(v) => setPhase('workDeltaSec', v)} suffix="s" />
              </Field>
              <Field label="Récupération du fractionné">
                <NumberField
                  value={editingPhase.recoverDeltaSec}
                  min={-600}
                  max={600}
                  step={15}
                  onChange={(v) => setPhase('recoverDeltaSec', v)}
                  suffix="s"
                />
              </Field>
            </div>
            <Field label="Description">
              <TextArea value={editingPhase.description} minRows={2} onChange={(e) => setPhase('description', e.target.value)} />
            </Field>
          </div>
        )}
      </Sheet>
    </div>
  );
}
