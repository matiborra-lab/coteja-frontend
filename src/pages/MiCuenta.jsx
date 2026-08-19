import { useEffect, useState } from 'react';
import { useMarca } from '../context/MarcaContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Campo, Boton } from '../components/ui';
import { TIPOS_COMERCIO } from '../utils/tiposComercio';

const MAX_LOGO_BYTES = 800 * 1024;

function SelectorTipoComercio({ value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de comercio</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      >
        <option value="">Elegí uno...</option>
        {TIPOS_COMERCIO.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
    </div>
  );
}

function SeccionMarca() {
  const { marcaActual, recargarMarcas } = useMarca();
  const [nombre, setNombre] = useState('');
  const [emailAlertas, setEmailAlertas] = useState('');
  const [telefono, setTelefono] = useState('');
  const [logoDataUrl, setLogoDataUrl] = useState(null);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    setNombre(marcaActual?.nombre || '');
    setEmailAlertas(marcaActual?.email_alertas || '');
    setTelefono(marcaActual?.telefono || '');
    setLogoDataUrl(null);
    setError('');
    setMensaje('');
  }, [marcaActual?.id]);

  function onLogoChange(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setError('');
    if (archivo.size > MAX_LOGO_BYTES) {
      setError('El logo pesa demasiado - subí uno de menos de 800KB.');
      e.target.value = '';
      return;
    }
    const lector = new FileReader();
    lector.onload = () => setLogoDataUrl(lector.result);
    lector.readAsDataURL(archivo);
  }

  async function guardar(e) {
    e.preventDefault();
    setError('');
    setMensaje('');
    setGuardando(true);
    try {
      const body = { nombre, email_alertas: emailAlertas || null, telefono: telefono || null };
      if (logoDataUrl) body.logo_url = logoDataUrl;
      await api.patch('/api/marcas/' + marcaActual.id, body);
      await recargarMarcas();
      setLogoDataUrl(null);
      setMensaje('Datos guardados.');
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  if (!marcaActual) return null;

  const logoParaMostrar = logoDataUrl || marcaActual.logo_url;

  return (
    <form onSubmit={guardar} className="bg-white rounded-xl shadow p-4 space-y-4">
      <h2 className="font-medium text-gray-900">Datos de {marcaActual.nombre}</h2>

      <div className="flex items-center gap-4">
        {logoParaMostrar ? (
          <img src={logoParaMostrar} alt="Logo" className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400">
            Sin logo
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Logo de la marca</label>
          <input type="file" accept="image/*" onChange={onLogoChange} className="text-sm" />
          <p className="text-xs text-gray-400 mt-1">Se usa para identificar la marca en mails y reportes. Menos de 800KB.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Campo label="Nombre de la marca" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <Campo
          label="Mail para recibir alertas (opcional)"
          type="email"
          value={emailAlertas}
          onChange={(e) => setEmailAlertas(e.target.value)}
          placeholder="ej: alertas@mimarca.com"
        />
        <Campo
          label="Número de contacto (opcional)"
          value={telefono}
          onChange={(e) => setTelefono(e.target.value)}
          placeholder="ej: 3511234567"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {mensaje && <p className="text-sm text-green-700">{mensaje}</p>}
      <Boton type="submit" cargando={guardando}>{guardando ? 'Guardando...' : 'Guardar cambios'}</Boton>
    </form>
  );
}

function SeccionPassword() {
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function guardar(e) {
    e.preventDefault();
    setError('');
    setMensaje('');
    if (passwordNueva !== confirmar) {
      setError('Las contraseñas nuevas no coinciden');
      return;
    }
    setGuardando(true);
    try {
      await api.post('/api/auth/cambiar-password', { passwordActual, passwordNueva });
      setMensaje('Contraseña actualizada.');
      setPasswordActual('');
      setPasswordNueva('');
      setConfirmar('');
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} className="bg-white rounded-xl shadow p-4 space-y-3">
      <h2 className="font-medium text-gray-900">Cambiar contraseña</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Campo label="Contraseña actual" type="password" required value={passwordActual} onChange={(e) => setPasswordActual(e.target.value)} />
        <Campo label="Contraseña nueva" type="password" required minLength={8} value={passwordNueva} onChange={(e) => setPasswordNueva(e.target.value)} />
        <Campo label="Repetir contraseña nueva" type="password" required value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {mensaje && <p className="text-sm text-green-700">{mensaje}</p>}
      <Boton type="submit" cargando={guardando}>{guardando ? 'Guardando...' : 'Cambiar contraseña'}</Boton>
    </form>
  );
}

const LIMITE_MARCAS_MULTIMARCA = 3;

// Fila de "Mis marcas": colapsada muestra logo + nombre; "Editar" despliega
// abajo el mismo formulario de datos que tiene SeccionMarca (nombre, tipo de
// comercio, logo, contacto, mail) mas "Eliminar marca" - todo por marca, sin
// tener que cambiar de marca actual para tocar sus datos.
function MarcaFila({ marca, expandido, onToggle }) {
  const { recargarMarcas, setMarcaActualId } = useMarca();
  const [nombre, setNombre] = useState(marca.nombre);
  const [tipoComercio, setTipoComercio] = useState(marca.tipo_comercio || '');
  const [emailAlertas, setEmailAlertas] = useState(marca.email_alertas || '');
  const [telefono, setTelefono] = useState(marca.telefono || '');
  const [logoDataUrl, setLogoDataUrl] = useState(null);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [borrando, setBorrando] = useState(false);

  useEffect(() => {
    if (!expandido) return;
    setNombre(marca.nombre);
    setTipoComercio(marca.tipo_comercio || '');
    setEmailAlertas(marca.email_alertas || '');
    setTelefono(marca.telefono || '');
    setLogoDataUrl(null);
    setError('');
    setMensaje('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandido, marca.id]);

  function onLogoChange(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;
    setError('');
    if (archivo.size > MAX_LOGO_BYTES) {
      setError('El logo pesa demasiado - subí uno de menos de 800KB.');
      e.target.value = '';
      return;
    }
    const lector = new FileReader();
    lector.onload = () => setLogoDataUrl(lector.result);
    lector.readAsDataURL(archivo);
  }

  async function guardar(e) {
    e.preventDefault();
    setError('');
    setMensaje('');
    setGuardando(true);
    try {
      const body = { nombre, tipo_comercio: tipoComercio || null, email_alertas: emailAlertas || null, telefono: telefono || null };
      if (logoDataUrl) body.logo_url = logoDataUrl;
      await api.patch('/api/marcas/' + marca.id, body);
      await recargarMarcas();
      setLogoDataUrl(null);
      setMensaje('Datos guardados.');
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function borrar() {
    const confirmacion = prompt(
      'Esto borra "' + marca.nombre + '" y TODO lo suyo (productos, competidores, alertas, historial) para siempre.\n' +
      'Escribí el nombre de la marca para confirmar:'
    );
    if (confirmacion !== marca.nombre) {
      if (confirmacion != null) alert('El nombre no coincide - no se borró nada.');
      return;
    }
    setError('');
    setBorrando(true);
    try {
      await api.del('/api/marcas/' + marca.id);
      setMarcaActualId(null);
      await recargarMarcas();
    } catch (err) {
      setError(err.message);
      setBorrando(false);
    }
  }

  const logoParaMostrar = logoDataUrl || marca.logo_url;

  return (
    <li className="py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {marca.logo_url ? (
            <img src={marca.logo_url} alt="" className="w-8 h-8 rounded object-cover border border-gray-200 shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded bg-gray-100 shrink-0" />
          )}
          <span className="text-sm text-gray-900 truncate">{marca.nombre}</span>
        </div>
        <button onClick={onToggle} className="text-xs text-coteja-azul-700 hover:underline shrink-0">
          {expandido ? 'Cerrar' : 'Editar'}
        </button>
      </div>

      {expandido && (
        <form onSubmit={guardar} className="mt-3 space-y-3 bg-gray-50 rounded-lg p-3">
          <div className="flex items-center gap-4">
            {logoParaMostrar ? (
              <img src={logoParaMostrar} alt="Logo" className="w-16 h-16 rounded-lg object-cover border border-gray-200" />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400">
                Sin logo
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Logo de la marca</label>
              <input type="file" accept="image/*" onChange={onLogoChange} className="text-sm" />
              <p className="text-xs text-gray-400 mt-1">Menos de 800KB.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Campo label="Nombre de la marca" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
            <SelectorTipoComercio value={tipoComercio} onChange={setTipoComercio} />
            <Campo
              label="Mail para recibir alertas (opcional)"
              type="email"
              value={emailAlertas}
              onChange={(e) => setEmailAlertas(e.target.value)}
              placeholder="ej: alertas@mimarca.com"
            />
            <Campo
              label="Número de contacto (opcional)"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="ej: 3511234567"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {mensaje && <p className="text-sm text-green-700">{mensaje}</p>}

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={borrar}
              disabled={borrando}
              className="text-xs text-red-600 hover:underline disabled:opacity-50"
            >
              {borrando ? 'Eliminando...' : 'Eliminar marca'}
            </button>
            <Boton type="submit" cargando={guardando}>{guardando ? 'Guardando...' : 'Guardar cambios'}</Boton>
          </div>
        </form>
      )}
    </li>
  );
}

function SeccionMisMarcas() {
  const { marcas, recargarMarcas, setMarcaActualId } = useMarca();
  const [expandidoId, setExpandidoId] = useState(null);
  const [error, setError] = useState('');
  const [agregando, setAgregando] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [creando, setCreando] = useState(false);

  const enElLimite = marcas.length >= LIMITE_MARCAS_MULTIMARCA;

  async function agregar(e) {
    e.preventDefault();
    setError('');
    setCreando(true);
    try {
      const nueva = await api.post('/api/marcas', { nombre: nombreNuevo });
      setMarcaActualId(nueva.id);
      await recargarMarcas(nueva.id);
      setNombreNuevo('');
      setAgregando(false);
      // Con el fix de cargandoInicial en MarcaContext, este estado local ya
      // sobrevive al refetch - abrimos directo el panel de la marca recien
      // creada para que el cliente termine de completarla (tipo de comercio,
      // logo, etc) sin tener que buscarla en la lista.
      setExpandidoId(nueva.id);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreando(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-4 space-y-3">
      <h2 className="font-medium text-gray-900">Mis marcas</h2>
      <p className="text-xs text-gray-400">Tu plan permite hasta {LIMITE_MARCAS_MULTIMARCA}. Borrar una es definitivo.</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <ul className="divide-y divide-gray-100">
        {marcas.map((m) => (
          <MarcaFila
            key={m.id}
            marca={m}
            expandido={expandidoId === m.id}
            onToggle={() => setExpandidoId((actual) => (actual === m.id ? null : m.id))}
          />
        ))}
      </ul>

      {agregando ? (
        <form onSubmit={agregar} className="flex items-center gap-2 pt-1">
          <input
            autoFocus
            required
            value={nombreNuevo}
            onChange={(e) => setNombreNuevo(e.target.value)}
            placeholder="Nombre de la nueva marca"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
          />
          <Boton type="submit" cargando={creando}>{creando ? 'Creando...' : 'Crear'}</Boton>
          <button type="button" onClick={() => { setAgregando(false); setNombreNuevo(''); }} className="text-xs text-gray-400 hover:text-gray-600">
            Cancelar
          </button>
        </form>
      ) : enElLimite ? (
        <p className="text-xs text-gray-400 pt-1">Ya tenés el máximo de marcas de tu plan.</p>
      ) : (
        <button onClick={() => setAgregando(true)} className="text-sm text-coteja-azul-700 hover:underline">
          + Agregar marca
        </button>
      )}
    </div>
  );
}

export default function MiCuenta() {
  const { usuario } = useAuth();
  const esMultimarca = usuario.tipo_cuenta === 'MULTIMARCA';

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900">Mi cuenta</h1>
      {esMultimarca ? (
        <>
          <SeccionPassword />
          <SeccionMisMarcas />
        </>
      ) : (
        <>
          <SeccionMarca />
          <SeccionPassword />
        </>
      )}
    </div>
  );
}
