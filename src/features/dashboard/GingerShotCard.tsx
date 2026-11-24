import { BookOpen, Citrus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button, Checkbox } from '@/components/ui';
import { toggleMeal } from '@/lib/actions';
import { useToday, weekdayOf } from '@/lib/dates';
import { useData, useUpdate } from '@/lib/store';
import { cx } from '@/lib/utils';
import { DashCard } from './DashCard';

/** Créneau « Citron-gingembre » de la nutrition : la case est la même que dans l'onglet Nutrition. */
export const GINGER_SLOT_ID = 's-lemon';

/** Accueil : le shot gingembre-citron du jour, avec une case à cocher. */
export function GingerShotCard({ delay }: { delay: number }) {
  const data = useData();
  const update = useUpdate();
  const today = useToday();
  const navigate = useNavigate();
  const meal = data.nutrition.plan[weekdayOf(today)]?.[GINGER_SLOT_ID];
  const done = !!data.nutrition.mealLog[today]?.[GINGER_SLOT_ID]?.done;
  // En shot, seule la dose de citron et de gingembre compte (l'eau est facultative).
  const ingredients = (meal?.items ?? []).filter((i) => !/^eau\b/i.test(i.name.trim()));
  const dose = ingredients.length
    ? ingredients.map((i) => [i.name, i.qty].filter(Boolean).join(' ')).join(' · ')
    : '½ citron pressé · 2 à 3 cm de gingembre frais';
  const recipeId = meal?.recipeId ?? 'r-gingembre';

  return (
    <DashCard module="nutrition" title="Shot gingembre-citron" icon={<Citrus />} to="/nutrition" meta={done ? 'Pris aujourd’hui' : 'Une fois par jour, idéalement le matin'} delay={delay}>
      <div
        className={cx(
          'flex items-center gap-3 rounded-2xl p-3 transition-colors',
          done ? 'bg-tint/10' : 'bg-surface-2',
        )}
      >
        <Checkbox size="lg" checked={done} onChange={(v) => update((d) => toggleMeal(d, today, GINGER_SLOT_ID, v))} label="Shot gingembre-citron pris" />
        <button type="button" onClick={() => update((d) => toggleMeal(d, today, GINGER_SLOT_ID, !done))} className="min-w-0 flex-1 text-left">
          <span className={cx('block text-[15px] font-semibold', done && 'text-ink-3 line-through decoration-ink-3/50')}>
            {done ? 'Shot pris aujourd’hui' : 'J’ai pris mon shot'}
          </span>
          <span className="block text-[13px] leading-snug text-ink-3">{dose}</span>
        </button>
        <span className="text-2xl leading-none" aria-hidden>
          🍋
        </span>
      </div>
      <Button size="sm" variant="ghost" className="mt-2 text-tint hover:text-tint" onClick={() => navigate(`/nutrition?tab=recipes&item=${recipeId}`)}>
        <BookOpen /> Voir la recette
      </Button>
    </DashCard>
  );
}
