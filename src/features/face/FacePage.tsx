import { CalendarDays, Hand, Package, Smile, Sparkles, SunMoon } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ModuleScope, Tabs } from '@/components/ui';
import { capitalize, formatLong, useToday } from '@/lib/dates';
import { useTab } from '@/lib/nav';
import { HistoryTab } from './HistoryTab';
import { MassageTab } from './MassageTab';
import { ProductsTab } from './ProductsTab';
import { RoutineTab } from './RoutineTab';
import { WellbeingTab } from './WellbeingTab';

const TABS = ['routine', 'massage', 'wellbeing', 'products', 'history'] as const;
type FaceTab = (typeof TABS)[number];

export default function FacePage() {
  const today = useToday();
  const [tab, setTab] = useTab<FaceTab>(TABS, 'routine');

  return (
    <ModuleScope module="face">
      <PageHeader
        icon={<Sparkles />}
        eyebrow={capitalize(formatLong(today))}
        title="Visage & Skincare"
        subtitle="Routine du matin et du soir, massage doux, posture et bien-être."
      />
      <Tabs<FaceTab>
        className="mb-6"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'routine', label: 'Routine', icon: <SunMoon /> },
          { id: 'massage', label: 'Massage', icon: <Hand /> },
          { id: 'wellbeing', label: 'Mâchoire & posture', icon: <Smile /> },
          { id: 'products', label: 'Produits', icon: <Package /> },
          { id: 'history', label: 'Suivi', icon: <CalendarDays /> },
        ]}
      />
      <div key={tab} className="animate-fade-in">
        {tab === 'routine' && <RoutineTab />}
        {tab === 'massage' && <MassageTab />}
        {tab === 'wellbeing' && <WellbeingTab />}
        {tab === 'products' && <ProductsTab />}
        {tab === 'history' && <HistoryTab />}
      </div>
    </ModuleScope>
  );
}
