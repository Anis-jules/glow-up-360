import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { IconButton } from '@/components/ui';
import { capitalize, formatMonth, fromKey, toKey, WEEKDAYS_LETTER, weekdayOf } from '@/lib/dates';
import type { DateKey } from '@/lib/types';
import { cx } from '@/lib/utils';

/** Décale une date de n mois (renvoie le 1er du mois obtenu). */
export function shiftMonth(key: DateKey, n: number): DateKey {
  const d = fromKey(key);
  return toKey(new Date(d.getFullYear(), d.getMonth() + n, 1, 12));
}

export function monthDays(key: DateKey): DateKey[] {
  const d = fromKey(key);
  const count = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return Array.from({ length: count }, (_, i) => toKey(new Date(d.getFullYear(), d.getMonth(), i + 1, 12)));
}

/**
 * Calendrier mensuel : chaque jour est coloré selon `valueFor` (0 à 1, null = pas de donnée).
 * Couleur : `--tint` du parent.
 */
export function MonthCalendar({
  month,
  onMonthChange,
  today,
  valueFor,
  onSelect,
  selected,
}: {
  month: DateKey;
  onMonthChange: (m: DateKey) => void;
  today: DateKey;
  valueFor: (key: DateKey) => number | null;
  onSelect?: (key: DateKey) => void;
  selected?: DateKey | null;
}) {
  const days = monthDays(month);
  const lead = weekdayOf(days[0]);
  const isCurrentMonth = month.slice(0, 7) === today.slice(0, 7);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <IconButton label="Mois précédent" size="icon-sm" onClick={() => onMonthChange(shiftMonth(month, -1))}>
          <ChevronLeft />
        </IconButton>
        <div className="text-[15px] font-semibold">{capitalize(formatMonth(days[0]))}</div>
        <IconButton
          label="Mois suivant"
          size="icon-sm"
          disabled={isCurrentMonth}
          onClick={() => onMonthChange(shiftMonth(month, 1))}
        >
          <ChevronRight />
        </IconButton>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-ink-3">
        {WEEKDAYS_LETTER.map((l, i) => (
          <div key={i} className="pb-1">
            {l}
          </div>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <div key={`b${i}`} />
        ))}
        {days.map((k) => {
          const future = k > today;
          const v = future ? null : valueFor(k);
          const full = v !== null && v >= 0.999;
          const pct = v === null || v <= 0 ? 0 : Math.round(18 + v * 62);
          return (
            <button
              key={k}
              type="button"
              disabled={future || !onSelect}
              onClick={() => onSelect?.(k)}
              title={v === null ? undefined : `${Math.round(v * 100)} %`}
              className={cx(
                'relative flex items-center justify-center aspect-square rounded-xl text-[13px] font-medium tabular transition-transform',
                onSelect && !future && 'hover:scale-105 active:scale-95',
                future ? 'text-ink-3/50' : 'text-ink',
                full && 'text-tint-ink',
                k === today && 'ring-2 ring-tint/60 ring-offset-1 ring-offset-surface',
                selected === k && 'outline-2 outline-ink/40',
                v === 0 && 'bg-ink/[0.04]',
              )}
              style={
                pct > 0
                  ? { background: full ? 'var(--tint)' : `color-mix(in oklab, var(--tint) ${pct}%, transparent)` }
                  : undefined
              }
            >
              {Number(k.slice(8))}
              {full && <Check className="absolute right-0.5 bottom-0.5 size-2.5 opacity-80" strokeWidth={3.5} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
