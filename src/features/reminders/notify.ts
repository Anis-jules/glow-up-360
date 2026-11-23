// Notifications web : état de l'autorisation, demande, affichage.
// Elles ne peuvent partir que lorsque l'application est ouverte (aucun serveur d'envoi n'est inclus).

export type NotifState = 'unsupported' | 'insecure' | 'default' | 'granted' | 'denied';

export function notificationState(): NotifState {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  if (!window.isSecureContext) return 'insecure';
  return Notification.permission as NotifState;
}

export async function requestNotificationPermission(): Promise<NotifState> {
  const s = notificationState();
  if (s === 'unsupported' || s === 'insecure') return s;
  try {
    const res = await Notification.requestPermission();
    return res as NotifState;
  } catch {
    return notificationState();
  }
}

/**
 * Affiche une notification système. Passe par le service worker quand il existe
 * (obligatoire sur Android), sinon par l'API simple (ordinateur).
 * `url` : adresse interne, par exemple « #/sport ».
 */
export async function showSystemNotification(title: string, body: string, url: string, tag?: string): Promise<boolean> {
  if (notificationState() !== 'granted') return false;
  const options: NotificationOptions = {
    body,
    icon: './icon-192.png',
    badge: './icon-192.png',
    tag,
    data: { url },
  };
  try {
    const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
    if (reg) {
      await reg.showNotification(title, options);
      return true;
    }
  } catch {
    /* on tente l'autre méthode */
  }
  try {
    const n = new Notification(title, options);
    n.onclick = () => {
      window.focus();
      window.location.hash = url.replace(/^#/, '');
      n.close();
    };
    return true;
  } catch {
    return false;
  }
}
