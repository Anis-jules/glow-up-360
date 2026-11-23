import { X } from 'lucide-react';
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cx } from '@/lib/utils';
import { IconButton } from './Button';
import { useTintStyle } from './ModuleScope';

/** Fenêtres ouvertes, de la plus ancienne à la plus récente : Échap ne ferme que la dernière. */
const stack: symbol[] = [];

/**
 * Panneau : glisse depuis le bas sur téléphone, fenêtre centrée sur ordinateur.
 * Garde la couleur de la rubrique d'où il est ouvert.
 */
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  size = 'md',
  bodyClassName,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  bodyClassName?: string;
}) {
  const tint = useTintStyle();
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const token = Symbol('sheet');
    stack.push(token);
    document.body.style.overflow = 'hidden';
    const prevFocus = document.activeElement as HTMLElement | null;
    const t = window.setTimeout(() => panelRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && stack[stack.length - 1] === token) {
        e.stopPropagation();
        onCloseRef.current();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(t);
      window.removeEventListener('keydown', onKey);
      stack.splice(stack.indexOf(token), 1);
      if (stack.length === 0) document.body.style.overflow = '';
      prevFocus?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  const widths = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6" style={tint}>
      <div className="absolute inset-0 animate-fade-in bg-black/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        className={cx(
          'relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[28px] bg-surface text-ink shadow-2xl outline-none',
          'animate-sheet-up sm:animate-pop-in sm:max-h-[88dvh] sm:rounded-3xl',
          widths[size],
        )}
      >
        <div className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-ink/15 sm:hidden" aria-hidden />
        {(title || subtitle) && (
          <header className="flex shrink-0 items-start gap-3 px-5 pt-4 pb-3 sm:px-6 sm:pt-5">
            {icon && (
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-tint/12 text-tint [&_svg]:size-5">
                {icon}
              </div>
            )}
            <div className="min-w-0 flex-1">
              {title && (
                <h2 id={titleId} className="text-lg leading-tight font-semibold">
                  {title}
                </h2>
              )}
              {subtitle && <p className="mt-0.5 text-sm text-ink-2">{subtitle}</p>}
            </div>
            <IconButton label="Fermer" size="icon-sm" onClick={onClose} className="-mt-1 -mr-2">
              <X />
            </IconButton>
          </header>
        )}
        <div className={cx('min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 sm:px-6', bodyClassName)}>
          {children}
        </div>
        {footer && (
          <footer className="pb-safe flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-line bg-surface px-5 py-3 sm:px-6">
            {footer}
          </footer>
        )}
      </div>
    </div>,
    document.body,
  );
}
