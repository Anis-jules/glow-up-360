// Moteur de rappels : vérifie toutes les 15 secondes, tant que l'application est ouverte.
// Un rappel se déclenche une seule fois par jour et par horaire, dans les 15 minutes qui suivent son heure
// (pas de rafale au lancement pour les heures passées depuis longtemps).

import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { nowMinutes, timeToMinutes, todayKey, weekdayOf } from '@/lib/dates';
import { toast } from '@/lib/feedback';
import { sounds, vibrate } from '@/lib/sound';
import { useApp } from '@/lib/store';
import type { Reminder } from '@/lib/types';
import { showSystemNotification } from './notify';
import { reminderRoute } from './reminderUtils';

const WINDOW_MIN = 15;

export function ReminderEngine() {
  const navigate = useNavigate();
  const navRef = useRef(navigate);
  navRef.current = navigate;

  useEffect(() => {
    const fire = (r: Reminder) => {
      const { settings } = useApp.getState().data;
      const route = reminderRoute(r.module);
      if (settings.inAppAlerts) {
        sounds.reminder();
        vibrate([60, 40, 60]);
        toast(`${r.time} · ${r.title}`, {
          duration: 12000,
          action: { label: 'Ouvrir', onClick: () => navRef.current(route) },
        });
      }
      if (settings.notificationsEnabled) {
        void showSystemNotification(r.title, r.description || 'C’est le moment.', `#${route}`, `glowup-${r.id}`);
      }
    };

    const check = () => {
      const { data, update } = useApp.getState();
      const today = todayKey();
      const wd = weekdayOf(today);
      const now = nowMinutes();
      const due = data.reminders.items.filter((r) => {
        if (!r.enabled || !r.days.includes(wd) || !/^\d{2}:\d{2}$/.test(r.time)) return false;
        const t = timeToMinutes(r.time);
        return now >= t && now - t < WINDOW_MIN && data.reminders.fired[r.id] !== `${today} ${r.time}`;
      });
      if (!due.length) return;
      update((d) => {
        for (const r of due) d.reminders.fired[r.id] = `${today} ${r.time}`;
      });
      due.forEach(fire);
    };

    check();
    const id = window.setInterval(check, 15_000);
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    document.addEventListener('visibilitychange', onVisible);
    // Clic sur une notification alors que l'app est déjà ouverte : le service worker demande d'aller à la rubrique.
    const onSwMessage = (e: MessageEvent) => {
      const msg = e.data as { type?: string; url?: string } | null;
      if (msg?.type === 'glowup-navigate' && typeof msg.url === 'string') navRef.current(msg.url.replace(/^#/, '') || '/');
    };
    navigator.serviceWorker?.addEventListener('message', onSwMessage);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
      navigator.serviceWorker?.removeEventListener('message', onSwMessage);
    };
  }, []);

  return null;
}
