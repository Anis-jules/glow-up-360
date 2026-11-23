import { cx } from '@/lib/utils';

export interface Bar {
  label: string;
  /** Valeur brute ; la hauteur est relative à `max`. */
  value: number;
  /** Texte au survol / sous la barre. */
  title?: string;
  highlight?: boolean;
}

/** Histogramme simple, sans dépendance. Couleur : `--tint` du parent. */
export function BarChart({
  bars,
  max,
  height = 140,
  showValues = false,
  format = (v) => String(Math.round(v)),
  goal,
  onSelect,
  className,
}: {
  bars: Bar[];
  max?: number;
  height?: number;
  showValues?: boolean;
  format?: (v: number) => string;
  /** Ligne d'objectif (même unité que les valeurs). */
  goal?: number;
  onSelect?: (index: number) => void;
  className?: string;
}) {
  const top = Math.max(max ?? 0, ...bars.map((b) => b.value), goal ?? 0, 1);
  const dense = bars.length > 14;
  return (
    <div className={cx('w-full', className)}>
      <div className="relative flex items-end gap-[3px] sm:gap-1.5" style={{ height }}>
        {goal !== undefined && (
          <div
            className="pointer-events-none absolute inset-x-0 border-t border-dashed border-ink/25"
            style={{ bottom: `${(goal / top) * 100}%` }}
            aria-hidden
          />
        )}
        {bars.map((b, i) => {
          const h = b.value > 0 ? Math.max(4, (b.value / top) * 100) : 0;
          return (
            <button
              key={`${b.label}-${i}`}
              type="button"
              title={b.title ?? `${b.label} : ${format(b.value)}`}
              onClick={() => onSelect?.(i)}
              className={cx('group relative flex h-full min-w-0 flex-1 flex-col items-center justify-end', !onSelect && 'cursor-default')}
            >
              {showValues && !dense && b.value > 0 && (
                <span className="mb-1 text-[10px] font-medium text-ink-3 tabular">{format(b.value)}</span>
              )}
              <span
                className={cx(
                  'w-full max-w-9 rounded-t-md rounded-b-[3px] transition-[height,opacity] duration-500 ease-out group-hover:opacity-100',
                  b.highlight ? 'bg-tint' : 'bg-tint/45',
                  h === 0 && 'bg-ink/10',
                )}
                style={{ height: h === 0 ? 3 : `${h}%` }}
              />
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex gap-[3px] sm:gap-1.5">
        {bars.map((b, i) => (
          <div
            key={`${b.label}-l-${i}`}
            className={cx(
              'min-w-0 flex-1 truncate text-center text-[11px] text-ink-3',
              b.highlight && 'font-semibold text-ink',
              dense && i % 5 !== 0 && i !== bars.length - 1 && 'invisible',
            )}
          >
            {b.label}
          </div>
        ))}
      </div>
    </div>
  );
}
