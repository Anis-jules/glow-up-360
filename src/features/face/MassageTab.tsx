import { Clock, Play, Plus, Trash2 } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Chip,
  DurationField,
  EmptyState,
  Field,
  ReorderButtons,
  SectionHeader,
  Select,
  SequenceTimer,
  Sheet,
  TextArea,
  TextInput,
  type TimerPhase,
} from '@/components/ui';
import { formatDuration, useToday } from '@/lib/dates';
import { removeWithUndo, toast } from '@/lib/feedback';
import { useData, useUpdate } from '@/lib/store';
import type { MassageIllustration as Kind, MassageStep } from '@/lib/types';
import { cx, moveItem, uid } from '@/lib/utils';
import { massageStepIds } from './helpers';
import { HonestyNotice } from './HonestyNotice';
import { ILLUSTRATION_OPTIONS, MassageIllustration } from './MassageIllustration';

function StepEditor({ id, onClose }: { id: string | null; onClose: () => void }) {
  const data = useData();
  const update = useUpdate();
  const step = id ? data.face.massage.find((s) => s.id === id) : undefined;
  const patch = (fn: (s: MassageStep) => void) =>
    update((d) => {
      const s = d.face.massage.find((x) => x.id === id);
      if (s) fn(s);
    });
  return (
    <Sheet
      open={!!step}
      onClose={onClose}
      title="Modifier le geste"
      subtitle="Chaque modification est enregistrée automatiquement."
      footer={
        <>
          <Button
            variant="danger"
            className="mr-auto"
            onClick={() => {
              removeWithUndo('Geste supprimé', (d) => void (d.face.massage = d.face.massage.filter((s) => s.id !== id)));
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
      {step && (
        <div className="space-y-4">
          <div className="mx-auto w-40 rounded-2xl bg-surface-2 p-2">
            <MassageIllustration kind={step.illustration} />
          </div>
          <Field label="Nom du geste">
            <TextInput value={step.title} onChange={(e) => patch((s) => void (s.title = e.target.value))} />
          </Field>
          <Field label="Explication">
            <TextArea value={step.description} onChange={(e) => patch((s) => void (s.description = e.target.value))} />
          </Field>
          <Field label="Durée">
            <DurationField value={step.durationSec} onChange={(v) => patch((s) => void (s.durationSec = Math.max(5, v)))} />
          </Field>
          <Field label="Illustration">
            <Select value={step.illustration} onChange={(e) => patch((s) => void (s.illustration = e.target.value as Kind))}>
              {ILLUSTRATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      )}
    </Sheet>
  );
}

function GuidedMassage({ open, onClose, steps }: { open: boolean; onClose: () => void; steps: MassageStep[] }) {
  const data = useData();
  const update = useUpdate();
  const today = useToday();
  const [idx, setIdx] = useState(0);
  const phases = useMemo<TimerPhase[]>(
    () => steps.map((s) => ({ label: s.title, seconds: Math.max(5, s.durationSec), tone: 'work' })),
    [steps],
  );
  const step = steps[Math.min(idx, steps.length - 1)];
  const massageIds = useMemo(() => massageStepIds(data.face), [data.face]);

  const onFinish = useCallback(() => {
    if (massageIds.length) {
      update((d) => {
        const log = (d.face.log[today] ??= { done: [], note: '' });
        log.done = [...new Set([...log.done, massageIds[0]])];
      });
      toast('Massage terminé et noté dans ta routine.', { tone: 'success' });
    } else {
      toast('Massage terminé. Belle détente !', { tone: 'success' });
    }
  }, [massageIds, today, update]);

  if (!step) return null;
  return (
    <Sheet
      open={open}
      onClose={() => {
        setIdx(0);
        onClose();
      }}
      title="Massage guidé"
      subtitle={`${steps.length} gestes · ${formatDuration(phases.reduce((a, p) => a + p.seconds, 0))}`}
      size="lg"
    >
      <div className="grid grid-cols-1 items-center gap-5 sm:grid-cols-2">
        <div className="text-center sm:text-left">
          <div className="mx-auto w-full max-w-[240px] rounded-3xl bg-surface-2 p-3 sm:mx-0">
            <MassageIllustration key={step.id} kind={step.illustration} animated className="animate-fade-in" />
          </div>
          <div key={`t-${step.id}`} className="mt-4 animate-fade-in">
            <div className="text-xs font-medium text-ink-3">
              Geste {Math.min(idx, steps.length - 1) + 1} sur {steps.length}
            </div>
            <h3 className="mt-0.5 text-lg font-semibold">{step.title}</h3>
            <p className="mt-1 text-[15px] leading-relaxed text-ink-2">{step.description}</p>
          </div>
        </div>
        <SequenceTimer phases={phases} onPhaseChange={setIdx} onFinish={onFinish} finishLabel="Massage terminé" />
      </div>
      <HonestyNotice compact className="mt-5" />
    </Sheet>
  );
}

export function MassageTab() {
  const data = useData();
  const update = useUpdate();
  const [editing, setEditing] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [guide, setGuide] = useState(false);
  const steps = data.face.massage;
  const total = steps.reduce((a, s) => a + s.durationSec, 0);

  const add = () => {
    const id = uid('m');
    update((d) => void d.face.massage.push({ id, title: 'Nouveau geste', description: '', durationSec: 20, illustration: 'none' }));
    setEditId(id);
  };

  return (
    <div className="space-y-6">
      <HonestyNotice className="animate-rise" />

      <Card className="animate-rise overflow-hidden" padding="none" style={{ animationDelay: '60ms' }}>
        <div className="grid grid-cols-1 items-center gap-4 p-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:p-6">
          <div>
            <Chip tone="tint">
              <Clock /> {formatDuration(total)}
            </Chip>
            <h2 className="mt-2 text-xl font-semibold">Massage facial guidé</h2>
            <p className="mt-1 max-w-md text-sm text-ink-2">
              Laisse-toi guider geste par geste, avec un minuteur et un signal sonore à chaque changement. Pression légère,
              mouvements lents.
            </p>
            <Button variant="tint" size="lg" className="mt-4" onClick={() => setGuide(true)} disabled={!steps.length}>
              <Play /> Lancer le massage guidé
            </Button>
          </div>
          <div className="mx-auto hidden w-36 sm:block">
            <MassageIllustration kind="cheeks" />
          </div>
        </div>
      </Card>

      <section>
        <SectionHeader
          title="Les gestes"
          subtitle="Dans l’ordre où tu les fais."
          editing={editing}
          onToggleEdit={() => setEditing((e) => !e)}
          onAdd={add}
          addLabel="Geste"
        />
        {steps.length === 0 ? (
          <EmptyState title="Aucun geste">Ajoute les gestes de ton massage.</EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {steps.map((s, i) => (
              <Card
                key={s.id}
                padding="sm"
                interactive={!editing}
                onClick={() => !editing && setEditId(s.id)}
                className="flex animate-rise gap-3"
                style={{ animationDelay: `${80 + i * 40}ms` }}
              >
                <div className="w-24 shrink-0 rounded-xl bg-surface-2 p-1 sm:w-28">
                  <MassageIllustration kind={s.illustration} />
                </div>
                <div className="min-w-0 flex-1 py-1">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center size-6 shrink-0 rounded-full bg-tint/12 text-xs font-semibold text-tint">
                      {i + 1}
                    </span>
                    <h3 className="truncate font-semibold">{s.title}</h3>
                  </div>
                  <div className="mt-1 text-xs text-ink-3">{formatDuration(s.durationSec)}</div>
                  <p className={cx('mt-1.5 text-[13px] leading-relaxed text-ink-2', !editing && 'line-clamp-4')}>{s.description}</p>
                  {editing && (
                    <div className="mt-2 flex items-center gap-1">
                      <Button size="xs" variant="secondary" onClick={() => setEditId(s.id)}>
                        Modifier
                      </Button>
                      <ReorderButtons index={i} count={steps.length} onMove={(to) => update((d) => moveItem(d.face.massage, i, to))} />
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
        {editing && (
          <Button variant="ghost" size="sm" onClick={add} className="mt-3 text-tint hover:text-tint">
            <Plus /> Ajouter un geste
          </Button>
        )}
      </section>

      <StepEditor id={editId} onClose={() => setEditId(null)} />
      <GuidedMassage open={guide} onClose={() => setGuide(false)} steps={steps} />
    </div>
  );
}
