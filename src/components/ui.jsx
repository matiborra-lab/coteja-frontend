import { useEffect, useState } from 'react';
import { logoDePlataforma } from '../utils/plataformaLogos';
import { api } from '../api/client';
import { parsearCantidad, unidadMedidaLabel } from '../utils/unidadesMedida';

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

// Confirmacion de una accion que ya se completo (guardar, crear) - a
// diferencia del Modal, no bloquea la pantalla: se puede seguir navegando
// mientras esta visible. Se cierra sola a los 4s o al tocarla.
export function Toast({ mensaje, onCerrar }) {
  useEffect(() => {
    const id = setTimeout(onCerrar, 4000);
    return () => clearTimeout(id);
  }, [mensaje, onCerrar]);

  return (
    <div
      onClick={onCerrar}
      className="fixed bottom-4 right-4 z-50 flex items-center gap-2 bg-coteja-verde-50/90 backdrop-blur-sm border border-coteja-verde-300 text-coteja-verde-900 text-sm font-medium px-4 py-3 rounded-lg shadow-lg cursor-pointer max-w-sm"
    >
      <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="shrink-0 text-coteja-verde-700">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.7-9.3a1 1 0 00-1.4-1.4L9 10.6 7.7 9.3a1 1 0 00-1.4 1.4l2 2a1 1 0 001.4 0l4-4z" clipRule="evenodd" />
      </svg>
      <span>{mensaje}</span>
    </div>
  );
}

// Editor inline de "Cantidad" de un vinculo (cuanta cantidad de la unidad
// de medida del articulo representa ese producto) - solo tiene sentido
// cuando la marca tiene permite_ajuste_unidad activo (ver Mi cuenta). Se
// usa tanto en "Artículos vinculados" (Competidores.jsx) como en el
// desplegable de un articulo (ProductosPropios.jsx), por eso vive aca en
// vez de duplicarse en los dos.
export function CantidadEditable({ vinculoId, cantidad, unidadMedida, onGuardado }) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const etiqueta = unidadMedidaLabel(unidadMedida);

  if (!editando) {
    return (
      <button
        type="button"
        onClick={() => { setValor(String(cantidad ?? 1)); setError(''); setEditando(true); }}
        className="text-gray-500 underline decoration-dotted hover:text-coteja-azul-800"
        title="Editar cantidad"
      >
        Cantidad: {cantidad ?? 1} {etiqueta}
      </button>
    );
  }

  async function guardar(e) {
    e.preventDefault();
    const numero = parsearCantidad(valor);
    if (numero === null) {
      setError('Tiene que ser un número mayor a 0.');
      return;
    }
    setGuardando(true);
    try {
      await api.patch('/api/vinculos/' + vinculoId, { cantidad: numero });
      setEditando(false);
      onGuardado();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="inline-flex items-center gap-1 flex-wrap">
      <span className="text-xs text-gray-500">Cantidad:</span>
      <input
        autoFocus
        type="text"
        inputMode="decimal"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        className="w-16 rounded border border-gray-300 px-1.5 py-0.5 text-xs"
      />
      <span className="text-xs text-gray-500">{etiqueta}</span>
      <button type="submit" disabled={guardando} className="text-green-700 hover:underline text-xs">✓</button>
      <button type="button" onClick={() => setEditando(false)} className="text-gray-400 hover:underline text-xs">×</button>
      {error && <span className="text-xs text-red-600 basis-full">{error}</span>}
    </form>
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
