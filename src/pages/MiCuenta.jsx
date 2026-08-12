import { useEffect, useState } from 'react';
import { useMarca } from '../context/MarcaContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { Campo, Boton } from '../components/ui';

const MAX_LOGO_BYTES = 800 * 1024;

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

function SeccionMisMarcas() {
  const { marcas, recargarMarcas, setMarcaActualId } = useMarca();
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [borrandoId, setBorrandoId] = useState(null);

  async function borrar(marca) {
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
    setBorrandoId(marca.id);
    try {
      await api.del('/api/marcas/' + marca.id);
      setMensaje('Marca "' + marca.nombre + '" eliminada.');
      setMarcaActualId(null);
      await recargarMarcas();
    } catch (err) {
      setError(err.message);
    } finally {
      setBorrandoId(null);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow p-4 space-y-3">
      <h2 className="font-medium text-gray-900">Mis marcas</h2>
      <p className="text-xs text-gray-400">Tu plan permite hasta 3. Borrar una es definitivo.</p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {mensaje && <p className="text-sm text-green-700">{mensaje}</p>}
      <ul className="divide-y divide-gray-100">
        {marcas.map((m) => (
          <li key={m.id} className="py-2 flex items-center justify-between text-sm">
            <span className="text-gray-900">{m.nombre}</span>
            <button
              onClick={() => borrar(m)}
              disabled={borrandoId === m.id}
              className="text-xs text-red-600 hover:underline disabled:opacity-50"
            >
              Eliminar
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function MiCuenta() {
  const { usuario } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-semibold text-gray-900">Mi cuenta</h1>
      <SeccionMarca />
      <SeccionPassword />
      {usuario.tipo_cuenta === 'MULTIMARCA' && <SeccionMisMarcas />}
    </div>
  );
}
