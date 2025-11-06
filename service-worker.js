// === CADScale SW: cambia SOLO questa riga quando vuoi forzare un refresh ===
const CACHE = 'cadscale-08-11-2025';
// ==========================================================================

// Asset della PWA (percorsi assoluti, niente ?v=… necessari)
const ASSETS = [
  '/CADScale-PWA/',
  '/CADScale-PWA/index.html',
  '/CADScale-PWA/styles.css',
  '/CADScale-PWA/script.js',
  '/CADScale-PWA/manifest.json',
  '/CADScale-PWA/cadscale-16.png',
  '/CADScale-PWA/cadscale-32.png',
  '/CADScale-PWA/cadscale-180.png',
  '/CADScale-PWA/cadscale-192.png',
  '/CADScale-PWA/cadscale-512.png'
];

// Install: cache degli asset di shell
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
    await self.skipWaiting();
  })());
});

// Activate: elimina cache precedenti
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Messaggi dalla pagina (usato dal tuo index.html per SKIP_WAITING)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// Fetch:
//  - HTML/manifest/SW → network-first (per aggiornarsi subito)
//  - il resto → cache-first (veloce/offline)
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Documenti / navigazioni
  if (req.mode === 'navigate' || req.destination === 'document') {
    event.respondWith(networkFirst(req));
    return;
  }

  // Manifest e service worker
  if (url.pathname.endsWith('/manifest.json') || url.pathname.endsWith('/service-worker.js')) {
    event.respondWith(networkFirst(req));
    return;
  }

  // Risorse statiche
  event.respondWith(cacheFirst(req));
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const fresh = await fetch(req, { cache: 'no-store' });
    cache.put(req, fresh.clone());
    return fresh;
  } catch {
    const cached = await cache.match(req);
    return cached || new Response('Offline', { status: 503, statusText: 'Offline' });
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(req);
  if (cached) return cached;
  const fresh = await fetch(req);
  cache.put(req, fresh.clone());
  return fresh;
}
