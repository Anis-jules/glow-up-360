import { Languages } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ProgressBar } from '@/components/ui';
import { useToday } from '@/lib/dates';
import { wordsOn } from '@/lib/english';
import { useData } from '@/lib/store';
import { AddWordForm } from '../english/AddWordForm';
import { DashCard } from './DashCard';

/** Accueil : les mots d'anglais du jour, et l'ajout rapide. */
export function EnglishCard({ delay }: { delay: number }) {
  const data = useData();
  const today = useToday();
  const navigate = useNavigate();
  const goal = Math.max(1, data.english.dailyGoal);
  const words = wordsOn(data, today);

  return (
    <DashCard module="mind" title="Mots en anglais" icon={<Languages />} to="/anglais" meta={`${words.length} / ${goal} aujourd’hui`} delay={delay}>
      <ProgressBar value={words.length / goal} height={6} className="mb-3" />
      {words.length === 0 ? (
        <p className="mb-3 text-sm text-ink-2">Note tes {goal} mots du jour avec leur traduction.</p>
      ) : (
        <ul className="mb-3 divide-y divide-line">
          {words.map((w) => (
            <li key={w.id}>
              <button type="button" onClick={() => navigate('/anglais')} className="flex w-full items-baseline gap-3 py-2 text-left">
                <span className="min-w-0 flex-1 truncate text-[15px] font-semibold" lang="en">
                  {w.en}
                </span>
                <span className="min-w-0 flex-1 truncate text-right text-[14px] text-ink-2">{w.fr || '…'}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <AddWordForm dateKey={today} compact />
    </DashCard>
  );
}
