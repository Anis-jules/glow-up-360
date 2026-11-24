import { ChevronRight, Droplets, GlassWater, Leaf, Minus, Pencil, Plus, Trash2, Utensils } from 'lucide-react';
import { useState } from 'react';
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
  ProgressRing,
  ReorderButtons,
  SectionHeader,
  Sheet,
  TextInput,
} from '@/components/ui';
import { weekdayOf } from '@/lib/dates';
import { removeWithUndo, toast } from '@/lib/feedback';
import { useData, useUpdate } from '@/lib/store';
import type { DateKey, ID, Weekday } from '@/lib/types';
import { cx, moveItem } from '@/lib/utils';
import { ensureMealLog, formatMl, isMealEmpty } from './helpers';
import { MealEditorSheet, MealLogSheet } from './MealSheets';
import { ProgramCard } from './ProgramCard';

export function TodayTab({ today, onOpenRecipe }: { today: DateKey; onOpenRecipe: (id: ID) => void }) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
      <ProgramCard today={today} className="xl:col-span-5" />
      <HydrationCard today={today} onOpenRecipe={onOpenRecipe} className="xl:col-span-2" />
      <MealsCard today={today} onOpenRecipe={onOpenRecipe} className="xl:col-span-3" />
      <PrinciplesCard className="xl:col-span-5" />
    </div>
  );
}

// ───────────────────────── Hydratation

function HydrationCard({ today, onOpenRecipe, className }: { today: DateKey; onOpenRecipe: (id: ID) => void; className?: string }) {
  const data = useData();
  const update = useUpdate();
  const { water, recipes } = data.nutrition;
  const ml = water.log[today] ?? 0;
  const goal = water.goalMl;
  const glass = Math.max(50, water.glassMl);
  const frac = goal > 0 ? ml / goal : 0;
  const glassCount = Math.min(12, Math.max(1, Math.ceil(goal / glass)));
  const filled = Math.floor(ml / glass);
  const [settings, setSettings] = useState(false);
  const [custom, setCustom] = useState(false);
  const [amount, setAmount] = useState(200);
  const ginger = recipes.find((r) => r.id === 'r-gingembre');

  const setMl = (v: number) => update((d) => void (d.nutrition.water.log[today] = Math.max(0, Math.round(v))));
  const add = (delta: number) => {
    const before = ml;
    setMl(ml + delta);
    if (delta > 0 && goal > 0 && before < goal && before + delta >= goal) toast('Objectif d’hydratation atteint, bravo.', { tone: 'success' });
  };

  return (
    <Card className={cx('animate-rise', className)}>
      <SectionHeader
        icon={<Droplets />}
        title="Hydratation"
        subtitle={`Objectif ${formatMl(goal)} · verre de ${glass} ml`}
        onToggleEdit={() => setSettings(true)}
      />
      <div className="flex items-center gap-5">
        <ProgressRing value={frac} size={124} stroke={11}>
          <div>
            <div className="font-display text-[26px] leading-none font-semibold tabular">{ml >= 1000 ? (ml / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) : ml}</div>
            <div className="mt-1 text-xs text-ink-3">{ml >= 1000 ? 'litres' : 'ml'} sur {formatMl(goal)}</div>
          </div>
        </ProgressRing>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-1" aria-label={`${filled} verres sur ${glassCount}`}>
            {Array.from({ length: glassCount }, (_, i) => (
              <button
                key={i}
                type="button"
                title={`${(i + 1) * glass} ml`}
                aria-label={`Régler à ${i + 1} verre${i ? 's' : ''}`}
                onClick={() => setMl(i + 1 === filled ? i * glass : (i + 1) * glass)}
                className="grid size-8 place-items-center rounded-lg transition-transform hover:bg-tint/10 active:scale-90"
              >
                <GlassWater className={cx('size-5 transition-colors', i < filled ? 'text-tint' : 'text-ink/20')} />
              </button>
            ))}
          </div>
          <p className="mt-2 text-[13px] text-ink-2">
            {frac >= 1 ? 'Objectif atteint, bravo.' : `Encore ${formatMl(Math.max(0, goal - ml))} pour ton objectif.`}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <IconButton label={`Retirer un verre (${glass} ml)`} variant="secondary" onClick={() => add(-glass)} disabled={ml <= 0}>
          <Minus />
        </IconButton>
        <Button variant="tint" onClick={() => add(glass)} className="flex-1">
          <Plus /> 1 verre · {glass} ml
        </Button>
        <Button variant="secondary" onClick={() => setCustom((v) => !v)} aria-expanded={custom}>
          Autre
        </Button>
      </div>
      {custom && (
        <div className="mt-3 flex animate-fade-in items-center gap-2">
          <NumberField value={amount} onChange={setAmount} min={10} max={2000} step={50} suffix="ml" className="flex-1" ariaLabel="Quantité en ml" />
          <Button
            variant="tint"
            onClick={() => {
              add(amount);
              setCustom(false);
            }}
          >
            Ajouter
          </Button>
        </div>
      )}
      {ginger && (
        <button
          type="button"
          onClick={() => onOpenRecipe(ginger.id)}
          className="mt-4 flex w-full items-center gap-3 rounded-xl bg-surface-2 px-3 py-2.5 text-left text-[13px] text-ink-2 transition-colors hover:bg-ink/[0.06]"
        >
          <span className="text-lg">{ginger.emoji}</span>
          <span className="min-w-0 flex-1">Idée : une {ginger.title.toLowerCase()} compte aussi dans ton hydratation.</span>
          <ChevronRight className="size-4 shrink-0 text-ink-3" />
        </button>
      )}

      <Sheet open={settings} onClose={() => setSettings(false)} icon={<Droplets />} title="Réglages d’hydratation" size="sm"
        footer={<Button variant="primary" onClick={() => setSettings(false)}>Fermer</Button>}>
        <div className="space-y-4">
          <Field label="Objectif quotidien">
            <NumberField
              value={goal}
              onChange={(v) => update((d) => void (d.nutrition.water.goalMl = v))}
              min={250}
              max={5000}
              step={250}
              suffix="ml"
            />
          </Field>
          <Field label="Taille d’un verre">
            <NumberField
              value={water.glassMl}
              onChange={(v) => update((d) => void (d.nutrition.water.glassMl = v))}
              min={50}
              max={1000}
              step={50}
              suffix="ml"
            />
          </Field>
          <Field label="Quantité bue aujourd’hui" hint="Pour corriger une erreur de saisie.">
            <NumberField value={ml} onChange={setMl} min={0} max={10000} step={50} suffix="ml" />
          </Field>
          <p className="rounded-xl bg-surface-2 p-3 text-[13px] leading-relaxed text-ink-2">
            Repère courant : environ 1,5 L d’eau par jour, davantage quand il fait chaud ou après le sport. Les infusions et la boisson
            gingembre-citron comptent. Ajuste l’objectif à tes besoins.
          </p>
        </div>
      </Sheet>
    </Card>
  );
}

// ───────────────────────── Repas du jour

function MealsCard({ today, onOpenRecipe, className }: { today: DateKey; onOpenRecipe: (id: ID) => void; className?: string }) {
  const data = useData();
  const update = useUpdate();
  const { slots, plan, mealLog, recipes } = data.nutrition;
  const wd = weekdayOf(today);
  const dayLog = mealLog[today] ?? {};
  const doneCount = slots.filter((s) => dayLog[s.id]?.done).length;
  const [editing, setEditing] = useState(false);
  const [logSlot, setLogSlot] = useState<ID | null>(null);
  const [editTarget, setEditTarget] = useState<{ wd: Weekday; slot: ID } | null>(null);

  return (
    <Card className={cx('animate-rise [animation-delay:60ms]', className)}>
      <SectionHeader
        icon={<Utensils />}
        title="Repas du jour"
        subtitle={slots.length ? `${doneCount} sur ${slots.length} suivis` : 'Aucun créneau'}
        editing={editing}
        onToggleEdit={() => setEditing((v) => !v)}
      />
      {slots.length > 0 && <ProgressBar value={slots.length ? doneCount / slots.length : 0} height={6} className="mb-2" />}
      {slots.length === 0 ? (
        <EmptyState icon={<Utensils />} title="Aucun créneau de repas">
          Ajoute tes créneaux dans l’onglet Planning.
        </EmptyState>
      ) : (
        <div className="-mx-2">
          {slots.map((slot) => {
            const meal = plan[wd]?.[slot.id];
            const log = dayLog[slot.id];
            const recipe = meal?.recipeId ? recipes.find((r) => r.id === meal.recipeId) : undefined;
            const empty = isMealEmpty(meal);
            return (
              <CheckRow
                key={slot.id}
                checked={!!log?.done}
                onToggle={(v) => update((d) => void (ensureMealLog(d, today, slot.id).done = v))}
                leading={<span className="grid size-9 shrink-0 place-items-center rounded-xl bg-tint/10 text-lg">{slot.emoji}</span>}
                title={empty ? 'Rien de prévu' : meal!.title || 'Repas sans nom'}
                muted={empty}
                subtitle={`${slot.name} · ${slot.time}${!empty && meal?.kcal ? ` · ≈ ${meal.kcal} kcal · ${meal.protein ?? 0} g prot.` : ''}${log?.actual ? ' · noté' : ''}`}
                onOpen={() => (editing ? setEditTarget({ wd, slot: slot.id }) : setLogSlot(slot.id))}
                trailing={
                  editing ? (
                    <IconButton label="Modifier le repas prévu" size="icon-sm" onClick={() => setEditTarget({ wd, slot: slot.id })}>
                      <Pencil />
                    </IconButton>
                  ) : (
                    <div className="flex shrink-0 items-center gap-1">
                      {recipe && <Chip className="max-sm:hidden">Recette</Chip>}
                      <ChevronRight className="size-4 text-ink-3" />
                    </div>
                  )
                }
              />
            );
          })}
        </div>
      )}
      {editing && (
        <p className="mt-2 text-[13px] text-ink-3">
          Touche un repas pour modifier ce qui est prévu chaque jour de la semaine identique. Les créneaux se gèrent dans Planning.
        </p>
      )}

      <MealLogSheet
        open={!!logSlot}
        onClose={() => setLogSlot(null)}
        dateKey={today}
        slotId={logSlot}
        onOpenRecipe={onOpenRecipe}
        onEditPlan={(w, s) => {
          setLogSlot(null);
          setEditTarget({ wd: w, slot: s });
        }}
      />
      <MealEditorSheet
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        weekday={editTarget?.wd ?? wd}
        slotId={editTarget?.slot ?? null}
        onOpenRecipe={onOpenRecipe}
      />
    </Card>
  );
}

// ───────────────────────── Repères

function PrinciplesCard({ className }: { className?: string }) {
  const principles = useData().nutrition.principles;
  const update = useUpdate();
  const [editing, setEditing] = useState(false);
  const [focusLast, setFocusLast] = useState(false);

  return (
    <Card className={cx('animate-rise [animation-delay:120ms]', className)}>
      <SectionHeader
        icon={<Leaf />}
        title="Mes repères"
        subtitle="Une alimentation variée, sans interdit"
        editing={editing}
        onToggleEdit={() => setEditing((v) => !v)}
        onAdd={() => {
          setEditing(true);
          setFocusLast(true);
          update((d) => void d.nutrition.principles.push(''));
        }}
      />
      {principles.length === 0 && !editing ? (
        <p className="text-sm text-ink-3">Aucun repère pour l’instant.</p>
      ) : editing ? (
        <div className="space-y-2">
          {principles.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <TextInput
                value={p}
                autoFocus={focusLast && i === principles.length - 1}
                placeholder="Un repère qui te parle"
                onChange={(e) => update((d) => void (d.nutrition.principles[i] = e.target.value))}
              />
              <ReorderButtons index={i} count={principles.length} onMove={(to) => update((d) => moveItem(d.nutrition.principles, i, to))} />
              <IconButton
                label="Supprimer"
                size="icon-sm"
                className="text-ink-3 hover:text-danger"
                onClick={() => removeWithUndo('Repère supprimé', (d) => void d.nutrition.principles.splice(i, 1))}
              >
                <Trash2 />
              </IconButton>
            </div>
          ))}
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
          {principles
            .filter((p) => p.trim())
            .map((p, i) => (
              <li key={i} className="flex gap-2.5 text-[14px] leading-snug text-ink-2">
                <Leaf className="mt-0.5 size-4 shrink-0 text-tint" />
                <span>{p}</span>
              </li>
            ))}
        </ul>
      )}
    </Card>
  );
}
