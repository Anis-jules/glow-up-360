import { Check } from 'lucide-react';
import type { ReactNode } from 'react';
import { vibrate } from '@/lib/sound';
import { cx } from '@/lib/utils';

export function Checkbox({
  checked,
  onChange,
  label,
  size = 'md',
  className,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Intitulé pour les lecteurs d'écran. */
  label: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const s = { sm: 'size-5 [&_svg]:size-3', md: 'size-7 [&_svg]:size-4', lg: 'size-9 [&_svg]:size-5' }[size];
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
        if (!checked) vibrate(8);
      }}
      className={cx(
        'grid shrink-0 place-items-center rounded-full border-2 transition-[background-color,border-color,transform] duration-200 active:scale-90',
        checked ? 'border-tint bg-tint text-tint-ink' : 'border-ink/20 hover:border-tint/70',
        s,
        className,
      )}
    >
      {checked && <Check strokeWidth={3.2} className="animate-check" />}
    </button>
  );
}

/**
 * Ligne cochable : case à gauche, texte au centre, contenu libre à droite.
 * Un clic sur le texte ouvre le détail (`onOpen`) s'il est fourni, sinon coche.
 */
export function CheckRow({
  checked,
  onToggle,
  title,
  subtitle,
  leading,
  trailing,
  onOpen,
  muted,
  className,
}: {
  checked: boolean;
  onToggle: (next: boolean) => void;
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  onOpen?: () => void;
  muted?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cx(
        'group flex min-h-14 items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-ink/[0.03]',
        className,
      )}
    >
      <Checkbox checked={checked} onChange={onToggle} label={typeof title === 'string' ? title : 'Valider'} />
      {leading}
      <button
        type="button"
        onClick={() => (onOpen ? onOpen() : onToggle(!checked))}
        className="min-w-0 flex-1 text-left"
      >
        <div
          className={cx(
            'truncate text-[15px] font-medium transition-colors',
            checked && 'text-ink-3 line-through decoration-ink-3/50',
            muted && !checked && 'text-ink-2',
          )}
        >
          {title}
        </div>
        {subtitle && <div className="truncate text-[13px] text-ink-3">{subtitle}</div>}
      </button>
      {trailing}
    </div>
  );
}
