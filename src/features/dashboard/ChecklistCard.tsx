import { Check, ClipboardCheck, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import {
  Button,
  Checkbox,
  DayPicker,
  EmojiField,
  Field,
  IconButton,
  ReorderButtons,
  Segmented,
  Select,
  Sheet,
  TextInput,
} from '@/components/ui';
import { setWater, toggleFaceStep, toggleFaceTraining, toggleHabit, toggleWeekly } from '@/lib/actions';
import { ALL_DAYS, formatDuration, formatRelative, startOfWeek, useToday, weekdayOf } from '@/lib/dates';
import { getFaceExercisesForDate } from '@/lib/progress';
import { removeWithUndo, toast } from '@/lib/feedback';
import { useData, useUpdate } from '@/lib/store';
import type { AppData, ChecklistItem, DateKey, HabitMoment, Weekday } from '@/lib/types';
import { cx, moveItem, uid } from '@/lib/utils';
import { DashCard } from './DashCard';

const MOMENT_LABEL: Record<HabitMoment, string> = {
  matin: 'Matin',
  journee: 'Dans la journée',
  soir: 'Soir',
  libre: 'Quand tu veux',
};

const litres = (ml: number) => `${(ml / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 })} L`;

/** Ce que l'accueil affiche pour une ligne, résolu à partir de ce qu'elle désigne. */
interface Resolved {
  item: ChecklistItem;
  title: string;
  subtitle?: string;
  /** Absente aujourd'hui (habitude non prévue ce jour) ou cible supprimée. */
  hidden: boolean;
  missing: boolean;
  done: boolean;
}

function resolve(data: AppData, item: ChecklistItem, today: DateKey): Resolved {
  const link = item.link;
  if (link.kind === 'habit') {
    const h = data.habits.items.find((x) => x.id === link.habitId);
    if (!h) return { item, title: item.label, hidden: true, missing: true, done: false };
    return {
      item,
      title: h.title,
      subtitle: MOMENT_LABEL[h.moment],
      hidden: h.archived || !h.days.includes(weekdayOf(today)),
      missing: false,
      done: (data.habits.log[today] ?? []).includes(h.id),
    };
  }
  if (link.kind === 'face') {
    const routine = data.face.routines.find((r) => r.steps.some((s) => s.id === link.stepId));
    if (!routine) return { item, title: item.label, hidden: true, missing: true, done: false };
    return {
      item,
      title: item.label,
      subtitle: `Routine du ${routine.name.toLowerCase()}`,
      hidden: false,
      missing: false,
      done: (data.face.log[today]?.done ?? []).includes(link.stepId),
    };
  }
  if (link.kind === 'faceTraining') {
    const plan = getFaceExercisesForDate(data.sport, today);
    if (!plan) return { item, title: item.label, hidden: true, missing: false, done: false };
    const ex = plan[link.slot];
    return {
      item,
      title: item.label,
      subtitle: [ex.name, ex.durationSec ? formatDuration(ex.durationSec) : ''].filter(Boolean).join(' · '),
      hidden: false,
      missing: false,
      done: (data.sport.faceTraining.log[today] ?? []).includes(link.slot),
    };
  }
  if (link.kind === 'weekly') {
    const care = data.face.weekly.find((c) => c.id === link.careId);
    if (!care) return { item, title: item.label, hidden: true, missing: true, done: false };
    const doneOn = care.log[startOfWeek(today)];
    return {
      item,
      title: item.label,
      subtitle: doneOn ? `Fait cette semaine (${formatRelative(doneOn, today).toLowerCase()})` : `${care.durationMin} min · recette et application dans Visage`,
      // Proposé seulement les jours prévus (le week-end).
      hidden: !care.days.includes(weekdayOf(today)),
      missing: false,
      done: !!doneOn,
    };
  }
  const goal = data.nutrition.water.goalMl;
  const ml = data.nutrition.water.log[today] ?? 0;
  return { item, title: item.label, subtitle: `${litres(ml)} sur ${litres(goal)}`, hidden: false, missing: false, done: goal > 0 && ml >= goal };
}

/** Liste « À faire aujourd'hui » : les actions concrètes de la journée, à cocher. */
export function ChecklistCard({ delay }: { delay: number }) {
  const data = useData();
  const update = useUpdate();
  const today = useToday();
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);

  const rows = data.checklist.map((item) => resolve(data, item, today));
  const visible = rows.filter((r) => !r.hidden);
  const doneCount = visible.filter((r) => r.done).length;

  const toggle = (r: Resolved, v: boolean) => {
    const link = r.item.link;
    update((d) => {
      if (link.kind === 'habit') toggleHabit(d, today, link.habitId, v);
      else if (link.kind === 'face') toggleFaceStep(d, today, link.stepId, v);
      else if (link.kind === 'faceTraining') toggleFaceTraining(d, today, link.slot, v);
      else if (link.kind === 'weekly') toggleWeekly(d, today, link.careId, v);
    });
  };

  return (
    <DashCard
      title="À faire aujourd’hui"
      icon={<ClipboardCheck />}
      meta={visible.length ? `${doneCount} sur ${visible.length} faites` : 'Rien de prévu'}
      delay={delay}
      actions={
        <>
          {editing && (
            <Button size="sm" variant="ghost" className="text-tint hover:text-tint" onClick={() => setAdding(true)}>
              <Plus /> <span className="max-sm:sr-only">Ajouter</span>
            </Button>
          )}
          <Button size="sm" variant={editing ? 'tint' : 'ghost'} onClick={() => setEditing((e) => !e)} aria-pressed={editing}>
            {editing ? <Check /> : <Pencil />}
            <span className="max-sm:sr-only">{editing ? 'Terminé' : 'Modifier'}</span>
          </Button>
        </>
      }
    >
      {editing ? (
        <EditList rows={rows} onAdd={() => setAdding(true)} />
      ) : visible.length === 0 ? (
        <div className="rounded-xl bg-surface-2 p-4 text-center text-sm text-ink-2">
          Aucune action pour aujourd’hui.{' '}
          <button type="button" className="font-medium text-accent" onClick={() => setAdding(true)}>
            Ajouter une action
          </button>
        </div>
      ) : (
        <ul className="-mx-2">
          {visible.map((r) =>
            r.item.link.kind === 'water' ? (
              <WaterRow key={r.item.id} r={r} parts={r.item.link.parts} />
            ) : (
              <li key={r.item.id} className="flex min-h-12 items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-ink/[0.03]">
                <Checkbox checked={r.done} onChange={(v) => toggle(r, v)} label={r.title} />
                <span className="text-lg leading-none">{r.item.emoji}</span>
                <button type="button" onClick={() => toggle(r, !r.done)} className="min-w-0 flex-1 text-left">
                  <span className={cx('block truncate text-[15px] font-medium', r.done && 'text-ink-3 line-through decoration-ink-3/50')}>
                    {r.title}
                  </span>
                  {r.subtitle && <span className="block truncate text-xs text-ink-3">{r.subtitle}</span>}
                </button>
              </li>
            ),
          )}
        </ul>
      )}
      <AddSheet open={adding} onClose={() => setAdding(false)} />
    </DashCard>
  );
}

/** L'eau : une case par part de la journée ; cocher remplit jusqu'à cette part. */
function WaterRow({ r, parts }: { r: Resolved; parts: string[] }) {
  const data = useData();
  const update = useUpdate();
  const today = useToday();
  const goal = data.nutrition.water.goalMl;
  const ml = data.nutrition.water.log[today] ?? 0;
  const n = Math.max(1, parts.length);
  const part = goal / n;
  return (
    <li className="rounded-xl px-2 py-2 hover:bg-ink/[0.03]">
      <div className="flex items-center gap-3">
        <span className="grid size-7 shrink-0 place-items-center text-lg leading-none">{r.item.emoji}</span>
        <div className="min-w-0 flex-1">
          <span className={cx('block truncate text-[15px] font-medium', r.done && 'text-ink-3 line-through decoration-ink-3/50')}>{r.title}</span>
          {r.subtitle && <span className="block truncate text-xs text-ink-3">{r.subtitle}</span>}
        </div>
      </div>
      <div className="mt-2 grid gap-1.5 pl-10 max-sm:pl-0" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
        {parts.map((label, i) => {
          const upTo = Math.round(part * (i + 1));
          const on = ml >= upTo - 1;
          return (
            <button
              key={`${label}-${i}`}
              type="button"
              aria-pressed={on}
              onClick={() => update((d) => setWater(d, today, on ? Math.min(ml, Math.round(part * i)) : Math.max(ml, upTo)))}
              className={cx(
                'flex min-w-0 flex-col items-center gap-1 rounded-xl border px-1 py-2 text-center text-xs transition-colors',
                on ? 'border-transparent bg-nutrition/15 text-ink' : 'border-line hover:bg-ink/[0.04]',
              )}
            >
              <span
                className={cx(
                  'grid size-4.5 shrink-0 place-items-center rounded-full border-2',
                  on ? 'border-nutrition bg-nutrition text-white' : 'border-ink/20',
                )}
              >
                {on && <Check className="size-3 animate-check" strokeWidth={3.5} />}
              </span>
              <span className="w-full min-w-0">
                <span className="block truncate font-medium">{label}</span>
                <span className="block text-[11px] text-ink-3 tabular">{litres(part)}</span>
              </span>
            </button>
          );
        })}
      </div>
    </li>
  );
}

function EditList({ rows, onAdd }: { rows: Resolved[]; onAdd: () => void }) {
  const update = useUpdate();
  const setLabel = (index: number, label: string) =>
    update((d) => {
      const item = d.checklist[index];
      item.label = label;
      // Pour une habitude, le libellé est son titre : on garde les deux identiques.
      if (item.link.kind === 'habit') {
        const id = item.link.habitId;
        const h = d.habits.items.find((x) => x.id === id);
        if (h) h.title = label;
      }
    });
  const setEmoji = (index: number, emoji: string) =>
    update((d) => {
      const item = d.checklist[index];
      item.emoji = emoji;
      if (item.link.kind === 'habit') {
        const id = item.link.habitId;
        const h = d.habits.items.find((x) => x.id === id);
        if (h) h.emoji = emoji;
      }
    });

  return (
    <div className="space-y-2">
      {rows.map((r, i) => (
        <div key={r.item.id} className="flex items-center gap-2 rounded-xl bg-surface-2 p-2">
          <input
            value={r.item.emoji}
            onChange={(e) => setEmoji(i, Array.from(e.target.value).slice(-2).join(''))}
            aria-label="Emoji"
            className="h-10 w-10 shrink-0 rounded-lg bg-surface text-center text-lg outline-none"
          />
          <div className="min-w-0 flex-1">
            <TextInput value={r.item.link.kind === 'habit' && !r.missing ? r.title : r.item.label} onChange={(e) => setLabel(i, e.target.value)} className="h-10 bg-surface" />
            <div className="mt-0.5 truncate px-1 text-[11px] text-ink-3">
              {r.missing
                ? 'Élément lié introuvable : il n’apparaît plus.'
                : r.item.link.kind === 'habit'
                  ? `Habitude · ${r.subtitle}`
                  : r.item.link.kind === 'face'
                    ? `Étape visage · ${r.subtitle}`
                    : r.item.link.kind === 'faceTraining'
                      ? 'Exercice visage · rotation réglable dans Sport'
                      : r.item.link.kind === 'weekly'
                        ? 'Soin de la semaine · affiché le week-end, recette dans Visage'
                        : 'Eau · objectif réglable dans Nutrition'}
            </div>
          </div>
          <ReorderButtons index={i} count={rows.length} onMove={(to) => update((d) => moveItem(d.checklist, i, to))} />
          <IconButton
            label="Retirer"
            size="icon-sm"
            className="text-danger hover:bg-danger/10 hover:text-danger"
            onClick={() =>
              removeWithUndo(`« ${r.title} » retiré de la liste`, (d) => {
                const link = d.checklist[i]?.link;
                d.checklist.splice(i, 1);
                // Une habitude créée depuis cette liste disparaît avec elle.
                if (link?.kind === 'habit' && link.owned) d.habits.items = d.habits.items.filter((h) => h.id !== link.habitId);
              })
            }
          >
            <Trash2 />
          </IconButton>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-ink/20 py-2.5 text-sm font-medium text-ink-2 hover:bg-ink/[0.03]"
      >
        <Plus className="size-4" /> Ajouter une action
      </button>
      <p className="px-1 text-xs text-ink-3">
        Une action cochée ici l’est aussi dans sa rubrique (habitude, routine visage, hydratation) et compte une seule fois.
      </p>
    </div>
  );
}

type Kind = 'action' | 'face' | 'water';

function AddSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const data = useData();
  const update = useUpdate();
  const [kind, setKind] = useState<Kind>('action');
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('✅');
  const [moment, setMoment] = useState<HabitMoment>('matin');
  const [days, setDays] = useState<Weekday[]>(ALL_DAYS);
  const [stepId, setStepId] = useState('');
  const hasWater = data.checklist.some((c) => c.link.kind === 'water');
  const steps = data.face.routines.flatMap((r) => r.steps.map((s) => ({ id: s.id, label: `${r.name} · ${s.title}`, title: s.title })));

  const reset = () => {
    setName('');
    setEmoji('✅');
    setKind('action');
    setStepId('');
    setDays(ALL_DAYS);
  };

  const add = () => {
    const label = name.trim();
    update((d) => {
      if (kind === 'action') {
        const habitId = uid('h');
        d.habits.items.push({ id: habitId, title: label || 'Nouvelle action', emoji, days, moment, note: '', archived: false });
        d.checklist.push({ id: uid('cl'), label: label || 'Nouvelle action', emoji, link: { kind: 'habit', habitId, owned: true } });
      } else if (kind === 'face') {
        const step = steps.find((s) => s.id === (stepId || steps[0]?.id));
        if (!step) return;
        d.checklist.push({ id: uid('cl'), label: label || step.title, emoji, link: { kind: 'face', stepId: step.id } });
      } else {
        const goal = d.nutrition.water.goalMl;
        d.checklist.push({
          id: uid('cl'),
          label: label || `${litres(goal)} d’eau à répartir dans la journée`,
          emoji: emoji === '✅' ? '💧' : emoji,
          link: { kind: 'water', parts: ['Matin', 'Après-midi', 'Soir'] },
        });
      }
    });
    toast('Action ajoutée à ta liste', { tone: 'success' });
    reset();
    onClose();
  };

  const kinds: { value: Kind; label: ReactNode }[] = [
    { value: 'action', label: 'Action' },
    { value: 'face', label: 'Routine visage' },
    ...(hasWater ? [] : [{ value: 'water' as Kind, label: 'Eau' }]),
  ];

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Ajouter une action"
      subtitle="Elle apparaîtra chaque jour prévu dans « À faire aujourd’hui »."
      icon={<Plus />}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button variant="primary" onClick={add} disabled={kind === 'action' && !name.trim()}>
            Ajouter
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Type">
          <Segmented options={kinds} value={kind} onChange={setKind} />
        </Field>
        <Field label="Nom" hint={kind === 'face' ? 'Laisse vide pour reprendre le nom de l’étape.' : undefined}>
          <TextInput
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={kind === 'action' ? 'Ex. Vitamine D au petit-déjeuner' : kind === 'face' ? 'Ex. Crème du soir' : 'Ex. 3 L d’eau'}
            autoFocus
          />
        </Field>
        <Field label="Emoji">
          <EmojiField value={emoji} onChange={setEmoji} suggestions={['💊', '🧴', '💧', '🦷', '🧘', '📖', '🍎', '☀️', '🌙']} />
        </Field>
        {kind === 'action' && (
          <>
            <Field label="Moment">
              <Segmented
                options={(Object.keys(MOMENT_LABEL) as HabitMoment[]).map((m) => ({ value: m, label: MOMENT_LABEL[m] }))}
                value={moment}
                onChange={setMoment}
                className="flex-wrap"
              />
            </Field>
            <Field label="Jours">
              <DayPicker value={days} onChange={setDays} />
            </Field>
            <p className="text-xs text-ink-3">L’action est aussi ajoutée à tes habitudes, pour son suivi et ses statistiques.</p>
          </>
        )}
        {kind === 'face' && (
          <Field label="Étape de ta routine">
            <Select value={stepId || steps[0]?.id} onChange={(e) => setStepId(e.target.value)}>
              {steps.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </Select>
          </Field>
        )}
        {kind === 'water' && (
          <p className="text-sm text-ink-2">
            Ton objectif ({litres(data.nutrition.water.goalMl)}) est réparti en trois cases : matin, après-midi, soir. Il se règle dans Nutrition.
          </p>
        )}
      </div>
    </Sheet>
  );
}
