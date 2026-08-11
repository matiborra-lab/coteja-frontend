import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMarca } from '../context/MarcaContext';
import { api } from '../api/client';
import { Campo, Boton, Modal, Leyenda, LogoPlataforma } from '../components/ui';
import { formatoMoneda, formatoFechaHora } from '../utils/formato';
import { detectarPlataforma, esCucinaLink } from '../utils/plataformas';
import { sugerirCategoria } from '../utils/categorias';

const NUEVO_ARTICULO = '__nuevo__';
const NUEVO_TIPO = '__nuevo_tipo__';

// Sistemas sin integracion viva atras: el precio que se guarda es el que ya
// vino en el item (cargado a mano o leido de la carta), no algo que el
// backend vaya a scrapear de nuevo al confirmar el vinculo.
const SISTEMAS_SIN_SCRAPING = ['MANUAL', 'MAPEO_IA'];

function leerComoDataUrl(archivo) {
  return new Promise((resolve, reject) => {
    const lector = new FileReader();
    lector.onload = () => resolve(lector.result);
    lector.onerror = () => reject(new Error('No se pudo leer "' + archivo.name + '"'));
    lector.readAsDataURL(archivo);
  });
}

function SelectorTipo({ valor, onChange, tiposExistentes }) {
  const [creandoNuevo, setCreandoNuevo] = useState(false);

  if (creandoNuevo) {
    return (
      <input
        autoFocus
        placeholder="Ej: Principales, Cercanas..."
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => { if (!valor) setCreandoNuevo(false); }}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-coteja-azul-500"
      />
    );
  }

  return (
    <select
      value={tiposExistentes.includes(valor) ? valor : ''}
      onChange={(e) => {
        if (e.target.value === NUEVO_TIPO) { setCreandoNuevo(true); onChange(''); }
        else onChange(e.target.value);
      }}
      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-coteja-azul-500"
    >
      <option value="">Sin tipo</option>
      {tiposExistentes.map((t) => <option key={t} value={t}>{t}</option>)}
      <option value={NUEVO_TIPO}>+ Crear tipo nuevo</option>
    </select>
  );
}

function FormAgregarTienda({ marcaId, esPropia, tiposExistentes, onAgregado, onCancelar }) {
  const [nombre, setNombre] = useState('');
  const [url, setUrl] = useState('');
  const [urlTienda, setUrlTienda] = useState('');
  const [tipo, setTipo] = useState('');
  const [archivos, setArchivos] = useState([]); // fotos/PDF opcionales, solo si no hay link
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null); // feedback post-alta cuando la plataforma no se reconoce

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      // Sin URL (el cliente prefiere subir la carta en vez de pegar un link)
      // se manda DESCONOCIDA directo - ver POST /api/competidores en el backend.
      const plataforma = url ? (detectarPlataforma(url) || 'DESCONOCIDA') : 'DESCONOCIDA';
      // Si es Cucina Link y no cargaron un link de sucursal aparte, se usa
      // el mismo link de la tienda: en la gran mayoria de los casos ES el
      // link de sucursal (sirve para la misma cookie de sesion), asi que
      // pedirlo aparte solo hace falta cuando de verdad es distinto.
      const urlTiendaFinal = urlTienda || (esCucinaLink(url) ? url : '');
      const data = await api.post('/api/competidores', {
        marca_id: marcaId,
        nombre,
        url: url || null,
        plataforma,
        url_tienda: urlTiendaFinal || null,
        tipo: esPropia ? null : (tipo || null),
        es_propia: !!esPropia,
      });

      // Sin link, si cargaron fotos/PDF de la carta se leen ya mismo aca -
      // antes había que guardar, buscar la tienda recien creada en la lista,
      // entrar, e ir a la pestaña Productos para recien ahi subirlas.
      let itemsLeidos = null;
      if (data.plataforma === 'DESCONOCIDA' && archivos.length > 0) {
        try {
          const dataUrls = await Promise.all(archivos.map(leerComoDataUrl));
          const subida = await api.post('/api/competidores/' + data.id + '/carta-subida', { archivos: dataUrls });
          itemsLeidos = subida.items.length;
        } catch (err) {
          // La tienda ya se creo - no tiene sentido perder el alta por un
          // problema puntual leyendo las fotos, solo se avisa y se puede
          // reintentar la subida desde adentro de la tienda.
          setError('Se creó la tienda, pero no se pudo leer lo que subiste: ' + err.message);
        }
      }

      if (data.plataforma === 'DESCONOCIDA') {
        setResultado({ ...data, itemsLeidos });
      } else {
        setNombre('');
        setUrl('');
        setUrlTienda('');
        setTipo('');
        setArchivos([]);
        onAgregado();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  if (resultado) {
    return (
      <div className="space-y-3 bg-gray-50 rounded-lg p-3">
        {resultado.itemsLeidos > 0 ? (
          <Leyenda>
            Se agregó "{resultado.nombre}" y se leyeron <strong>{resultado.itemsLeidos} productos</strong> de la carta que subiste.
            Entrá a la tienda para revisarlos y vincularlos con tus artículos.
          </Leyenda>
        ) : resultado.itemsImportados > 0 ? (
          <Leyenda>
            Se agregó "{resultado.nombre}" y se detectaron <strong>{resultado.itemsImportados} productos</strong> automáticamente.
            Esta plataforma no está oficialmente integrada, así que esos precios son una foto del momento y no se van a
            actualizar solos hasta que la revisemos.
          </Leyenda>
        ) : (
          <Leyenda>
            Se agregó "{resultado.nombre}", pero no hay integración automática con esta plataforma{resultado.url ? ' ni se pudo leer nada del link' : ''}.
            Entrá a la tienda para subir fotos o un PDF de la carta y leerla con IA.
          </Leyenda>
        )}
        <Boton onClick={() => { setResultado(null); setNombre(''); setUrl(''); setUrlTienda(''); setTipo(''); setArchivos([]); onAgregado(); }}>
          Listo
        </Boton>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Campo label="Nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
        {!esPropia && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <SelectorTipo valor={tipo} onChange={setTipo} tiposExistentes={tiposExistentes} />
          </div>
        )}
      </div>

      <Campo label="Link de la tienda virtual" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />

      {esCucinaLink(url) && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
          <p className="text-xs text-gray-500">
            Detectamos Cucina Link. Por lo general no hace falta nada más - completá esto solo si el link de arriba
            no corresponde a esta sucursal en particular (ej: cadenas con un link por sucursal).
            Ej: <span className="font-mono">https://cucina.link/mi-local/sucursal-centro</span>
          </p>
          <Campo label="URL de sucursal (opcional)" value={urlTienda} onChange={(e) => setUrlTienda(e.target.value)} placeholder={url || 'https://...'} />
        </div>
      )}

      {!url.trim() && (
        <>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <div className="flex-1 h-px bg-gray-200" />
            o
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subí fotos o un PDF de la carta (opcional)</label>
            <input
              type="file"
              accept="image/*,application/pdf"
              multiple
              onChange={(e) => setArchivos([...e.target.files])}
              className="block w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-coteja-azul-50 file:text-coteja-azul-700 file:text-sm file:font-medium hover:file:bg-coteja-azul-100"
            />
            <Leyenda>La leemos con IA apenas guardes y va a quedar lista para revisar y vincular con tus artículos.</Leyenda>
          </div>
        </>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <Boton type="submit" cargando={cargando}>{cargando ? 'Guardando...' : (esPropia ? 'Guardar mi tienda' : 'Agregar competidor')}</Boton>
        {onCancelar && (
          <button type="button" onClick={onCancelar} className="text-sm text-gray-500 hover:underline whitespace-nowrap px-2">
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

function VincularSelect({ producto, productosPropios, onVinculado }) {
  const [valor, setValor] = useState(producto.producto_propio_id ? String(producto.producto_propio_id) : '');
  const [creandoArticulo, setCreandoArticulo] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function vincularCon(productoPropioId) {
    setGuardando(true);
    try {
      await api.post('/api/vinculos', {
        producto_propio_id: productoPropioId,
        producto_competencia_id: producto.id,
      });
      onVinculado();
    } finally {
      setGuardando(false);
    }
  }

  async function onChangeSelect(e) {
    const v = e.target.value;
    if (v === NUEVO_ARTICULO) {
      setCreandoArticulo(true);
      return;
    }
    setValor(v);
    if (v) await vincularCon(Number(v));
  }

  async function crearYvincular(e) {
    e.preventDefault();
    if (!nombreNuevo.trim()) return;
    setGuardando(true);
    try {
      const articulo = await api.post('/api/productos-propios', {
        marca_id: producto.marca_id_hint,
        nombre: nombreNuevo,
        categoria: sugerirCategoria(nombreNuevo) || null,
      });
      await vincularCon(articulo.id);
      setCreandoArticulo(false);
      setNombreNuevo('');
    } finally {
      setGuardando(false);
    }
  }

  if (creandoArticulo) {
    return (
      <form onSubmit={crearYvincular} className="flex items-center gap-1">
        <input
          autoFocus
          placeholder="Nombre del artículo nuevo"
          value={nombreNuevo}
          onChange={(e) => setNombreNuevo(e.target.value)}
          className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
        />
        <button type="submit" disabled={guardando} className="text-xs text-coteja-azul-700 hover:underline whitespace-nowrap">Crear y vincular</button>
        <button type="button" onClick={() => setCreandoArticulo(false)} className="text-xs text-gray-400">×</button>
      </form>
    );
  }

  return (
    <select
      value={valor}
      disabled={guardando}
      onChange={onChangeSelect}
      className="rounded-lg border border-gray-300 px-2 py-1 text-xs"
    >
      <option value="">Vincular con...</option>
      {productosPropios.map((pp) => (
        <option key={pp.id} value={pp.id}>{pp.nombre}</option>
      ))}
      <option value={NUEVO_ARTICULO}>+ Crear artículo nuevo</option>
    </select>
  );
}

// Cargar a mano siempre es sistema MANUAL (sin integracion viva) - no tiene
// sentido pedir plataforma/URL/parametro aca, eso es para cuando SI hay una
// pagina de la que se puede leer el precio en vivo. Se puede vincular de
// una con un articulo para no tener que ir despues a "Ya cargados" a hacerlo.
function FormAgregarProducto({ competidorId, productosPropios, onAgregado }) {
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [vincularCon, setVincularCon] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const producto = await api.post('/api/productos-competencia', {
        competidor_id: competidorId,
        nombre,
        sistema: 'MANUAL',
        url: null,
        ultimo_precio: precio ? Number(precio) : null,
      });
      if (vincularCon) {
        await api.post('/api/vinculos', { producto_propio_id: Number(vincularCon), producto_competencia_id: producto.id });
      }
      setNombre('');
      setPrecio('');
      setVincularCon('');
      onAgregado();
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="bg-gray-50 rounded-lg p-3 space-y-2">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <Campo label="Nombre del producto" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <Campo label="Precio" type="number" step="0.01" value={precio} onChange={(e) => setPrecio(e.target.value)} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vincular con</label>
          <select
            value={vincularCon}
            onChange={(e) => setVincularCon(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-coteja-azul-500"
          >
            <option value="">Sin vincular (solo agregar)</option>
            {productosPropios.map((pp) => <option key={pp.id} value={pp.id}>{pp.nombre}</option>)}
          </select>
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Boton type="submit" cargando={cargando}>{cargando ? 'Agregando...' : 'Agregar producto'}</Boton>
    </form>
  );
}

// Junta items cuyo nombre comparte todo menos el ultimo " - Variante"
// (ej: "Armala como quieras - Simple/Doble/Triple/Cuadruple") en un solo
// renglon desplegable, en vez de una fila suelta por variante.
function agruparPorBase(items) {
  const porBase = new Map();
  for (const item of items) {
    const idx = item.nombre.lastIndexOf(' - ');
    const base = idx > -1 ? item.nombre.slice(0, idx) : item.nombre;
    if (!porBase.has(base)) porBase.set(base, []);
    porBase.get(base).push(item);
  }
  return [...porBase.entries()].map(([base, lista]) =>
    lista.length === 1 ? { tipo: 'simple', item: lista[0] } : { tipo: 'grupo', base, variantes: lista }
  );
}

// Para plataformas reales, url+parametro identifica el producto de forma
// unica. MANUAL/MAPEO_IA no tienen ninguno de los dos (se cargan a mano o
// se leen de una foto/PDF) - ahi la unica pista que se repite entre una
// lectura de carta y la siguiente es el nombre.
function clave(item) {
  if (SISTEMAS_SIN_SCRAPING.includes(item.sistema)) {
    return item.sistema + '|' + item.nombre.trim().toLowerCase();
  }
  return item.url + '|' + (item.parametro || '');
}

function FilaItem({ item, etiqueta, yaAgregado, actualizable, seleccionado, onElegir }) {
  const disabled = yaAgregado && !actualizable;
  return (
    <li className="py-1.5 px-1 flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={seleccionado}
        disabled={disabled}
        onChange={() => onElegir(item)}
        className="rounded border-gray-300"
      />
      <span className={'flex-1 truncate ' + (disabled ? 'text-gray-400' : '')}>
        {etiqueta || item.nombre} <span className="text-gray-400">{formatoMoneda(item.precio)}</span>
        {yaAgregado && (
          <span className="ml-1 text-xs">{actualizable ? '(ya agregado · tocá para actualizar precio)' : '(ya agregado)'}</span>
        )}
      </span>
    </li>
  );
}

function CartaCompleta({ tienda, productos, productosPropios, onAgregado }) {
  const [estado, setEstado] = useState('inicial'); // inicial | cargando | error | listo
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [expandidos, setExpandidos] = useState(new Set());
  const [seleccionado, setSeleccionado] = useState(null);
  const [agregadoSeleccionado, setAgregadoSeleccionado] = useState(null);
  const [vincularCon, setVincularCon] = useState('');
  const [creandoArticulo, setCreandoArticulo] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [subiendoArchivos, setSubiendoArchivos] = useState(false);
  const [precioManual, setPrecioManual] = useState('');
  const [actualizandoTodos, setActualizandoTodos] = useState(false);

  // MANUAL/MAPEO_IA no tienen integracion viva atras (carga a mano, o leido
  // de una foto/PDF por IA) - por las dudas el mapeo automatico se haya
  // equivocado, se puede corregir el precio aca mismo antes de guardar el
  // vinculo, en vez de tener que guardarlo mal y despues ir a editarlo.
  useEffect(() => {
    if (seleccionado) {
      setPrecioManual(String(seleccionado.precio + (agregadoSeleccionado?.precio || 0)));
    }
  }, [seleccionado, agregadoSeleccionado]);

  async function escanear() {
    setEstado('cargando');
    setError('');
    try {
      const data = await api.get('/api/competidores/' + tienda.id + '/carta');
      setItems(data.items);
      setEstado('listo');
    } catch (err) {
      setError(err.message);
      setEstado('error');
    }
  }

  // Distinto de "escanear": esto no cambia "estado" a 'error' si falla, asi
  // el input de archivos sigue disponible para reintentar (a diferencia de
  // un link roto, ac lo unico que se puede hacer es volver a intentar con
  // otras fotos/otro PDF).
  async function leerCartaSubida(fileList) {
    setError('');
    setSubiendoArchivos(true);
    try {
      const archivos = await Promise.all([...fileList].map(leerComoDataUrl));
      const data = await api.post('/api/competidores/' + tienda.id + '/carta-subida', { archivos });
      if (data.items.length === 0) {
        setError('No se pudo leer ningún producto con precio en lo que subiste - probá con otra foto más clara, o cargá los productos a mano.');
      } else {
        setItems(data.items);
        setEstado('listo');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubiendoArchivos(false);
    }
  }

  // Mapa (en vez de un simple Set) para poder ir del item recien leido al
  // producto YA guardado que le corresponde - hace falta su id para poder
  // actualizarle el precio en vez de crear un vinculo nuevo.
  const productosPorClave = useMemo(() => {
    const mapa = new Map();
    for (const p of productos || []) mapa.set(clave(p), p);
    return mapa;
  }, [productos]);

  // Items de la carta recien leida que ya existen (MANUAL/MAPEO_IA, sin
  // integracion viva) - candidatos para el boton de actualizar precios en
  // lote en vez de tener que entrar uno por uno.
  const itemsActualizables = useMemo(() => {
    const vistas = new Set();
    const resultado = [];
    for (const item of items) {
      if (!SISTEMAS_SIN_SCRAPING.includes(item.sistema)) continue;
      const key = clave(item);
      if (!productosPorClave.has(key) || vistas.has(key)) continue;
      vistas.add(key);
      resultado.push(item);
    }
    return resultado;
  }, [items, productosPorClave]);

  async function actualizarTodosLosPrecios() {
    setActualizandoTodos(true);
    try {
      await Promise.all(itemsActualizables.map((item) => {
        const producto = productosPorClave.get(clave(item));
        return api.patch('/api/productos-competencia/' + producto.id, { ultimo_precio: item.precio });
      }));
      onAgregado();
    } catch (err) {
      alert('No se pudieron actualizar todos los precios: ' + err.message);
    } finally {
      setActualizandoTodos(false);
    }
  }

  async function actualizarPrecioSeleccionado() {
    const producto = productosPorClave.get(clave(seleccionado));
    if (!producto || precioManual === '' || isNaN(Number(precioManual))) return;
    setGuardando(true);
    try {
      await api.patch('/api/productos-competencia/' + producto.id, { ultimo_precio: Number(precioManual) });
      setSeleccionado(null);
      onAgregado();
    } catch (err) {
      alert('No se pudo actualizar el precio de "' + seleccionado.nombre + '": ' + err.message);
    } finally {
      setGuardando(false);
    }
  }

  // Si el articulo elegido en "Vincular con" ya tiene algun producto de la
  // competencia vinculado, este va a ser el segundo (o mas) - ahi el panel
  // promedia entre todos, asi que conviene avisarlo justo en ese momento.
  const vinculandoSegundo = useMemo(() => {
    if (!vincularCon) return false;
    const articulo = productosPropios.find((pp) => String(pp.id) === vincularCon);
    return (articulo?.vinculosExistentes || 0) >= 1;
  }, [vincularCon, productosPropios]);

  const grupos = useMemo(() => {
    const filtrados = busqueda
      ? items.filter((i) => i.nombre.toLowerCase().includes(busqueda.toLowerCase()))
      : items;
    const porCategoria = new Map();
    for (const item of filtrados) {
      const cat = item.categoria || 'Productos';
      if (!porCategoria.has(cat)) porCategoria.set(cat, []);
      porCategoria.get(cat).push(item);
    }
    return [...porCategoria.entries()].map(([cat, lista]) => [cat, agruparPorBase(lista)]);
  }, [items, busqueda]);

  function toggleExpandido(base) {
    setExpandidos((prev) => {
      const next = new Set(prev);
      if (next.has(base)) next.delete(base); else next.add(base);
      return next;
    });
  }

  function elegir(item) {
    setSeleccionado((prev) => (prev === item ? null : item));
    setAgregadoSeleccionado(null);
    setVincularCon('');
    setCreandoArticulo(false);
    setNombreNuevo('');
  }

  // El agregado (ej: extra bacon) solo se puede sumar al MISMO articulo que
  // esta elegido - por eso vive adentro de "seleccionado.agregados" en vez
  // de ser una seleccion independiente, y se limpia solo con cambiar de
  // variante.
  function elegirAgregado(agregado) {
    setAgregadoSeleccionado((prev) => (prev === agregado ? null : agregado));
  }

  async function confirmar() {
    if (!seleccionado || (creandoArticulo && !nombreNuevo.trim())) return;
    setGuardando(true);
    try {
      const nombreFinal = agregadoSeleccionado ? seleccionado.nombre + ' + ' + agregadoSeleccionado.nombre : seleccionado.nombre;
      const parametroFinal = agregadoSeleccionado ? agregadoSeleccionado.parametro : seleccionado.parametro;

      let articuloId = vincularCon ? Number(vincularCon) : null;
      if (creandoArticulo) {
        // La categoria del producto tal como aparece en la carta de la
        // competencia (seleccionado.categoria) es un dato mas confiable que
        // adivinar por nombre - es la que ya se usa para agrupar el mapeo
        // en pantalla (ver "grupos" mas abajo), asi que el articulo nuevo
        // arranca clasificado igual en vez de quedar sin categoria.
        const articulo = await api.post('/api/productos-propios', {
          marca_id: tienda.marca_id,
          nombre: nombreNuevo,
          categoria: seleccionado.categoria || sugerirCategoria(nombreNuevo) || null,
        });
        articuloId = articulo.id;
      }
      const esEditable = SISTEMAS_SIN_SCRAPING.includes(seleccionado.sistema);
      const precioFinal = esEditable ? Number(precioManual) : seleccionado.precio + (agregadoSeleccionado?.precio || 0);
      const producto = await api.post('/api/productos-competencia', {
        competidor_id: tienda.id,
        nombre: nombreFinal,
        sistema: seleccionado.sistema,
        url: seleccionado.url,
        parametro: parametroFinal,
        ultimo_precio: esEditable ? precioFinal : null,
      });
      if (articuloId) {
        await api.post('/api/vinculos', { producto_propio_id: articuloId, producto_competencia_id: producto.id });
      }
      setSeleccionado(null);
      setAgregadoSeleccionado(null);
      setVincularCon('');
      setCreandoArticulo(false);
      setNombreNuevo('');
      onAgregado();
    } catch (err) {
      alert('No se pudo agregar "' + seleccionado.nombre + '": ' + err.message);
    } finally {
      setGuardando(false);
    }
  }

  if (estado === 'inicial') {
    if (tienda.plataforma === 'DESCONOCIDA') {
      return (
        <div className="space-y-2">
          <Leyenda>No hay integración automática con esta plataforma. Subí fotos o un PDF de la carta y la leemos con IA.</Leyenda>
          <label className="block">
            <span className="sr-only">Subir carta</span>
            <input
              type="file"
              accept="image/*,application/pdf"
              multiple
              disabled={subiendoArchivos}
              onChange={(e) => { if (e.target.files.length) leerCartaSubida(e.target.files); e.target.value = ''; }}
              className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-coteja-azul-50 file:text-coteja-azul-800 file:font-medium file:cursor-pointer hover:file:bg-coteja-azul-100 disabled:opacity-50"
            />
          </label>
          {subiendoArchivos && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="inline-block w-4 h-4 border-2 border-coteja-azul-300 border-t-coteja-azul-800 rounded-full animate-spin" />
              Leyendo la carta con IA...
            </div>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
      );
    }
    return (
      <button onClick={escanear} className="w-full bg-coteja-verde-700 hover:bg-coteja-verde-800 text-white font-medium rounded-lg py-2.5 transition">
        Ver carta completa
      </button>
    );
  }

  if (estado === 'cargando') {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-sm text-gray-500">
        <span className="inline-block w-4 h-4 border-2 border-coteja-azul-300 border-t-coteja-azul-800 rounded-full animate-spin" />
        Leyendo la carta...
      </div>
    );
  }

  if (estado === 'error') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
        {error}
      </div>
    );
  }

  // Si lo elegido ya corresponde a un producto guardado (mismo nombre para
  // MANUAL/MAPEO_IA), la accion no es "vincular" - ya esta vinculado, lo
  // unico que puede hacer falta es corregir el precio que trajo esta lectura.
  const esActualizacion = seleccionado ? productosPorClave.has(clave(seleccionado)) && SISTEMAS_SIN_SCRAPING.includes(seleccionado.sistema) : false;

  return (
    <div className="space-y-2">
      <input
        type="search"
        value={busqueda}
        onChange={(e) => setBusqueda(e.target.value)}
        placeholder="Buscar en la carta..."
        className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-coteja-azul-500"
      />

      <Leyenda>Si un producto o una variante no aparece acá, es porque no tiene un precio asociado en la carta de la tienda.</Leyenda>

      {itemsActualizables.length >= 2 && (
        <button
          onClick={actualizarTodosLosPrecios}
          disabled={actualizandoTodos}
          className="w-full text-sm bg-coteja-azul-50 hover:bg-coteja-azul-100 disabled:opacity-50 text-coteja-azul-800 font-medium rounded-lg py-2 transition"
        >
          {actualizandoTodos
            ? 'Actualizando...'
            : `Actualizar todos los precios de artículos anteriormente cargados (${itemsActualizables.length})`}
        </button>
      )}

      <div className="max-h-80 overflow-y-auto border border-gray-100 rounded-lg p-2 space-y-3">
        {grupos.map(([cat, filas]) => (
          <div key={cat}>
            <h4 className="text-xs font-semibold uppercase text-gray-400 px-1 mb-1">{cat}</h4>
            <ul className="divide-y divide-gray-100">
              {filas.map((fila) =>
                fila.tipo === 'simple' ? (
                  <FilaItem
                    key={clave(fila.item)}
                    item={fila.item}
                    yaAgregado={productosPorClave.has(clave(fila.item))}
                    actualizable={SISTEMAS_SIN_SCRAPING.includes(fila.item.sistema)}
                    seleccionado={seleccionado === fila.item}
                    onElegir={elegir}
                  />
                ) : (
                  <li key={fila.base}>
                    <button
                      onClick={() => toggleExpandido(fila.base)}
                      className="w-full flex items-center justify-between py-1.5 px-1 text-sm text-left"
                    >
                      <span className="font-medium text-gray-700">
                        {fila.base} <span className="text-xs text-gray-400 font-normal">({fila.variantes.length} variantes)</span>
                      </span>
                      <span className="text-xs text-gray-400">{expandidos.has(fila.base) ? '▲' : '▼'}</span>
                    </button>
                    {expandidos.has(fila.base) && (
                      <ul className="pl-3 divide-y divide-coteja-azul-100 border-l-2 border-coteja-azul-300 ml-2 bg-coteja-azul-50/50 rounded-r-md">
                        {fila.variantes.map((v) => (
                          <FilaItem
                            key={clave(v)}
                            item={v}
                            etiqueta={v.nombre.slice(fila.base.length + 3)}
                            yaAgregado={productosPorClave.has(clave(v))}
                            actualizable={SISTEMAS_SIN_SCRAPING.includes(v.sistema)}
                            seleccionado={seleccionado === v}
                            onElegir={elegir}
                          />
                        ))}
                      </ul>
                    )}
                  </li>
                )
              )}
            </ul>
          </div>
        ))}
      </div>

      {seleccionado && esActualizacion && (
        <div className="bg-coteja-azul-50 border border-coteja-azul-200 rounded-lg p-3 space-y-2">
          <p className="text-sm text-coteja-azul-900 flex items-center gap-1.5 flex-wrap">
            <strong>{seleccionado.nombre}</strong>
            {' · ya está vinculado, actualizar precio a '}
            <span className="inline-flex items-center gap-1">
              $
              <input
                autoFocus
                type="number"
                step="0.01"
                value={precioManual}
                onChange={(e) => setPrecioManual(e.target.value)}
                className="w-24 rounded border border-coteja-azul-300 px-1.5 py-0.5 text-sm"
              />
            </span>
          </p>
          <Leyenda>Este producto ya está cargado y vinculado a un artículo - acá solo se actualiza su precio, no hace falta volver a elegir con qué artículo va.</Leyenda>
          <div className="flex items-center gap-2">
            <button
              onClick={actualizarPrecioSeleccionado}
              disabled={guardando || precioManual === '' || isNaN(Number(precioManual))}
              className="text-white bg-coteja-verde-700 hover:bg-coteja-verde-800 disabled:opacity-50 rounded-lg px-3 py-1.5 text-sm font-medium"
            >
              {guardando ? '...' : '✓ Actualizar precio'}
            </button>
            <button onClick={() => setSeleccionado(null)} className="text-gray-400 hover:text-gray-600 text-sm">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {seleccionado && !esActualizacion && (
        <div className="bg-coteja-azul-50 border border-coteja-azul-200 rounded-lg p-3 space-y-2">
          <p className="text-sm text-coteja-azul-900 flex items-center gap-1.5 flex-wrap">
            <strong>{seleccionado.nombre}</strong>
            {agregadoSeleccionado && <> + <strong>{agregadoSeleccionado.nombre}</strong></>}
            {' · '}
            {SISTEMAS_SIN_SCRAPING.includes(seleccionado.sistema) ? (
              <span className="inline-flex items-center gap-1">
                $
                <input
                  type="number"
                  step="0.01"
                  value={precioManual}
                  onChange={(e) => setPrecioManual(e.target.value)}
                  className="w-24 rounded border border-coteja-azul-300 px-1.5 py-0.5 text-sm"
                />
              </span>
            ) : (
              formatoMoneda(seleccionado.precio + (agregadoSeleccionado?.precio || 0))
            )}
          </p>
          {SISTEMAS_SIN_SCRAPING.includes(seleccionado.sistema) && (
            <Leyenda>Este precio se leyó automáticamente (a mano o con IA) - revisalo y corregilo acá si hace falta antes de guardar.</Leyenda>
          )}

          {seleccionado.agregados?.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs text-gray-500">¿Sumar algún agregado de este mismo artículo? (opcional)</p>
              <div className="flex flex-wrap gap-1.5">
                {seleccionado.agregados.map((a) => (
                  <label
                    key={a.parametro}
                    className={
                      'flex items-center gap-1 text-xs px-2 py-1 rounded-full border cursor-pointer ' +
                      (agregadoSeleccionado === a ? 'bg-coteja-azul-100 border-coteja-azul-400 text-coteja-azul-900' : 'border-gray-300 text-gray-600 hover:bg-gray-50')
                    }
                  >
                    <input
                      type="checkbox"
                      checked={agregadoSeleccionado === a}
                      onChange={() => elegirAgregado(a)}
                      className="rounded border-gray-300"
                    />
                    {a.nombre} (+{formatoMoneda(a.precio)})
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 whitespace-nowrap">Vincular con</span>
            {creandoArticulo ? (
              <input
                autoFocus
                placeholder="Nombre del artículo nuevo"
                value={nombreNuevo}
                onChange={(e) => setNombreNuevo(e.target.value)}
                className="flex-1 min-w-[140px] rounded-lg border border-gray-300 px-2 py-1 text-sm"
              />
            ) : (
              <select
                value={vincularCon}
                onChange={(e) => {
                  if (e.target.value === NUEVO_ARTICULO) { setCreandoArticulo(true); setVincularCon(''); }
                  else setVincularCon(e.target.value);
                }}
                className="flex-1 min-w-[140px] rounded-lg border border-gray-300 px-2 py-1 text-sm"
              >
                <option value="">Sin vincular (solo agregar)</option>
                {productosPropios.map((pp) => <option key={pp.id} value={pp.id}>{pp.nombre}</option>)}
                <option value={NUEVO_ARTICULO}>+ Crear artículo nuevo</option>
              </select>
            )}
            <button
              onClick={confirmar}
              disabled={
                guardando ||
                (creandoArticulo && !nombreNuevo.trim()) ||
                (SISTEMAS_SIN_SCRAPING.includes(seleccionado.sistema) && (precioManual === '' || isNaN(Number(precioManual))))
              }
              className="text-white bg-coteja-verde-700 hover:bg-coteja-verde-800 disabled:opacity-50 rounded-lg px-3 py-1.5 text-sm font-medium"
            >
              {guardando ? '...' : '✓ Guardar'}
            </button>
            <button onClick={() => setSeleccionado(null)} className="text-gray-400 hover:text-gray-600 text-sm">
              Cancelar
            </button>
          </div>

          {vinculandoSegundo && (
            <Leyenda>Ese artículo ya tiene un producto de la competencia vinculado - al agregar este, el panel va a mostrar el promedio entre todos los que estén vinculados.</Leyenda>
          )}
        </div>
      )}
    </div>
  );
}

// Unico lugar de toda la app donde se puede editar el precio de un
// MANUAL/MAPEO_IA a mano (dentro de "Artículos vinculados" de la propia
// tienda) - la pagina global de Artículos solo lo muestra de lectura.
function PrecioEditableProducto({ producto, onGuardado }) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState('');
  const [guardando, setGuardando] = useState(false);

  const editable = SISTEMAS_SIN_SCRAPING.includes(producto.sistema);
  const fechaActualizacion = formatoFechaHora(producto.ultima_actualizacion);

  if (!editable) {
    return (
      <>
        <span className="text-gray-500">{formatoMoneda(producto.ultimo_precio)}</span>
        {fechaActualizacion && <span className="text-gray-400 text-xs"> · act. {fechaActualizacion}</span>}
      </>
    );
  }

  if (!editando) {
    return (
      <>
        <button
          type="button"
          onClick={() => { setValor(producto.ultimo_precio ?? ''); setEditando(true); }}
          className="text-gray-500 underline decoration-dotted hover:text-coteja-azul-800"
          title="Editar precio a mano"
        >
          {formatoMoneda(producto.ultimo_precio)}
        </button>
        {fechaActualizacion && <span className="text-gray-400 text-xs"> · act. {fechaActualizacion}</span>}
      </>
    );
  }

  async function guardar(e) {
    e.preventDefault();
    if (valor === '' || isNaN(Number(valor))) return;
    setGuardando(true);
    try {
      await api.patch('/api/productos-competencia/' + producto.id, { ultimo_precio: Number(valor) });
      setEditando(false);
      onGuardado();
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="inline-flex items-center gap-1">
      <input
        autoFocus
        type="number"
        step="0.01"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        className="w-24 rounded border border-gray-300 px-1.5 py-0.5 text-xs"
      />
      <button type="submit" disabled={guardando} className="text-green-700 hover:underline">✓</button>
      <button type="button" onClick={() => setEditando(false)} className="text-gray-400 hover:underline">×</button>
    </form>
  );
}

// Editar el link/plataforma/tipo de una tienda ya cargada - mismos campos y
// misma logica de deteccion de plataforma que FormAgregarTienda (alta), asi
// que reeditar el link es equivalente a "recargar" el competidor de cero.
// No toca los productos ya vinculados: cada uno sigue leyendo con su propio
// sistema/url/parametro, esto solo cambia de que plataforma sale "Ver carta
// completa" (CartaCompleta) de aca en mas.
function TabConfiguracion({ tienda, tiposExistentes, onGuardado }) {
  const [nombre, setNombre] = useState(tienda.nombre);
  const [url, setUrl] = useState(tienda.url || '');
  const [urlTienda, setUrlTienda] = useState(tienda.url_tienda || '');
  const [tipo, setTipo] = useState(tienda.tipo || '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const plataformaNueva = url.trim() ? (detectarPlataforma(url) || 'DESCONOCIDA') : 'DESCONOCIDA';
  // Solo avisa cuando el cambio EMPEORA la situacion (tenia una plataforma
  // reconocida y deja de tenerla) - si ya era manual, no hay nada nuevo que
  // advertir.
  const pasaAManual = tienda.plataforma !== 'DESCONOCIDA' && plataformaNueva === 'DESCONOCIDA';

  async function guardar(e) {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      const urlTiendaFinal = urlTienda || (esCucinaLink(url) ? url : '');
      const body = {
        nombre,
        url: url || null,
        plataforma: plataformaNueva,
        url_tienda: urlTiendaFinal || null,
      };
      if (!tienda.es_propia) body.tipo = tipo || null;
      const actualizado = await api.patch('/api/competidores/' + tienda.id, body);
      onGuardado(actualizado);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="space-y-3">
      <Campo label="Nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} />

      {!tienda.es_propia && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
          <SelectorTipo valor={tipo} onChange={setTipo} tiposExistentes={tiposExistentes} />
        </div>
      )}

      <div>
        <Campo label="Link de la tienda virtual" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
        <p className="text-xs text-gray-500 mt-1">
          Plataforma detectada: <span className="font-medium text-gray-700">{plataformaNueva === 'DESCONOCIDA' ? 'ninguna (carga manual)' : plataformaNueva}</span>
        </p>
      </div>

      {esCucinaLink(url) && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
          <p className="text-xs text-gray-500">
            Detectamos Cucina Link. Por lo general no hace falta nada más - completá esto solo si el link de arriba
            no corresponde a esta sucursal en particular (ej: cadenas con un link por sucursal).
          </p>
          <Campo label="URL de sucursal (opcional)" value={urlTienda} onChange={(e) => setUrlTienda(e.target.value)} placeholder={url || 'https://...'} />
        </div>
      )}

      {pasaAManual && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-xs text-amber-800">
            Si guardás sin un link reconocido, esta tienda pasa a carga manual (fotos/PDF) - los productos que se
            venían actualizando solos desde acá pueden dejar de recibir precios nuevos hasta que caigas en una
            plataforma reconocida de nuevo. Los vínculos con tus artículos no se pierden.
          </p>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Boton type="submit" cargando={guardando}>{guardando ? 'Guardando...' : 'Guardar cambios'}</Boton>
    </form>
  );
}

function TiendaModal({ tienda, marcaId, tiposExistentes, productosPropios, onCerrar, onCambioGlobal, onTiendaActualizada }) {
  const [tab, setTab] = useState('productos');
  const [productos, setProductos] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);

  async function cargarProductos() {
    const data = await api.get('/api/productos-competencia/' + tienda.id);
    setProductos(data.map((p) => ({ ...p, marca_id_hint: marcaId })));
  }

  useEffect(() => {
    cargarProductos();
  }, [tienda.id]);

  async function eliminarProducto(id) {
    if (!confirm('¿Eliminar este producto?')) return;
    await api.del('/api/productos-competencia/' + id);
    await cargarProductos();
    onCambioGlobal();
  }

  async function quitarVinculo(vinculoId) {
    await api.del('/api/vinculos/' + vinculoId);
    await cargarProductos();
    onCambioGlobal();
  }

  // Un producto vinculado no se repite en las dos pestañas: una vez que
  // pasa a "Artículos vinculados" (mas recientes primero), deja de listarse
  // aca en "Productos" - esa pestaña queda solo para lo que todavia hace
  // falta revisar/vincular.
  const sinVincular = (productos || []).filter((p) => !p.vinculo_id);
  const vinculados = (productos || [])
    .filter((p) => p.vinculo_id)
    .sort((a, b) => new Date(b.vinculo_creado_en) - new Date(a.vinculo_creado_en));

  return (
    <Modal titulo={tienda.nombre} onClose={onCerrar} ancho="max-w-2xl">
      <div className="space-y-3">
        <div className="text-xs text-gray-500 space-y-0.5">
          <p className="flex items-center gap-1.5">
            <LogoPlataforma plataforma={tienda.plataforma} className="w-4 h-4" />
            <span><span className="font-medium text-gray-700">Plataforma:</span> {tienda.plataforma}</span>
          </p>
          {tienda.url ? (
            <p className="break-all"><span className="font-medium text-gray-700">Link:</span> <a href={tienda.url} target="_blank" rel="noreferrer" className="text-coteja-azul-700 hover:underline">{tienda.url}</a></p>
          ) : (
            <p><span className="font-medium text-gray-700">Link:</span> sin link (carta subida a mano)</p>
          )}
        </div>

        <div className="flex gap-1 border-b border-gray-100">
          <button
            onClick={() => setTab('productos')}
            className={'text-sm px-3 py-2 font-medium border-b-2 ' + (tab === 'productos' ? 'border-coteja-azul-800 text-coteja-azul-800' : 'border-transparent text-gray-500')}
          >
            Actualización
          </button>
          <button
            onClick={() => setTab('vinculados')}
            className={'text-sm px-3 py-2 font-medium border-b-2 ' + (tab === 'vinculados' ? 'border-coteja-azul-800 text-coteja-azul-800' : 'border-transparent text-gray-500')}
          >
            Artículos vinculados {vinculados.length > 0 && '(' + vinculados.length + ')'}
          </button>
          <button
            onClick={() => setTab('config')}
            className={'text-sm px-3 py-2 font-medium border-b-2 ' + (tab === 'config' ? 'border-coteja-azul-800 text-coteja-azul-800' : 'border-transparent text-gray-500')}
          >
            Configuración
          </button>
        </div>

        {tab === 'productos' ? (
          <div className="space-y-3">
            <CartaCompleta
              tienda={tienda}
              productos={productos}
              productosPropios={productosPropios}
              onAgregado={() => { cargarProductos(); onCambioGlobal(); }}
            />

            <button onClick={() => setMostrarForm((v) => !v)} className="text-xs text-gray-400 hover:underline">
              {mostrarForm ? 'Cerrar' : '¿No aparece? Cargalo a mano'}
            </button>
            {mostrarForm && (
              <FormAgregarProducto
                competidorId={tienda.id}
                productosPropios={productosPropios}
                onAgregado={() => { setMostrarForm(false); cargarProductos(); onCambioGlobal(); }}
              />
            )}

            <h3 className="text-xs font-semibold uppercase text-gray-400 pt-2">Sin vincular</h3>
            {productos == null ? (
              <p className="text-sm text-gray-400">Cargando productos...</p>
            ) : sinVincular.length === 0 ? (
              <p className="text-sm text-gray-400">
                {productos.length === 0 ? 'Sin productos cargados todavía.' : 'Ya vinculaste todos los productos cargados - mirá "Artículos vinculados".'}
              </p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {sinVincular.map((p) => (
                  <li key={p.id} className="py-2 space-y-1.5 text-sm">
                    <div>
                      <span className="font-medium text-gray-900">{p.nombre}</span>{' '}
                      <span className="text-gray-500">{formatoMoneda(p.ultimo_precio)}</span>
                      {p.sistema === 'MANUAL' && tienda.plataforma === 'DESCONOCIDA' && (
                        <span className="ml-2 text-xs bg-coteja-azul-100 text-coteja-azul-800 px-1.5 py-0.5 rounded">detectado solo · revisar</span>
                      )}
                      {p.sistema === 'MAPEO_IA' && (
                        <span className="ml-2 text-xs bg-coteja-azul-100 text-coteja-azul-800 px-1.5 py-0.5 rounded">leído por IA</span>
                      )}
                      {p.estado && p.estado !== 'OK' && (
                        <span className="ml-2 text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">{p.estado}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <VincularSelect producto={p} productosPropios={productosPropios} onVinculado={() => { cargarProductos(); onCambioGlobal(); }} />
                      <button onClick={() => eliminarProducto(p.id)} className="text-xs text-red-600 hover:underline">Eliminar</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : tab === 'vinculados' ? (
          <div>
            {vinculados.length === 0 ? (
              <p className="text-sm text-gray-400">Todavía no vinculaste ningún producto de esta tienda con un artículo.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {vinculados.map((p) => (
                  <li key={p.id} className="py-2 space-y-1.5 text-sm">
                    <div>
                      <span className="font-medium text-gray-900">{p.nombre}</span>
                      <span className="text-gray-400"> → </span>
                      <span className="text-coteja-azul-800">{p.producto_propio_nombre}</span>
                      <span className="text-gray-400"> · </span>
                      <PrecioEditableProducto producto={p} onGuardado={() => { cargarProductos(); onCambioGlobal(); }} />
                    </div>
                    <div className="flex items-center gap-2">
                      <VincularSelect producto={p} productosPropios={productosPropios} onVinculado={() => { cargarProductos(); onCambioGlobal(); }} />
                      <button onClick={() => quitarVinculo(p.vinculo_id)} className="text-xs text-red-600 hover:underline">Eliminar</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <TabConfiguracion tienda={tienda} tiposExistentes={tiposExistentes} onGuardado={onTiendaActualizada} />
        )}
      </div>
    </Modal>
  );
}

function TiendaCard({ tienda, vinculados, onClick, destacada }) {
  const primeros = vinculados.slice(0, 2);
  const restantes = vinculados.length - primeros.length;

  return (
    <button
      onClick={onClick}
      className={
        'w-full text-left bg-white rounded-xl shadow p-4 hover:shadow-md transition ' +
        (destacada ? 'border-2 border-amber-400' : '')
      }
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LogoPlataforma plataforma={tienda.plataforma} />
          <div>
            <p className="font-medium text-gray-900">
              {tienda.nombre}
              {tienda.tipo && <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded align-middle">{tienda.tipo}</span>}
            </p>
            <p className="text-xs text-gray-500">{tienda.plataforma}</p>
          </div>
        </div>
        <span className="text-xs text-gray-400">Ver →</span>
      </div>
      <div className="mt-2 text-xs text-gray-500">
        {vinculados.length === 0 ? (
          <span className="text-gray-400">Sin artículos vinculados todavía</span>
        ) : (
          <>
            {primeros.map((v) => v.producto_propio_nombre).join(' · ')}
            {restantes > 0 && ' · +' + restantes + ' más'}
          </>
        )}
      </div>
    </button>
  );
}

export default function Competidores() {
  const { marcaActualId } = useMarca();
  const [searchParams] = useSearchParams();
  const [tiendas, setTiendas] = useState(null);
  const [productosCompetenciaPorTienda, setProductosCompetenciaPorTienda] = useState({});
  const [productosPropios, setProductosPropios] = useState([]);
  const [mostrarFormNuevaTienda, setMostrarFormNuevaTienda] = useState(false);
  const [mostrarFormMiTienda, setMostrarFormMiTienda] = useState(false);
  const [tiendaAbierta, setTiendaAbierta] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [filtroTipos, setFiltroTipos] = useState([]);
  const [filtroPlataformas, setFiltroPlataformas] = useState([]);
  const [filtroCompetidores, setFiltroCompetidores] = useState([]);

  async function cargar() {
    const [tiendasData, panel] = await Promise.all([
      api.get('/api/competidores/' + marcaActualId),
      api.get('/api/panel/' + marcaActualId),
    ]);
    setTiendas(tiendasData);
    setProductosPropios(panel.map((p) => ({ id: p.id, nombre: p.nombre, vinculosExistentes: p.competencia.length })));

    // Para el resumen de cada card ("2 vinculados, +N más") sin tener que
    // abrir cada tienda - se trae en paralelo la lista de productos de cada una.
    const listas = await Promise.all(
      tiendasData.map((t) => api.get('/api/productos-competencia/' + t.id).then((r) => [t.id, r]))
    );
    setProductosCompetenciaPorTienda(Object.fromEntries(listas));
  }

  useEffect(() => {
    cargar();
  }, [marcaActualId]);

  // Deep-link desde el banner de incidencias ("Ver →" en Layout.jsx) - abre
  // directo la tienda en cuestion en cuanto termino de cargar la lista.
  useEffect(() => {
    const idParam = searchParams.get('tienda');
    if (!idParam || !tiendas) return;
    const t = tiendas.find((t) => String(t.id) === idParam);
    if (t) setTiendaAbierta(t);
  }, [searchParams, tiendas]);

  const miTienda = useMemo(() => tiendas?.find((t) => t.es_propia) || null, [tiendas]);
  const competidores = useMemo(() => (tiendas || []).filter((t) => !t.es_propia), [tiendas]);
  const tiposExistentes = useMemo(
    () => [...new Set(competidores.map((c) => c.tipo).filter(Boolean))],
    [competidores]
  );
  const plataformasDisponibles = useMemo(
    () => [...new Set(competidores.map((c) => c.plataforma).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [competidores]
  );

  function alternar(lista, setLista, valor) {
    setLista(lista.includes(valor) ? lista.filter((v) => v !== valor) : [...lista, valor]);
  }

  const filtrosActivos = filtroTipos.length + filtroPlataformas.length + filtroCompetidores.length;

  const competidoresFiltrados = useMemo(
    () => competidores.filter((c) => {
      const q = busqueda.toLowerCase();
      if (q && !(c.nombre.toLowerCase().includes(q) || c.plataforma.toLowerCase().includes(q))) return false;
      if (filtroTipos.length > 0 && !filtroTipos.includes(c.tipo)) return false;
      if (filtroPlataformas.length > 0 && !filtroPlataformas.includes(c.plataforma)) return false;
      if (filtroCompetidores.length > 0 && !filtroCompetidores.includes(c.id)) return false;
      return true;
    }),
    [competidores, busqueda, filtroTipos, filtroPlataformas, filtroCompetidores]
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Tiendas</h1>

      <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4">
        <h2 className="font-semibold text-amber-900 mb-1">Mi tienda</h2>
        {miTienda ? (
          <TiendaCard
            tienda={miTienda}
            vinculados={(productosCompetenciaPorTienda[miTienda.id] || []).filter((p) => p.vinculo_id)}
            onClick={() => setTiendaAbierta(miTienda)}
            destacada
          />
        ) : mostrarFormMiTienda ? (
          <FormAgregarTienda
            marcaId={marcaActualId}
            esPropia
            tiposExistentes={[]}
            onAgregado={() => { setMostrarFormMiTienda(false); cargar(); }}
            onCancelar={() => setMostrarFormMiTienda(false)}
          />
        ) : (
          <button onClick={() => setMostrarFormMiTienda(true)} className="text-sm text-amber-800 font-medium hover:underline">
            + Agregar el link de mi tienda
          </button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <h2 className="font-medium text-gray-900">Competencia</h2>
        <button onClick={() => setMostrarFormNuevaTienda((v) => !v)} className="text-sm text-coteja-azul-700 hover:underline">
          {mostrarFormNuevaTienda ? 'Cerrar' : '+ Nuevo competidor'}
        </button>
      </div>

      {mostrarFormNuevaTienda && (
        <div className="bg-white rounded-xl shadow p-4">
          <FormAgregarTienda
            marcaId={marcaActualId}
            tiposExistentes={tiposExistentes}
            onAgregado={() => { setMostrarFormNuevaTienda(false); cargar(); }}
          />
        </div>
      )}

      {competidores.length > 0 && (
        <div className="flex items-center gap-2">
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre o plataforma..."
            className="w-full sm:w-80 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-coteja-azul-500"
          />
          {(tiposExistentes.length > 0 || plataformasDisponibles.length > 0 || competidores.length > 0) && (
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
      )}

      {competidores.length > 0 && mostrarFiltros && (
        <div className="bg-white rounded-xl shadow p-3 space-y-3">
          {tiposExistentes.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400 mb-1.5">Tipo</p>
              <div className="flex flex-wrap gap-1.5">
                {tiposExistentes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => alternar(filtroTipos, setFiltroTipos, t)}
                    className={
                      'text-xs px-2.5 py-1 rounded-full border ' +
                      (filtroTipos.includes(t) ? 'bg-coteja-azul-100 border-coteja-azul-400 text-coteja-azul-900 font-medium' : 'border-gray-300 text-gray-600 hover:bg-gray-50')
                    }
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          )}
          {plataformasDisponibles.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400 mb-1.5">Plataforma</p>
              <div className="flex flex-wrap gap-1.5">
                {plataformasDisponibles.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => alternar(filtroPlataformas, setFiltroPlataformas, p)}
                    className={
                      'text-xs px-2.5 py-1 rounded-full border ' +
                      (filtroPlataformas.includes(p) ? 'bg-coteja-azul-100 border-coteja-azul-400 text-coteja-azul-900 font-medium' : 'border-gray-300 text-gray-600 hover:bg-gray-50')
                    }
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
          {competidores.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase text-gray-400 mb-1.5">Competencia</p>
              <div className="flex flex-wrap gap-1.5">
                {competidores.map((c) => (
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
          {filtrosActivos > 0 && (
            <button
              type="button"
              onClick={() => { setFiltroTipos([]); setFiltroPlataformas([]); setFiltroCompetidores([]); }}
              className="text-xs text-coteja-azul-700 hover:underline"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {tiendas == null ? (
        <p className="text-gray-400">Cargando...</p>
      ) : competidores.length === 0 ? (
        <p className="text-gray-400">Todavía no cargaste ningún competidor.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {competidoresFiltrados.map((c) => (
            <TiendaCard
              key={c.id}
              tienda={c}
              vinculados={(productosCompetenciaPorTienda[c.id] || []).filter((p) => p.vinculo_id)}
              onClick={() => setTiendaAbierta(c)}
            />
          ))}
        </div>
      )}

      {tiendaAbierta && (
        <TiendaModal
          tienda={tiendaAbierta}
          marcaId={marcaActualId}
          tiposExistentes={tiposExistentes}
          productosPropios={productosPropios}
          onCerrar={() => setTiendaAbierta(null)}
          onCambioGlobal={cargar}
          onTiendaActualizada={(actualizada) => { setTiendaAbierta(actualizada); cargar(); }}
        />
      )}
    </div>
  );
}
