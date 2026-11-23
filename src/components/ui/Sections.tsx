import { ArrowDown, ArrowUp, Check, Pencil, Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { cx } from '@/lib/utils';
import { Button, IconButton } from './Button';

/**
 * En-tête de section avec les actions standard : Modifier / Terminé et Ajouter.
 * En mode « Modifier », les éléments affichent leurs boutons Supprimer et Réorganiser.
 */
export function SectionHeader({
  title,
  subtitle,
  icon,
  editing,
  onToggleEdit,
  onAdd,
  addLabel = 'Ajouter',
  extra,
  className,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  editing?: boolean;
  onToggleEdit?: () => void;
  onAdd?: () => void;
  addLabel?: string;
  extra?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('mb-3 flex items-center gap-3', className)}>
      {icon && <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-tint/12 text-tint [&_svg]:size-4">{icon}</div>}
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-[17px] font-semibold">{title}</h2>
        {subtitle && <p className="truncate text-[13px] text-ink-3">{subtitle}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {extra}
        {onAdd && (
          <Button size="sm" variant="ghost" onClick={onAdd} className="text-tint hover:text-tint">
            <Plus /> <span className="max-sm:sr-only">{addLabel}</span>
          </Button>
        )}
        {onToggleEdit && (
          <Button size="sm" variant={editing ? 'tint' : 'ghost'} onClick={onToggleEdit} aria-pressed={editing}>
            {editing ? <Check /> : <Pencil />}
            <span className="max-sm:sr-only">{editing ? 'Terminé' : 'Modifier'}</span>
          </Button>
        )}
      </div>
    </div>
  );
}

/** Flèches pour réorganiser un élément dans une liste. */
export function ReorderButtons({
  index,
  count,
  onMove,
  className,
}: {
  index: number;
  count: number;
  onMove: (to: number) => void;
  className?: string;
}) {
  return (
    <div className={cx('flex shrink-0 items-center', className)}>
      <IconButton label="Monter" size="icon-sm" disabled={index === 0} onClick={() => onMove(index - 1)}>
        <ArrowUp />
      </IconButton>
      <IconButton label="Descendre" size="icon-sm" disabled={index === count - 1} onClick={() => onMove(index + 1)}>
        <ArrowDown />
      </IconButton>
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  children,
  action,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('flex flex-col items-center rounded-2xl border border-dashed border-line px-6 py-10 text-center', className)}>
      {icon && <div className="mb-3 grid size-12 place-items-center rounded-2xl bg-tint/12 text-tint [&_svg]:size-6">{icon}</div>}
      <div className="font-semibold">{title}</div>
      {children && <div className="mt-1 max-w-sm text-sm text-ink-2">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Onglets internes d'une page (défilent horizontalement sur téléphone). */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: { id: T; label: string; icon?: ReactNode; count?: number }[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div className={cx('scrollbar-none -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0', className)}>
      <div role="tablist" className="inline-flex min-w-full gap-1 rounded-2xl bg-ink/[0.045] p-1 sm:min-w-0">
        {tabs.map((t) => {
          const on = t.id === value;
          return (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={on}
              onClick={() => onChange(t.id)}
              className={cx(
                'flex h-9 flex-1 items-center justify-center gap-1.5 rounded-xl px-3.5 text-[13px] font-medium whitespace-nowrap transition-[background-color,color,box-shadow] sm:flex-none [&_svg]:size-4',
                on ? 'bg-surface text-ink shadow-sm' : 'text-ink-2 hover:text-ink',
              )}
            >
              {t.icon}
              {t.label}
              {t.count !== undefined && (
                <span className={cx('rounded-full px-1.5 text-[11px] tabular', on ? 'bg-tint/15 text-tint' : 'bg-ink/[0.07]')}>
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Choix compact entre quelques options. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  className,
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  return (
    <div className={cx('inline-flex rounded-xl bg-ink/[0.05] p-0.5', className)}>
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={cx(
            'h-8 rounded-[10px] px-3 text-[13px] font-medium transition-[background-color,color]',
            o.value === value ? 'bg-surface text-ink shadow-sm' : 'text-ink-2 hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
