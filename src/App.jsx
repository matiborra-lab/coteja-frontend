import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MarcaProvider, useMarca } from './context/MarcaContext';
import { RequireAuth, RequireMarca, RequireAdmin } from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import OlvideClave from './pages/OlvideClave';
import DefinirClave from './pages/DefinirClave';
import CrearMarca from './pages/CrearMarca';
import Panel from './pages/Panel';
import ProductosPropios from './pages/ProductosPropios';
import Competidores from './pages/Competidores';
import Alertas from './pages/Alertas';
import Actividad from './pages/Actividad';
import AdminUsuarios from './pages/AdminUsuarios';
import MiCuenta from './pages/MiCuenta';
import Ayuda from './pages/Ayuda';
import Planes from './pages/Planes';

// Un admin sin ninguna marca elegida todavia va a Usuarios (ahi elige "Ver
// panel" de algun cliente). Si ya eligio una (via "Ver panel"), ve el Panel
// de esa marca como cualquier cliente.
function Inicio() {
  const { usuario } = useAuth();
  const { marcaActualId } = useMarca();
  if (usuario.rol === 'ADMIN' && !marcaActualId) return <Navigate to="/admin" replace />;
  return <Panel />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <MarcaProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/olvide-clave" element={<OlvideClave />} />
            <Route path="/definir-clave" element={<DefinirClave />} />
            <Route path="/planes" element={<Planes />} />

            <Route element={<RequireAuth />}>
              <Route path="/crear-marca" element={<CrearMarca />} />

              <Route element={<RequireMarca />}>
                <Route element={<Layout />}>
                  <Route path="/" element={<Inicio />} />
                  <Route path="/productos" element={<ProductosPropios />} />
                  <Route path="/competidores" element={<Competidores />} />
                  <Route path="/alertas" element={<Alertas />} />
                  <Route path="/actividad" element={<Actividad />} />
                  <Route path="/mi-cuenta" element={<MiCuenta />} />
                  <Route path="/ayuda" element={<Ayuda />} />
                  <Route path="/ayuda/:articuloId" element={<Ayuda />} />
                  <Route element={<RequireAdmin />}>
                    <Route path="/admin" element={<AdminUsuarios />} />
                  </Route>
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </MarcaProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
