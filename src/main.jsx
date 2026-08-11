import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './utils/pwaInstall.js'
import { setRegistrationPromise } from './utils/push.js'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  // El registro se guarda (no solo se dispara) porque src/utils/push.js lo
  // necesita despues para poder suscribir el dispositivo a notificaciones.
  setRegistrationPromise(
    new Promise((resolve) => {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(resolve);
      });
    })
  );
}
