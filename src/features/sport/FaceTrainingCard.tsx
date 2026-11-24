import { Check, ExternalLink, Moon, Pencil, Plus, RotateCcw, Settings2, Smile, Sun, Trash2, Undo2 } from 'lucide-react';
import { useState } from 'react';
import {
  Button,
  Card,
  Checkbox,
  Chip,
  DurationField,
  Field,
  IconButton,
  ReorderButtons,
  SectionHeader,
  SequenceTimer,
  Sheet,
  TextArea,
  TextInput,
  Toggle,
} from '@/components/ui';
import { toggleFaceTraining } from '@/lib/actions';
import { addDays, formatDuration, formatShort, WEEKDAYS_SHORT, weekdayOf } from '@/lib/dates';
import { confirm, removeWithUndo, toast } from '@/lib/feedback';
import { getFaceExercisesForDate } from '@/lib/progress';
import { useData, useUpdate } from '@/lib/store';
import type { DateKey, FaceExercise, FaceSlot } from '@/lib/types';
import { cx, moveItem, uid } from '@/lib/utils';

const SLOT_LABEL: Record<FaceSlot, string> = { matin: 'Matin', soir: 'Soir' };

/** N'ouvre que des liens web (http / https). */
function safeUrl(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(v) ? v : `https://${v}`);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : null;
  } catch {
    return null;
  }
}

/** Exercices du visage : un le matin, un le soir, en rotation sur les exercices de la liste. */
export function FaceTrainingCard({ today }: { today: DateKey }) {
  const data = useData();
  const update = useUpdate();
  const ft = data.sport.faceTraining;
  const plan = getFaceExercisesForDate(data.sport, today);
  const tomorrow = getFaceExercisesForDate(data.sport, addDays(today, 1));
  const done = new Set(ft.log[today] ?? []);
  const [open, setOpen] = useState<FaceSlot | null>(null);
  const [managing, setManaging] = useState(false);

  return (
    <Card padding="md" className="animate-rise" style={{ animationDelay: '90ms' }}>
      <SectionHeader
        title="Exercices du visage"
        subtitle={ft.exercises.length ? `Un le matin, un le soir · rotation de ${ft.exercises.length} exercice${ft.exercises.length > 1 ? 's' : ''}` : 'Aucun exercice'}
        icon={<Smile />}
        extra={
          <Button size="sm" variant="ghost" onClick={() => setManaging(true)}>
            <Settings2 /> <span className="max-sm:sr-only">Gérer</span>
          </Button>
        }
      />

      {!ft.enabled || !plan ? (
        <div className="rounded-xl bg-surface-2 p-4 text-center text-sm text-ink-2">
          {ft.enabled ? 'Ajoute au moins un exercice pour lancer la rotation.' : 'Les exercices du visage sont en pause.'}{' '}
          <button type="button" className="font-medium text-tint" onClick={() => setManaging(true)}>
            {ft.enabled ? 'Ajouter' : 'Réactiver'}
          </button>
        </div>
      ) : (
        <>
          <div className="-mx-2 divide-y divide-line">
            {(['matin', 'soir'] as FaceSlot[]).map((slot) => {
              const ex = plan[slot];
              const Icon = slot === 'matin' ? Sun : Moon;
              return (
                <div key={slot} className="flex min-h-14 items-center gap-3 rounded-xl px-2 py-2 hover:bg-ink/[0.03]">
                  <Checkbox
                    checked={done.has(slot)}
                    onChange={(v) => update((d) => toggleFaceTraining(d, today, slot, v))}
                    label={`${SLOT_LABEL[slot]} : ${ex.name}`}
                  />
                  <button type="button" onClick={() => setOpen(slot)} className="min-w-0 flex-1 text-left">
                    <span className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-ink-3 uppercase">
                      <Icon className="size-3.5" /> {SLOT_LABEL[slot]}
                    </span>
                    <span className={cx('block truncate text-[15px] font-medium', done.has(slot) && 'text-ink-3 line-through decoration-ink-3/50')}>
                      {ex.name}
                    </span>
                    <span className="block truncate text-[13px] text-ink-3">
                      {[ex.author, ex.durationSec ? formatDuration(ex.durationSec) : ''].filter(Boolean).join(' · ')}
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
          {tomorrow && (
            <p className="mt-2 px-1 text-xs text-ink-3">
              Demain : matin {tomorrow.matin.name}, soir {tomorrow.soir.name}.
            </p>
          )}
        </>
      )}

      <FaceExerciseSheet
        slot={open}
        exercise={open && plan ? plan[open] : null}
        done={!!open && done.has(open)}
        onToggle={(v) => open && update((d) => toggleFaceTraining(d, today, open, v))}
        onClose={() => setOpen(null)}
      />
      <ManageSheet open={managing} onClose={() => setManaging(false)} today={today} />
    </Card>
  );
}

function FaceExerciseSheet({
  slot,
  exercise,
  done,
  onToggle,
  onClose,
}: {
  slot: FaceSlot | null;
  exercise: FaceExercise | null;
  done: boolean;
  onToggle: (v: boolean) => void;
  onClose: () => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const url = exercise ? safeUrl(exercise.link) : null;
  return (
    <>
      <Sheet
        open={!!exercise && !editing}
        onClose={onClose}
        size="lg"
        title={exercise?.name}
        subtitle={slot ? `Exercice du ${slot}` : undefined}
        icon={slot === 'soir' ? <Moon /> : <Sun />}
        footer={
          exercise && (
            <>
              <Button variant="ghost" className="mr-auto" onClick={() => setEditing(exercise.id)}>
                <Pencil /> Modifier
              </Button>
              {done ? (
                <Button variant="secondary" onClick={() => onToggle(false)}>
                  <Undo2 /> Annuler la validation
                </Button>
              ) : (
                <Button
                  variant="tint"
                  size="lg"
                  onClick={() => {
                    onToggle(true);
                    toast(`${exercise.name} validé`, { tone: 'success' });
                    onClose();
                  }}
                >
                  <Check /> Valider
                </Button>
              )}
            </>
          )
        }
      >
        {exercise && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {exercise.author && <Chip tone="tint">{exercise.author}</Chip>}
              {exercise.durationSec > 0 && <Chip>{formatDuration(exercise.durationSec)}</Chip>}
              {done && (
                <Chip tone="success">
                  <Check /> Fait
                </Chip>
              )}
            </div>
            <div>
              <h3 className="mb-1.5 text-[13px] font-semibold tracking-wide text-ink-3 uppercase">Comment faire</h3>
              <p className="text-[15px] leading-relaxed whitespace-pre-line text-ink-2">{exercise.instructions || 'Pas encore de description.'}</p>
            </div>
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-xl border border-line py-3 text-sm font-medium text-tint hover:bg-tint/8"
              >
                <ExternalLink className="size-4" /> Ouvrir la vidéo de référence
              </a>
            ) : (
              <p className="rounded-xl bg-surface-2 p-3 text-[13px] text-ink-2">
                Astuce : ajoute le lien de la vidéo avec « Modifier » pour la retrouver en un geste.
              </p>
            )}
            {exercise.durationSec > 0 && <SequenceTimer phases={[{ label: exercise.name, seconds: exercise.durationSec, tone: 'work' }]} finishLabel="Terminé" />}
            <p className="text-xs leading-relaxed text-ink-3">
              Mouvements doux et contrôlés. Ces exercices tonifient et détendent ; ils ne changent pas la structure osseuse ni ne font fondre la graisse
              d’une zone. Évite de forcer sur la mâchoire : douleur ou claquement, arrête.
            </p>
          </div>
        )}
      </Sheet>
      <FaceExerciseEditor id={editing} onClose={() => setEditing(null)} />
    </>
  );
}

function FaceExerciseEditor({ id, onClose }: { id: string | null; onClose: () => void }) {
  const data = useData();
  const update = useUpdate();
  const ex = id ? data.sport.faceTraining.exercises.find((e) => e.id === id) : undefined;
  const set = <K extends keyof FaceExercise>(key: K, value: FaceExercise[K]) =>
    update((d) => {
      const e = d.sport.faceTraining.exercises.find((x) => x.id === id);
      if (e) e[key] = value;
    });
  return (
    <Sheet open={!!ex} onClose={onClose} size="lg" title={ex?.name || 'Exercice'} subtitle="Chaque modification est enregistrée." icon={<Pencil />} footer={<Button variant="tint" onClick={onClose}>Terminé</Button>}>
      {ex && (
        <div className="space-y-4">
          <Field label="Nom">
            <TextInput value={ex.name} onChange={(e) => set('name', e.target.value)} />
          </Field>
          <Field label="Créateur ou source">
            <TextInput value={ex.author} onChange={(e) => set('author', e.target.value)} placeholder="Ex. compte Instagram, chaîne…" />
          </Field>
          <Field label="Lien de la vidéo" hint="Instagram, TikTok, YouTube… s’ouvre dans un nouvel onglet.">
            <TextInput type="url" inputMode="url" value={ex.link} onChange={(e) => set('link', e.target.value)} placeholder="https://…" />
          </Field>
          <Field label="Durée">
            <DurationField value={ex.durationSec} onChange={(v) => set('durationSec', v)} />
          </Field>
          <Field label="Comment faire">
            <TextArea value={ex.instructions} minRows={5} onChange={(e) => set('instructions', e.target.value)} placeholder="Position, mouvement, nombre de répétitions…" />
          </Field>
        </div>
      )}
    </Sheet>
  );
}

function ManageSheet({ open, onClose, today }: { open: boolean; onClose: () => void; today: DateKey }) {
  const data = useData();
  const update = useUpdate();
  const ft = data.sport.faceTraining;
  const [editing, setEditing] = useState<string | null>(null);
  const preview = [0, 1, 2].map((i) => ({ key: addDays(today, i), plan: getFaceExercisesForDate(data.sport, addDays(today, i)) }));

  return (
    <>
      <Sheet
        open={open && !editing}
        onClose={onClose}
        size="lg"
        title="Exercices du visage"
        subtitle="Un exercice le matin, un le soir, en suivant l’ordre de la liste."
        icon={<Smile />}
        footer={<Button variant="tint" onClick={onClose}>Terminé</Button>}
      >
        <div className="space-y-5">
          <div className="rounded-2xl border border-line px-4">
            <Toggle
              className="py-3"
              label="Exercices du visage chaque jour"
              description="Comptent dans ta progression, avec le sport."
              checked={ft.enabled}
              onChange={(v) => update((d) => void (d.sport.faceTraining.enabled = v))}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[13px] font-semibold tracking-wide text-ink-3 uppercase">Ordre de rotation</h3>
              <Button
                size="sm"
                variant="ghost"
                className="text-tint hover:text-tint"
                onClick={() => {
                  const id = uid('fx');
                  update((d) => void d.sport.faceTraining.exercises.push({ id, name: 'Nouvel exercice', author: '', instructions: '', durationSec: 120, link: '' }));
                  setEditing(id);
                }}
              >
                <Plus /> Ajouter
              </Button>
            </div>
            <div className="space-y-1.5">
              {ft.exercises.map((ex, i) => (
                <div key={ex.id} className="flex items-center gap-2 rounded-xl bg-surface-2 p-2 pl-3">
                  <span className="grid size-6 shrink-0 place-items-center rounded-md bg-surface text-[11px] font-semibold text-ink-3 tabular">{i + 1}</span>
                  <button type="button" onClick={() => setEditing(ex.id)} className="min-w-0 flex-1 text-left">
                    <span className="block truncate text-[15px] font-medium">{ex.name}</span>
                    <span className="block truncate text-xs text-ink-3">{[ex.author, ex.link ? 'vidéo liée' : 'sans lien'].filter(Boolean).join(' · ')}</span>
                  </button>
                  <ReorderButtons index={i} count={ft.exercises.length} onMove={(to) => update((d) => moveItem(d.sport.faceTraining.exercises, i, to))} />
                  <IconButton
                    label="Supprimer"
                    size="icon-sm"
                    className="text-danger hover:bg-danger/10 hover:text-danger"
                    onClick={() => removeWithUndo(`« ${ex.name} » supprimé`, (d) => void d.sport.faceTraining.exercises.splice(i, 1))}
                  >
                    <Trash2 />
                  </IconButton>
                </div>
              ))}
            </div>
          </div>

          {ft.enabled && preview[0].plan && (
            <div className="rounded-2xl bg-surface-2 p-4">
              <h3 className="mb-2 text-sm font-semibold">Les 3 prochains jours</h3>
              <ul className="space-y-1.5 text-[13px]">
                {preview.map(({ key, plan }) => (
                  <li key={key} className="flex gap-2">
                    <span className="w-16 shrink-0 font-medium text-ink-2">
                      {WEEKDAYS_SHORT[weekdayOf(key)]} {formatShort(key).replace('.', '')}
                    </span>
                    <span className="min-w-0 text-ink-3">
                      <Sun className="mr-1 inline size-3.5" />
                      {plan?.matin.name} · <Moon className="mr-1 inline size-3.5" />
                      {plan?.soir.name}
                    </span>
                  </li>
                ))}
              </ul>
              <Button
                size="sm"
                variant="ghost"
                className="mt-3"
                onClick={async () => {
                  const ok = await confirm({ title: 'Recommencer la rotation aujourd’hui ?', message: 'Ce matin : le 1er exercice de la liste, ce soir : le 2e.', confirmLabel: 'Recommencer' });
                  if (ok) update((d) => void (d.sport.faceTraining.startDate = today));
                }}
              >
                <RotateCcw /> Recommencer la rotation aujourd’hui
              </Button>
            </div>
          )}

          <p className="text-xs leading-relaxed text-ink-3">
            Ces exercices tonifient et détendent les muscles du visage ; ils ne changent pas la structure osseuse et ne font pas fondre la
            graisse d’une zone. Évite les exercices de mâchoire trop intenses.
          </p>
        </div>
      </Sheet>
      <FaceExerciseEditor id={editing} onClose={() => setEditing(null)} />
    </>
  );
}
