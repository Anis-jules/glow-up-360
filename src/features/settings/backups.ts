// Points de restauration stockés sur l'appareil (localStorage, clé « glowup360-backups »).
// 7 points automatiques (un par jour) + 5 points manuels au maximum.

import { useEffect, useState } from 'react';
import { todayKey, toKey } from '@/lib/dates';
import { looksLikeAppData, useApp } from '@/lib/store';
import type { AppData } from '@/lib/types';
import { clone, uid } from '@/lib/utils';

export const BACKUP_KEY = 'glowup360-backups';
const MAX_AUTO = 7;
const MAX_MANUAL = 5;
const EVENT = 'glowup360-backups-changed';

export interface Backup {
  id: string;
  /** Date ISO complète. */
  createdAt: string;
  label: string;
  auto: boolean;
  data: AppData;
}

export interface BackupMeta {
  id: string;
  createdAt: string;
  label: string;
  auto: boolean;
  /** Taille approximative en octets. */
  size: number;
}

function readAll(): Backup[] {
  try {
    const raw = localStorage.getItem(BACKUP_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as unknown;
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (b): b is Backup =>
        !!b && typeof b === 'object' && typeof (b as Backup).id === 'string' && looksLikeAppData((b as Backup).data),
    );
  } catch {
    return [];
  }
}

function isQuotaError(e: unknown): boolean {
  return (
    e instanceof DOMException &&
    (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED' || e.code === 22 || e.code === 1014)
  );
}

/** Garde les plus récents de chaque type. */
function prune(list: Backup[]): Backup[] {
  const sorted = [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const autos = sorted.filter((b) => b.auto).slice(0, MAX_AUTO);
  const manuals = sorted.filter((b) => !b.auto).slice(0, MAX_MANUAL);
  return [...autos, ...manuals].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Écrit la liste ; si la place manque, supprime les plus anciens (automatiques d'abord) et réessaie.
 * Ne lève jamais d'erreur : retourne false si rien n'a pu être écrit.
 */
function writeAll(list: Backup[], keepId?: string): boolean {
  let current = prune(list);
  for (;;) {
    try {
      if (current.length) localStorage.setItem(BACKUP_KEY, JSON.stringify(current));
      else localStorage.removeItem(BACKUP_KEY);
      window.dispatchEvent(new Event(EVENT));
      return keepId ? current.some((b) => b.id === keepId) : true;
    } catch (e) {
      if (!isQuotaError(e) || current.length === 0) return false;
      // Supprimer le plus ancien, en épargnant celui qu'on vient de créer.
      const candidates = [...current]
        .filter((b) => b.id !== keepId)
        .sort((a, b) => Number(b.auto) - Number(a.auto) || a.createdAt.localeCompare(b.createdAt));
      if (!candidates.length) return false;
      const drop = candidates[0].id;
      current = current.filter((b) => b.id !== drop);
    }
  }
}

export function listBackups(): BackupMeta[] {
  let raw = '';
  try {
    raw = localStorage.getItem(BACKUP_KEY) ?? '';
  } catch {
    return [];
  }
  const all = readAll();
  const avg = all.length ? raw.length / all.length : 0;
  return all
    .map(({ id, createdAt, label, auto }) => ({ id, createdAt, label, auto, size: Math.round(avg) }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getBackup(id: string): Backup | null {
  return readAll().find((b) => b.id === id) ?? null;
}

/** Crée un point de restauration de l'état actuel. Retourne null si l'appareil manque de place. */
export function createBackup(label: string, auto = false): Backup | null {
  const backup: Backup = {
    id: uid('bk'),
    createdAt: new Date().toISOString(),
    label,
    auto,
    data: clone(useApp.getState().data),
  };
  const ok = writeAll([backup, ...readAll()], backup.id);
  return ok ? backup : null;
}

/** Restaure un point (l'état actuel est d'abord sauvegardé). */
export function restoreBackup(id: string): boolean {
  const b = getBackup(id);
  if (!b) return false;
  createBackup('Avant restauration', false);
  useApp.getState().replaceAll(clone(b.data));
  return true;
}

export function deleteBackup(id: string): void {
  writeAll(readAll().filter((b) => b.id !== id));
}

export function hasAutoBackupToday(): boolean {
  const today = todayKey();
  return readAll().some((b) => b.auto && toKey(new Date(b.createdAt)) === today);
}

/** Liste des points de restauration, mise à jour à chaque changement. */
export function useBackups(): BackupMeta[] {
  const [list, setList] = useState(listBackups);
  useEffect(() => {
    const refresh = () => setList(listBackups());
    const onStorage = (e: StorageEvent) => {
      if (e.key === BACKUP_KEY) refresh();
    };
    window.addEventListener(EVENT, refresh);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(EVENT, refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  return list;
}

/** « 12,4 Ko » */
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} o`;
  if (n < 1024 * 1024) return `${(n / 1024).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Ko`;
  return `${(n / 1024 / 1024).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} Mo`;
}
