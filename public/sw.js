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

// Notificacion push (Web Push) - el payload lo arma el backend en
// src/push/index.js, mensajeCambiosPush(): { titulo, cuerpo, url }.
self.addEventListener('push', (event) => {
  let datos = { titulo: 'COTEJA', cuerpo: 'Tenés novedades.', url: '/' };
  try {
    if (event.data) datos = { ...datos, ...event.data.json() };
  } catch {
    // Si el payload no es JSON valido, se muestra igual con el texto default.
  }

  event.waitUntil(
    self.registration.showNotification(datos.titulo, {
      body: datos.cuerpo,
      icon: '/brand/coteja_pwa_icon_192.png',
      badge: '/brand/coteja_pwa_icon_192.png',
      data: { url: datos.url || '/' },
    })
  );
});

// Al tocar la notificacion: si ya hay una pestaña de COTEJA abierta, la
// enfoca y la navega ahi mismo; si no, abre una nueva.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((lista) => {
      for (const cliente of lista) {
        if ('focus' in cliente) {
          cliente.navigate(url);
          return cliente.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
