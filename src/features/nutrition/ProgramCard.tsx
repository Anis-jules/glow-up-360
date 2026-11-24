import { ChevronDown, Flame, Pencil, Target } from 'lucide-react';
import { useState } from 'react';
import { Button, Card, Field, NumberField, ProgressBar, Sheet, TextArea, TextInput } from '@/components/ui';
import { weekdayOf } from '@/lib/dates';
import { useData, useUpdate } from '@/lib/store';
import type { AppData, DateKey, NutritionProgram } from '@/lib/types';
import { cx } from '@/lib/utils';

const fmt = (n: number) => Math.round(n).toLocaleString('fr-FR');

/** Repères du jour : ce qui est prévu et ce qui est déjà mangé (d'après les repas cochés). */
export function dayTotals(data: AppData, key: DateKey) {
  const { slots, plan, mealLog } = data.nutrition;
  const day = plan[weekdayOf(key)] ?? {};
  const log = mealLog[key] ?? {};
  let plannedKcal = 0;
  let plannedProtein = 0;
  let eatenKcal = 0;
  let eatenProtein = 0;
  for (const s of slots) {
    const m = day[s.id];
    if (!m) continue;
    plannedKcal += m.kcal ?? 0;
    plannedProtein += m.protein ?? 0;
    if (log[s.id]?.done) {
      eatenKcal += m.kcal ?? 0;
      eatenProtein += m.protein ?? 0;
    }
  }
  return { plannedKcal, plannedProtein, eatenKcal, eatenProtein };
}

export function ProgramCard({ today, className }: { today: DateKey; className?: string }) {
  const data = useData();
  const p = data.nutrition.program;
  const t = dayTotals(data, today);
  const [editing, setEditing] = useState(false);
  const [showTips, setShowTips] = useState(false);

  return (
    <Card className={cx('animate-rise', className)}>
      <div className="flex items-start gap-3">
        <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-tint/12 text-tint">
          <Target className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] leading-tight font-semibold">{p.title}</h2>
          <p className="mt-0.5 text-[13px] text-ink-3">
            {p.profile || 'Ajoute ton profil (taille, poids, activité) avec « Modifier » : il reste sur cet appareil.'}
          </p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
          <Pencil /> <span className="max-sm:sr-only">Modifier</span>
        </Button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Target_ label="Calories" value={`≈ ${fmt(p.kcal)}`} unit="kcal / jour" />
        <Target_ label="Protéines" value={fmt(p.protein)} unit="g / jour" />
        <Target_ label="Lipides" value={fmt(p.fat)} unit="g / jour" />
        <Target_ label="Glucides" value={fmt(p.carbs)} unit="g / jour" />
      </div>

      <div className="mt-4 space-y-3">
        <Gauge label="Protéines mangées" value={t.eatenProtein} target={p.protein} unit="g" planned={t.plannedProtein} />
        <Gauge label="Calories mangées" value={t.eatenKcal} target={p.kcal} unit="kcal" planned={t.plannedKcal} />
        <p className="text-xs text-ink-3">
          Calculé d’après les repas cochés dans « Repas du jour », avec les valeurs prévues de chaque repas (estimations).
        </p>
      </div>

      <p className="mt-4 rounded-xl bg-surface-2 p-3 text-[13px] leading-relaxed text-ink-2">
        <Flame className="mr-1.5 inline size-4 text-tint" />
        {p.goal}
      </p>

      {p.tips.length > 0 && (
        <div className="mt-3">
          <button type="button" onClick={() => setShowTips((v) => !v)} className="flex w-full items-center gap-2 py-1 text-left text-sm font-medium text-ink-2 hover:text-ink">
            <ChevronDown className={cx('size-4 transition-transform', showTips && 'rotate-180')} />
            Les repères du programme ({p.tips.length})
          </button>
          {showTips && (
            <ul className="mt-2 space-y-2">
              {p.tips.map((tip, i) => (
                <li key={i} className="flex gap-2.5 text-[13px] leading-relaxed text-ink-2">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-tint" />
                  <span className="min-w-0">{tip}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <ProgramSheet open={editing} onClose={() => setEditing(false)} />
    </Card>
  );
}

function Target_({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div className="rounded-xl bg-surface-2 px-3 py-2.5">
      <div className="text-[11px] font-medium tracking-wide text-ink-3 uppercase">{label}</div>
      <div className="font-display text-lg font-semibold tabular">{value}</div>
      <div className="text-[11px] text-ink-3">{unit}</div>
    </div>
  );
}

function Gauge({ label, value, target, unit, planned }: { label: string; value: number; target: number; unit: string; planned: number }) {
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between gap-2 text-[13px]">
        <span className="font-medium">{label}</span>
        <span className="text-ink-3 tabular">
          {fmt(value)} / {fmt(target)} {unit}
          <span className="max-sm:hidden"> · prévu {fmt(planned)}</span>
        </span>
      </div>
      <ProgressBar value={target ? value / target : 0} height={7} />
    </div>
  );
}

function ProgramSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const data = useData();
  const update = useUpdate();
  const p = data.nutrition.program;
  const set = <K extends keyof NutritionProgram>(key: K, value: NutritionProgram[K]) => update((d) => void (d.nutrition.program[key] = value));
  return (
    <Sheet open={open} onClose={onClose} size="lg" title="Mon programme" subtitle="Repères indicatifs, à ajuster selon tes résultats." icon={<Target />} footer={<Button variant="primary" onClick={onClose}>Terminé</Button>}>
      <div className="space-y-4">
        <Field label="Nom du programme">
          <TextInput value={p.title} onChange={(e) => set('title', e.target.value)} />
        </Field>
        <Field label="Profil" hint="Taille, poids, activité… Enregistré seulement sur cet appareil.">
          <TextInput value={p.profile} placeholder="Ex. Homme · 1,80 m · 80 kg · sport 4 fois par semaine" onChange={(e) => set('profile', e.target.value)} />
        </Field>
        <Field label="Objectif">
          <TextArea minRows={2} value={p.goal} onChange={(e) => set('goal', e.target.value)} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Calories (kcal)">
            <NumberField value={p.kcal} min={1200} max={5000} step={50} onChange={(v) => set('kcal', v)} />
          </Field>
          <Field label="Protéines (g)">
            <NumberField value={p.protein} min={40} max={300} step={5} onChange={(v) => set('protein', v)} />
          </Field>
          <Field label="Lipides (g)">
            <NumberField value={p.fat} min={20} max={200} step={5} onChange={(v) => set('fat', v)} />
          </Field>
          <Field label="Glucides (g)">
            <NumberField value={p.carbs} min={0} max={600} step={5} onChange={(v) => set('carbs', v)} />
          </Field>
        </div>
        <Field label="Repères" hint="Un repère par ligne.">
          <TextArea minRows={6} value={p.tips.join('\n')} onChange={(e) => set('tips', e.target.value.split('\n'))} />
        </Field>
      </div>
    </Sheet>
  );
}
