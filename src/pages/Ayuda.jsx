import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SECCIONES, todosLosArticulos } from './ayuda/contenido';

function Indice() {
  const { usuario } = useAuth();
  const secciones = useMemo(
    () => SECCIONES
      .map((s) => ({ ...s, articulos: s.articulos.filter((a) => !a.soloMultimarca || usuario.tipo_cuenta === 'MULTIMARCA') }))
      .filter((s) => s.articulos.length > 0),
    [usuario.tipo_cuenta]
  );

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <p className="text-coteja-verde-700 text-xs font-semibold uppercase tracking-widest">Centro de ayuda</p>
        <h1 className="text-2xl font-bold text-coteja-azul-900 mt-1">Aprendé a usar COTEJA</h1>
        <p className="text-gray-500 mt-2">
          Guías paso a paso de cada parte de la plataforma. Empezá por "Primeros pasos" si es tu primera vez.
        </p>
      </div>

      {secciones.map((seccion) => (
        <div key={seccion.id}>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{seccion.titulo}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {seccion.articulos.map((a) => (
              <Link
                key={a.id}
                to={'/ayuda/' + a.id}
                className="block bg-white rounded-xl border border-gray-100 shadow-sm p-4 hover:border-coteja-verde-300 hover:shadow-md transition"
              >
                <p className="font-medium text-gray-900">{a.titulo}</p>
                <p className="text-sm text-gray-500 mt-1">{a.resumen}</p>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Articulo({ articuloId }) {
  const { usuario } = useAuth();
  const lista = useMemo(() => todosLosArticulos(usuario.tipo_cuenta), [usuario.tipo_cuenta]);
  const idx = lista.findIndex((a) => a.id === articuloId);
  const articulo = lista[idx];
  const anterior = idx > 0 ? lista[idx - 1] : null;
  const siguiente = idx >= 0 && idx < lista.length - 1 ? lista[idx + 1] : null;

  if (!articulo) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <p className="text-gray-400">No encontramos ese artículo.</p>
        <Link to="/ayuda" className="text-coteja-azul-700 underline text-sm mt-2 inline-block">← Volver al índice</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Link to="/ayuda" className="text-xs text-coteja-azul-700 hover:underline">← Volver al índice</Link>
        <p className="text-coteja-verde-700 text-xs font-semibold uppercase tracking-widest mt-3">{articulo.seccionTitulo}</p>
        <h1 className="text-xl font-bold text-coteja-azul-900 mt-1">{articulo.titulo}</h1>
      </div>

      <div className="space-y-8">
        {articulo.pasos.map((paso, i) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-5 h-5 rounded-full bg-coteja-azul-800 text-white text-[11px] font-semibold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <h3 className="font-medium text-gray-900">{paso.titulo}</h3>
              </div>
              {paso.texto && <p className="text-sm text-gray-600 leading-relaxed">{paso.texto}</p>}
            </div>
            {paso.mock && <div>{paso.mock}</div>}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-6 border-t border-gray-100 text-sm">
        {anterior ? (
          <Link to={'/ayuda/' + anterior.id} className="text-coteja-azul-700 hover:underline">← {anterior.titulo}</Link>
        ) : <span />}
        {siguiente ? (
          <Link to={'/ayuda/' + siguiente.id} className="text-coteja-azul-700 hover:underline text-right">{siguiente.titulo} →</Link>
        ) : <span />}
      </div>
    </div>
  );
}

export default function Ayuda() {
  const { articuloId } = useParams();
  return articuloId ? <Articulo articuloId={articuloId} /> : <Indice />;
}
