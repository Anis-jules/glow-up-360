// Petits messages (toasts) et boîte de confirmation, utilisables partout.

import { create } from 'zustand';
import { uid } from './utils';
import { useApp } from './store';
import { clone } from './utils';

export interface Toast {
  id: string;
  message: string;
  tone: 'default' | 'success' | 'error';
  action?: { label: string; onClick: () => void };
  duration: number;
}

interface ToastStore {
  toasts: Toast[];
  push: (t: Omit<Toast, 'id' | 'tone' | 'duration'> & Partial<Pick<Toast, 'tone' | 'duration'>>) => string;
  dismiss: (id: string) => void;
}

export const useToasts = create<ToastStore>((set, get) => ({
  toasts: [],
  push: (t) => {
    const id = uid('t');
    const toast: Toast = { tone: 'default', duration: 3500, ...t, id };
    set({ toasts: [...get().toasts.slice(-2), toast] });
    window.setTimeout(() => get().dismiss(id), toast.duration);
    return id;
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));

export function toast(message: string, opts: Partial<Omit<Toast, 'id' | 'message'>> = {}) {
  return useToasts.getState().push({ message, ...opts });
}

/**
 * Supprime quelque chose en laissant 6 secondes pour annuler.
 * Exemple : removeWithUndo('Exercice supprimé', (d) => { w.exercises.splice(i, 1) })
 */
export function removeWithUndo(message: string, mutate: Parameters<ReturnType<typeof useApp.getState>['update']>[0]) {
  const { update, replaceAll, data } = useApp.getState();
  const before = clone(data);
  update(mutate);
  toast(message, {
    duration: 6000,
    action: { label: 'Annuler', onClick: () => replaceAll(before) },
  });
}

// ───────────────────────── Confirmation

export interface ConfirmOptions {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmStore {
  current: (ConfirmOptions & { resolve: (ok: boolean) => void }) | null;
  ask: (o: ConfirmOptions) => Promise<boolean>;
  close: (ok: boolean) => void;
}

export const useConfirmStore = create<ConfirmStore>((set, get) => ({
  current: null,
  ask: (o) =>
    new Promise<boolean>((resolve) => {
      get().current?.resolve(false);
      set({ current: { ...o, resolve } });
    }),
  close: (ok) => {
    get().current?.resolve(ok);
    set({ current: null });
  },
}));

/** const ok = await confirm({ title: 'Supprimer ?', danger: true }) */
export function confirm(o: ConfirmOptions): Promise<boolean> {
  return useConfirmStore.getState().ask(o);
}
