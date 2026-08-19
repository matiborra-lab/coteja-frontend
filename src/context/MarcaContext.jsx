import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

const MarcaContext = createContext(null);

export function MarcaProvider({ children }) {
  const { usuario, cargando: cargandoAuth } = useAuth();
  const [marcas, setMarcas] = useState([]);
  const [marcaActualId, setMarcaActualId] = useState(null);
  const [cargando, setCargando] = useState(true);
  // cargando pasa a true en CADA refetch (crear/editar/borrar una marca
  // vuelve a llamar recargarMarcas) - pero RequireMarca (ver ProtectedRoute.jsx)
  // solo necesita bloquear la pantalla entera la PRIMERA vez, mientras
  // todavia no sabe si el cliente tiene alguna marca o hay que mandarlo a
  // /crear-marca. Si RequireMarca usara "cargando" a secas, cada refetch
  // desmontaria por un instante TODO lo que cuelga del Outlet (Layout,
  // la pagina actual) - eso se lleva puesto cualquier estado local en
  // pantalla (ej: un mensaje de "guardado" o un panel desplegado).
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const resueltoAlgunaVezRef = useRef(false);

  // Para un admin, /api/mis-marcas necesita saber en que marca esta parado
  // para devolver solo las hermanas de ese cliente (ver backend). Un ref en
  // vez de sumar marcaActualId a las dependencias de cargarMarcas evita que
  // cambiar de marca dispare un refetch automatico por el useEffect de mas
  // abajo - solo se usa como valor de respaldo cuando recargarMarcas() se
  // llama sin argumentos.
  const marcaActualIdRef = useRef(null);
  useEffect(() => {
    marcaActualIdRef.current = marcaActualId;
  }, [marcaActualId]);

  const cargarMarcas = useCallback(async (marcaIdParaContexto) => {
    // Mientras AuthContext todavia no resolvio quien es el usuario, "usuario"
    // esta transitoriamente en null - si tratasemos eso como "sin marcas" ya
    // quedaria cargando=false por un instante, y un guard como RequireMarca
    // podria alcanzar a redirigir a /crear-marca antes de tiempo. Hay que
    // esperar a que termine de cargar el auth antes de decidir cualquier cosa.
    if (cargandoAuth) return;
    if (!usuario) {
      setMarcas([]);
      setMarcaActualId(null);
      setCargando(false);
      if (!resueltoAlgunaVezRef.current) {
        resueltoAlgunaVezRef.current = true;
        setCargandoInicial(false);
      }
      return;
    }
    setCargando(true);
    try {
      // undefined = "no me dijeron nada, uso la marca actual" (recargarMarcas()
      // suelto); null explicito = "sin contexto de marca" (volver a Usuarios) -
      // por eso no se puede usar ?? aca, pisaria el null a proposito.
      const marcaId = marcaIdParaContexto !== undefined ? marcaIdParaContexto : marcaActualIdRef.current;
      const query = usuario.rol === 'ADMIN' && marcaId ? `?marcaId=${marcaId}` : '';
      const data = await api.get('/api/mis-marcas' + query);
      setMarcas(data);
      setMarcaActualId((actual) => {
        if (actual && data.some((m) => m.id === actual)) return actual;
        // Un admin no tiene "su" marca - no le elegimos ninguna de arranque,
        // la elige el mismo desde Usuarios ("Ver panel"). Un cliente con
        // 1+ marcas arranca viendo la primera.
        if (usuario.rol === 'ADMIN') return actual ?? null;
        return data[0]?.id ?? null;
      });
    } finally {
      setCargando(false);
      if (!resueltoAlgunaVezRef.current) {
        resueltoAlgunaVezRef.current = true;
        setCargandoInicial(false);
      }
    }
  }, [usuario, cargandoAuth]);

  useEffect(() => {
    cargarMarcas();
  }, [cargarMarcas]);

  const marcaActual = marcas.find((m) => m.id === marcaActualId) || null;

  return (
    <MarcaContext.Provider
      value={{ marcas, marcaActual, marcaActualId, setMarcaActualId, cargando, cargandoInicial, recargarMarcas: cargarMarcas }}
    >
      {children}
    </MarcaContext.Provider>
  );
}

export function useMarca() {
  const ctx = useContext(MarcaContext);
  if (!ctx) throw new Error('useMarca debe usarse dentro de <MarcaProvider>');
  return ctx;
}
