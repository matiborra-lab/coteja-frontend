import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

const MarcaContext = createContext(null);

export function MarcaProvider({ children }) {
  const { usuario, cargando: cargandoAuth } = useAuth();
  const [marcas, setMarcas] = useState([]);
  const [marcaActualId, setMarcaActualId] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargarMarcas = useCallback(async () => {
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
      return;
    }
    setCargando(true);
    try {
      const data = await api.get('/api/mis-marcas');
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
    }
  }, [usuario, cargandoAuth]);

  useEffect(() => {
    cargarMarcas();
  }, [cargarMarcas]);

  const marcaActual = marcas.find((m) => m.id === marcaActualId) || null;

  return (
    <MarcaContext.Provider
      value={{ marcas, marcaActual, marcaActualId, setMarcaActualId, cargando, recargarMarcas: cargarMarcas }}
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
