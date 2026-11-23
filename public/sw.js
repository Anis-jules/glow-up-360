// Service worker de Glow Up 360°.
// - Hors ligne : réseau d'abord pour les pages (repli sur la copie en cache), cache puis réseau pour les fichiers.
// - Notifications : un clic ramène sur l'application, à la bonne rubrique.
// Changer CACHE à chaque évolution majeure pour repartir d'un cache propre.

const CACHE = 'glowup360-v1';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon.svg', './icon-192.png', './icon-512.png'];
/** Nombre maximal de fichiers gardés : les anciennes versions des scripts sont retirées au fil des mises à jour. */
const MAX_ENTRIES = 80;

async function trim(cache) {
  const keys = await cache.keys();
  const extra = keys.length - MAX_ENTRIES;
  for (let i = 0; i < extra; i++) {
    const path = new URL(keys[i].url).pathname;
    if (!SHELL.some((s) => path.endsWith(s.replace('./', '/')))) await cache.delete(keys[i]);
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .catch(() => undefined),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('glowup360-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Pages : réseau d'abord, copie en cache si hors ligne.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put('./index.html', copy));
          }
          return res;
        })
        .catch(async () => (await caches.match(req)) || (await caches.match('./index.html')) || (await caches.match('./')) || Response.error()),
    );
    return;
  }

  // Fichiers (scripts, styles, polices, images) : cache d'abord, mise à jour en arrière-plan.
  const cacheP = caches.open(CACHE);
  const networkP = cacheP.then((cache) =>
    fetch(req)
      .then((res) => {
        if (res.ok && res.type === 'basic') cache.put(req, res.clone()).then(() => trim(cache));
        return res;
      })
      .catch(() => undefined),
  );
  event.waitUntil(networkP);
  event.respondWith(cacheP.then(async (cache) => (await cache.match(req)) || (await networkP) || Response.error()));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '#/';
  event.waitUntil(
    (async () => {
      const scope = self.registration.scope;
      const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of windows) {
        if (client.url.startsWith(scope)) {
          await client.focus();
          client.postMessage({ type: 'glowup-navigate', url: target });
          return;
        }
      }
      await self.clients.openWindow(new URL(target, scope).href);
    })(),
  );
});
