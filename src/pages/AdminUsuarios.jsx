import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useMarca } from '../context/MarcaContext';
import { Campo, Boton, Modal } from '../components/ui';

const ROLES = [
  { value: 'CLIENTE', label: 'Cliente (1 marca)' },
  { value: 'CLIENTE_MULTIMARCA', label: 'Cliente multimarca (hasta 3 marcas)' },
  { value: 'ADMIN', label: 'Administrador' },
];

// Mismos 12 valores que valida el backend (TIPOS_COMERCIO_VALIDOS en src/server/index.js).
const TIPOS_COMERCIO = [
  { value: 'COMIDA_RAPIDA', label: 'Comida rápida' },
  { value: 'HAMBURGUESERIA', label: 'Hamburguesería' },
  { value: 'COMERCIO', label: 'Comercio' },
  { value: 'HELADERIA', label: 'Heladería' },
  { value: 'CAFETERIA', label: 'Cafetería' },
  { value: 'LOMITERIA', label: 'Lomitería' },
  { value: 'SUSHI', label: 'Sushi' },
  { value: 'EMPANADAS', label: 'Empanadas' },
  { value: 'ETNICA', label: 'Étnica' },
  { value: 'SANDWICHES', label: 'Sandwiches' },
  { value: 'COMIDA_SALUDABLE', label: 'Comida saludable' },
  { value: 'VARIOS', label: 'Varios' },
];

function SelectorTipoComercio({ value, onChange, required }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de comercio</label>
      <select
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="">Elegí uno...</option>
        {TIPOS_COMERCIO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>
    </div>
  );
}

function formatoFecha(fecha) {
  if (!fecha) return 'nunca';
  return new Date(fecha).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
}

function tipoComercioLabel(valor) {
  return TIPOS_COMERCIO.find((t) => t.value === valor)?.label || '-';
}

function rolLabel(valor) {
  return ROLES.find((r) => r.value === valor)?.label || valor;
}

function ModalNuevaMarca({ usuario, onClose, onCreada }) {
  const [nombre, setNombre] = useState('');
  const [tipoComercio, setTipoComercio] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const marca = await api.post('/api/admin/usuarios/' + usuario.id + '/marcas', {
        marca_nombre: nombre,
        tipo_comercio: tipoComercio || undefined,
      });
      onCreada(marca);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal titulo={'Nueva marca para ' + usuario.email} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-3">
        <Campo label="Nombre de la marca" required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="ej: Fat Burger" />
        <SelectorTipoComercio value={tipoComercio} onChange={setTipoComercio} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Boton type="submit" cargando={cargando}>{cargando ? 'Creando...' : 'Crear marca'}</Boton>
      </form>
    </Modal>
  );
}

// Fila de edicion de una marca dentro de la ficha del usuario - tipo de
// comercio se guarda solo (select), telefono necesita un boton "Guardar"
// porque es texto libre.
function FilaMarcaAdmin({ marca, onVerPanel, onEliminar, onGuardarTipo, onGuardarTelefono }) {
  const [telefono, setTelefono] = useState(marca.telefono || '');
  const [guardandoTelefono, setGuardandoTelefono] = useState(false);
  const [guardandoTipo, setGuardandoTipo] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  async function guardarTelefono() {
    setGuardandoTelefono(true);
    try {
      await onGuardarTelefono(telefono);
    } finally {
      setGuardandoTelefono(false);
    }
  }

  async function cambiarTipo(e) {
    setGuardandoTipo(true);
    try {
      await onGuardarTipo(e.target.value);
    } finally {
      setGuardandoTipo(false);
    }
  }

  async function eliminar() {
    setEliminando(true);
    try {
      await onEliminar();
    } finally {
      setEliminando(false);
    }
  }

  return (
    <div className="border border-gray-100 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-gray-900 text-sm">{marca.nombre}</span>
        <button onClick={onVerPanel} className="text-xs text-violet-600 hover:underline whitespace-nowrap">
          Ver panel →
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de comercio</label>
          <select
            value={marca.tipo_comercio || ''}
            disabled={guardandoTipo}
            onChange={cambiarTipo}
            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
          >
            <option value="">Sin tipo</option>
            {TIPOS_COMERCIO.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Teléfono / WhatsApp</label>
          <div className="flex gap-1 items-center">
            <input
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="ej: 3511234567"
              className="flex-1 min-w-0 rounded-lg border border-gray-300 px-2 py-1.5 text-xs"
            />
            <button onClick={guardarTelefono} disabled={guardandoTelefono} className="text-xs text-violet-600 hover:underline whitespace-nowrap">
              Guardar
            </button>
            {marca.telefono && (
              <a
                href={'https://wa.me/' + marca.telefono.replace(/\D/g, '')}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-green-600 hover:underline whitespace-nowrap"
              >
                WhatsApp →
              </a>
            )}
          </div>
        </div>
      </div>
      <button onClick={eliminar} disabled={eliminando} className="text-xs text-red-600 hover:underline disabled:opacity-50">
        Eliminar marca
      </button>
    </div>
  );
}

function VerUsuarioModal({ usuario, onClose, onActualizado }) {
  const { setMarcaActualId, recargarMarcas } = useMarca();
  const navigate = useNavigate();
  const [u, setU] = useState(usuario);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [accionandoRol, setAccionandoRol] = useState(false);
  const [accionandoActivo, setAccionandoActivo] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [mostrarNuevaMarca, setMostrarNuevaMarca] = useState(false);

  async function reenviar() {
    setError('');
    setMensaje('');
    setReenviando(true);
    try {
      const data = await api.post('/api/admin/usuarios/' + u.id + '/resetear');
      setMensaje(data.message);
    } catch (err) {
      setError(err.message);
    } finally {
      setReenviando(false);
    }
  }

  async function cambiarRol(nuevoRol) {
    if (nuevoRol === u.rol) return;
    setError('');
    setMensaje('');
    setAccionandoRol(true);
    try {
      const data = await api.post('/api/admin/usuarios/' + u.id + '/rol', { rol: nuevoRol });
      setU((prev) => ({ ...prev, rol: data.rol }));
      onActualizado();
    } catch (err) {
      setError(err.message);
    } finally {
      setAccionandoRol(false);
    }
  }

  async function toggleActivo() {
    setError('');
    setMensaje('');
    setAccionandoActivo(true);
    try {
      const data = await api.post('/api/admin/usuarios/' + u.id + '/activo', { activo: !u.activo });
      setU((prev) => ({ ...prev, activo: data.activo }));
      onActualizado();
    } catch (err) {
      setError(err.message);
    } finally {
      setAccionandoActivo(false);
    }
  }

  async function verPanel(marcaId) {
    setMarcaActualId(marcaId);
    await recargarMarcas();
    navigate('/');
  }

  async function eliminarMarca(marca) {
    const confirmacion = prompt(
      'Esto borra "' + marca.nombre + '" y TODO lo suyo (productos, competidores, alertas, historial) para siempre.\n' +
      'Escribí el nombre de la marca para confirmar:'
    );
    if (confirmacion !== marca.nombre) {
      if (confirmacion != null) alert('El nombre no coincide - no se borró nada.');
      return;
    }
    setError('');
    setMensaje('');
    try {
      await api.del('/api/marcas/' + marca.id);
      setU((prev) => ({ ...prev, marcas: prev.marcas.filter((m) => m.id !== marca.id) }));
      setMensaje('Marca "' + marca.nombre + '" eliminada.');
      onActualizado();
    } catch (err) {
      setError(err.message);
    }
  }

  async function guardarMarca(marcaId, cambios) {
    const data = await api.patch('/api/marcas/' + marcaId, cambios);
    setU((prev) => ({ ...prev, marcas: prev.marcas.map((m) => (m.id === marcaId ? { ...m, ...data } : m)) }));
    onActualizado();
  }

  // Mismo tope que LIMITE_MARCAS_POR_ROL en el backend - un CLIENTE comun
  // tambien puede sumar SU marca (la primera), no solo un multimarca.
  const LIMITE_MARCAS = { CLIENTE: 1, CLIENTE_MULTIMARCA: 3 };
  const puedeAgregarMarca = LIMITE_MARCAS[u.rol] != null && u.marcas.length < LIMITE_MARCAS[u.rol];

  return (
    <Modal titulo={u.email} onClose={onClose} ancho="max-w-xl">
      <div className="space-y-5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={'text-xs font-semibold px-2 py-0.5 rounded-full ' + (u.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
            {u.activo ? 'Habilitado' : 'Deshabilitado'}
          </span>
          <span className="text-xs text-gray-500">
            {u.clave_definida ? 'clave definida' : 'invitación pendiente'} · último login: {formatoFecha(u.ultimo_login)}
          </span>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {mensaje && <p className="text-sm text-green-700">{mensaje}</p>}

        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase text-gray-400">Accesos</h3>
          <div className="flex flex-wrap gap-3">
            <button onClick={reenviar} disabled={reenviando} className="text-sm text-violet-600 hover:underline disabled:opacity-50">
              Reenviar acceso
            </button>
            <a href={'mailto:' + u.email} className="text-sm text-violet-600 hover:underline">
              Contactar por mail →
            </a>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase text-gray-400">Rol</h3>
          <select
            value={u.rol}
            disabled={accionandoRol}
            onChange={(e) => cambiarRol(e.target.value)}
            className="rounded-lg border border-gray-300 px-2 py-1.5 text-sm"
          >
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>

        {u.rol !== 'ADMIN' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase text-gray-400">Marcas</h3>
              {puedeAgregarMarca && (
                <button onClick={() => setMostrarNuevaMarca(true)} className="text-xs text-violet-600 hover:underline">
                  + Agregar marca
                </button>
              )}
            </div>
            {u.marcas.length === 0 ? (
              <p className="text-xs text-gray-400">Todavía no tiene ninguna marca configurada.</p>
            ) : (
              <div className="space-y-2">
                {u.marcas.map((m) => (
                  <FilaMarcaAdmin
                    key={m.id}
                    marca={m}
                    onVerPanel={() => verPanel(m.id)}
                    onEliminar={() => eliminarMarca(m)}
                    onGuardarTipo={(tipo_comercio) => guardarMarca(m.id, { tipo_comercio })}
                    onGuardarTelefono={(telefono) => guardarMarca(m.id, { telefono })}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase text-gray-400">Acceso</h3>
          <button
            onClick={toggleActivo}
            disabled={accionandoActivo}
            className={'text-sm hover:underline disabled:opacity-50 ' + (u.activo ? 'text-red-600' : 'text-green-700')}
          >
            {u.activo ? 'Bloquear acceso' : 'Desbloquear acceso'}
          </button>
        </div>
      </div>

      {mostrarNuevaMarca && (
        <ModalNuevaMarca
          usuario={u}
          onClose={() => setMostrarNuevaMarca(false)}
          onCreada={(marca) => {
            setMostrarNuevaMarca(false);
            setU((prev) => ({ ...prev, marcas: [...prev.marcas, marca] }));
            setMensaje('Marca "' + marca.nombre + '" agregada.');
            onActualizado();
          }}
        />
      )}
    </Modal>
  );
}

function TiendasPendientes() {
  const [pendientes, setPendientes] = useState(null);
  const [error, setError] = useState('');
  const [accionandoId, setAccionandoId] = useState(null);

  async function cargar() {
    try {
      setPendientes(await api.get('/api/admin/competidores-pendientes'));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function marcarRevisado(id) {
    setAccionandoId(id);
    try {
      await api.patch('/api/competidores/' + id, { revision_pendiente: false });
      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setAccionandoId(null);
    }
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (pendientes == null) return <p className="text-gray-400">Cargando...</p>;
  if (pendientes.length === 0) {
    return <p className="text-sm text-gray-400">No hay ninguna tienda pendiente de revisar por ahora.</p>;
  }

  return (
    <div className="bg-white rounded-xl shadow divide-y divide-gray-100">
      {pendientes.map((c) => (
        <div key={c.id} className="p-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Pendiente de revisar</span>
              <span className="font-medium text-gray-900">{c.nombre}</span>
              {c.es_propia && <span className="text-xs text-amber-700">(Mi tienda)</span>}
            </div>
            <p className="text-gray-500">Marca: {c.marca_nombre}</p>
            {c.url ? (
              <a href={c.url} target="_blank" rel="noreferrer" className="text-violet-600 hover:underline break-all">{c.url}</a>
            ) : (
              <p className="text-gray-400">Sin link (carta subida a mano)</p>
            )}
            <p className="text-gray-500">
              Plataforma parecida: {c.plataforma_sugerida ? <span className="font-medium text-gray-700">{c.plataforma_sugerida}</span> : 'sin pista'}
            </p>
          </div>
          <button
            onClick={() => marcarRevisado(c.id)}
            disabled={accionandoId === c.id}
            className="text-xs text-violet-600 hover:underline whitespace-nowrap"
          >
            Marcar como revisado
          </button>
        </div>
      ))}
    </div>
  );
}

export default function AdminUsuarios() {
  const { setMarcaActualId, recargarMarcas } = useMarca();
  const navigate = useNavigate();
  const [tab, setTab] = useState('usuarios'); // 'usuarios' | 'pendientes'
  const [usuarios, setUsuarios] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState('CLIENTE');
  const [marcaNombre, setMarcaNombre] = useState('');
  const [tipoComercio, setTipoComercio] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [usuarioViendo, setUsuarioViendo] = useState(null);

  async function cargar() {
    const data = await api.get('/api/admin/usuarios');
    setUsuarios(data);
  }

  useEffect(() => {
    cargar();
  }, []);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setMensaje('');
    setCargando(true);
    try {
      const data = await api.post('/api/admin/usuarios', {
        email,
        rol,
        marca_nombre: rol !== 'ADMIN' && marcaNombre ? marcaNombre : undefined,
        tipo_comercio: rol !== 'ADMIN' && tipoComercio ? tipoComercio : undefined,
      });
      setMensaje(data.advertencia || 'Usuario invitado - le llegó un mail para crear su contraseña.');
      setEmail('');
      setMarcaNombre('');
      setTipoComercio('');
      setRol('CLIENTE');
      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  async function verPanel(marcaId) {
    setMarcaActualId(marcaId);
    await recargarMarcas();
    navigate('/');
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-gray-900">Admin</h1>

      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setTab('usuarios')}
          className={'text-sm px-3 py-2 font-medium border-b-2 ' + (tab === 'usuarios' ? 'border-violet-600 text-violet-700' : 'border-transparent text-gray-500')}
        >
          Usuarios
        </button>
        <button
          onClick={() => setTab('pendientes')}
          className={'text-sm px-3 py-2 font-medium border-b-2 ' + (tab === 'pendientes' ? 'border-violet-600 text-violet-700' : 'border-transparent text-gray-500')}
        >
          Tiendas pendientes
        </button>
      </div>

      {tab === 'pendientes' ? (
        <TiendasPendientes />
      ) : (
        <>
          <form onSubmit={onSubmit} className="bg-white rounded-xl shadow p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <Campo label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
              <select value={rol} onChange={(e) => setRol(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2">
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
            {rol !== 'ADMIN' && (
              <>
                <Campo
                  label="Nombre de la marca"
                  value={marcaNombre}
                  onChange={(e) => setMarcaNombre(e.target.value)}
                  placeholder="ej: Fat Burger"
                />
                <SelectorTipoComercio value={tipoComercio} onChange={setTipoComercio} />
              </>
            )}
            <Boton type="submit" cargando={cargando}>{cargando ? 'Invitando...' : 'Invitar usuario'}</Boton>
          </form>
          {mensaje && <p className="text-sm text-green-700">{mensaje}</p>}
          {error && <p className="text-sm text-red-600">{error}</p>}

          {usuarios != null && usuarios.length > 0 && (
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por email o marca..."
              className="w-full sm:w-80 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          )}

          <div className="bg-white rounded-xl shadow overflow-x-auto">
            {usuarios == null ? (
              <p className="p-4 text-gray-400">Cargando...</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-semibold uppercase text-gray-400 border-b border-gray-100">
                    <th className="p-3 font-semibold">Marca</th>
                    <th className="p-3 font-semibold">Estado</th>
                    <th className="p-3 font-semibold">Tipo</th>
                    <th className="p-3 font-semibold">Mail</th>
                    <th className="p-3 font-semibold">Último log</th>
                    <th className="p-3 font-semibold">Rol</th>
                    <th className="p-3 font-semibold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {usuarios
                    .filter((u) =>
                      u.email.toLowerCase().includes(busqueda.toLowerCase()) ||
                      u.marcas.some((m) => m.nombre.toLowerCase().includes(busqueda.toLowerCase()))
                    )
                    .map((u) => (
                    <tr key={u.id}>
                      <td className="p-3 align-top">
                        {u.rol === 'ADMIN' ? (
                          <span className="text-xs text-gray-400">—</span>
                        ) : u.marcas.length === 0 ? (
                          <span className="text-xs text-gray-400">Sin marcas todavía</span>
                        ) : (
                          <div className="space-y-1">
                            {u.marcas.map((m) => (
                              <button
                                key={m.id}
                                onClick={() => verPanel(m.id)}
                                className="h-7 flex items-center text-xs bg-violet-50 text-violet-700 px-2 rounded-lg hover:bg-violet-100 whitespace-nowrap"
                              >
                                {m.nombre} →
                              </button>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-3 align-top">
                        <span className={'text-xs font-semibold px-2 py-0.5 rounded-full ' + (u.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700')}>
                          {u.activo ? 'Habilitado' : 'Deshabilitado'}
                        </span>
                      </td>
                      <td className="p-3 align-top">
                        {u.rol === 'ADMIN' || u.marcas.length === 0 ? (
                          <span className="text-xs text-gray-400">—</span>
                        ) : (
                          <div className="space-y-1">
                            {u.marcas.map((m) => (
                              <p key={m.id} className="h-7 flex items-center text-xs text-gray-600 whitespace-nowrap">
                                {tipoComercioLabel(m.tipo_comercio)}
                              </p>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-3 align-top text-gray-900">{u.email}</td>
                      <td className="p-3 align-top text-gray-500 text-xs whitespace-nowrap">{formatoFecha(u.ultimo_login)}</td>
                      <td className="p-3 align-top text-gray-600 whitespace-nowrap">{rolLabel(u.rol)}</td>
                      <td className="p-3 align-top">
                        <button onClick={() => setUsuarioViendo(u)} className="text-xs text-violet-600 hover:underline whitespace-nowrap">
                          Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {usuarioViendo && (
        <VerUsuarioModal
          usuario={usuarioViendo}
          onClose={() => setUsuarioViendo(null)}
          onActualizado={cargar}
        />
      )}
    </div>
  );
}
