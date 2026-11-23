import { Apple, CalendarDays, ChefHat, Salad, ShoppingCart, Sun } from 'lucide-react';
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/layout/PageHeader';
import { ModuleScope, Tabs } from '@/components/ui';
import { capitalize, formatLong, useToday } from '@/lib/dates';
import { useItemParam, useTab } from '@/lib/nav';
import { useData } from '@/lib/store';
import type { ID } from '@/lib/types';
import { FoodsTab } from './FoodsTab';
import { PlanTab } from './PlanTab';
import { RecipesTab } from './RecipesTab';
import { ShoppingTab } from './ShoppingTab';
import { TodayTab } from './TodayTab';

const TABS = ['today', 'plan', 'recipes', 'foods', 'shopping'] as const;
type Tab = (typeof TABS)[number];

export default function NutritionPage() {
  const today = useToday();
  const [tab, setTab] = useTab<Tab>(TABS, 'today');
  const [item, setItem] = useItemParam();
  const [, setParams] = useSearchParams();
  const nutrition = useData().nutrition;
  const toBuy = nutrition.shopping.filter((i) => !i.checked).length;

  /** Ouvre une recette depuis n'importe quel onglet (?tab=recipes&item=…). */
  const openRecipe = useCallback(
    (id: ID) =>
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        next.set('tab', 'recipes');
        next.set('item', id);
        return next;
      }),
    [setParams],
  );

  return (
    <ModuleScope module="nutrition">
      <PageHeader
        icon={<Salad />}
        eyebrow={capitalize(formatLong(today))}
        title="Nutrition"
        subtitle="Bien manger, varié et sans se priver."
      />
      <Tabs<Tab>
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'today', label: 'Aujourd’hui', icon: <Sun /> },
          { id: 'plan', label: 'Planning', icon: <CalendarDays /> },
          { id: 'recipes', label: 'Recettes', icon: <ChefHat />, count: nutrition.recipes.length },
          { id: 'foods', label: 'Aliments', icon: <Apple /> },
          { id: 'shopping', label: 'Courses', icon: <ShoppingCart />, count: toBuy || undefined },
        ]}
      />
      <div key={tab} className="mt-5 animate-fade-in">
        {tab === 'today' && <TodayTab today={today} onOpenRecipe={openRecipe} />}
        {tab === 'plan' && <PlanTab today={today} onOpenRecipe={openRecipe} />}
        {tab === 'recipes' && <RecipesTab today={today} openId={item} setOpenId={setItem} />}
        {tab === 'foods' && <FoodsTab />}
        {tab === 'shopping' && <ShoppingTab />}
      </div>
    </ModuleScope>
  );
}
