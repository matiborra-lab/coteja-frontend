import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMarca } from '../context/MarcaContext';
import { api } from '../api/client';

const linkClass = ({ isActive }) =>
  'px-3 py-2 rounded-lg text-sm font-medium ' +
  (isActive ? 'bg-coteja-azul-100 text-coteja-azul-800' : 'text-gray-600 hover:bg-gray-100');

export default function Layout() {
  const { usuario, logout } = useAuth();
  const { marcas, marcaActual, marcaActualId, setMarcaActualId } = useMarca();
  const navigate = useNavigate();
  const [incidencias, setIncidencias] = useState([]);
  const [verIncidencias, setVerIncidencias] = useState(true);

  function volverAUsuarios() {
    setMarcaActualId(null);
    navigate('/admin');
  }

  useEffect(() => {
    setVerIncidencias(true);
    if (!marcaActualId) {
      setIncidencias([]);
      return;
    }
    api.get('/api/incidencias/' + marcaActualId).then(setIncidencias).catch(() => setIncidencias([]));
  }, [marcaActualId]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <img src="/brand/coteja_logo_horizontal.png" alt="COTEJA" className="h-8" />
            {usuario.rol === 'ADMIN' && marcaActualId && (
              <button onClick={volverAUsuarios} className="text-sm text-coteja-azul-700 hover:underline">
                ← Volver a Usuarios
              </button>
            )}
            {marcaActualId && (
              <nav className="flex gap-1">
                <NavLink to="/" end className={linkClass}>Panel</NavLink>
                <NavLink to="/productos" className={linkClass}>Artículos</NavLink>
                <NavLink to="/competidores" className={linkClass}>Tiendas</NavLink>
                <NavLink to="/alertas" className={linkClass}>Alertas</NavLink>
              </nav>
            )}
            {usuario.rol !== 'ADMIN' && (
              <NavLink to="/mi-cuenta" className={linkClass}>Mi cuenta</NavLink>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-500">
            {marcas.length > 1 ? (
              <select
                value={marcaActualId || ''}
                onChange={(e) => setMarcaActualId(e.target.value ? Number(e.target.value) : null)}
                className="rounded-lg border border-gray-300 px-2 py-1 text-gray-700"
              >
                {!marcaActualId && <option value="">Elegí una marca</option>}
                {marcas.map((m) => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </select>
            ) : (
              marcaActual && <span className="font-medium text-gray-700">{marcaActual.nombre}</span>
            )}
            <span>{usuario.email}</span>
            <button onClick={logout} className="text-red-600 hover:underline">Salir</button>
          </div>
        </div>
      </header>

      {verIncidencias && incidencias.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-start justify-between gap-4">
            <div className="text-sm text-amber-800">
              <strong>{incidencias.length}</strong> producto{incidencias.length > 1 ? 's' : ''} de la
              competencia dej{incidencias.length > 1 ? 'aron' : 'ó'} de poder leerse:
              <ul className="list-disc list-inside mt-1">
                {incidencias.slice(0, 5).map((i) => (
                  <li key={i.id}>
                    {i.competidor_nombre} - {i.nombre} ({i.estado}){' '}
                    <Link to={'/competidores?tienda=' + i.competidor_id} className="underline hover:text-amber-900">
                      Ver →
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-1">Revisalo en "Tiendas" y borralo o reemplazalo por otro producto.</p>
            </div>
            <button onClick={() => setVerIncidencias(false)} className="text-amber-700 hover:text-amber-900 text-lg leading-none">
              &times;
            </button>
          </div>
        </div>
      )}

      <main className="max-w-5xl mx-auto px-4 py-8">
        {marcaActualId || usuario.rol === 'ADMIN' ? (
          <Outlet />
        ) : (
          <p className="text-center text-gray-400 py-16">Elegí una marca arriba para ver su información.</p>
        )}
      </main>
    </div>
  );
}
