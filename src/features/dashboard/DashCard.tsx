import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, ModuleScope } from '@/components/ui';
import type { ModuleKey } from '@/lib/types';
import { cx } from '@/lib/utils';

/**
 * Carte du tableau de bord. Avec `to`, l'en-tête mène à la rubrique ;
 * sans `to`, l'en-tête accueille des boutons (`actions`).
 */
export function DashCard({
  module,
  title,
  icon,
  to,
  meta,
  actions,
  children,
  delay,
  className,
}: {
  module?: ModuleKey;
  title: string;
  icon: ReactNode;
  to?: string;
  meta?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  delay: number;
  className?: string;
}) {
  const navigate = useNavigate();
  const head = (
    <>
      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-tint/12 text-tint [&_svg]:size-[18px]">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="font-display text-[16px] font-semibold">{title}</div>
        {meta && <div className="truncate text-[13px] text-ink-3">{meta}</div>}
      </div>
    </>
  );
  return (
    <ModuleScope module={module} className={cx('min-w-0', className)}>
      <Card className="h-full animate-rise" style={{ animationDelay: `${delay}ms` }}>
        {to ? (
          <button type="button" onClick={() => navigate(to)} className="group mb-3 flex w-full items-center gap-3 text-left">
            {head}
            <ChevronRight className="size-4 text-ink-3 transition-transform group-hover:translate-x-0.5" />
          </button>
        ) : (
          <div className="mb-3 flex w-full items-center gap-3">
            {head}
            {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
          </div>
        )}
        {children}
      </Card>
    </ModuleScope>
  );
}
