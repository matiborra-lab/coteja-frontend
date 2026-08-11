import { useEffect, useMemo, useState } from 'react';
import { useMarca } from '../context/MarcaContext';
import { api } from '../api/client';
import { formatoMoneda, formatoFechaHora } from '../utils/formato';
import { sugerirCategoria } from '../utils/categorias';
import { Leyenda, Toast } from '../components/ui';

const SIN_CATEGORIA = 'Sin categoría';
const NUEVA_CATEGORIA = '__nueva__';

// Elegir de las categorias YA EXISTENTES (no texto libre) para que dos
// articulos de la misma categoria no queden separados por un typo - hoy se
// agrupan solo si el texto es identico. Crear una categoria nueva sigue
// siendo posible, pero es una accion explicita ("+ Crear categoría nueva"),
// no algo que pase por escribir distinto sin querer.
function SelectorCategoria({ valor, onChange, categoriasExistentes }) {
  const [creandoNueva, setCreandoNueva] = useState(false);

  if (creandoNueva) {
    return (
      <input
        autoFocus
        placeholder="Nombre de la categoría nueva"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => { if (!valor) setCreandoNueva(false); }}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-coteja-azul-500"
      />
    );
  }

  return (
    <select
      value={categoriasExistentes.includes(valor) ? valor : ''}
      onChange={(e) => {
        if (e.target.value === NUEVA_CATEGORIA) { setCreandoNueva(true); onChange(''); }
        else onChange(e.target.value);
      }}
      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-coteja-azul-500"
    >
      <option value="">Sin categoría</option>
      {categoriasExistentes.map((c) => <option key={c} value={c}>{c}</option>)}
      <option value={NUEVA_CATEGORIA}>+ Crear categoría nueva</option>
    </select>
  );
}

// La edicion de precio a mano vive unicamente en la ventana de la tienda
// (pestaña "Artículos vinculados") - aca el precio es de solo lectura, con
// la fecha de la ultima actualizacion al lado para tener contexto de que
// tan fresco esta.
function FilaVinculo({ vinculo, etiqueta, onQuitar }) {
  const fechaActualizacion = formatoFechaHora(vinculo.ultima_actualizacion);
  return (
    <li className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
      <span>
        <span className="font-medium text-gray-700">{etiqueta}</span>
        <span className="text-gray-500"> · {vinculo.nombre} · </span>
        <span className="text-gray-500">{formatoMoneda(vinculo.ultimo_precio)}</span>
        {fechaActualizacion && <span className="text-gray-400"> · act. {fechaActualizacion}</span>}
      </span>
      <button onClick={onQuitar} className="text-red-600 hover:underline">
        Quitar vínculo
      </button>
    </li>
  );
}

function VinculosDeArticulo({ articulo, onCambio }) {
  async function eliminarVinculo(vinculoId) {
    if (!confirm('¿Quitar este vínculo? El artículo y el producto de la competencia siguen existiendo, solo se desvinculan.')) return;
    await api.del('/api/vinculos/' + vinculoId);
    onCambio();
  }

  const vinculosPropios = articulo.vinculos_propios || [];
  if (vinculosPropios.length === 0 && articulo.competencia.length === 0) {
    return <p className="text-xs text-gray-400 px-4 pb-3">Todavía no tiene ningún producto de la competencia vinculado.</p>;
  }

  return (
    <div className="px-4 pb-3 space-y-2">
      {vinculosPropios.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-semibold uppercase text-gray-400">Tu tienda</p>
          <ul className="space-y-1.5">
            {vinculosPropios.map((v) => (
              <FilaVinculo
                key={v.vinculo_id}
                vinculo={v}
                etiqueta={v.competidor_nombre}
                onQuitar={() => eliminarVinculo(v.vinculo_id)}
              />
            ))}
          </ul>
        </div>
      )}
      {articulo.competencia.length > 0 && (
        <div className="space-y-1.5">
          {vinculosPropios.length > 0 && <p className="text-xs font-semibold uppercase text-gray-400">Competencia</p>}
          <ul className="space-y-1.5">
            {articulo.competencia.map((c) => (
              <FilaVinculo
                key={c.vinculo_id}
                vinculo={c}
                etiqueta={c.competidor_nombre}
                onQuitar={() => eliminarVinculo(c.vinculo_id)}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Ayuda del campo "Orden": el mismo texto se usa aca y en el alta, asi que
// vive en una constante para no repetirlo distinto en cada lado.
const AYUDA_ORDEN =
  'Define en qué posición aparece este artículo en el panel, las alertas y los reportes - ' +
  'el mismo orden se respeta en todas las pantallas y en los mails. Admite números negativos y ' +
  'positivos: el menor va primero (ej: orden 1 antes que orden 2). Si lo dejás vacío, se ordena ' +
  'alfabéticamente.';

function EditorArticulo({ articulo, categoriasExistentes, onCerrar, onCambio, onExito }) {
  const [nombre, setNombre] = useState(articulo.nombre);
  const [categoria, setCategoria] = useState(articulo.categoria || '');
  const [orden, setOrden] = useState(articulo.orden ?? '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function guardar(e) {
    e.preventDefault();
    if (!nombre.trim()) return;
    setError('');
    setGuardando(true);
    try {
      await api.patch('/api/productos-propios/' + articulo.id, {
        nombre,
        categoria: categoria || null,
        orden: orden === '' ? null : Number(orden),
      });
      const categoriaNueva = categoria && !categoriasExistentes.includes(categoria);
      onCerrar();
      onCambio();
      onExito(categoriaNueva ? 'Artículo actualizado. Categoría "' + categoria + '" creada.' : 'Artículo actualizado.');
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="px-4 pb-4 pt-1 space-y-2 bg-gray-50 border-t border-gray-100">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Nombre</label>
          <input
            required
            autoFocus
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
          <SelectorCategoria valor={categoria} onChange={setCategoria} categoriasExistentes={categoriasExistentes} />
        </div>
        <div>
          <label className="flex items-center gap-1 text-xs font-medium text-gray-600 mb-1">
            Orden (opcional)
            <span className="text-gray-400 cursor-help" title={AYUDA_ORDEN}>ⓘ</span>
          </label>
          <input
            type="number"
            step="1"
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
            placeholder="Alfabético"
            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={guardando} className="text-xs bg-coteja-azul-700 hover:bg-coteja-azul-800 disabled:opacity-50 text-white font-medium rounded-lg px-3 py-1.5">
          {guardando ? 'Guardando...' : 'Guardar'}
        </button>
        <button type="button" onClick={onCerrar} className="text-xs text-gray-500 hover:underline">Cancelar</button>
      </div>
    </form>
  );
}

function FilaArticulo({ p, expandido, editando, categoriasExistentes, onToggle, onEditar, onCambio, onExito }) {
  // El vinculo con Mi tienda cuenta igual que uno de competencia - un
  // articulo puede tener SOLO competencia vinculada (para comparar precios
  // entre ellas sin tener el propio todavia) y eso ya cuenta como vinculado.
  const totalVinculados = p.competencia.length + (p.vinculos_propios || []).length;
  return (
    <div>
      <div className="w-full flex items-center hover:bg-gray-50">
        <button
          onClick={onToggle}
          className="flex-1 min-w-0 p-4 flex items-center justify-between text-sm text-left"
        >
          <p className="font-medium text-gray-900 truncate">{p.nombre}</p>
          <div className="flex items-center gap-3 shrink-0 ml-3">
            <p className="font-medium">{formatoMoneda(p.tu_precio)}</p>
            <span className="text-xs text-coteja-azul-700">
              {totalVinculados} vinculado{totalVinculados !== 1 ? 's' : ''} {expandido ? '▲' : '▼'}
            </span>
          </div>
        </button>
        <button
          onClick={onEditar}
          title="Editar artículo"
          className="px-3 self-stretch text-gray-400 hover:text-coteja-azul-700 shrink-0"
        >
          ✎
        </button>
      </div>
      {editando && (
        <EditorArticulo
          articulo={p}
          categoriasExistentes={categoriasExistentes}
          onCerrar={onEditar}
          onCambio={onCambio}
          onExito={onExito}
        />
      )}
      {expandido && <VinculosDeArticulo articulo={p} onCambio={onCambio} />}
    </div>
  );
}

export default function ProductosPropios() {
  const { marcaActualId } = useMarca();
  const [productos, setProductos] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [expandidoId, setExpandidoId] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState('');
  const [categoriaTocadaAMano, setCategoriaTocadaAMano] = useState(false);
  const [orden, setOrden] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [toast, setToast] = useState('');

  async function cargar() {
    const panel = await api.get('/api/panel/' + marcaActualId);
    setProductos(panel);
  }

  useEffect(() => {
    cargar();
  }, [marcaActualId]);

  const categoriasExistentes = useMemo(
    () => [...new Set((productos || []).map((p) => p.categoria).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [productos]
  );

  function onNombreChange(valor) {
    setNombre(valor);
    // Solo autocompleta con una categoria que YA EXISTE - si la sugerencia
    // fuera una categoria nueva, dejarla puesta sin que el usuario la haya
    // confirmado terminaria creandola en silencio al guardar.
    if (!categoriaTocadaAMano) {
      const sugerida = sugerirCategoria(valor);
      if (sugerida && categoriasExistentes.includes(sugerida)) setCategoria(sugerida);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await api.post('/api/productos-propios', {
        marca_id: marcaActualId,
        nombre,
        categoria: categoria || null,
        orden: orden === '' ? null : Number(orden),
      });
      const categoriaNueva = categoria && !categoriasExistentes.includes(categoria);
      setNombre('');
      setCategoria('');
      setCategoriaTocadaAMano(false);
      setOrden('');
      await cargar();
      setToast(categoriaNueva ? 'Artículo cargado. Categoría "' + categoria + '" creada.' : 'Artículo cargado.');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  const filtrados = useMemo(() => {
    if (!productos) return [];
    return productos.filter((p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (p.categoria || '').toLowerCase().includes(busqueda.toLowerCase())
    );
  }, [productos, busqueda]);

  const grupos = useMemo(() => {
    const mapa = new Map();
    for (const p of filtrados) {
      const cat = p.categoria || SIN_CATEGORIA;
      if (!mapa.has(cat)) mapa.set(cat, []);
      mapa.get(cat).push(p);
    }
    return [...mapa.entries()].sort(([a], [b]) => (a === SIN_CATEGORIA ? 1 : b === SIN_CATEGORIA ? -1 : a.localeCompare(b)));
  }, [filtrados]);

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Artículos</h1>

      <form onSubmit={onSubmit} className="bg-white rounded-xl shadow p-4 space-y-3">
        <h2 className="font-medium text-gray-900">Nuevo artículo a cotejar</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-start">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">¿Con qué nombre lo vas a cotejar?</label>
            <input
              required
              value={nombre}
              onChange={(e) => onNombreChange(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-coteja-azul-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría (opcional)</label>
            <SelectorCategoria
              valor={categoria}
              onChange={(v) => { setCategoria(v); setCategoriaTocadaAMano(true); }}
              categoriasExistentes={categoriasExistentes}
            />
          </div>
          <div>
            <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1">
              Orden (opcional)
              <span className="text-gray-400 cursor-help" title={AYUDA_ORDEN}>ⓘ</span>
            </label>
            <input
              type="number"
              step="1"
              value={orden}
              onChange={(e) => setOrden(e.target.value)}
              placeholder="Alfabético"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-coteja-azul-500"
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={cargando} className="w-full bg-coteja-verde-700 hover:bg-coteja-verde-800 disabled:opacity-50 text-white font-medium rounded-lg py-2 transition">
          {cargando ? 'Sumando...' : 'Sumar a mis artículos'}
        </button>
      </form>

      {productos != null && productos.length > 0 && (
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o categoría..."
          className="w-full sm:w-80 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-coteja-azul-500"
        />
      )}

      {productos == null ? (
        <p className="text-gray-400">Cargando...</p>
      ) : productos.length === 0 ? (
        <p className="text-gray-400">Todavía no cargaste ningún artículo.</p>
      ) : grupos.length === 0 ? (
        <p className="text-gray-400">Ningún artículo coincide con "{busqueda}".</p>
      ) : (
        <div className="space-y-4">
          {grupos.map(([categoria, items]) => (
            <div key={categoria}>
              <h3 className="text-xs font-semibold uppercase text-gray-400 mb-1.5 px-1">{categoria}</h3>
              <div className="bg-white rounded-xl shadow divide-y divide-gray-100">
                {items.map((p) => (
                  <FilaArticulo
                    key={p.id}
                    p={p}
                    expandido={expandidoId === p.id}
                    editando={editandoId === p.id}
                    categoriasExistentes={categoriasExistentes}
                    onToggle={() => setExpandidoId((v) => (v === p.id ? null : p.id))}
                    onEditar={() => setEditandoId((v) => (v === p.id ? null : p.id))}
                    onCambio={cargar}
                    onExito={setToast}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {productos != null && productos.length > 0 && (
        <Leyenda>Los precios que requieran actualización manual se tienen que realizar desde la tienda.</Leyenda>
      )}

      {toast && <Toast mensaje={toast} onCerrar={() => setToast('')} />}
    </div>
  );
}
