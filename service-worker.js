// === CADScale SW: cambia SOLO questa riga quando vuoi forzare un refresh ===
const CACHE = 'cadscale-7-11-2025';
// ==========================================================================

// Asset della PWA (percorsi assoluti)
const ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/manifest.json',
  '/cadscale-16.png',
  '/cadscale-32.png',
  '/cadscale-180.png',
  '/cadscale-192.png',
  '/cadscale-512.png',
  '/cadscale-1024.png'
];

// Install: precache
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(ASSETS);
    // niente skipWaiting: il nuovo SW diventa attivo al prossimo riavvio
  })());
});

// Activate: elimina cache precedenti e prendi controllo dei nuovi client
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// Fetch: network-first per HTML/manifest/SW, cache-first per il resto
self.addEventListener('fetch', event => {
  const req = event.request;

  if (req.method !== 'GET') return;

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
