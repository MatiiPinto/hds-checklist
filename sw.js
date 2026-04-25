/* ═══════════════════════════════════════════════════════════
   Service Worker — Checklist Farmacia HDS
   Versión: 2.0 · Hospital del Salvador
   Estrategia: Cache-first para todos los assets estáticos
═══════════════════════════════════════════════════════════ */

const CACHE_NAME = 'hds-checklist-v2';
const ASSETS = [
  './index.html',
  './manifest.json',
];

// Instalar: pre-cachear assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activar: limpiar caches antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache-first, luego red
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        // Cachear respuestas OK de same-origin
        if (response.ok && event.request.url.startsWith(self.location.origin)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
    })
  );
});
