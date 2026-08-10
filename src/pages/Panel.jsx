import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart, Line, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { useMarca } from '../context/MarcaContext';
import { api } from '../api/client';
import { formatoMoneda } from '../utils/formato';

const PERIODOS = [
  { value: 15, label: '15 días' },
  { value: 30, label: '1 mes' },
  { value: 365, label: '1 año' },
];

// Paleta de marca (Manual de marca COTEJA, pag. 09): azul oscuro para la
// serie propia, gris para competidores, verde para el dato destacado
// (el promedio de la competencia, tanto en la barra como en la linea).
const COLOR_MI_TIENDA = '#011c3b';
const COLOR_COMPETENCIA = '#9ca3af';
const COLOR_PROMEDIO = '#02662e';

function formatoFechaCorta(fechaISO) {
  const [, mes, dia] = fechaISO.split('-');
  return String(Number(dia)) + '/' + String(Number(mes));
}

function Diferencia({ producto }) {
  if (producto.diferencia_vs_promedio == null) return <span className="text-gray-400">-</span>;
  const positiva = Number(producto.diferencia_vs_promedio) > 0;
  const color = positiva ? 'text-red-600' : 'text-green-600';
  const porcentaje = producto.diferencia_vs_promedio_porcentaje;
  return (
    <span className={color}>
      {positiva ? '+' : ''}
      {formatoMoneda(producto.diferencia_vs_promedio)}
      {porcentaje != null && (
        <span className="text-xs ml-1">
          ({positiva ? '+' : ''}{Number(porcentaje).toFixed(1)}%)
        </span>
      )}
    </span>
  );
}

function NivelGeneral({ productos }) {
  const conDatos = productos.filter((p) => p.promedio_competencia != null);
  const sinDatos = productos.length - conDatos.length;
  const posicionPromedio = conDatos.length
    ? conDatos.reduce((acc, p) => acc + Number(p.diferencia_vs_promedio_porcentaje || 0), 0) / conDatos.length
    : null;
  const masCaros = conDatos.filter((p) => Number(p.diferencia_vs_promedio) > 0).length;
  const masBaratos = conDatos.filter((p) => Number(p.diferencia_vs_promedio) < 0).length;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500">Posición promedio</p>
          <p className={'text-2xl font-semibold ' + (posicionPromedio == null ? 'text-gray-400' : posicionPromedio > 0 ? 'text-red-600' : 'text-green-600')}>
            {posicionPromedio == null ? '-' : (posicionPromedio > 0 ? '+' : '') + posicionPromedio.toFixed(1) + '%'}
          </p>
          <p className="text-xs text-gray-400">vs. promedio de competencia</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500">Productos más caros</p>
          <p className="text-2xl font-semibold text-gray-900">{masCaros} / {conDatos.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4">
          <p className="text-sm text-gray-500">Productos más baratos</p>
          <p className="text-2xl font-semibold text-gray-900">{masBaratos} / {conDatos.length}</p>
        </div>
      </div>
      {sinDatos > 0 && (
        <p className="text-xs text-gray-400">
          {sinDatos} producto{sinDatos > 1 ? 's' : ''} todavía no {sinDatos > 1 ? 'tienen' : 'tiene'} competencia vinculada - no entra{sinDatos > 1 ? 'n' : ''} en este cálculo.
        </p>
      )}
    </div>
  );
}

function GraficoComparacionTiendas({ productos }) {
  const barras = useMemo(() => {
    const tuPrecios = productos.map((p) => p.tu_precio).filter((v) => v != null);
    const tuPrecio = tuPrecios.length ? tuPrecios.reduce((a, b) => a + b, 0) / tuPrecios.length : null;

    const porTienda = new Map();
    for (const p of productos) {
      for (const c of p.competencia_por_competidor || []) {
        if (!porTienda.has(c.competidor_id)) porTienda.set(c.competidor_id, { nombre: c.competidor_nombre, precios: [] });
        porTienda.get(c.competidor_id).precios.push(c.precio_final);
      }
    }

    const competidores = [];
    for (const t of porTienda.values()) {
      competidores.push({ nombre: t.nombre, precio: t.precios.reduce((a, b) => a + b, 0) / t.precios.length, esPropia: false });
    }

    // Promedio de la competencia como una barra mas (igual al que se ve en
    // la tabla de arriba) - se ubica intercalada segun su valor, no fija al
    // final, y es la unica barra verde (dato destacado, manual de marca).
    if (competidores.length) {
      const promedio = competidores.reduce((a, b) => a + b.precio, 0) / competidores.length;
      competidores.push({ nombre: 'Promedio competencia', precio: promedio, esPromedio: true });
    }
    competidores.sort((a, b) => a.precio - b.precio);

    return [{ nombre: 'Mi tienda', precio: tuPrecio, esPropia: true }, ...competidores];
  }, [productos]);

  const hayDatos = barras.some((b) => b.precio != null);

  return (
    <div className="bg-white rounded-xl shadow p-4 space-y-2">
      <h2 className="font-medium text-gray-900">Comparación entre tiendas</h2>
      {!hayDatos ? (
        <p className="text-sm text-gray-400">Todavía no hay precios suficientes para comparar.</p>
      ) : (
        <div style={{ width: '100%', height: 280 }}>
          <ResponsiveContainer>
            <BarChart data={barras}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="nombre" tick={{ fontSize: 12 }} interval={0} angle={-15} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatoMoneda(v)} width={56} />
              <Tooltip formatter={(v) => formatoMoneda(v)} />
              <Bar dataKey="precio" radius={[4, 4, 0, 0]}>
                {barras.map((b, i) => (
                  <Cell key={i} fill={b.esPropia ? COLOR_MI_TIENDA : b.esPromedio ? COLOR_PROMEDIO : COLOR_COMPETENCIA} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function GraficoEvolucion({ productos, filtroCompetidores, marcaActualId }) {
  const [periodo, setPeriodo] = useState(30);
  const [datos, setDatos] = useState(null);
  const idsProductos = productos.map((p) => p.id).join(',');

  useEffect(() => {
    const params = new URLSearchParams();
    const desde = new Date(Date.now() - periodo * 24 * 60 * 60 * 1000);
    params.set('desde', desde.toISOString());
    if (idsProductos) params.set('producto_propio_ids', idsProductos);
    api.get('/api/panel/' + marcaActualId + '/evolucion?' + params.toString()).then(setDatos);
  }, [marcaActualId, idsProductos, periodo]);

  // El mismo filtro de competencia del bloque de arriba decide que
  // competidores entran en el promedio de este grafico - un solo filtro
  // para toda la pantalla, no uno propio del grafico.
  const competidoresFiltrados = useMemo(() => {
    if (!datos) return [];
    if (filtroCompetidores.length === 0) return datos.competidores;
    return datos.competidores.filter((c) => filtroCompetidores.includes(c.id));
  }, [datos, filtroCompetidores]);

  const puntosGrafico = useMemo(() => {
    if (!datos) return [];
    return datos.puntos.map((punto) => {
      const valores = competidoresFiltrados.map((c) => punto['c_' + c.id]).filter((v) => v != null);
      return {
        fechaLabel: formatoFechaCorta(punto.fecha),
        tu_precio: punto.tu_precio,
        promedio_competencia: valores.length ? valores.reduce((a, b) => a + b, 0) / valores.length : null,
      };
    });
  }, [datos, competidoresFiltrados]);

  return (
    <div className="bg-white rounded-xl shadow p-4 space-y-4">
      <h2 className="font-medium text-gray-900">Evolución de precios</h2>
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex gap-1 ml-auto">
          {PERIODOS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriodo(p.value)}
              className={'text-xs px-2.5 py-1.5 rounded-lg font-medium ' + (periodo === p.value ? 'bg-coteja-azul-100 text-coteja-azul-800' : 'text-gray-500 hover:bg-gray-100')}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {datos == null ? (
        <p className="text-sm text-gray-400">Cargando gráfico...</p>
      ) : puntosGrafico.length === 0 ? (
        <p className="text-sm text-gray-400">Todavía no hay suficiente historial para graficar este período.</p>
      ) : (
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <LineChart data={puntosGrafico}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="fechaLabel" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => formatoMoneda(v)} width={56} />
              <Tooltip formatter={(v) => formatoMoneda(v)} />
              <Legend />
              <Line type="monotone" dataKey="tu_precio" name="Tu precio" stroke={COLOR_MI_TIENDA} strokeWidth={2} connectNulls dot={{ r: 3 }} />
              <Line type="monotone" dataKey="promedio_competencia" name="Promedio competencia" stroke={COLOR_PROMEDIO} strokeWidth={2} connectNulls dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function SeccionGraficos({ productos, filtroCompetidores, marcaActualId }) {
  return (
    <div className="space-y-4">
      <GraficoComparacionTiendas productos={productos} />
      <GraficoEvolucion productos={productos} filtroCompetidores={filtroCompetidores} marcaActualId={marcaActualId} />
    </div>
  );
}

export default function Panel() {
  const { marcaActualId } = useMarca();
  const [productos, setProductos] = useState(null);
  const [vista, setVista] = useState('articulo');
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtroCategorias, setFiltroCategorias] = useState([]);
  const [filtroCompetidores, setFiltroCompetidores] = useState([]);
  const [filtroProductos, setFiltroProductos] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    setProductos(null);
    api.get('/api/panel/' + marcaActualId).then(setProductos).catch((e) => setError(e.message));
  }, [marcaActualId]);

  // Facetas disponibles para el filtro desplegable - se calculan sobre
  // TODOS los productos (no los ya filtrados), asi las opciones no
  // desaparecen apenas se elige una.
  const categoriasDisponibles = useMemo(() => {
    if (!productos) return [];
    return [...new Set(productos.map((p) => p.categoria).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  }, [productos]);

  const competidoresDisponibles = useMemo(() => {
    if (!productos) return [];
    const mapa = new Map();
    for (const p of productos) {
      for (const c of p.competencia_por_competidor || []) {
        if (!mapa.has(c.competidor_id)) mapa.set(c.competidor_id, c.competidor_nombre);
      }
    }
    return [...mapa.entries()].map(([id, nombre]) => ({ id, nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [productos]);

  const productosDisponibles = useMemo(() => {
    if (!productos) return [];
    return [...productos].map((p) => ({ id: p.id, nombre: p.nombre })).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [productos]);

  function alternar(lista, setLista, valor) {
    setLista(lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor]);
  }

  const productosFiltrados = useMemo(() => {
    if (!productos) return [];
    const q = busqueda.toLowerCase();
    const filtrados = productos.filter((p) => {
      if (q && !(p.nombre.toLowerCase().includes(q) || (p.categoria || '').toLowerCase().includes(q))) return false;
      if (filtroCategorias.length > 0 && !filtroCategorias.includes(p.categoria)) return false;
      if (filtroProductos.length > 0 && !filtroProductos.includes(p.id)) return false;
      if (filtroCompetidores.length > 0) {
        const tieneAlguno = (p.competencia_por_competidor || []).some((c) => filtroCompetidores.includes(c.competidor_id));
        if (!tieneAlguno) return false;
      }
      return true;
    });

    if (filtroCompetidores.length === 0) return filtrados;

    // Con el filtro de competencia activo, "Promedio" y "Diferencia" tienen
    // que reflejar solo a los competidores elegidos - si no, quedarian
    // mostrando un promedio que no coincide con la unica columna visible.
    return filtrados.map((p) => {
      const competencia = (p.competencia_por_competidor || []).filter((c) => filtroCompetidores.includes(c.competidor_id));
      const promedio = competencia.length ? competencia.reduce((acc, c) => acc + c.precio_final, 0) / competencia.length : null;
      const tuPrecio = p.tu_precio != null ? Number(p.tu_precio) : null;
      const diferencia = promedio !== null && tuPrecio !== null ? tuPrecio - promedio : null;
      return {
        ...p,
        competencia_por_competidor: competencia,
        promedio_competencia: promedio,
        diferencia_vs_promedio: diferencia,
        diferencia_vs_promedio_porcentaje: diferencia !== null && promedio ? (diferencia / promedio) * 100 : null,
      };
    });
  }, [productos, busqueda, filtroCategorias, filtroProductos, filtroCompetidores]);

  // Une, sin repetir, todos los competidores que aparecen vinculados en
  // algun articulo del set filtrado - se usan como columnas de la tabla en
  // vez de una lista adentro de una sola celda "Competencia". Si el
  // filtro de competencia esta activo, las columnas quedan acotadas a lo
  // elegido aunque algun producto tenga otras vinculadas.
  const competidoresColumnas = useMemo(() => {
    const mapa = new Map();
    for (const p of productosFiltrados) {
      for (const c of p.competencia_por_competidor || []) {
        if (filtroCompetidores.length > 0 && !filtroCompetidores.includes(c.competidor_id)) continue;
        if (!mapa.has(c.competidor_id)) mapa.set(c.competidor_id, c.competidor_nombre);
      }
    }
    return [...mapa.entries()]
      .map(([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));
  }, [productosFiltrados, filtroCompetidores]);

  const filtrosActivos = filtroCategorias.length + filtroCompetidores.length + filtroProductos.length;

  if (error) return <p className="text-red-600">{error}</p>;
  if (!productos) return <p className="text-gray-400">Cargando...</p>;

  if (productos.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="mb-2">Todavía no cargaste ningún artículo propio.</p>
        <Link to="/productos" className="text-coteja-azul-700 hover:underline text-sm">
          Empezá agregando tus artículos →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Panel de precios</h1>
        <div className="flex gap-1">
          <button
            onClick={() => setVista('articulo')}
            className={'text-sm px-3 py-1.5 rounded-lg font-medium ' + (vista === 'articulo' ? 'bg-coteja-azul-100 text-coteja-azul-800' : 'text-gray-500 hover:bg-gray-100')}
          >
            Por artículo
          </button>
          <button
            onClick={() => setVista('general')}
            className={'text-sm px-3 py-1.5 rounded-lg font-medium ' + (vista === 'general' ? 'bg-coteja-azul-100 text-coteja-azul-800' : 'text-gray-500 hover:bg-gray-100')}
          >
            Nivel general
          </button>
        </div>
      </div>

      {vista === 'general' ? (
        <NivelGeneral productos={productosFiltrados} />
      ) : (
        <>
          <div className="flex items-center gap-2">
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o categoría..."
              className="w-full sm:w-80 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-coteja-azul-500"
            />
            {(categoriasDisponibles.length > 0 || competidoresDisponibles.length > 0 || productosDisponibles.length > 0) && (
              <button
                type="button"
                onClick={() => setMostrarFiltros((v) => !v)}
                className={
                  'flex items-center gap-1.5 text-sm rounded-lg border px-3 py-2 whitespace-nowrap ' +
                  (filtrosActivos > 0 ? 'border-coteja-azul-300 bg-coteja-azul-50 text-coteja-azul-800' : 'border-gray-300 text-gray-600 hover:bg-gray-50')
                }
              >
                <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M2 4a1 1 0 011-1h14a1 1 0 01.8 1.6l-5.8 7.73V17a1 1 0 01-1.45.9l-3-1.5A1 1 0 017 15.5v-3.17L1.2 4.6A1 1 0 012 4z" />
                </svg>
                Filtros
                {filtrosActivos > 0 && (
                  <span className="bg-coteja-azul-800 text-white text-[10px] font-semibold rounded-full w-4 h-4 flex items-center justify-center">
                    {filtrosActivos}
                  </span>
                )}
              </button>
            )}
          </div>

          {mostrarFiltros && (
            <div className="bg-white rounded-xl shadow p-3 space-y-3">
              {categoriasDisponibles.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-1.5">Categoría</p>
                  <div className="flex flex-wrap gap-1.5">
                    {categoriasDisponibles.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => alternar(filtroCategorias, setFiltroCategorias, cat)}
                        className={
                          'text-xs px-2.5 py-1 rounded-full border ' +
                          (filtroCategorias.includes(cat) ? 'bg-coteja-azul-100 border-coteja-azul-400 text-coteja-azul-900 font-medium' : 'border-gray-300 text-gray-600 hover:bg-gray-50')
                        }
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {competidoresDisponibles.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-1.5">Competencia</p>
                  <div className="flex flex-wrap gap-1.5">
                    {competidoresDisponibles.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => alternar(filtroCompetidores, setFiltroCompetidores, c.id)}
                        className={
                          'text-xs px-2.5 py-1 rounded-full border ' +
                          (filtroCompetidores.includes(c.id) ? 'bg-coteja-azul-100 border-coteja-azul-400 text-coteja-azul-900 font-medium' : 'border-gray-300 text-gray-600 hover:bg-gray-50')
                        }
                      >
                        {c.nombre}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {productosDisponibles.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-1.5">Producto</p>
                  <div className="flex flex-wrap gap-1.5">
                    {productosDisponibles.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => alternar(filtroProductos, setFiltroProductos, p.id)}
                        className={
                          'text-xs px-2.5 py-1 rounded-full border ' +
                          (filtroProductos.includes(p.id) ? 'bg-coteja-azul-100 border-coteja-azul-400 text-coteja-azul-900 font-medium' : 'border-gray-300 text-gray-600 hover:bg-gray-50')
                        }
                      >
                        {p.nombre}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {filtrosActivos > 0 && (
                <button
                  type="button"
                  onClick={() => { setFiltroCategorias([]); setFiltroCompetidores([]); setFiltroProductos([]); }}
                  className="text-xs text-coteja-azul-700 hover:underline"
                >
                  Limpiar filtros
                </button>
              )}
            </div>
          )}

          <div className="hidden md:block bg-white rounded-xl shadow overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Categoría</th>
                  <th className="px-4 py-3 font-medium">Artículo</th>
                  <th className="px-4 py-3 font-medium">Tu precio</th>
                  {competidoresColumnas.map((col) => (
                    <th key={col.id} className="px-4 py-3 font-medium whitespace-nowrap">{col.nombre}</th>
                  ))}
                  <th className="px-4 py-3 font-medium">Promedio competencia</th>
                  <th className="px-4 py-3 font-medium">Diferencia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {productosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={5 + competidoresColumnas.length} className="px-4 py-6 text-center text-gray-400">
                      Ningún artículo coincide con "{busqueda}".
                    </td>
                  </tr>
                ) : (
                  productosFiltrados.map((p) => (
                    <tr key={p.id}>
                      <td className="px-4 py-3 align-top text-gray-500">{p.categoria || 'Sin categoría'}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 align-top">{p.nombre}</td>
                      <td className="px-4 py-3 align-top">{formatoMoneda(p.tu_precio)}</td>
                      {competidoresColumnas.map((col) => {
                        const c = (p.competencia_por_competidor || []).find((c) => c.competidor_id === col.id);
                        return (
                          <td key={col.id} className="px-4 py-3 align-top whitespace-nowrap">
                            {c ? (
                              <>
                                {formatoMoneda(c.precio_final)}
                                {c.en_promocion && (
                                  <span className="ml-1 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">promo</span>
                                )}
                                {c.con_incidencia && (
                                  <span className="ml-1 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">revisar</span>
                                )}
                              </>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 align-top font-bold">{formatoMoneda(p.promedio_competencia)}</td>
                      <td className="px-4 py-3 align-top"><Diferencia producto={p} /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {productosFiltrados.length === 0 ? (
              <p className="bg-white rounded-xl shadow p-4 text-center text-gray-400 text-sm">
                Ningún artículo coincide con "{busqueda}".
              </p>
            ) : (
              productosFiltrados.map((p) => (
                <div key={p.id} className="bg-white rounded-xl shadow p-4 space-y-2 text-sm">
                  <div>
                    <p className="font-medium text-gray-900">{p.nombre}</p>
                    <p className="text-xs text-gray-500">{p.categoria || 'Sin categoría'}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Tu precio</span>
                    <span>{formatoMoneda(p.tu_precio)}</span>
                  </div>
                  {competidoresColumnas.map((col) => {
                    const c = (p.competencia_por_competidor || []).find((c) => c.competidor_id === col.id);
                    return (
                      <div key={col.id} className="flex items-center justify-between">
                        <span className="text-gray-500">{col.nombre}</span>
                        <span>
                          {c ? (
                            <>
                              {formatoMoneda(c.precio_final)}
                              {c.en_promocion && (
                                <span className="ml-1 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded">promo</span>
                              )}
                              {c.con_incidencia && (
                                <span className="ml-1 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">revisar</span>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </span>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <span className="text-gray-500">Promedio competencia</span>
                    <span className="font-bold">{formatoMoneda(p.promedio_competencia)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-500">Diferencia</span>
                    <Diferencia producto={p} />
                  </div>
                </div>
              ))
            )}
          </div>

          <SeccionGraficos productos={productosFiltrados} filtroCompetidores={filtroCompetidores} marcaActualId={marcaActualId} />
        </>
      )}
    </div>
  );
}
