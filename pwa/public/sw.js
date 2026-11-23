/* Service worker mínimo de CRM-123 (TECHNICAL_SPEC §9.3).
 * Solo hace dos cosas: guarda la pantalla /offline (con sus estilos) y los iconos, y la muestra cuando una
 * navegación falla por falta de conexión. NUNCA guarda /api/*, respuestas de Supabase ni páginas con datos.
 * Sin notificaciones push ni sincronización en segundo plano. */
const CACHE = 'crm123-offline-v1';
const ICONS = ['/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      const response = await fetch('/offline', { cache: 'reload' });
      if (!response.ok) throw new Error('offline no disponible');
      const html = await response.clone().text();
      await cache.put('/offline', response);
      // Estilos y tipografía que usa la propia pantalla /offline, para que se vea igual sin conexión.
      const assets = [...html.matchAll(/(?:href|src)="(\/_next\/static\/[^"]+\.(?:css|woff2))"/g)].map((m) => m[1]);
      await cache.addAll([...ICONS, ...new Set(assets)]);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((name) => name !== CACHE).map((name) => caches.delete(name)));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // nunca se toca Supabase ni otros orígenes
  if (url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(async () => (await caches.match('/offline')) || Response.error()),
    );
    return;
  }
  // Solo se atienden desde la caché los archivos que se guardaron a propósito (iconos y estilos de /offline).
  if (ICONS.includes(url.pathname) || /^\/_next\/static\/.*\.(?:css|woff2)$/.test(url.pathname)) {
    event.respondWith(caches.match(request).then((hit) => hit || fetch(request)));
  }
});
