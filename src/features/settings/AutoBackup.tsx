import { useEffect } from 'react';
import { createBackup, hasAutoBackupToday } from './backups';

/**
 * Sauvegarde automatique : un point de restauration par jour, gardé 7 jours sur l'appareil.
 * Vérifie au lancement puis toutes les heures (l'application peut rester ouverte plusieurs jours).
 */
export function AutoBackup() {
  useEffect(() => {
    const run = () => {
      try {
        if (!hasAutoBackupToday()) createBackup('Sauvegarde automatique', true);
      } catch {
        /* jamais bloquant */
      }
    };
    // Laisse l'application se charger avant d'écrire.
    const first = window.setTimeout(run, 3000);
    const id = window.setInterval(run, 60 * 60 * 1000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
    };
  }, []);
  return null;
}
