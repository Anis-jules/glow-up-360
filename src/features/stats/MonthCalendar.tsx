import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { IconButton } from '@/components/ui';
import { capitalize, formatLong, formatMonth, useToday, WEEKDAYS_LETTER, weekdayOf } from '@/lib/dates';
import { getDaySummary } from '@/lib/progress';
import { useData } from '@/lib/store';
import type { DateKey } from '@/lib/types';
import { cx } from '@/lib/utils';
import { addMonths, monthDates, monthStart } from './statsUtils';

/** Calendrier du mois : couleur selon la progression, coche pour les journées réussies. */
export function MonthCalendar({ onSelect }: { onSelect: (k: DateKey) => void }) {
  const data = useData();
  const today = useToday();
  const [month, setMonth] = useState(() => monthStart(today));
  const dates = monthDates(month);
  const lead = weekdayOf(dates[0]);
  const threshold = data.settings.completionThreshold;
  const isCurrent = month === monthStart(today);
  const canPrev = month > monthStart(data.createdAt);

  const successCount = dates.filter((k) => k <= today && k >= data.createdAt && getDaySummary(data, k, today).pct >= threshold).length;

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-semibold">{capitalize(formatMonth(month))}</div>
          <div className="text-[13px] text-ink-3">
            {successCount} journée{successCount > 1 ? 's' : ''} réussie{successCount > 1 ? 's' : ''}
          </div>
        </div>
        <IconButton label="Mois précédent" size="icon-sm" disabled={!canPrev} onClick={() => setMonth(addMonths(month, -1))}>
          <ChevronLeft />
        </IconButton>
        <IconButton label="Mois suivant" size="icon-sm" disabled={isCurrent} onClick={() => setMonth(addMonths(month, 1))}>
          <ChevronRight />
        </IconButton>
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS_LETTER.map((l, i) => (
          <div key={i} className="pb-1 text-center text-[11px] font-medium text-ink-3">
            {l}
          </div>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <div key={`lead-${i}`} />
        ))}
        {dates.map((k) => {
          const inRange = k <= today && k >= data.createdAt;
          const pct = inRange ? getDaySummary(data, k, today).pct : 0;
          const success = inRange && pct >= threshold;
          const strength = inRange && pct > 0 ? Math.round(14 + (pct / 100) * 76) : 0;
          const strong = strength >= 55;
          return (
            <button
              key={k}
              type="button"
              disabled={!inRange}
              onClick={() => onSelect(k)}
              title={inRange ? `${formatLong(k)} : ${pct} %` : formatLong(k)}
              className={cx(
                'relative flex aspect-square min-w-0 flex-col items-center justify-center rounded-xl text-[13px] font-medium tabular transition-transform enabled:hover:scale-105 enabled:active:scale-95',
                !inRange && 'text-ink-3/60',
                inRange && strength === 0 && 'bg-surface-2 text-ink-2',
                k === today && 'ring-2 ring-ink ring-offset-2 ring-offset-surface',
              )}
              style={
                strength
                  ? {
                      background: `color-mix(in oklab, var(--accent) ${strength}%, var(--surface-2))`,
                      color: strong ? 'var(--accent-ink)' : 'var(--ink)',
                    }
                  : undefined
              }
            >
              {Number(k.slice(8))}
              {success && <Check className="absolute top-0.5 right-0.5 size-3" strokeWidth={3} />}
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-ink-3">
        <span className="flex items-center gap-1.5">
          Moins
          {[14, 40, 65, 90].map((s) => (
            <span key={s} className="size-3 rounded" style={{ background: `color-mix(in oklab, var(--accent) ${s}%, var(--surface-2))` }} />
          ))}
          Plus
        </span>
        <span className="flex items-center gap-1">
          <Check className="size-3" strokeWidth={3} /> journée réussie (≥ {threshold} %)
        </span>
      </div>
    </div>
  );
}
