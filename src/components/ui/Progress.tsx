import type { ReactNode } from 'react';
import { cx } from '@/lib/utils';

/** Anneau de progression ; `value` entre 0 et 1. Couleur : `--tint` du parent, ou `color`. */
export function ProgressRing({
  value,
  size = 120,
  stroke = 10,
  color,
  children,
  className,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  children?: ReactNode;
  className?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value || 0));
  return (
    <div className={cx('relative inline-grid shrink-0 place-items-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-ink/[0.08]" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v)}
          className={cx('transition-[stroke-dashoffset] duration-700 ease-out', !color && 'stroke-tint')}
          style={color ? { stroke: color } : undefined}
        />
      </svg>
      {children && <div className="absolute inset-0 grid place-items-center text-center">{children}</div>}
    </div>
  );
}

/** Barre de progression ; `value` entre 0 et 1. */
export function ProgressBar({
  value,
  color,
  height = 8,
  className,
}: {
  value: number;
  color?: string;
  height?: number;
  className?: string;
}) {
  const v = Math.max(0, Math.min(1, value || 0));
  return (
    <div
      className={cx('w-full overflow-hidden rounded-full bg-ink/[0.07]', className)}
      style={{ height }}
      role="progressbar"
      aria-valuenow={Math.round(v * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cx('h-full rounded-full transition-[width] duration-700 ease-out', !color && 'bg-tint')}
        style={{ width: `${v * 100}%`, ...(color ? { background: color } : {}) }}
      />
    </div>
  );
}
