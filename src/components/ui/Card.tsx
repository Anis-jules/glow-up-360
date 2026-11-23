import type { HTMLAttributes, ReactNode } from 'react';
import { cx } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Carte cliquable : léger soulèvement au survol. */
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const pads = { none: '', sm: 'p-3', md: 'p-4 sm:p-5', lg: 'p-5 sm:p-6' };

export function Card({ interactive, padding = 'md', className, ...props }: CardProps) {
  return (
    <div
      className={cx(
        'card',
        pads[padding],
        interactive &&
          'cursor-pointer transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-tint/25 active:translate-y-0',
        className,
      )}
      {...props}
    />
  );
}

/** Petite pastille de texte. */
export function Chip({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'tint' | 'success' | 'danger' | 'accent';
  className?: string;
}) {
  const tones = {
    neutral: 'bg-ink/[0.06] text-ink-2',
    tint: 'bg-tint/12 text-tint',
    accent: 'bg-accent/12 text-accent',
    success: 'bg-success/12 text-success',
    danger: 'bg-danger/12 text-danger',
  };
  return (
    <span
      className={cx(
        'inline-flex h-6 items-center gap-1 rounded-full px-2.5 text-xs font-medium whitespace-nowrap [&_svg]:size-3.5',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Tuile de chiffre clé. */
export function Stat({
  label,
  value,
  sub,
  icon,
  className,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('card min-w-0 p-4', className)}>
      <div className="flex min-w-0 items-center gap-2 text-[13px] text-ink-2 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-tint">
        {icon}
        <span className="min-w-0 truncate">{label}</span>
      </div>
      <div className="mt-2 font-display text-2xl font-semibold tracking-tight tabular">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-ink-3">{sub}</div>}
    </div>
  );
}
