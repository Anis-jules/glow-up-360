import { BookText, GraduationCap, Languages, PenLine, Trophy } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ModuleScope, Tabs } from '@/components/ui';
import { capitalize, formatLong, useToday } from '@/lib/dates';
import { wordsOn } from '@/lib/english';
import { useTab } from '@/lib/nav';
import { useData } from '@/lib/store';
import { ConjugationTab } from './ConjugationTab';
import { quizStatus } from './quiz';
import { QuizTab } from './QuizTab';
import { TodayTab, type EnglishTab } from './TodayTab';
import { WordsTab } from './WordsTab';

const TABS = ['today', 'conjugaison', 'quiz', 'mots'] as const;

export default function EnglishPage() {
  const data = useData();
  const today = useToday();
  const [tab, setTab] = useTab<EnglishTab>(TABS, 'today');
  const goal = Math.max(1, data.english.dailyGoal);
  const todays = wordsOn(data, today).length;
  const total = data.english.words.length;
  const status = quizStatus(data, today);
  const quizPending = !!status && !status.passed;

  return (
    <ModuleScope module="mind">
      <PageHeader
        icon={<Languages />}
        eyebrow={capitalize(formatLong(today))}
        title="Anglais"
        subtitle={`${todays} / ${goal} mots aujourd’hui · ${total} mot${total > 1 ? 's' : ''} · ${data.english.verbs.length} verbe${data.english.verbs.length > 1 ? 's' : ''}`}
      />
      <Tabs<EnglishTab>
        className="mb-6 animate-rise"
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'today', label: 'Aujourd’hui', icon: <PenLine /> },
          { id: 'conjugaison', label: 'Conjugaison', icon: <GraduationCap /> },
          { id: 'quiz', label: quizPending ? 'Quiz · à faire' : 'Quiz', icon: <Trophy /> },
          { id: 'mots', label: 'Mes mots', icon: <BookText />, count: total },
        ]}
      />
      {tab === 'today' && <TodayTab onGoTo={setTab} />}
      {tab === 'conjugaison' && <ConjugationTab />}
      {tab === 'quiz' && <QuizTab />}
      {tab === 'mots' && <WordsTab />}
    </ModuleScope>
  );
}
