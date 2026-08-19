import { useState } from 'react';
import { useMarca } from '../context/MarcaContext';
import { Modal, Boton } from './ui';

const WHATSAPP_SOPORTE = '5493512380620';

function IconoAuriculares({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M4 13v-1a8 8 0 0116 0v1" />
      <rect x="2.5" y="13" width="4" height="6" rx="1.5" />
      <rect x="17.5" y="13" width="4" height="6" rx="1.5" />
      <path d="M19.5 19v.5a3.5 3.5 0 01-3.5 3.5h-2" />
    </svg>
  );
}

function IconoWhatsapp({ className }) {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" className={className} aria-hidden="true">
      <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.24.08.38-.058 1.171-.48 1.337-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
    </svg>
  );
}

// Boton flotante de soporte, fijo en la esquina - vive solo dentro del
// Centro de ayuda (se monta desde Ayuda.jsx), no en toda la app. El
// mensaje de WhatsApp arma la marca solo automaticamente (marcaActual del
// contexto) - el usuario nunca la tipea a mano.
export default function SoporteFlotante() {
  const { marcaActual } = useMarca();
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState('');
  const [consulta, setConsulta] = useState('');
  const [error, setError] = useState('');

  function cerrar() {
    setAbierto(false);
    setNombre('');
    setConsulta('');
    setError('');
  }

  function enviar(e) {
    e.preventDefault();
    if (!nombre.trim() || !consulta.trim()) {
      setError('Completá tu nombre y la consulta para poder comunicarte con soporte.');
      return;
    }
    const marca = marcaActual?.nombre || null;
    const mensaje = marca
      ? `Hola, soy ${nombre.trim()} de ${marca}. Me comunico por la siguiente consulta: ${consulta.trim()}.`
      : `Hola, soy ${nombre.trim()}. Me comunico por la siguiente consulta: ${consulta.trim()}.`;
    window.open('https://wa.me/' + WHATSAPP_SOPORTE + '?text=' + encodeURIComponent(mensaje), '_blank', 'noopener,noreferrer');
    cerrar();
  }

  return (
    <>
      <button
        onClick={() => setAbierto(true)}
        aria-label="Soporte"
        title="Soporte"
        className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full bg-coteja-verde-700 hover:bg-coteja-verde-800 text-white shadow-lg flex items-center justify-center transition"
      >
        <IconoAuriculares className="w-6 h-6" />
      </button>

      {abierto && (
        <Modal titulo="Comunicate con soporte" onClose={cerrar}>
          <form onSubmit={enviar} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tu nombre</label>
              <input
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-coteja-azul-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Describí brevemente tu consulta</label>
              <textarea
                required
                rows={3}
                value={consulta}
                onChange={(e) => setConsulta(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-coteja-azul-500 resize-none"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Boton type="submit">
              <span className="inline-flex items-center justify-center gap-2">
                <IconoWhatsapp className="w-4 h-4" />
                Comunicar con soporte
              </span>
            </Boton>

            <p className="text-xs text-gray-400 text-center">Horario de atención: lunes a viernes de 9:00 a 18:00 hs.</p>
            <p className="text-xs text-gray-400 text-center">
              Para consultas sobre el uso del sistema, podés consultar las guías disponibles en el Centro de Ayuda.
            </p>
          </form>
        </Modal>
      )}
    </>
  );
}
