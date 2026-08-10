// Service worker minimo - solo lo necesario para que el navegador considere
// el sitio instalable (Chrome/Edge exigen un SW registrado con listener de
// fetch). No implementa ninguna estrategia de cache: cada request pasa
// derecho a la red, no hay funcionamiento offline (no se pidio).
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {});
