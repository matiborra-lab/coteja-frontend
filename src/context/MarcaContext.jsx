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
  // Guarda para que USUARIO ya se resolvio cargandoInicial una vez (null =
  // "sin sesion"). Tiene que ser por usuario, no un booleano global: si
  // fuera global, la PRIMERA vez que este Provider ve "sin usuario" (por
  // ej. en /login, antes de que alguien inicie sesion) ya lo marcaria
  // resuelto para siempre - despues, un login exitoso cambia "usuario" pero
  // cargandoInicial ya quedo en false, entonces RequireMarca no espera el
  // fetch real y lee marcas=[] (el valor viejo) como si fuera definitivo,
  // mandando al recien logueado a /crear-marca aunque ya tenga marca. Al
  // guardar CUAL usuario ya se resolvio, un login (null -> usuario real)
  // se reconoce como una resolucion nueva y vuelve a bloquear con
  // cargandoInicial hasta que el fetch de esa sesion realmente termine.
  const resueltoParaRef = useRef(undefined);
  // Si /api/mis-marcas falla (blip de red, cold start del backend en
  // Railway, etc) NO hay que confundir "no pude confirmar cuantas marcas
  // tiene" con "tiene cero marcas" - lo segundo manda a RequireMarca a
  // redirigir a /crear-marca, y ahi el cliente se encuentra con un backend
  // que SI ve su marca de siempre y le rechaza la creacion por duplicada
  // (404/403 confuso). Por eso cargarMarcas reintenta antes de rendirse, y
  // si aun asi falla, expone "error" para que RequireMarca muestre un
  // reintentar en vez de asumir que no tiene marcas.
  const [error, setError] = useState(null);

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

  const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  const cargarMarcas = useCallback(async (marcaIdParaContexto) => {
    // Mientras AuthContext todavia no resolvio quien es el usuario, "usuario"
    // esta transitoriamente en null - si tratasemos eso como "sin marcas" ya
    // quedaria cargando=false por un instante, y un guard como RequireMarca
    // podria alcanzar a redirigir a /crear-marca antes de tiempo. Hay que
    // esperar a que termine de cargar el auth antes de decidir cualquier cosa.
    if (cargandoAuth) return;
    const claveUsuario = usuario?.id ?? null;
    // Si esta resolucion es para un usuario distinto del que ya habiamos
    // resuelto (tipicamente: login nuevo tras estar deslogueado), hay que
    // volver a bloquear con cargandoInicial hasta que termine - ver el
    // comentario de resueltoParaRef mas arriba.
    if (resueltoParaRef.current !== claveUsuario) {
      setCargandoInicial(true);
    }
    if (!usuario) {
      setMarcas([]);
      setMarcaActualId(null);
      setCargando(false);
      setError(null);
      resueltoParaRef.current = claveUsuario;
      setCargandoInicial(false);
      return;
    }
    setCargando(true);
    // undefined = "no me dijeron nada, uso la marca actual" (recargarMarcas()
    // suelto); null explicito = "sin contexto de marca" (volver a Usuarios) -
    // por eso no se puede usar ?? aca, pisaria el null a proposito.
    const marcaId = marcaIdParaContexto !== undefined ? marcaIdParaContexto : marcaActualIdRef.current;
    const query = usuario.rol === 'ADMIN' && marcaId ? `?marcaId=${marcaId}` : '';
    // Un blip de red o un cold start del backend no significa "el cliente no
    // tiene marcas" - antes de rendirse (y potencialmente mandarlo a
    // /crear-marca con 0 resultados) reintentamos un par de veces.
    const intentos = 3;
    for (let intento = 1; intento <= intentos; intento++) {
      try {
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
        setError(null);
        break;
      } catch (err) {
        if (intento === intentos) {
          setError(err.message || 'No se pudieron cargar tus marcas');
        } else {
          await esperar(500 * intento);
        }
      }
    }
    setCargando(false);
    resueltoParaRef.current = claveUsuario;
    setCargandoInicial(false);
  }, [usuario, cargandoAuth]);

  useEffect(() => {
    cargarMarcas();
  }, [cargarMarcas]);

  const marcaActual = marcas.find((m) => m.id === marcaActualId) || null;

  return (
    <MarcaContext.Provider
      value={{ marcas, marcaActual, marcaActualId, setMarcaActualId, cargando, cargandoInicial, error, recargarMarcas: cargarMarcas }}
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
