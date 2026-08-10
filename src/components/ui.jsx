import { useState } from 'react';
import { logoDePlataforma } from '../utils/plataformaLogos';

// Miniatura de la plataforma de una tienda de competencia (FUDO, Cucina
// Link, etc.). Si el nombre no matchea ninguna de las integradas (o el
// archivo no carga), cae al isotipo de COTEJA en gris como generico -
// nunca se deja el espacio vacio.
export function LogoPlataforma({ plataforma, className = 'w-8 h-8' }) {
  const ruta = logoDePlataforma(plataforma);
  const [error, setError] = useState(false);

  if (!ruta || error) {
    return (
      <img
        src="/brand/coteja_isotipo.png"
        alt={plataforma || 'Plataforma no identificada'}
        title={plataforma || 'Plataforma no identificada'}
        className={className + ' object-contain rounded shrink-0'}
        style={{ filter: 'grayscale(1) opacity(60%)' }}
      />
    );
  }

  return (
    <img
      src={ruta}
      alt={plataforma}
      title={plataforma}
      className={className + ' object-contain rounded shrink-0'}
      onError={() => setError(true)}
    />
  );
}

export function Campo({ label, ...props }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        {...props}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-coteja-azul-500"
      />
    </div>
  );
}

export function Boton({ cargando, children, ...props }) {
  return (
    <button
      {...props}
      disabled={cargando || props.disabled}
      className="w-full bg-coteja-verde-700 hover:bg-coteja-verde-800 disabled:opacity-50 text-white font-medium rounded-lg py-2 transition"
    >
      {children}
    </button>
  );
}

export function Modal({ titulo, onClose, children, ancho = 'max-w-lg' }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-4 overflow-y-auto z-50" onClick={onClose}>
      <div
        className={'bg-white rounded-xl shadow-xl w-full ' + ancho + ' mt-4 md:mt-12'}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="font-medium text-gray-900">{titulo}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

// Aclaracion informativa, discreta y traslucida - para notas de contexto
// que no hace falta que el usuario confirme, solo que las tenga presentes.
export function Leyenda({ children }) {
  return (
    <p className="flex items-start gap-1.5 text-xs text-gray-500 bg-gray-50/70 border border-gray-100 rounded-lg px-2.5 py-1.5">
      <span className="shrink-0 leading-none">ⓘ</span>
      <span>{children}</span>
    </p>
  );
}

export function AuthCard({ titulo, subtitulo, children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-coteja-azul-900 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <img src="/brand/coteja_logo_primary.png" alt="COTEJA" className="h-32 mx-auto mb-4" />
        {titulo && <h1 className="text-2xl font-semibold text-gray-900 mb-1 text-center">{titulo}</h1>}
        {subtitulo && <p className="text-sm text-gray-500 mb-6 text-center">{subtitulo}</p>}
        {children}
      </div>
    </div>
  );
}
