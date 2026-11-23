import { Brain, FolderOpen, GraduationCap, Library, NotebookPen, Target } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ModuleScope, Tabs } from '@/components/ui';
import { capitalize, formatLong, useToday } from '@/lib/dates';
import { useTab } from '@/lib/nav';
import { useData } from '@/lib/store';
import { BooksTab } from './BooksTab';
import { CategoriesTab } from './CategoriesTab';
import { JournalTab } from './JournalTab';
import { TodayTab } from './TodayTab';
import { TopicsTab } from './TopicsTab';

const TABS = ['today', 'books', 'topics', 'journal', 'categories'] as const;
type MindTab = (typeof TABS)[number];

export default function MindPage() {
  const today = useToday();
  const data = useData();
  const [tab, setTab] = useTab<MindTab>(TABS, 'today');

  return (
    <ModuleScope module="mind">
      <PageHeader
        icon={<Brain />}
        eyebrow={capitalize(formatLong(today))}
        title="Développement intellectuel"
        subtitle="Lire, apprendre, réfléchir, retenir."
      />
      <Tabs<MindTab>
        className="mb-6"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'today', label: 'Aujourd’hui', icon: <Target /> },
          { id: 'books', label: 'Livres', icon: <Library />, count: data.mind.books.length },
          { id: 'topics', label: 'Sujets', icon: <GraduationCap /> },
          { id: 'journal', label: 'Journal', icon: <NotebookPen />, count: data.mind.journal.length },
          { id: 'categories', label: 'Catégories', icon: <FolderOpen /> },
        ]}
      />
      <div key={tab} className="animate-fade-in">
        {tab === 'today' && <TodayTab onGoBooks={() => setTab('books')} />}
        {tab === 'books' && <BooksTab />}
        {tab === 'topics' && <TopicsTab />}
        {tab === 'journal' && <JournalTab />}
        {tab === 'categories' && <CategoriesTab />}
      </div>
    </ModuleScope>
  );
}
