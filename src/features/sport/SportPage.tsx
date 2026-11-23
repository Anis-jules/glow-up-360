import { CalendarDays, Dumbbell, History, Library, Play, TrendingUp } from 'lucide-react';
import { ModuleScope, Tabs } from '@/components/ui';
import { PageHeader } from '@/components/layout/PageHeader';
import { capitalize, formatLong, useToday } from '@/lib/dates';
import { useTab } from '@/lib/nav';
import { getProgressionInfo } from '@/lib/progress';
import { useData } from '@/lib/store';
import { HistoryTab } from './HistoryTab';
import { LibraryTab } from './LibraryTab';
import { ProgramTab } from './ProgramTab';
import { TodayTab, type SportTab } from './TodayTab';
import { WeekTab } from './WeekTab';

const TABS = ['today', 'week', 'library', 'program', 'history'] as const;

export default function SportPage() {
  const today = useToday();
  const data = useData();
  const [tab, setTab] = useTab<SportTab>(TABS, 'today');
  const info = getProgressionInfo(data.sport, today);

  return (
    <ModuleScope module="sport">
      <PageHeader
        icon={<Dumbbell />}
        eyebrow={capitalize(formatLong(today))}
        title="Sport"
        subtitle={
          info.day && info.phase
            ? `Programme 30 jours · jour ${info.day} · phase ${info.phase.name}`
            : 'Ton planning de la semaine, tes séances et ta progression'
        }
      />
      <Tabs<SportTab>
        className="mb-6 animate-rise"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'today', label: 'Aujourd’hui', icon: <Play /> },
          { id: 'week', label: 'Semaine', icon: <CalendarDays /> },
          { id: 'library', label: 'Séances', icon: <Library />, count: data.sport.workouts.length },
          { id: 'program', label: 'Programme 30 j', icon: <TrendingUp /> },
          { id: 'history', label: 'Historique', icon: <History /> },
        ]}
      />
      {tab === 'today' && <TodayTab today={today} onGoTo={setTab} />}
      {tab === 'week' && <WeekTab today={today} />}
      {tab === 'library' && <LibraryTab />}
      {tab === 'program' && <ProgramTab today={today} />}
      {tab === 'history' && <HistoryTab today={today} />}
    </ModuleScope>
  );
}
