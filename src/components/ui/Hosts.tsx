import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';
import { useConfirmStore, useToasts } from '@/lib/feedback';
import { cx } from '@/lib/utils';
import { Button } from './Button';
import { Sheet } from './Sheet';

/** Pile de messages en bas de l'écran (au-dessus de la barre d'onglets sur téléphone). */
export function Toaster() {
  const { toasts, dismiss } = useToasts();
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 lg:bottom-6">
      {toasts.map((t) => (
        <div
          key={t.id}
          role="status"
          className="pointer-events-auto flex w-full max-w-md animate-pop-in items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-sm text-bg shadow-xl"
        >
          {t.tone === 'success' && <CheckCircle2 className="size-4 shrink-0 text-success" />}
          {t.tone === 'error' && <AlertTriangle className="size-4 shrink-0 text-danger" />}
          {t.tone === 'default' && <Info className="size-4 shrink-0 opacity-60" />}
          <span className="min-w-0 flex-1">{t.message}</span>
          {t.action && (
            <button
              type="button"
              onClick={() => {
                t.action!.onClick();
                dismiss(t.id);
              }}
              className="shrink-0 rounded-lg px-2 py-1 font-semibold text-accent hover:bg-bg/10"
            >
              {t.action.label}
            </button>
          )}
          <button type="button" aria-label="Fermer" onClick={() => dismiss(t.id)} className="shrink-0 opacity-50 hover:opacity-100">
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

/** Fenêtre de confirmation globale (voir `confirm()` dans lib/feedback). */
export function ConfirmHost() {
  const { current, close } = useConfirmStore();
  return (
    <Sheet
      open={!!current}
      onClose={() => close(false)}
      size="sm"
      title={current?.title}
      footer={
        <>
          <Button variant="ghost" onClick={() => close(false)}>
            {current?.cancelLabel ?? 'Annuler'}
          </Button>
          <Button
            variant={current?.danger ? 'danger' : 'primary'}
            onClick={() => close(true)}
            className={cx(current?.danger && 'bg-danger text-white hover:bg-danger hover:brightness-110')}
            autoFocus
          >
            {current?.confirmLabel ?? 'Confirmer'}
          </Button>
        </>
      }
    >
      {current?.message && <p className="text-[15px] leading-relaxed text-ink-2">{current.message}</p>}
    </Sheet>
  );
}
