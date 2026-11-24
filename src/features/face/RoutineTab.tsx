import { Clock, Moon, Pencil, Plus, Sun, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { WeeklyCareSection } from './WeeklyCareCard';
import {
  Button,
  Card,
  CheckRow,
  Chip,
  EmptyState,
  Field,
  IconButton,
  NumberField,
  ProgressBar,
  Rating,
  ReorderButtons,
  SectionHeader,
  Select,
  Sheet,
  TextArea,
  TextInput,
  TimeField,
  Toggle,
} from '@/components/ui';
import { nowMinutes, timeToMinutes, useToday } from '@/lib/dates';
import { confirm, removeWithUndo } from '@/lib/feedback';
import { useData, useUpdate } from '@/lib/store';
import type { AppData, Routine, RoutineStep } from '@/lib/types';
import { cx, moveItem, uid } from '@/lib/utils';
import { SKIN_LABELS } from './helpers';

export function RoutineIcon({ icon, className }: { icon: string; className?: string }) {
  if (icon === 'sun') return <Sun className={className} />;
  if (icon === 'moon') return <Moon className={className} />;
  return <span className={cx('leading-none', className)}>{icon || '✨'}</span>;
}

/** Routine du moment : la dernière dont l'heure est passée (ou arrive dans les 2 h). */
function currentRoutineId(routines: Routine[]): string | null {
  if (!routines.length) return null;
  const now = nowMinutes();
  const sorted = [...routines].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));
  const past = sorted.filter((r) => timeToMinutes(r.time) <= now + 120);
  return (past.at(-1) ?? sorted.at(-1))!.id;
}

function findStep(d: AppData, rid: string, sid: string): RoutineStep | undefined {
  return d.face.routines.find((r) => r.id === rid)?.steps.find((s) => s.id === sid);
}

function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const isEmoji = value !== 'sun' && value !== 'moon';
  return (
    <div className="flex items-center gap-1.5">
      {(['sun', 'moon'] as const).map((k) => (
        <button
          key={k}
          type="button"
          aria-pressed={value === k}
          aria-label={k === 'sun' ? 'Soleil' : 'Lune'}
          onClick={() => onChange(k)}
          className={cx(
            'flex items-center justify-center size-9 rounded-lg transition-colors',
            value === k ? 'bg-tint text-tint-ink' : 'bg-surface-2 text-ink-2 hover:bg-ink/[0.08]',
          )}
        >
          <RoutineIcon icon={k} className="size-4" />
        </button>
      ))}
      <input
        aria-label="Emoji de la routine"
        value={isEmoji ? value : ''}
        placeholder="✨"
        onChange={(e) => onChange(Array.from(e.target.value).slice(-2).join('') || '✨')}
        className={cx(
          'h-9 w-11 rounded-lg bg-surface-2 text-center text-lg outline-none focus:ring-2 focus:ring-tint/40',
          isEmoji && 'ring-2 ring-tint/60',
        )}
      />
    </div>
  );
}

function StepSheet({
  target,
  onClose,
  today,
}: {
  target: { rid: string; sid: string; edit: boolean } | null;
  onClose: () => void;
  today: string;
}) {
  const data = useData();
  const update = useUpdate();
  const [editing, setEditing] = useState(false);
  const routine = target ? data.face.routines.find((r) => r.id === target.rid) : undefined;
  const step = routine?.steps.find((s) => s.id === target?.sid);
  const open = !!(target && step);
  const isEditing = editing || !!target?.edit;
  const done = !!step && (data.face.log[today]?.done ?? []).includes(step.id);
  const product = step?.productId ? data.face.products.find((p) => p.id === step.productId) : undefined;

  const close = () => {
    setEditing(false);
    onClose();
  };
  const patch = (fn: (s: RoutineStep) => void) =>
    target &&
    update((d) => {
      const s = findStep(d, target.rid, target.sid);
      if (s) fn(s);
    });
  const toggle = () =>
    step &&
    update((d) => {
      const log = (d.face.log[today] ??= { done: [], note: '' });
      log.done = done ? log.done.filter((x) => x !== step.id) : [...new Set([...log.done, step.id])];
    });

  return (
    <Sheet
      open={open}
      onClose={close}
      title={step?.title || 'Étape'}
      subtitle={routine ? `Routine ${routine.name.toLowerCase()}` : undefined}
      footer={
        step &&
        (isEditing ? (
          <>
            <Button
              variant="danger"
              className="mr-auto"
              onClick={() => {
                const { rid, sid } = target!;
                removeWithUndo('Étape supprimée', (d) => {
                  const r = d.face.routines.find((x) => x.id === rid);
                  if (r) r.steps = r.steps.filter((s) => s.id !== sid);
                });
                close();
              }}
            >
              <Trash2 /> Supprimer
            </Button>
            <Button variant="tint" onClick={close}>
              Terminé
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" onClick={() => setEditing(true)} className="mr-auto">
              <Pencil /> Modifier
            </Button>
            <Button variant={done ? 'secondary' : 'tint'} onClick={toggle}>
              {done ? 'Annuler la validation' : 'Valider l’étape'}
            </Button>
          </>
        ))
      }
    >
      {step &&
        (isEditing ? (
          <div className="space-y-4">
            <Field label="Nom de l’étape">
              <TextInput value={step.title} onChange={(e) => patch((s) => void (s.title = e.target.value))} />
            </Field>
            <Field label="Consignes">
              <TextArea value={step.description} onChange={(e) => patch((s) => void (s.description = e.target.value))} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Durée">
                <NumberField
                  value={step.durationMin}
                  min={0}
                  max={60}
                  suffix="min"
                  onChange={(v) => patch((s) => void (s.durationMin = v))}
                />
              </Field>
              <Field label="Produit utilisé">
                <Select
                  value={step.productId ?? ''}
                  onChange={(e) => patch((s) => void (s.productId = e.target.value || null))}
                >
                  <option value="">Aucun</option>
                  {data.face.products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Toggle
              checked={step.optional}
              onChange={(v) => patch((s) => void (s.optional = v))}
              label="Étape facultative"
              description="Elle ne compte pas dans ta progression si tu la sautes."
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {step.durationMin > 0 && (
                <Chip>
                  <Clock /> {step.durationMin} min
                </Chip>
              )}
              {step.optional && <Chip>Facultatif</Chip>}
              {done && <Chip tone="success">Fait aujourd’hui</Chip>}
            </div>
            <p className="text-[15px] leading-relaxed text-ink-2">{step.description || 'Pas de consigne pour cette étape.'}</p>
            {product && (
              <div className="rounded-2xl bg-surface-2 p-4">
                <div className="text-xs font-medium text-ink-3">Produit</div>
                <div className="mt-0.5 font-medium">
                  {product.name}
                  {product.brand && <span className="text-ink-2"> · {product.brand}</span>}
                </div>
                {product.notes && <div className="mt-1 text-sm text-ink-2">{product.notes}</div>}
              </div>
            )}
          </div>
        ))}
    </Sheet>
  );
}

function RoutineCard({
  routine,
  index,
  count,
  editing,
  current,
  today,
  onOpenStep,
}: {
  routine: Routine;
  index: number;
  count: number;
  editing: boolean;
  current: boolean;
  today: string;
  onOpenStep: (sid: string, edit: boolean) => void;
}) {
  const data = useData();
  const update = useUpdate();
  const done = new Set(data.face.log[today]?.done ?? []);
  const required = routine.steps.filter((s) => !s.optional);
  const doneCount = required.filter((s) => done.has(s.id)).length;
  const complete = required.length > 0 && doneCount === required.length;
  const products = data.face.products;

  const patch = (fn: (r: Routine) => void) =>
    update((d) => {
      const r = d.face.routines.find((x) => x.id === routine.id);
      if (r) fn(r);
    });
  const toggle = (sid: string, next: boolean) =>
    update((d) => {
      const log = (d.face.log[today] ??= { done: [], note: '' });
      log.done = next ? [...new Set([...log.done, sid])] : log.done.filter((x) => x !== sid);
    });
  const addStep = () => {
    const id = uid('fs');
    patch((r) => void r.steps.push({ id, title: 'Nouvelle étape', description: '', durationMin: 1, optional: false, productId: null }));
    onOpenStep(id, true);
  };
  const deleteRoutine = async () => {
    const ok = await confirm({
      title: `Supprimer la routine « ${routine.name} » ?`,
      message: 'Ses étapes seront supprimées. Ton historique reste intact.',
      confirmLabel: 'Supprimer',
      danger: true,
    });
    if (ok) removeWithUndo('Routine supprimée', (d) => void (d.face.routines = d.face.routines.filter((r) => r.id !== routine.id)));
  };

  return (
    <Card className={cx('animate-rise', current && !editing && 'border-tint/30')} style={{ animationDelay: `${index * 60}ms` }}>
      <div className="mb-3 flex items-center gap-3">
        <div
          className={cx(
            'flex items-center justify-center size-11 shrink-0 rounded-2xl text-lg [&_svg]:size-5',
            complete ? 'bg-tint text-tint-ink' : 'bg-tint/12 text-tint',
          )}
        >
          <RoutineIcon icon={routine.icon} />
        </div>
        {editing ? (
          <div className="min-w-0 flex-1 space-y-2">
            <TextInput
              value={routine.name}
              aria-label="Nom de la routine"
              onChange={(e) => patch((r) => void (r.name = e.target.value))}
              className="h-9"
            />
            <div className="flex flex-wrap items-center gap-2">
              <TimeField value={routine.time} onChange={(v) => patch((r) => void (r.time = v))} className="h-9 w-28" />
              <IconPicker value={routine.icon} onChange={(v) => patch((r) => void (r.icon = v))} />
            </div>
          </div>
        ) : (
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-[17px] font-semibold">{routine.name}</h3>
              {current && <Chip tone="tint">Maintenant</Chip>}
            </div>
            <div className="text-[13px] text-ink-3">
              {routine.time} · {doneCount}/{required.length} étape{required.length > 1 ? 's' : ''}
            </div>
          </div>
        )}
        {editing && (
          <div className="flex shrink-0 flex-col items-end gap-1 self-start">
            <ReorderButtons
              index={index}
              count={count}
              onMove={(to) => update((d) => moveItem(d.face.routines, index, to))}
            />
            <IconButton label="Supprimer la routine" size="icon-sm" onClick={deleteRoutine} className="text-danger hover:text-danger">
              <Trash2 />
            </IconButton>
          </div>
        )}
      </div>
      {!editing && required.length > 0 && <ProgressBar value={doneCount / required.length} className="mb-2" height={6} />}

      {routine.steps.length === 0 ? (
        <p className="py-3 text-sm text-ink-3">Aucune étape pour l’instant.</p>
      ) : (
        <div className="-mx-2">
          {routine.steps.map((s, i) => {
            const product = s.productId ? products.find((p) => p.id === s.productId) : undefined;
            const sub = [product?.name, s.durationMin ? `${s.durationMin} min` : '', s.optional ? 'Facultatif' : '']
              .filter(Boolean)
              .join(' · ');
            return (
              <CheckRow
                key={s.id}
                checked={done.has(s.id)}
                onToggle={(v) => toggle(s.id, v)}
                title={s.title}
                subtitle={sub}
                muted={s.optional}
                onOpen={() => onOpenStep(s.id, editing)}
                trailing={
                  editing ? (
                    <ReorderButtons
                      index={i}
                      count={routine.steps.length}
                      onMove={(to) => patch((r) => moveItem(r.steps, i, to))}
                    />
                  ) : undefined
                }
              />
            );
          })}
        </div>
      )}
      {editing && (
        <Button variant="ghost" size="sm" onClick={addStep} className="mt-2 text-tint hover:text-tint">
          <Plus /> Ajouter une étape
        </Button>
      )}
    </Card>
  );
}

export function RoutineTab() {
  const data = useData();
  const update = useUpdate();
  const today = useToday();
  const [editing, setEditing] = useState(false);
  const [stepTarget, setStepTarget] = useState<{ rid: string; sid: string; edit: boolean } | null>(null);
  const routines = data.face.routines;
  const currentId = currentRoutineId(routines);
  const ordered = editing ? routines : [...routines].sort((a, b) => (a.id === currentId ? -1 : b.id === currentId ? 1 : 0));
  const log = data.face.log[today];

  const addRoutine = () => {
    update((d) =>
      void d.face.routines.push({ id: uid('r'), name: 'Nouvelle routine', icon: '✨', time: '20:00', steps: [] }),
    );
    setEditing(true);
  };

  return (
    <div className="space-y-6">
      <section>
        <SectionHeader
          title="Mes routines"
          subtitle={editing ? 'Renomme, réorganise, ajoute des étapes.' : 'Touche une étape pour voir ses consignes.'}
          editing={editing}
          onToggleEdit={() => setEditing((e) => !e)}
          onAdd={addRoutine}
          addLabel="Routine"
        />
        {routines.length === 0 ? (
          <EmptyState title="Aucune routine" action={<Button variant="tint" onClick={addRoutine}><Plus /> Créer une routine</Button>}>
            Crée ta routine du matin, du soir, ou une routine hebdomadaire.
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {ordered.map((r) => (
              <RoutineCard
                key={r.id}
                routine={r}
                index={routines.indexOf(r)}
                count={routines.length}
                editing={editing}
                current={r.id === currentId}
                today={today}
                onOpenStep={(sid, edit) => setStepTarget({ rid: r.id, sid, edit })}
              />
            ))}
          </div>
        )}
      </section>

      <WeeklyCareSection />

      <Card className="animate-rise" style={{ animationDelay: '120ms' }}>
        <SectionHeader title="Ma peau aujourd’hui" subtitle="Un repère rapide pour suivre ses réactions." />
        <div className="flex flex-wrap items-center gap-3">
          <Rating
            value={log?.skinFeel ?? 0}
            labels={SKIN_LABELS}
            onChange={(v) =>
              update((d) => {
                const l = (d.face.log[today] ??= { done: [], note: '' });
                l.skinFeel = v || undefined;
              })
            }
          />
          {!!log?.skinFeel && <span className="text-sm text-ink-2">{SKIN_LABELS[log.skinFeel - 1]}</span>}
        </div>
        <Field label="Note du jour" className="mt-3">
          <TextArea
            minRows={2}
            value={log?.note ?? ''}
            placeholder="Nouveau produit, peau qui tiraille, bouton, bonne mine…"
            onChange={(e) =>
              update((d) => {
                const l = (d.face.log[today] ??= { done: [], note: '' });
                l.note = e.target.value;
              })
            }
          />
        </Field>
      </Card>

      <StepSheet target={stepTarget} onClose={() => setStepTarget(null)} today={today} />
    </div>
  );
}
