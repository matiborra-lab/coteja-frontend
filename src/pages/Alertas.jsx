import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useMarca } from '../context/MarcaContext';
import { api } from '../api/client';
import { Campo, Boton, Modal, Leyenda } from '../components/ui';
import { suscribirsePush, pushDisponible, estaSuscripto } from '../utils/push';

const TIPOS_ALERTA = [
  { value: 'POSICIONAMIENTO', label: 'Reporte general de posicionamiento' },
  { value: 'CAMBIOS_COMPETENCIA', label: 'Cambios de precios de competidores' },
  { value: 'POSICION_VS_MERCADO', label: 'Posición vs. mercado' },
];

const CONDICIONES = [
  { value: 'CUALQUIER_CAMBIO', label: 'Cambie el precio' },
  { value: 'VARIACION_PORCENTAJE', label: 'El precio varíe más de un porcentaje' },
];

// Una alerta de posicion vs. mercado chequea UN solo lado (no una franja) -
// el alcance/filtro tambien es uno solo por alerta, asi que si el cliente
// necesita vigilar categorias distintas en direcciones distintas (ej:
// bebidas por debajo, hamburguesas por encima), crea alertas separadas.
const CONDICIONES_POSICION_VS_MERCADO = [
  { value: 'POR_ENCIMA', label: 'Por encima del promedio de competencia' },
  { value: 'POR_DEBAJO', label: 'Por debajo del promedio de competencia' },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NOMBRES_DIAS_LARGO = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const NOMBRES_DIAS_CORTO = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];
const ORDEN_VISUAL_DIAS = [1, 2, 3, 4, 5, 6, 0]; // Lunes primero para mostrar, aunque el valor interno sea 0=Domingo

// El push solo tiene sentido en alertas puntuales/accionables - reportes de
// rutina (POSICIONAMIENTO, CAMBIOS_COMPETENCIA programado) no lo ofrecen,
// mismo criterio que el backend (ver server/index.js).
function pushDisponibleParaEsteTipo(tipo, modalidadEnvio) {
  return (tipo === 'CAMBIOS_COMPETENCIA' && modalidadEnvio === 'AUTOMATICO') || tipo === 'POSICION_VS_MERCADO';
}

function tipoLabel(valor) {
  return TIPOS_ALERTA.find((t) => t.value === valor)?.label || valor;
}
function condicionLabel(valor) {
  return [...CONDICIONES, ...CONDICIONES_POSICION_VS_MERCADO].find((c) => c.value === valor)?.label || valor;
}
function formatoFecha(fecha) {
  if (!fecha) return '-';
  return new Date(fecha).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
}

// -----------------------------------------------------------------------
// Piezas reutilizables de programación / destinatarios / alcance
// -----------------------------------------------------------------------

function ChipsEmailInput({ value, onChange }) {
  const [texto, setTexto] = useState('');
  const [error, setError] = useState('');

  function agregar() {
    const email = texto.trim();
    if (!email) return;
    if (!EMAIL_REGEX.test(email)) { setError('Ese mail no tiene un formato válido'); return; }
    if (!value.includes(email)) onChange([...value, email]);
    setTexto('');
    setError('');
  }

  return (
    <div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          {value.map((email) => (
            <span key={email} className="inline-flex items-center gap-1 text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
              {email}
              <button type="button" onClick={() => onChange(value.filter((e) => e !== email))} className="text-gray-400 hover:text-red-600 leading-none">
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <input
        type="text"
        value={texto}
        onChange={(e) => { setTexto(e.target.value); setError(''); }}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregar(); } }}
        onBlur={agregar}
        placeholder="mail@ejemplo.com y Enter"
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-coteja-azul-500"
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

function SelectorDiasSemana({ value, onChange }) {
  return (
    <div className="flex gap-1.5">
      {ORDEN_VISUAL_DIAS.map((dia) => (
        <button
          type="button"
          key={dia}
          onClick={() => onChange(value.includes(dia) ? value.filter((d) => d !== dia) : [...value, dia])}
          title={NOMBRES_DIAS_LARGO[dia]}
          className={'w-8 h-8 rounded-full text-xs font-medium transition ' + (value.includes(dia) ? 'bg-coteja-azul-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}
        >
          {NOMBRES_DIAS_CORTO[dia]}
        </button>
      ))}
    </div>
  );
}

function SelectorDiasMes({ value, onChange }) {
  return (
    <div className="grid grid-cols-7 gap-1 max-w-[248px]">
      {Array.from({ length: 31 }, (_, i) => i + 1).map((dia) => (
        <button
          type="button"
          key={dia}
          onClick={() => onChange(value.includes(dia) ? value.filter((d) => d !== dia) : [...value, dia])}
          className={'w-8 h-8 rounded text-xs font-medium transition ' + (value.includes(dia) ? 'bg-coteja-azul-800 text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}
        >
          {dia}
        </button>
      ))}
    </div>
  );
}

function leyendaProgramacion({ frecuencia, horaEnvio, diasSemana, diasMes }) {
  if (frecuencia === 'DIARIA') return 'Se enviará todos los días a las ' + horaEnvio + ' h.';
  if (frecuencia === 'SEMANAL') {
    if (diasSemana.length === 0) return 'Elegí al menos un día de la semana.';
    const dias = [...diasSemana].sort((a, b) => a - b).map((d) => NOMBRES_DIAS_LARGO[d]);
    return 'Se enviará todos los ' + dias.join(', ') + ' a las ' + horaEnvio + ' h.';
  }
  if (frecuencia === 'MENSUAL') {
    if (diasMes.length === 0) return 'Elegí al menos un día del mes.';
    const dias = [...diasMes].sort((a, b) => a - b);
    return 'Se enviará los días ' + dias.join(', ') + ' de cada mes a las ' + horaEnvio + ' h. Si en algún mes ese día no existe, se ejecuta el último día disponible de ese mes.';
  }
  return '';
}

function SelectorProgramacion({ frecuencia, horaEnvio, diasSemana, diasMes, onChange }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Frecuencia</label>
          <select
            value={frecuencia}
            onChange={(e) => onChange({ frecuencia: e.target.value, horaEnvio, diasSemana, diasMes })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2"
          >
            <option value="DIARIA">Diaria</option>
            <option value="SEMANAL">Semanal</option>
            <option value="MENSUAL">Mensual</option>
          </select>
        </div>
        <Campo label="Hora de envío" type="time" value={horaEnvio} onChange={(e) => onChange({ frecuencia, horaEnvio: e.target.value, diasSemana, diasMes })} />
      </div>
      {frecuencia === 'SEMANAL' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Días</label>
          <SelectorDiasSemana value={diasSemana} onChange={(d) => onChange({ frecuencia, horaEnvio, diasSemana: d, diasMes })} />
        </div>
      )}
      {frecuencia === 'MENSUAL' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Días del mes</label>
          <SelectorDiasMes value={diasMes} onChange={(d) => onChange({ frecuencia, horaEnvio, diasSemana, diasMes: d })} />
        </div>
      )}
      <Leyenda>{leyendaProgramacion({ frecuencia, horaEnvio, diasSemana, diasMes })}</Leyenda>
    </div>
  );
}

// Mismo patron que SelectorProductos (categoria->producto) pero
// tipo->competidor: agrupa por competidores.tipo (la misma etiqueta libre
// que ya se carga en Tiendas > Configuración y se usa como filtro en el
// Panel) - un tipo entero queda dinamico (suma competidores nuevos de ese
// tipo solos), igual que categorias_completas para productos. Los
// competidores sin tipo cargado caen en un grupo "Sin tipo".
function SelectorCompetidores({ competidores, value, onChange }) {
  const grupos = useMemo(() => {
    const mapa = new Map();
    for (const c of competidores) {
      const tipo = c.tipo || 'Sin tipo';
      if (!mapa.has(tipo)) mapa.set(tipo, []);
      mapa.get(tipo).push(c);
    }
    return [...mapa.entries()];
  }, [competidores]);

  function toggleTipo(tipo, competidoresDeTipo) {
    const yaCompleto = value.tipos_completos.includes(tipo);
    if (yaCompleto) {
      onChange({ ...value, tipos_completos: value.tipos_completos.filter((t) => t !== tipo) });
    } else {
      const idsDeTipo = competidoresDeTipo.map((c) => c.id);
      onChange({
        ...value,
        tipos_completos: [...value.tipos_completos, tipo],
        competidores_ids: value.competidores_ids.filter((id) => !idsDeTipo.includes(id)),
      });
    }
  }

  function toggleCompetidor(id, tipo) {
    if (value.tipos_completos.includes(tipo)) return;
    const yaIncluido = value.competidores_ids.includes(id);
    onChange({
      ...value,
      competidores_ids: yaIncluido ? value.competidores_ids.filter((x) => x !== id) : [...value.competidores_ids, id],
    });
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            checked={value.modo_competidores === 'TODOS'}
            onChange={() => onChange({ ...value, modo_competidores: 'TODOS', competidores_ids: [], tipos_completos: [] })}
          />
          Todos los competidores
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            checked={value.modo_competidores === 'SELECCION'}
            onChange={() => onChange({ ...value, modo_competidores: 'SELECCION' })}
          />
          Elegir competidores
        </label>
      </div>
      {value.modo_competidores === 'SELECCION' && (
        <div className="border border-gray-200 rounded-lg p-2 max-h-56 overflow-y-auto space-y-2">
          {grupos.length === 0 && <p className="text-xs text-gray-400">Esta marca todavía no tiene competidores cargados.</p>}
          {grupos.map(([tipoNombre, comps]) => {
            const tipoCompleto = value.tipos_completos.includes(tipoNombre);
            return (
              <div key={tipoNombre}>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                  <input type="checkbox" checked={tipoCompleto} onChange={() => toggleTipo(tipoNombre, comps)} />
                  {tipoNombre} <span className="text-xs text-gray-400 font-normal">(Todos)</span>
                </label>
                <div className="pl-5 space-y-0.5 mt-0.5">
                  {comps.map((c) => (
                    <label key={c.id} className="flex items-center gap-1.5 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={tipoCompleto || value.competidores_ids.includes(c.id)}
                        disabled={tipoCompleto}
                        onChange={() => toggleCompetidor(c.id, tipoNombre)}
                      />
                      {c.nombre}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Arbol categoria -> producto (checkboxes) para "Productos a monitorear" -
// se expresa siempre en terminos del catalogo PROPIO (no hace falta que el
// cliente reconozca el nombre exacto que cada competidor le puso a su
// version de cada producto), tanto para el reporte de posicionamiento como
// para filtrar que cambios de competencia mirar.
function SelectorProductos({ productosPropios, value, onChange }) {
  const grupos = useMemo(() => {
    const mapa = new Map();
    for (const p of productosPropios) {
      const cat = p.categoria || 'Sin categoría';
      if (!mapa.has(cat)) mapa.set(cat, []);
      mapa.get(cat).push(p);
    }
    return [...mapa.entries()];
  }, [productosPropios]);

  function toggleCategoria(cat, productosDeCat) {
    const yaCompleta = value.categorias_completas.includes(cat);
    if (yaCompleta) {
      onChange({ ...value, categorias_completas: value.categorias_completas.filter((c) => c !== cat) });
    } else {
      const idsDeCat = productosDeCat.map((p) => p.id);
      onChange({
        ...value,
        categorias_completas: [...value.categorias_completas, cat],
        productos_ids: value.productos_ids.filter((id) => !idsDeCat.includes(id)),
      });
    }
  }

  function toggleProducto(id, cat) {
    if (value.categorias_completas.includes(cat)) return;
    const yaIncluido = value.productos_ids.includes(id);
    onChange({
      ...value,
      productos_ids: yaIncluido ? value.productos_ids.filter((x) => x !== id) : [...value.productos_ids, id],
    });
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-4 text-sm">
        <label className="flex items-center gap-1.5">
          <input type="radio" checked={value.modo_productos === 'TODOS'} onChange={() => onChange({ ...value, modo_productos: 'TODOS' })} />
          Todos los productos
        </label>
        <label className="flex items-center gap-1.5">
          <input type="radio" checked={value.modo_productos === 'SELECCION'} onChange={() => onChange({ ...value, modo_productos: 'SELECCION' })} />
          Elegir categorías/productos
        </label>
      </div>
      {value.modo_productos === 'SELECCION' && (
        <div className="border border-gray-200 rounded-lg p-2 max-h-56 overflow-y-auto space-y-2">
          {grupos.length === 0 && <p className="text-xs text-gray-400">Esta marca todavía no tiene artículos cargados.</p>}
          {grupos.map(([cat, productos]) => {
            const catCompleta = value.categorias_completas.includes(cat);
            return (
              <div key={cat}>
                <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                  <input type="checkbox" checked={catCompleta} onChange={() => toggleCategoria(cat, productos)} />
                  {cat} <span className="text-xs text-gray-400 font-normal">(Todas)</span>
                </label>
                <div className="pl-5 space-y-0.5 mt-0.5">
                  {productos.map((p) => (
                    <label key={p.id} className="flex items-center gap-1.5 text-sm text-gray-600">
                      <input
                        type="checkbox"
                        checked={catCompleta || value.productos_ids.includes(p.id)}
                        disabled={catCompleta}
                        onChange={() => toggleProducto(p.id, cat)}
                      />
                      {p.nombre}
                    </label>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Compartido entre CAMBIOS_COMPETENCIA automática y POSICION_VS_MERCADO -
// las dos unicas alertas puntuales/accionables donde el push tiene sentido.
function NotificacionPushCheckbox({ checked, suscribiendo, error, onChange }) {
  return (
    <div className="space-y-1">
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={checked} disabled={suscribiendo} onChange={(e) => onChange(e.target.checked)} />
        Enviar notificación push a tus dispositivos móviles vinculados
      </label>
      <p className="text-xs text-gray-400">
        Se envía a todos los dispositivos donde el mismo usuario tenga la app instalada y las notificaciones activadas.
      </p>
      {suscribiendo && <p className="text-xs text-gray-400">Activando notificaciones...</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

function bloqueVacio() {
  return {
    modo_competidores: 'TODOS', competidores_ids: [], tipos_completos: [],
    modo_productos: 'TODOS', categorias_completas: [], productos_ids: [],
  };
}

// -----------------------------------------------------------------------
// Formulario de alta/edición - un unico componente para las dos acciones,
// en modo edicion agrega "Eliminar alerta" con confirmacion.
// -----------------------------------------------------------------------

function FormAlerta({ alerta, marcaActualId, usuarioEmail, onGuardado, onEliminado, onCancelar }) {
  const { marcas, usuario } = { ...useMarca(), usuario: useAuth().usuario };
  const esMultimarca = usuario.tipo_cuenta === 'MULTIMARCA' && marcas.length > 1;

  const [tipo, setTipo] = useState(alerta?.tipo || 'CAMBIOS_COMPETENCIA');
  const [observacion, setObservacion] = useState(alerta?.observacion || '');
  const [marcasSeleccionadas, setMarcasSeleccionadas] = useState(
    alerta ? alerta.marcas.map((m) => m.marca_id) : [marcaActualId]
  );
  const [bloquesPorMarca, setBloquesPorMarca] = useState(() => {
    if (!alerta) return { [marcaActualId]: bloqueVacio() };
    return Object.fromEntries(alerta.marcas.map((m) => [m.marca_id, {
      // modo_competidores no se persiste (a diferencia de modo_productos) -
      // se deriva UNA sola vez acá a partir de lo ya guardado, para que una
      // alerta existente con selección real se vea en modo "Elegir
      // competidores" al editarla. De ahí en más es estado propio del
      // formulario, no se vuelve a recalcular por el contenido de los
      // arrays (ver SelectorCompetidores).
      modo_competidores: (m.competidores_ids?.length || m.tipos_completos?.length) ? 'SELECCION' : 'TODOS',
      competidores_ids: m.competidores_ids || [],
      tipos_completos: m.tipos_completos || [],
      modo_productos: m.modo_productos || 'TODOS',
      categorias_completas: m.categorias_completas || [],
      productos_ids: m.productos_ids || [],
    }]));
  });
  const [condicion, setCondicion] = useState(alerta?.condicion || 'CUALQUIER_CAMBIO');
  const [umbral, setUmbral] = useState(alerta?.condicion_umbral_porcentaje ?? '');
  const [modalidadEnvio, setModalidadEnvio] = useState(alerta?.modalidad_envio || 'AUTOMATICO');
  const [notificacionPush, setNotificacionPush] = useState(alerta?.notificacion_push || false);
  const [pushError, setPushError] = useState('');
  const [suscribiendoPush, setSuscribiendoPush] = useState(false);
  const [frecuencia, setFrecuencia] = useState(alerta?.frecuencia_programada || 'SEMANAL');
  const [horaEnvio, setHoraEnvio] = useState(alerta?.hora_envio?.slice(0, 5) || '09:00');
  const [diasSemana, setDiasSemana] = useState(alerta?.dias_semana || [1]);
  const [diasMes, setDiasMes] = useState(alerta?.dias_mes || [1]);
  const [emailsCc, setEmailsCc] = useState(alerta?.emails_cc || []);
  // 'CUENTA' = usar usuarioEmail (default), 'OTRO' = override cargado en
  // email_principal, 'NINGUNO' = email_principal_desactivado (solo CC/push).
  const [emailPrincipalModo, setEmailPrincipalModo] = useState(() => {
    if (!alerta) return 'CUENTA';
    if (alerta.email_principal_desactivado) return 'NINGUNO';
    if (alerta.email_principal) return 'OTRO';
    return 'CUENTA';
  });
  const [emailPrincipalValor, setEmailPrincipalValor] = useState(alerta?.email_principal || '');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const [datosPorMarca, setDatosPorMarca] = useState({});

  useEffect(() => {
    const faltantes = marcasSeleccionadas.filter((id) => id && !datosPorMarca[id]);
    if (faltantes.length === 0) return;
    Promise.all(faltantes.map((id) =>
      Promise.all([api.get('/api/competidores/' + id), api.get('/api/panel/' + id)]).then(([comps, panel]) => [id, {
        competidores: comps.filter((c) => !c.es_propia),
        productosPropios: panel.map((p) => ({ id: p.id, nombre: p.nombre, categoria: p.categoria })),
      }])
    )).then((entradas) => setDatosPorMarca((prev) => ({ ...prev, ...Object.fromEntries(entradas) })));
  }, [marcasSeleccionadas]);

  function toggleMarca(marcaId) {
    setMarcasSeleccionadas((prev) => {
      if (prev.includes(marcaId)) return prev.filter((id) => id !== marcaId);
      return [...prev, marcaId];
    });
    setBloquesPorMarca((prev) => (prev[marcaId] ? prev : { ...prev, [marcaId]: bloqueVacio() }));
  }

  function actualizarBloque(marcaId, cambios) {
    setBloquesPorMarca((prev) => ({ ...prev, [marcaId]: { ...prev[marcaId], ...cambios } }));
  }

  // "condicion" es la misma columna para CAMBIOS_COMPETENCIA y POSICION_VS_MERCADO
  // (valores distintos segun el tipo) - al cambiar de tipo, si el valor
  // actual no es valido para el tipo nuevo, se resetea a un default sensato
  // en vez de dejar un radio sin marcar.
  function onTipoChange(nuevoTipo) {
    setTipo(nuevoTipo);
    if (nuevoTipo === 'POSICION_VS_MERCADO' && !CONDICIONES_POSICION_VS_MERCADO.some((c) => c.value === condicion)) {
      setCondicion('POR_ENCIMA');
    } else if (nuevoTipo === 'CAMBIOS_COMPETENCIA' && !CONDICIONES.some((c) => c.value === condicion)) {
      setCondicion('CUALQUIER_CAMBIO');
    }
  }

  const esProgramada = tipo === 'POSICIONAMIENTO' || (tipo === 'CAMBIOS_COMPETENCIA' && modalidadEnvio === 'PROGRAMADO');
  const pushDisponibleAqui = pushDisponibleParaEsteTipo(tipo, modalidadEnvio);
  const quedariaSinCanal = emailsCc.length === 0 && !(pushDisponibleAqui && notificacionPush);

  // Tildar la casilla registra el dispositivo actual (pide permiso al
  // navegador) - un dispositivo ya suscripto queda disponible para
  // cualquier otra alerta con push activado, no hace falta repetirlo.
  // Destildar solo apaga el push de ESTA alerta, no desuscribe el
  // dispositivo (podria estar en uso por otra alerta).
  async function onNotificacionPushChange(activar) {
    setPushError('');
    if (!activar) { setNotificacionPush(false); return; }
    setSuscribiendoPush(true);
    try {
      await suscribirsePush();
      setNotificacionPush(true);
    } catch (err) {
      setPushError(err.message);
    } finally {
      setSuscribiendoPush(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (marcasSeleccionadas.length === 0) { setError('Elegí al menos una marca'); return; }
    setError('');
    setGuardando(true);
    try {
      const body = {
        tipo,
        observacion: observacion.trim() || null,
        condicion: tipo === 'CAMBIOS_COMPETENCIA' || tipo === 'POSICION_VS_MERCADO' ? condicion : null,
        condicion_umbral_porcentaje:
          (tipo === 'CAMBIOS_COMPETENCIA' && condicion === 'VARIACION_PORCENTAJE') || tipo === 'POSICION_VS_MERCADO'
            ? Number(umbral) : null,
        modalidad_envio: tipo === 'CAMBIOS_COMPETENCIA' ? modalidadEnvio : null,
        notificacion_push: pushDisponibleAqui ? notificacionPush : false,
        frecuencia_programada: esProgramada ? frecuencia : null,
        hora_envio: esProgramada ? horaEnvio : null,
        dias_semana: esProgramada && frecuencia === 'SEMANAL' ? diasSemana : null,
        dias_mes: esProgramada && frecuencia === 'MENSUAL' ? diasMes : null,
        email_principal: emailPrincipalModo === 'OTRO' ? emailPrincipalValor.trim() : null,
        email_principal_desactivado: emailPrincipalModo === 'NINGUNO',
        marcas: marcasSeleccionadas.map((id) => {
          const bloque = bloquesPorMarca[id] || bloqueVacio();
          return {
            marca_id: id,
            competidores_ids: bloque.competidores_ids,
            tipos_completos: bloque.tipos_completos,
            modo_productos: bloque.modo_productos,
            categorias_completas: bloque.categorias_completas,
            productos_ids: bloque.productos_ids,
          };
        }),
        emails_cc: emailsCc,
      };
      if (alerta) {
        await api.patch('/api/alertas/' + alerta.id, body);
      } else {
        await api.post('/api/alertas', body);
      }
      onGuardado();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar() {
    if (!confirm('¿Eliminar esta alerta? Esta acción no se puede deshacer.')) return;
    setEliminando(true);
    try {
      await api.del('/api/alertas/' + alerta.id);
      onEliminado();
    } catch (err) {
      setError(err.message);
    } finally {
      setEliminando(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de alerta</label>
        <select value={tipo} onChange={(e) => onTipoChange(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2">
          {TIPOS_ALERTA.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      <Campo
        label="Observación (opcional)"
        value={observacion}
        onChange={(e) => setObservacion(e.target.value)}
        placeholder="ej: Control semanal de hamburguesas"
      />

      {esMultimarca && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">¿A qué marca aplica esta alerta?</label>
          <div className="flex flex-wrap gap-3">
            {marcas.map((m) => (
              <label key={m.id} className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" checked={marcasSeleccionadas.includes(m.id)} onChange={() => toggleMarca(m.id)} />
                {m.nombre}
              </label>
            ))}
          </div>
        </div>
      )}

      {tipo === 'CAMBIOS_COMPETENCIA' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notificar cuando</label>
          <div className="space-y-1.5">
            {CONDICIONES.map((c) => (
              <label key={c.value} className="flex items-center gap-2 text-sm">
                <input type="radio" checked={condicion === c.value} onChange={() => setCondicion(c.value)} />
                {c.label}
                {c.value === 'VARIACION_PORCENTAJE' && condicion === 'VARIACION_PORCENTAJE' && (
                  <input
                    type="number" step="0.1" min="0" required value={umbral}
                    onChange={(e) => setUmbral(e.target.value)}
                    placeholder="%"
                    className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-sm ml-1"
                  />
                )}
              </label>
            ))}
          </div>
        </div>
      )}

      {tipo === 'POSICION_VS_MERCADO' && (
        <div className="space-y-3">
          <Leyenda>
            Te avisa cuando tu precio se aleja del promedio de la competencia filtrada más de lo que definas abajo. No es
            un reporte periódico: se dispara sola cuando detecta un producto fuera de rango. Igual que con cambios de
            precio de la competencia, espera un poco (hasta 60 minutos) antes de avisarte, dando tiempo a que la
            competencia termine de actualizar su carta - si para entonces el precio volvió a estar dentro del rango, no
            te llega nada. Una alerta chequea un solo lado - si necesitás vigilar otras categorías en la dirección
            contraria, creá otra alerta con su propio filtro.
          </Leyenda>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Avisarme cuando mi precio esté</label>
            <div className="space-y-1.5">
              {CONDICIONES_POSICION_VS_MERCADO.map((c) => (
                <label key={c.value} className="flex items-center gap-2 text-sm">
                  <input type="radio" checked={condicion === c.value} onChange={() => setCondicion(c.value)} />
                  {c.label}
                  {condicion === c.value && (
                    <input
                      type="number" step="0.1" min="0" required value={umbral}
                      onChange={(e) => setUmbral(e.target.value)}
                      placeholder="%"
                      className="w-20 rounded-lg border border-gray-300 px-2 py-1 text-sm ml-1"
                    />
                  )}
                </label>
              ))}
            </div>
          </div>
          <NotificacionPushCheckbox
            checked={notificacionPush}
            suscribiendo={suscribiendoPush}
            error={pushError}
            onChange={onNotificacionPushChange}
          />
        </div>
      )}

      {marcasSeleccionadas.filter(Boolean).map((marcaId) => {
        const marca = marcas.find((m) => m.id === marcaId);
        const datos = datosPorMarca[marcaId];
        const bloque = bloquesPorMarca[marcaId] || bloqueVacio();
        return (
          <div key={marcaId} className="border border-gray-200 rounded-lg p-3 space-y-3">
            {esMultimarca && <p className="text-sm font-medium text-gray-900">{marca?.nombre}</p>}
            {!datos ? (
              <p className="text-xs text-gray-400">Cargando...</p>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {tipo === 'POSICIONAMIENTO' || tipo === 'POSICION_VS_MERCADO' ? 'Competencias a monitorear' : 'Competidores a monitorear'}
                  </label>
                  <SelectorCompetidores
                    competidores={datos.competidores}
                    value={{ modo_competidores: bloque.modo_competidores, competidores_ids: bloque.competidores_ids, tipos_completos: bloque.tipos_completos }}
                    onChange={(v) => actualizarBloque(marcaId, v)}
                  />
                  {(tipo === 'POSICIONAMIENTO' || tipo === 'POSICION_VS_MERCADO') && (
                    <p className="text-xs text-gray-400 mt-1">El promedio se calcula solo con las competencias elegidas.</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Productos a monitorear</label>
                  <SelectorProductos
                    productosPropios={datos.productosPropios}
                    value={bloque}
                    onChange={(v) => actualizarBloque(marcaId, v)}
                  />
                </div>
              </>
            )}
          </div>
        );
      })}

      {tipo === 'CAMBIOS_COMPETENCIA' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Modalidad de envío</label>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={modalidadEnvio === 'AUTOMATICO'} onChange={() => setModalidadEnvio('AUTOMATICO')} />
              Enviar automáticamente al detectar cambios
            </label>
            {modalidadEnvio === 'AUTOMATICO' && (
              <>
                <Leyenda>
                  Para evitar notificaciones incompletas, COTEJA agrupa durante aproximadamente 60 minutos los cambios detectados
                  antes de enviar el aviso.
                </Leyenda>
                <div className="pl-6">
                  <NotificacionPushCheckbox
                    checked={notificacionPush}
                    suscribiendo={suscribiendoPush}
                    error={pushError}
                    onChange={onNotificacionPushChange}
                  />
                </div>
              </>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={modalidadEnvio === 'PROGRAMADO'} onChange={() => setModalidadEnvio('PROGRAMADO')} />
              Enviar cambios como reporte programado
            </label>
          </div>
        </div>
      )}

      {esProgramada && (
        <SelectorProgramacion
          frecuencia={frecuencia}
          horaEnvio={horaEnvio}
          diasSemana={diasSemana}
          diasMes={diasMes}
          onChange={(v) => { setFrecuencia(v.frecuencia); setHoraEnvio(v.horaEnvio); setDiasSemana(v.diasSemana); setDiasMes(v.diasMes); }}
        />
      )}
      {(esProgramada || (tipo === 'CAMBIOS_COMPETENCIA' && modalidadEnvio === 'PROGRAMADO')) && (
        <Leyenda>Si durante este período no se detectan cambios que cumplan las condiciones configuradas, no se enviará ningún correo.</Leyenda>
      )}

      <div className="space-y-2 border-t border-gray-100 pt-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Enviar a</label>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={emailPrincipalModo === 'CUENTA'} onChange={() => setEmailPrincipalModo('CUENTA')} />
              El mail de tu cuenta ({usuarioEmail})
            </label>
            <label className="flex flex-wrap items-center gap-2 text-sm">
              <input type="radio" checked={emailPrincipalModo === 'OTRO'} onChange={() => setEmailPrincipalModo('OTRO')} />
              Otro mail
              {emailPrincipalModo === 'OTRO' && (
                <input
                  type="email" required value={emailPrincipalValor}
                  onChange={(e) => setEmailPrincipalValor(e.target.value)}
                  placeholder="mail@ejemplo.com"
                  className="flex-1 min-w-[180px] rounded-lg border border-gray-300 px-2 py-1 text-sm"
                />
              )}
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" checked={emailPrincipalModo === 'NINGUNO'} onChange={() => setEmailPrincipalModo('NINGUNO')} />
              Sin destinatario principal (solo copia y/o push)
            </label>
          </div>
          {emailPrincipalModo === 'NINGUNO' && quedariaSinCanal && (
            <p className="text-xs text-red-600 mt-1">
              Con esta opción necesitás cargar al menos un mail en copia{pushDisponibleAqui ? ' o activar el push' : ''}.
            </p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CC / Enviar copia a (opcional)</label>
          <ChipsEmailInput value={emailsCc} onChange={setEmailsCc} />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3">
        <Boton type="submit" cargando={guardando}>{guardando ? 'Guardando...' : (alerta ? 'Guardar cambios' : 'Crear alerta')}</Boton>
        {onCancelar && (
          <button type="button" onClick={onCancelar} className="text-sm text-gray-500 hover:underline whitespace-nowrap">
            Cancelar
          </button>
        )}
        {alerta && (
          <button
            type="button"
            onClick={eliminar}
            disabled={eliminando}
            className="text-sm text-red-600 hover:underline whitespace-nowrap ml-auto disabled:opacity-50"
          >
            Eliminar alerta
          </button>
        )}
      </div>
    </form>
  );
}

// -----------------------------------------------------------------------
// Pagina principal
// -----------------------------------------------------------------------

const ESTADO_BADGE = {
  ACTIVA: 'bg-green-100 text-green-700',
  PAUSADA: 'bg-gray-100 text-gray-600',
  ERROR: 'bg-red-100 text-red-700',
};
const ESTADO_LABEL = { ACTIVA: 'Activa', PAUSADA: 'Pausada', ERROR: 'Error' };

const CLAVE_BANNER_PUSH_OCULTO = 'coteja_banner_push_oculto';

function esIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function yaInstalada() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}

// Ofrece activar el push de entrada, sin tener que pasar primero por el
// checkbox de una alerta puntual (misma suscribirsePush() que usa ese
// checkbox mas abajo). Se oculta si: ya esta suscripto, el usuario lo
// cerro con la cruz (se recuerda en localStorage, no vuelve a aparecer), o
// el navegador no tiene nada util para ofrecer (iOS sin instalar como app,
// sin soporte de Push, o ya bloqueo las notificaciones del sitio - en ese
// caso insistir no sirve, tiene que habilitarlas el mismo desde el navegador).
function BannerNotificacionesPush() {
  const [visible, setVisible] = useState(false);
  const [activando, setActivando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelado = false;
    async function evaluar() {
      if (localStorage.getItem(CLAVE_BANNER_PUSH_OCULTO)) return;
      if (!pushDisponible()) return;
      if (esIOS() && !yaInstalada()) return;
      if (Notification.permission === 'denied') return;
      const suscripto = await estaSuscripto();
      if (!cancelado && !suscripto) setVisible(true);
    }
    evaluar();
    return () => {
      cancelado = true;
    };
  }, []);

  function cerrar() {
    localStorage.setItem(CLAVE_BANNER_PUSH_OCULTO, '1');
    setVisible(false);
  }

  async function activar() {
    setActivando(true);
    setError('');
    try {
      await suscribirsePush();
      setVisible(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setActivando(false);
    }
  }

  if (!visible) return null;

  return (
    <div className="bg-coteja-azul-50 border border-coteja-azul-200 rounded-xl p-4 flex items-start gap-3">
      <span className="text-xl leading-none" aria-hidden="true">
        🔔
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-coteja-azul-900">Activá las notificaciones y permití recibir alertas push en tu celular o computadora.</p>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        <button
          type="button"
          onClick={activar}
          disabled={activando}
          className="mt-2 text-sm font-medium text-coteja-azul-700 hover:underline disabled:opacity-50"
        >
          {activando ? 'Activando...' : 'Activar notificaciones'}
        </button>
      </div>
      <button type="button" onClick={cerrar} aria-label="Cerrar" className="text-coteja-azul-400 hover:text-coteja-azul-600 shrink-0 text-lg leading-none">
        ×
      </button>
    </div>
  );
}

export default function Alertas() {
  const { usuario } = useAuth();
  const { marcaActualId } = useMarca();
  const [alertas, setAlertas] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [alertaEditando, setAlertaEditando] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [accionandoId, setAccionandoId] = useState(null);

  async function cargar() {
    setAlertas(await api.get('/api/alertas/' + marcaActualId));
  }

  useEffect(() => {
    cargar();
  }, [marcaActualId]);

  function cerrarForm() {
    setMostrarForm(false);
    setAlertaEditando(null);
  }

  async function pausarOReactivar(alerta) {
    setAccionandoId(alerta.id);
    setError('');
    try {
      await api.patch('/api/alertas/' + alerta.id + '/estado', { estado: alerta.estado === 'ACTIVA' ? 'PAUSADA' : 'ACTIVA' });
      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setAccionandoId(null);
    }
  }

  async function duplicar(alerta) {
    setAccionandoId(alerta.id);
    setError('');
    try {
      await api.post('/api/alertas/' + alerta.id + '/duplicar');
      setMensaje('Alerta duplicada.');
      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setAccionandoId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Alertas</h1>
        <button onClick={() => { setAlertaEditando(null); setMostrarForm(true); }} className="text-sm text-coteja-azul-700 hover:underline">
          + Nueva alerta
        </button>
      </div>

      <BannerNotificacionesPush />

      <Leyenda>
        COTEJA consulta periódicamente las tiendas online para mantener actualizada la información. Algunas plataformas pueden
        tardar en reflejar completamente los cambios realizados por un comercio - por eso una alerta automática puede tardar
        hasta una hora en llegar desde que el competidor modificó su carta.
      </Leyenda>

      {mensaje && <p className="text-sm text-green-700">{mensaje}</p>}
      {error && <p className="text-sm text-red-600">{error}</p>}

      {alertas == null ? (
        <p className="bg-white rounded-xl shadow p-4 text-gray-400">Cargando...</p>
      ) : alertas.length === 0 ? (
        <p className="bg-white rounded-xl shadow p-4 text-gray-400">Todavía no creaste ninguna alerta.</p>
      ) : (
        <>
          <div className="hidden md:block bg-white rounded-xl shadow overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold uppercase text-gray-400 border-b border-gray-100">
                  <th className="p-3 font-semibold">Tipo</th>
                  <th className="p-3 font-semibold">Marca</th>
                  <th className="p-3 font-semibold">Observación</th>
                  <th className="p-3 font-semibold">Condición</th>
                  <th className="p-3 font-semibold">Frecuencia</th>
                  <th className="p-3 font-semibold">Próximo envío</th>
                  <th className="p-3 font-semibold">Estado</th>
                  <th className="p-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {alertas.map((a) => (
                  <tr key={a.id}>
                    <td className="p-3 align-top text-gray-900">{tipoLabel(a.tipo)}</td>
                    <td className="p-3 align-top text-gray-600 whitespace-nowrap">
                      {a.marcas.length > 1 ? a.marcas.length + ' marcas' : (a.marcas[0]?.marca_nombre || '-')}
                    </td>
                    <td className="p-3 align-top text-gray-600">{a.observacion || <span className="text-gray-300">-</span>}</td>
                    <td className="p-3 align-top text-gray-600">
                      {a.tipo === 'CAMBIOS_COMPETENCIA'
                        ? condicionLabel(a.condicion) + (a.condicion === 'VARIACION_PORCENTAJE' ? ' ≥' + a.condicion_umbral_porcentaje + '%' : '')
                        : a.tipo === 'POSICION_VS_MERCADO' ? condicionLabel(a.condicion) + ' ' + a.condicion_umbral_porcentaje + '%' : '-'}
                    </td>
                    <td className="p-3 align-top text-gray-600 whitespace-nowrap">
                      {a.tipo === 'POSICION_VS_MERCADO' || (a.tipo === 'CAMBIOS_COMPETENCIA' && a.modalidad_envio === 'AUTOMATICO')
                        ? 'Automática' : (a.frecuencia_programada || '-')}
                    </td>
                    <td className="p-3 align-top text-gray-600 whitespace-nowrap">{formatoFecha(a.proximo_envio)}</td>
                    <td className="p-3 align-top">
                      <span className={'text-xs font-semibold px-2 py-0.5 rounded-full ' + ESTADO_BADGE[a.estado]} title={a.ultimo_error || ''}>
                        {ESTADO_LABEL[a.estado]}
                      </span>
                      {a.estado === 'ERROR' && a.ultimo_error && (
                        <p className="text-xs text-red-500 mt-0.5 max-w-[220px]">{a.ultimo_error}</p>
                      )}
                    </td>
                    <td className="p-3 align-top">
                      <div className="flex flex-col items-start gap-1">
                        <button onClick={() => { setAlertaEditando(a); setMostrarForm(true); }} className="text-xs text-coteja-azul-700 hover:underline whitespace-nowrap">
                          Editar
                        </button>
                        <button onClick={() => duplicar(a)} disabled={accionandoId === a.id} className="text-xs text-coteja-azul-700 hover:underline whitespace-nowrap disabled:opacity-50">
                          Duplicar
                        </button>
                        <button onClick={() => pausarOReactivar(a)} disabled={accionandoId === a.id} className="text-xs text-coteja-azul-700 hover:underline whitespace-nowrap disabled:opacity-50">
                          {a.estado === 'PAUSADA' ? 'Reactivar' : 'Pausar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden space-y-3">
            {alertas.map((a) => (
              <div key={a.id} className="bg-white rounded-xl shadow p-4 space-y-2 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900">{tipoLabel(a.tipo)}</p>
                    <p className="text-xs text-gray-500">
                      {a.marcas.length > 1 ? a.marcas.length + ' marcas' : (a.marcas[0]?.marca_nombre || '-')}
                    </p>
                  </div>
                  <span className={'shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ' + ESTADO_BADGE[a.estado]} title={a.ultimo_error || ''}>
                    {ESTADO_LABEL[a.estado]}
                  </span>
                </div>
                {a.estado === 'ERROR' && a.ultimo_error && (
                  <p className="text-xs text-red-500">{a.ultimo_error}</p>
                )}
                {a.observacion && <p className="text-gray-600">{a.observacion}</p>}
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Condición</span>
                  <span className="text-gray-700">
                    {a.tipo === 'CAMBIOS_COMPETENCIA'
                      ? condicionLabel(a.condicion) + (a.condicion === 'VARIACION_PORCENTAJE' ? ' ≥' + a.condicion_umbral_porcentaje + '%' : '')
                      : a.tipo === 'POSICION_VS_MERCADO' ? condicionLabel(a.condicion) + ' ' + a.condicion_umbral_porcentaje + '%' : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Frecuencia</span>
                  <span className="text-gray-700">
                    {a.tipo === 'POSICION_VS_MERCADO' || (a.tipo === 'CAMBIOS_COMPETENCIA' && a.modalidad_envio === 'AUTOMATICO')
                      ? 'Automática' : (a.frecuencia_programada || '-')}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Próximo envío</span>
                  <span className="text-gray-700">{formatoFecha(a.proximo_envio)}</span>
                </div>
                <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
                  <button onClick={() => { setAlertaEditando(a); setMostrarForm(true); }} className="text-xs text-coteja-azul-700 hover:underline">
                    Editar
                  </button>
                  <button onClick={() => duplicar(a)} disabled={accionandoId === a.id} className="text-xs text-coteja-azul-700 hover:underline disabled:opacity-50">
                    Duplicar
                  </button>
                  <button onClick={() => pausarOReactivar(a)} disabled={accionandoId === a.id} className="text-xs text-coteja-azul-700 hover:underline disabled:opacity-50">
                    {a.estado === 'PAUSADA' ? 'Reactivar' : 'Pausar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {mostrarForm && (
        <Modal titulo={alertaEditando ? 'Editar alerta' : 'Nueva alerta'} onClose={cerrarForm} ancho="max-w-2xl">
          <FormAlerta
            alerta={alertaEditando}
            marcaActualId={marcaActualId}
            usuarioEmail={usuario.email}
            onGuardado={() => { cerrarForm(); setMensaje(alertaEditando ? 'Alerta actualizada.' : 'Alerta creada.'); cargar(); }}
            onEliminado={() => { cerrarForm(); setMensaje('Alerta eliminada.'); cargar(); }}
            onCancelar={cerrarForm}
          />
        </Modal>
      )}
    </div>
  );
}
