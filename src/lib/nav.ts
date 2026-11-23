import {
  BarChart3,
  Bell,
  Brain,
  Dumbbell,
  LayoutDashboard,
  ListChecks,
  Salad,
  Settings,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ModuleKey } from './types';

export interface NavItem {
  to: string;
  label: string;
  short: string;
  icon: LucideIcon;
  module?: ModuleKey;
}

/** Les huit onglets principaux, dans l'ordre demandé. */
export const NAV: NavItem[] = [
  { to: '/', label: 'Dashboard', short: 'Accueil', icon: LayoutDashboard },
  { to: '/sport', label: 'Sport', short: 'Sport', icon: Dumbbell, module: 'sport' },
  { to: '/nutrition', label: 'Nutrition', short: 'Nutrition', icon: Salad, module: 'nutrition' },
  { to: '/visage', label: 'Visage & Skincare', short: 'Visage', icon: Sparkles, module: 'face' },
  { to: '/esprit', label: 'Développement intellectuel', short: 'Esprit', icon: Brain, module: 'mind' },
  { to: '/habitudes', label: 'Habitudes', short: 'Habitudes', icon: ListChecks, module: 'habits' },
  { to: '/statistiques', label: 'Statistiques', short: 'Stats', icon: BarChart3 },
  { to: '/parametres', label: 'Paramètres', short: 'Réglages', icon: Settings },
];

export const REMINDERS_NAV: NavItem = { to: '/rappels', label: 'Rappels', short: 'Rappels', icon: Bell };

/** Onglets visibles dans la barre du bas sur téléphone ; les autres sont dans « Plus ». */
export const MOBILE_PRIMARY = ['/', '/sport', '/nutrition', '/visage'];

export const MODULE_ROUTES: Record<ModuleKey, string> = {
  sport: '/sport',
  nutrition: '/nutrition',
  face: '/visage',
  mind: '/esprit',
  habits: '/habitudes',
};

/**
 * Onglet interne d'une page, conservé dans l'adresse (?tab=…) :
 * le tableau de bord peut ainsi ouvrir directement le bon onglet.
 */
export function useTab<T extends string>(allowed: readonly T[], fallback: T): [T, (t: T) => void] {
  const [params, setParams] = useSearchParams();
  const raw = params.get('tab') as T | null;
  const tab = raw && allowed.includes(raw) ? raw : fallback;
  const setTab = useCallback(
    (t: T) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('tab', t);
          next.delete('item');
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );
  return [tab, setTab];
}

/** Élément à ouvrir directement (?item=…), utilisé par les liens du tableau de bord. */
export function useItemParam(): [string | null, (id: string | null) => void] {
  const [params, setParams] = useSearchParams();
  const set = useCallback(
    (id: string | null) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (id) next.set('item', id);
          else next.delete('item');
          return next;
        },
        { replace: true },
      ),
    [setParams],
  );
  return [params.get('item'), set];
}
