import { useEffect, useState } from 'react';
import { Modal } from './ui';
import { obtenerPromptCapturado, suscribirsePrompt } from '../utils/pwaInstall';

function esIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function yaInstalada() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

// Boton de "instalar como app" en el header. En Chrome/Edge (desktop y
// Android) dispara el prompt nativo del navegador via beforeinstallprompt -
// no hace falta UI propia, el sistema operativo se encarga de anclarla. Ese
// evento se captura en src/utils/pwaInstall.js (importado antes de montar
// la app en main.jsx) porque Chrome puede dispararlo antes de que este
// componente llegue a montarse - ahi se lee lo que ya se haya capturado, y
// tambien se suscribe por si todavia no disparo.
// iOS Safari nunca dispara ese evento, asi que ahi el clic muestra las
// instrucciones manuales (Compartir -> Agregar a pantalla de inicio). Si
// no hay prompt nativo disponible y no es iOS (navegador sin soporte), el
// boton no se muestra - no hay ninguna accion util que ofrecer.
export default function InstalarApp() {
  const [prompt, setPrompt] = useState(() => obtenerPromptCapturado());
  const [mostrarInstrucciones, setMostrarInstrucciones] = useState(false);
  const [instalada, setInstalada] = useState(true);

  useEffect(() => {
    setInstalada(yaInstalada());
    return suscribirsePrompt(setPrompt);
  }, []);

  if (instalada) return null;
  if (!prompt && !esIOS()) return null;

  async function onClick() {
    if (prompt) {
      prompt.prompt();
      await prompt.userChoice;
      setPrompt(null);
    } else {
      setMostrarInstrucciones(true);
    }
  }

  return (
    <>
      <button
        onClick={onClick}
        aria-label="Instalar app"
        title="Instalar COTEJA como app"
        className="text-gray-500 hover:text-gray-700 p-1"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M7 16a4 4 0 01-.5-7.97A5 5 0 0116.9 6.34 4 4 0 0118 14h-1" />
          <path d="M12 12v6" />
          <path d="M9 15l3 3 3-3" />
        </svg>
      </button>

      {mostrarInstrucciones && (
        <Modal titulo="Instalar COTEJA" onClose={() => setMostrarInstrucciones(false)}>
          <div className="space-y-4 text-sm text-gray-700">
            <img src="/brand/coteja_pwa_icon_192.png" alt="COTEJA" className="w-14 h-14 rounded-xl mx-auto" />
            <p className="text-center">Instalá COTEJA en tu pantalla de inicio para acceder más rápido, como una app.</p>
            <ol className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-coteja-azul-100 text-coteja-azul-800 text-xs font-semibold">1</span>
                <span>Tocá el ícono <strong>Compartir</strong> (el cuadrado con la flecha hacia arriba) en la barra del navegador.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-coteja-azul-100 text-coteja-azul-800 text-xs font-semibold">2</span>
                <span>Deslizá hacia abajo y tocá <strong>"Agregar a pantalla de inicio"</strong>.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-coteja-azul-100 text-coteja-azul-800 text-xs font-semibold">3</span>
                <span>Tocá <strong>"Agregar"</strong> para confirmar.</span>
              </li>
            </ol>
          </div>
        </Modal>
      )}
    </>
  );
}
