// Suscripcion a notificaciones push (Web Push / VAPID) - sin ningun
// servicio de terceros, el estandar que ya traen los navegadores alcanza.
// El registro del Service Worker se guarda una sola vez a nivel de modulo
// (mismo patron que pwaInstall.js) para que cualquier componente lo pueda
// usar despues sin tener que volver a registrarlo.
//
// OJO iOS: Safari solo entrega push si el sitio esta instalado como app
// (Agregar a inicio) - desde una pestaña normal del navegador no hay forma
// de activarlo, es una restriccion de Apple. En Android/escritorio andan
// igual, instalada o no.
import { api } from '../api/client';

let registrationPromise = null;

export function setRegistrationPromise(promise) {
  registrationPromise = promise;
}

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function pushDisponible() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

export async function estaSuscripto() {
  if (!pushDisponible() || !registrationPromise) return false;
  const registration = await registrationPromise;
  const sub = await registration.pushManager.getSubscription();
  return !!sub;
}

export async function suscribirsePush() {
  if (!pushDisponible()) throw new Error('Este navegador no soporta notificaciones push.');
  if (Notification.permission === 'denied') {
    throw new Error('Bloqueaste las notificaciones para este sitio - habilitalas desde la configuración del navegador.');
  }
  const permiso = await Notification.requestPermission();
  if (permiso !== 'granted') throw new Error('No diste permiso para recibir notificaciones.');

  const registration = await registrationPromise;
  const { clave } = await api.get('/api/push/clave-publica');
  let sub = await registration.pushManager.getSubscription();
  if (!sub) {
    sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(clave),
    });
  }
  const data = sub.toJSON();
  await api.post('/api/push/suscripcion', { endpoint: data.endpoint, keys: data.keys });
}

export async function desuscribirsePush() {
  if (!registrationPromise) return;
  const registration = await registrationPromise;
  const sub = await registration.pushManager.getSubscription();
  if (!sub) return;
  await api.del('/api/push/suscripcion', { endpoint: sub.endpoint }).catch(() => {});
  await sub.unsubscribe();
}
