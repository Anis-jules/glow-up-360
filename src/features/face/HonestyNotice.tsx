import { ShieldAlert } from 'lucide-react';
import { cx } from '@/lib/utils';

/** Rappel d'honnêteté, toujours visible et non supprimable. */
export function HonestyNotice({ compact, className }: { compact?: boolean; className?: string }) {
  return (
    <div
      className={cx(
        'flex gap-3 rounded-2xl border border-tint/20 bg-tint/[0.07] text-ink-2',
        compact ? 'p-3 text-[13px]' : 'p-4 text-sm',
        className,
      )}
      role="note"
    >
      <ShieldAlert className={cx('shrink-0 text-tint', compact ? 'mt-0.5 size-4' : 'mt-0.5 size-5')} />
      <div className="space-y-1 leading-relaxed">
        <p>
          <span className="font-semibold text-ink">Le massage peut diminuer temporairement les gonflements et détendre.</span>{' '}
          Il ne modifie pas la structure osseuse et ne fait pas fondre la graisse localement.
        </p>
        {!compact && (
          <p>
            Évite les exercices excessifs de mâchoire (mastication prolongée, accessoires « de musculation ») : ils peuvent
            fatiguer l’articulation. Douleur, claquement ou blocage : parles-en à un dentiste ou à un médecin.
          </p>
        )}
      </div>
    </div>
  );
}
