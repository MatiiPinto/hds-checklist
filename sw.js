/* ═══════════════════════════════════════════════════════════
   Service Worker — Checklist Farmacia HDS
   Versión: 3.0 · Hospital del Salvador
   Estrategia: Network-first para index.html, cache-first resto
═══════════════════════════════════════════════════════════ */

const CACHE_NAME = 'hds-checklist-v3';
const ASSETS = [
  './index.html',
  './manifest.json',
];

// Instalar: pre-cachear assets desde la red (siempre frescos)
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting(); // Activa inmediatamente sin esperar
});

// Activar: eliminar TODOS los caches anteriores
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('[SW] Eliminando cache viejo:', k);
          return caches.delete(k);
        })
      )
    ).then(() => self.clients.claim()) // Toma control de todos los clientes
  );
});

// Fetch: network-first para index.html (siempre actualizado), cache-first para el resto
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  const isPage = url.pathname.endsWith('/') || url.pathname.endsWith('index.html');

  if (isPage) {
    // Network-first para la página principal
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Cache-first para otros assets
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(response => {
          if (response.ok && event.request.url.startsWith(self.location.origin)) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        }).catch(() => cached);
      })
    );
  }
});
