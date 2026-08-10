import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMarca } from '../context/MarcaContext';

function Cargando() {
  return <div className="min-h-screen flex items-center justify-center text-gray-400">Cargando...</div>;
}

// Exige estar logueado, sin importar si ya tiene marca o no (la usa /crear-marca).
export function RequireAuth() {
  const { usuario, cargando } = useAuth();
  if (cargando) return <Cargando />;
  if (!usuario) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// Ademas de estar logueado, exige que un CLIENTE (o CLIENTE_MULTIMARCA) ya
// tenga al menos una marca (si no, lo manda a /crear-marca). Un admin no
// necesita ninguna. Usar DENTRO de <RequireAuth>.
export function RequireMarca() {
  const { usuario } = useAuth();
  const { marcas, cargando } = useMarca();
  if (cargando) return <Cargando />;
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
