import { useEffect, useMemo, useState } from 'react';
import { useMarca } from '../context/MarcaContext';
import { api } from '../api/client';
import { formatoMoneda } from '../utils/formato';

const API_URL = import.meta.env.VITE_API_URL;
const POR_PAGINA = 30;
const RANGO_MAXIMO_DIAS = 31;

const RANGOS = [
  { value: 1, label: 'Hoy' },
  { value: 7, label: '7 días' },
  { value: 15, label: '15 días' },
  { value: 30, label: 'Último mes' },
];

function formatoFechaHora(fechaISO) {
  return new Date(fechaISO).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
}

function formatoFechaSeccion(fechaISO) {
  const texto = new Date(fechaISO).toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Misma convencion que ya usan los mails de alerta (src/mailer/plantillas.js):
// verde+flecha arriba cuando el precio sube, rojo+flecha abajo cuando baja -
// es la direccion del cambio, no un juicio de "favorable" (aca se mezclan
// cambios propios y de competencia, donde "favorable" significaria cosas
// distintas para cada uno).
function Diferencia({ anterior, actual }) {
  const monto = actual - anterior;
  const porcentaje = anterior !== 0 ? (monto / anterior) * 100 : 0;
  const sube = monto > 0;
  const color = sube ? 'text-green-600' : 'text-red-600';
  return (
    <span className={color}>
      {sube ? '▲' : '▼'} {sube ? '+' : ''}{formatoMoneda(monto)}
      <span className="text-xs ml-1">({sube ? '+' : ''}{porcentaje.toFixed(1)}%)</span>
    </span>
  );
}

// Agrupa el feed plano que devuelve el backend (ya ordenado por fecha DESC)
// en secciones por dia y, adentro de cada dia, por tienda - el pedido era
// "agrupado por fechas y por competencia si hubo mas de un cambio".
function agruparPorFechaYTienda(cambios) {
  const porFecha = new Map();
  for (const c of cambios) {
    const clave = new Date(c.fecha).toISOString().slice(0, 10);
    if (!porFecha.has(clave)) porFecha.set(clave, { fecha: c.fecha, porTienda: new Map() });
    const dia = porFecha.get(clave);
    if (!dia.porTienda.has(c.competidor_nombre)) dia.porTienda.set(c.competidor_nombre, []);
    dia.porTienda.get(c.competidor_nombre).push(c);
  }
  return [...porFecha.values()].sort((a, b) => b.fecha.localeCompare(a.fecha));
}

export default function Actividad() {
  const { marcaActualId } = useMarca();
  const [productos, setProductos] = useState(null);
  const [rango, setRango] = useState(7);
  const [personalizado, setPersonalizado] = useState(false);
  const [desdePersonalizado, setDesdePersonalizado] = useState('');
  const [hastaPersonalizado, setHastaPersonalizado] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtroCategorias, setFiltroCategorias] = useState([]);
  const [filtroCompetidores, setFiltroCompetidores] = useState([]);
  const [filtroProductos, setFiltroProductos] = useState([]);
  const [pagina, setPagina] = useState(1);
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState('');
  const [exportando, setExportando] = useState(false);

  useEffect(() => {
    api.get('/api/panel/' + marcaActualId).then(setProductos).catch(() => setProductos([]));
  }, [marcaActualId]);

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

  // Sin sort propio a proposito: "productos" ya viene ordenado por el
  // backend segun el orden de visualizacion que carga el cliente (o
  // alfabetico si no cargo ninguno) - se respeta el mismo orden aca.
  const productosDisponibles = useMemo(() => {
    if (!productos) return [];
    return productos.map((p) => ({ id: p.id, nombre: p.nombre }));
  }, [productos]);

  function alternar(lista, setLista, valor) {
    setLista(lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor]);
  }

  const { desdeISO, hastaISO } = useMemo(() => {
    if (personalizado && desdePersonalizado && hastaPersonalizado) {
      const desde = new Date(desdePersonalizado);
      const hasta = new Date(new Date(hastaPersonalizado).getTime() + 24 * 60 * 60 * 1000 - 1);
      return { desdeISO: desde.toISOString(), hastaISO: hasta.toISOString() };
    }
    const hasta = new Date();
    const desde = new Date(hasta.getTime() - rango * 24 * 60 * 60 * 1000);
    return { desdeISO: desde.toISOString(), hastaISO: hasta.toISOString() };
  }, [personalizado, desdePersonalizado, hastaPersonalizado, rango]);

  useEffect(() => {
    setPagina(1);
  }, [desdeISO, hastaISO, filtroCategorias, filtroCompetidores, filtroProductos]);

  useEffect(() => {
    if (!marcaActualId) return;
    const params = new URLSearchParams();
    params.set('desde', desdeISO);
    params.set('hasta', hastaISO);
    if (filtroCategorias.length) params.set('categorias', filtroCategorias.join(','));
    if (filtroCompetidores.length) params.set('competidor_ids', filtroCompetidores.join(','));
    if (filtroProductos.length) params.set('producto_ids', filtroProductos.join(','));
    params.set('pagina', pagina);
    params.set('porPagina', POR_PAGINA);
    setDatos(null);
    api.get('/api/actividad/' + marcaActualId + '?' + params.toString())
      .then(setDatos)
      .catch((e) => setError(e.message));
  }, [marcaActualId, desdeISO, hastaISO, filtroCategorias, filtroCompetidores, filtroProductos, pagina]);

  const grupos = useMemo(() => (datos ? agruparPorFechaYTienda(datos.cambios) : []), [datos]);
  const filtrosActivos = filtroCategorias.length + filtroCompetidores.length + filtroProductos.length;

  async function exportar() {
    setExportando(true);
    try {
      const params = new URLSearchParams();
      params.set('desde', desdeISO);
      params.set('hasta', hastaISO);
      if (filtroCategorias.length) params.set('categorias', filtroCategorias.join(','));
      if (filtroCompetidores.length) params.set('competidor_ids', filtroCompetidores.join(','));
      if (filtroProductos.length) params.set('producto_ids', filtroProductos.join(','));

      const token = localStorage.getItem('coteja_token');
      const resp = await fetch(API_URL + '/api/actividad/' + marcaActualId + '/exportar?' + params.toString(), {
        headers: { Authorization: 'Bearer ' + token },
      });
      if (!resp.ok) throw new Error('No se pudo exportar el reporte');
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'actividad.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e.message);
    } finally {
      setExportando(false);
    }
  }

  const hastaMaximaPersonalizada = desdePersonalizado
    ? new Date(new Date(desdePersonalizado).getTime() + (RANGO_MAXIMO_DIAS - 1) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    : undefined;

  if (error) return <p className="text-red-600">{error}</p>;
  if (!productos) return <p className="text-gray-400">Cargando...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Actividad</h1>
        <button
          onClick={exportar}
          disabled={exportando || !datos?.cambios?.length}
          className="text-sm text-coteja-azul-700 hover:underline disabled:opacity-50"
        >
          {exportando ? 'Exportando...' : 'Exportar reporte'}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          {RANGOS.map((r) => (
            <button
              key={r.value}
              onClick={() => { setPersonalizado(false); setRango(r.value); }}
              className={'text-xs px-2.5 py-1.5 rounded-lg font-medium ' + (!personalizado && rango === r.value ? 'bg-coteja-azul-100 text-coteja-azul-800' : 'text-gray-500 hover:bg-gray-100')}
            >
              {r.label}
            </button>
          ))}
          <button
            onClick={() => setPersonalizado(true)}
            className={'text-xs px-2.5 py-1.5 rounded-lg font-medium ' + (personalizado ? 'bg-coteja-azul-100 text-coteja-azul-800' : 'text-gray-500 hover:bg-gray-100')}
          >
            Personalizado
          </button>
        </div>
        {personalizado && (
          <div className="flex items-center gap-2 text-sm">
            <input
              type="date"
              value={desdePersonalizado}
              onChange={(e) => setDesdePersonalizado(e.target.value)}
              className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
            />
            <span className="text-gray-400">a</span>
            <input
              type="date"
              value={hastaPersonalizado}
              min={desdePersonalizado || undefined}
              max={hastaMaximaPersonalizada}
              onChange={(e) => setHastaPersonalizado(e.target.value)}
              className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
            />
          </div>
        )}
        {(categoriasDisponibles.length > 0 || competidoresDisponibles.length > 0 || productosDisponibles.length > 0) && (
          <button
            type="button"
            onClick={() => setMostrarFiltros((v) => !v)}
            className={
              'flex items-center gap-1.5 text-sm rounded-lg border px-3 py-2 whitespace-nowrap ml-auto ' +
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

      {datos == null ? (
        <p className="text-gray-400">Cargando...</p>
      ) : grupos.length === 0 ? (
        <p className="bg-white rounded-xl shadow p-4 text-center text-gray-400 text-sm">No hubo cambios de precio en este período.</p>
      ) : (
        <div className="space-y-5">
          {grupos.map((dia) => (
            <div key={dia.fecha}>
              <h2 className="text-sm font-semibold text-gray-700 mb-2">{formatoFechaSeccion(dia.fecha)}</h2>
              <div className="space-y-3">
                {[...dia.porTienda.entries()].map(([tienda, items]) => (
                  <div key={tienda} className="bg-white rounded-xl shadow p-4">
                    <p className="text-xs font-semibold uppercase text-gray-400 mb-2">{tienda}</p>
                    <div className="divide-y divide-gray-100">
                      {items.map((c) => (
                        <div key={c.id} className="py-2 flex items-center justify-between gap-3 text-sm">
                          <div>
                            <p className="font-medium text-gray-900">{c.producto_nombre}</p>
                            <p className="text-xs text-gray-500">{c.categoria || 'Sin categoría'} · {formatoFechaHora(c.fecha)}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-gray-500 text-xs">{formatoMoneda(c.precio_anterior)} → {formatoMoneda(c.precio)}</p>
                            <Diferencia anterior={Number(c.precio_anterior)} actual={Number(c.precio)} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {datos && (grupos.length > 0 || pagina > 1) && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            disabled={pagina === 1}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 disabled:opacity-40 hover:bg-gray-50"
          >
            ← Anterior
          </button>
          <span className="text-sm text-gray-500">Página {pagina}</span>
          <button
            onClick={() => setPagina((p) => p + 1)}
            disabled={!datos.hayMas}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 disabled:opacity-40 hover:bg-gray-50"
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
}
