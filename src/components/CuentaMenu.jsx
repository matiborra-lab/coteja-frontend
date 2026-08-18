import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMarca } from '../context/MarcaContext';

// Logo de la marca si lo subio, si no una inicial en un circulo de color, si
// no hay ninguna marca elegida (admin recien entrado) el isotipo de COTEJA.
function Avatar({ marca, tamano }) {
  if (marca?.logo_url) {
    return <img src={marca.logo_url} alt={marca.nombre} className={tamano + ' rounded-full object-cover shrink-0'} />;
  }
  if (marca) {
    return (
      <span className={tamano + ' rounded-full bg-coteja-azul-800 text-white flex items-center justify-center text-xs font-semibold shrink-0'}>
        {marca.nombre.charAt(0).toUpperCase()}
      </span>
    );
  }
  return <img src="/brand/coteja_isotipo.png" alt="COTEJA" className={tamano + ' rounded-full object-contain bg-coteja-azul-50 p-1 shrink-0'} />;
}

// Menu de cuenta tipo Facebook: un avatar en el header que agrupa todo lo
// que antes eran items sueltos (selector de marca, mail, volver a usuarios,
// mi cuenta, salir) - asi el header no se sigue llenando a medida que se
// agregan secciones nuevas al nav.
export default function CuentaMenu() {
  const { usuario, logout } = useAuth();
  const { marcas, marcaActual, marcaActualId, setMarcaActualId, recargarMarcas } = useMarca();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClickFuera(e) {
      if (ref.current && !ref.current.contains(e.target)) setAbierto(false);
    }
    document.addEventListener('mousedown', onClickFuera);
    return () => document.removeEventListener('mousedown', onClickFuera);
  }, []);

  function volverAUsuarios() {
    setMarcaActualId(null);
    recargarMarcas(null);
    navigate('/admin');
    setAbierto(false);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setAbierto((v) => !v)}
        aria-label="Cuenta"
        className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-gray-100"
      >
        <Avatar marca={marcaActual} tamano="w-8 h-8" />
        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" className="text-gray-400" aria-hidden="true">
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.29l3.71-4.06a.75.75 0 111.08 1.04l-4.24 4.65a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      {abierto && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 text-sm">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="font-medium text-gray-900 truncate">{usuario.email}</p>
          </div>

          {marcas.length > 1 && (
            <div className="py-1 border-b border-gray-100">
              {marcas.map((m) => (
                <button
                  key={m.id}
                  onClick={() => { setMarcaActualId(m.id); setAbierto(false); }}
                  className={'w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 ' + (m.id === marcaActualId ? 'bg-coteja-azul-50' : '')}
                >
                  <Avatar marca={m} tamano="w-6 h-6" />
                  <span className="text-gray-700 truncate">{m.nombre}</span>
                </button>
              ))}
            </div>
          )}

          <div className="py-1">
            {usuario.rol === 'ADMIN' && marcaActualId && (
              <button onClick={volverAUsuarios} className="w-full text-left px-3 py-2 text-coteja-azul-700 hover:bg-gray-50">
                ← Volver a Usuarios
              </button>
            )}
            {usuario.rol !== 'ADMIN' && (
              <NavLink to="/mi-cuenta" onClick={() => setAbierto(false)} className="block px-3 py-2 text-gray-700 hover:bg-gray-50">
                Mi cuenta
              </NavLink>
            )}
            <NavLink to="/ayuda" onClick={() => setAbierto(false)} className="block px-3 py-2 text-gray-700 hover:bg-gray-50">
              Centro de ayuda
            </NavLink>
            <button onClick={logout} className="w-full text-left px-3 py-2 text-red-600 hover:bg-gray-50">
              Salir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
