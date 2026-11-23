// Service worker : fonctionnement hors ligne et affichage des notifications (obligatoire sur Android).
// Il n'est enregistré qu'en production (npm run build) pour ne pas gêner le développement.

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* hors contexte sécurisé : l'application fonctionne sans */
    });
  });
}

/** Demande au navigateur de ne pas effacer les données de l'application quand l'espace manque. */
export async function requestPersistentStorage(): Promise<boolean | null> {
  try {
    if (!navigator.storage?.persist) return null;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return null;
  }
}

/** L'application est-elle lancée depuis l'écran d'accueil (PWA installée) ? */
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as unknown as { standalone?: boolean }).standalone === true
  );
}
