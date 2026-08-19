import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMarca } from '../context/MarcaContext';

function Cargando() {
  return <div className="min-h-screen flex items-center justify-center text-gray-400">Cargando...</div>;
}

function ErrorCargandoMarcas({ onReintentar }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center space-y-3">
        <p className="text-gray-600">No pudimos cargar los datos de tu cuenta.</p>
        <button
          onClick={onReintentar}
          className="px-4 py-2 rounded-lg bg-coteja-azul-700 text-white text-sm hover:bg-coteja-azul-800"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}

// Exige estar logueado, sin importar si ya tiene marca o no (la usa /crear-marca).
export function RequireAuth() {
  const { usuario, cargando } = useAuth();
  if (cargando) return <Cargando />;
  if (!usuario) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// Ademas de estar logueado, exige que un CLIENTE (de cualquier tipo_cuenta)
// ya tenga al menos una marca (si no, lo manda a /crear-marca). Un admin no
// necesita ninguna. Usar DENTRO de <RequireAuth>.
export function RequireMarca() {
  const { usuario } = useAuth();
  const { marcas, cargandoInicial, error, recargarMarcas } = useMarca();
  if (cargandoInicial) return <Cargando />;
  // "marcas.length === 0" solo es confiable si /api/mis-marcas efectivamente
  // respondio - si fallo (y ya agoto los reintentos, ver MarcaContext), no
  // hay que interpretar eso como "el cliente no tiene marcas" y mandarlo a
  // crear una: si ya tenia una, el backend se la rechaza como duplicada y
  // queda varado. Mejor mostrar un reintentar.
  if (error && marcas.length === 0) return <ErrorCargandoMarcas onReintentar={() => recargarMarcas()} />;
  if (usuario.rol !== 'ADMIN' && marcas.length === 0) return <Navigate to="/crear-marca" replace />;
  return <Outlet />;
}

// El listado de Usuarios (invitar gente, ver actividad de cada marca) es
// solo para ADMIN - un CLIENTE (multimarca o no) no tiene que poder verlo
// ni entrar escribiendo la URL a mano. Usar DENTRO de <RequireAuth>.
export function RequireAdmin() {
  const { usuario } = useAuth();
  if (usuario.rol !== 'ADMIN') return <Navigate to="/" replace />;
  return <Outlet />;
}
