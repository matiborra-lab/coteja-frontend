import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMarca } from '../context/MarcaContext';
import { api } from '../api/client';
import InstalarApp from './InstalarApp';
import CuentaMenu from './CuentaMenu';

const linkClass = ({ isActive }) =>
  'px-3 py-2 rounded-lg text-sm font-medium ' +
  (isActive ? 'bg-coteja-azul-100 text-coteja-azul-800' : 'text-gray-600 hover:bg-gray-100');

const linkClassDrawer = ({ isActive }) =>
  'block px-3 py-2 rounded-lg text-sm font-medium ' +
  (isActive ? 'bg-coteja-azul-100 text-coteja-azul-800' : 'text-gray-600 hover:bg-gray-100');

export default function Layout() {
  const { usuario, logout } = useAuth();
  const { marcas, marcaActual, marcaActualId, setMarcaActualId } = useMarca();
  const navigate = useNavigate();
  const location = useLocation();
  const [incidencias, setIncidencias] = useState([]);
  const [verIncidencias, setVerIncidencias] = useState(true);
  const [menuAbierto, setMenuAbierto] = useState(false);

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

  // Cierra el menu lateral solo al navegar - asi tocar un link ahi adentro
  // no deja el drawer abierto tapando la pantalla nueva.
  useEffect(() => {
    setMenuAbierto(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-[1600px] mx-auto px-4 h-14 flex items-center justify-between">
          {/* Mobile: solo hamburguesa + logo, para que el header nunca desborde. */}
          <div className="flex md:hidden items-center gap-3">
            <button
              onClick={() => setMenuAbierto(true)}
              aria-label="Abrir menú"
              className="text-gray-500 hover:text-gray-700 -ml-1 p-1"
            >
              <svg width="22" height="22" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M3 5h14a1 1 0 100-2H3a1 1 0 000 2zm0 6h14a1 1 0 100-2H3a1 1 0 000 2zm0 6h14a1 1 0 100-2H3a1 1 0 000 2z" clipRule="evenodd" />
              </svg>
            </button>
            <img src="/brand/coteja_logo_horizontal.png" alt="COTEJA" className="h-7" />
          </div>
          <div className="flex md:hidden items-center">
            <InstalarApp />
          </div>

          {/* Desktop: header horizontal - lo especifico de cuenta (marca,
              mail, volver a usuarios, mi cuenta, salir) vive en CuentaMenu
              para que el nav no siga creciendo cada vez que se agrega una
              seccion nueva. */}
          <div className="hidden md:flex items-center gap-6">
            <img src="/brand/coteja_logo_horizontal.png" alt="COTEJA" className="h-8" />
            {marcaActualId && (
              <nav className="flex gap-1">
                <NavLink to="/" end className={linkClass}>Panel</NavLink>
                <NavLink to="/productos" className={linkClass}>Artículos</NavLink>
                <NavLink to="/competidores" className={linkClass}>Tiendas</NavLink>
                <NavLink to="/alertas" className={linkClass}>Alertas</NavLink>
                <NavLink to="/actividad" className={linkClass}>Actividad</NavLink>
              </nav>
            )}
          </div>
          <div className="hidden md:flex items-center gap-2">
            <InstalarApp />
            <CuentaMenu />
          </div>
        </div>
      </header>

      {/* Menu lateral (drawer) - solo mobile. */}
      {menuAbierto && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuAbierto(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between px-4 h-14 border-b border-gray-100 shrink-0">
              <img src="/brand/coteja_logo_horizontal.png" alt="COTEJA" className="h-7" />
              <button onClick={() => setMenuAbierto(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">
                &times;
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {usuario.rol === 'ADMIN' && marcaActualId && (
                <button onClick={volverAUsuarios} className="block text-sm text-coteja-azul-700 hover:underline">
                  ← Volver a Usuarios
                </button>
              )}
              {marcaActualId && (
                <nav className="flex flex-col gap-1">
                  <NavLink to="/" end className={linkClassDrawer}>Panel</NavLink>
                  <NavLink to="/productos" className={linkClassDrawer}>Artículos</NavLink>
                  <NavLink to="/competidores" className={linkClassDrawer}>Tiendas</NavLink>
                  <NavLink to="/alertas" className={linkClassDrawer}>Alertas</NavLink>
                  <NavLink to="/actividad" className={linkClassDrawer}>Actividad</NavLink>
                </nav>
              )}
              {usuario.rol !== 'ADMIN' && (
                <NavLink to="/mi-cuenta" className={linkClassDrawer}>Mi cuenta</NavLink>
              )}
              {marcas.length > 1 ? (
                <select
                  value={marcaActualId || ''}
                  onChange={(e) => setMarcaActualId(e.target.value ? Number(e.target.value) : null)}
                  className="w-full rounded-lg border border-gray-300 px-2 py-2 text-sm text-gray-700"
                >
                  {!marcaActualId && <option value="">Elegí una marca</option>}
                  {marcas.map((m) => (
                    <option key={m.id} value={m.id}>{m.nombre}</option>
                  ))}
                </select>
              ) : (
                marcaActual && <p className="text-sm font-medium text-gray-700">{marcaActual.nombre}</p>
              )}
            </div>
            <div className="border-t border-gray-100 p-4 space-y-2 text-sm shrink-0">
              <p className="text-gray-500 truncate">{usuario.email}</p>
              <button onClick={logout} className="text-red-600 hover:underline">Salir</button>
            </div>
          </div>
        </div>
      )}

      {verIncidencias && incidencias.length > 0 && (
        <div className="bg-amber-50 border-b border-amber-200">
          <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-start justify-between gap-4">
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

      <main className="max-w-[1600px] mx-auto px-4 py-8">
        {marcaActualId || usuario.rol === 'ADMIN' ? (
          <Outlet />
        ) : (
          <p className="text-center text-gray-400 py-16">Elegí una marca arriba para ver su información.</p>
        )}
      </main>
    </div>
  );
}
