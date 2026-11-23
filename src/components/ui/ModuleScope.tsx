import { createContext, useContext, type CSSProperties, type ReactNode } from 'react';
import { useSettings } from '@/lib/store';
import type { ModuleKey } from '@/lib/types';
import { readableInk } from '@/lib/utils';

/** Couleur de la rubrique courante, transmise aux fenêtres (qui sont rendues hors de l'arbre DOM). */
const TintContext = createContext<CSSProperties | undefined>(undefined);

export function useTintStyle(): CSSProperties | undefined {
  return useContext(TintContext);
}

/** Donne à tout son contenu la couleur d'une rubrique (classes `*-tint`). */
export function ModuleScope({
  module,
  color,
  children,
  className,
}: {
  module?: ModuleKey;
  /** Couleur libre (hex) à la place de celle d'une rubrique. */
  color?: string;
  children: ReactNode;
  className?: string;
}) {
  const settings = useSettings();
  const hex = color ?? (module ? settings.moduleColors[module] : settings.accent);
  const style = { '--tint': hex, '--tint-ink': readableInk(hex) } as CSSProperties;
  return (
    <TintContext.Provider value={style}>
      <div style={style} className={className}>
        {children}
      </div>
    </TintContext.Provider>
  );
}
