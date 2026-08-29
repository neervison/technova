// Service Worker mínimo de TechNova (patrón reutilizado de PropinasApp).
// Estrategia network-first: siempre intenta la red; si falla (offline),
// usa la caché. NO cachea la API (para no guardar datos/auth).
const CACHE = 'technova-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (req.url.includes('/api/')) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req))
  );
});
