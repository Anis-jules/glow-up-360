import type { ReactNode } from 'react';
import { cx } from '@/lib/utils';

export function PageHeader({
  title,
  eyebrow,
  subtitle,
  icon,
  actions,
  className,
}: {
  title: ReactNode;
  eyebrow?: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cx('mb-6 flex animate-rise flex-wrap items-end justify-between gap-4 sm:mb-8', className)}>
      <div className="flex min-w-0 items-center gap-3.5">
        {icon && (
          <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-tint/12 text-tint [&_svg]:size-6">{icon}</div>
        )}
        <div className="min-w-0">
          {eyebrow && <p className="text-[13px] font-medium text-ink-3 first-letter:uppercase">{eyebrow}</p>}
          <h1 className="text-[26px] leading-tight font-semibold sm:text-[32px]">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-ink-2">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
