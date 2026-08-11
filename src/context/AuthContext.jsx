import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { api, guardarToken, borrarToken } from '../api/client';
import { desuscribirsePush } from '../utils/push';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargarUsuario = useCallback(async () => {
    if (!localStorage.getItem('coteja_token')) {
      setUsuario(null);
      setCargando(false);
      return;
    }
    try {
      const data = await api.get('/api/auth/yo');
      setUsuario(data);
    } catch {
      // El token dejo de ser valido sin pasar por logout() (vencio solo, o
      // un admin desactivo la cuenta / le cambio el rol) - si no
      // desuscribimos igual aca, un dispositivo compartido se queda
      // escuchando las notificaciones de esta cuenta con la sesion ya
      // muerta. No hace falta esperarlo: ya vamos a limpiar el estado.
      desuscribirsePush().catch(() => {});
      borrarToken();
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarUsuario();
  }, [cargarUsuario]);

  const login = useCallback(async (email, password) => {
    const data = await api.post('/api/auth/login', { email, password }, { auth: false });
    guardarToken(data.token);
    setUsuario(data.usuario);
    return data.usuario;
  }, []);

  // Se usa despues de definir-password o de crear la marca, cuando el
  // backend emite un token nuevo (por ejemplo porque ahora ya tiene marcaId).
  const aplicarToken = useCallback((token, usuarioData) => {
    guardarToken(token);
    setUsuario(usuarioData);
  }, []);

  const logout = useCallback(() => {
    // La UI se siente instantanea (setUsuario ya dispara el redirect a
    // /login), pero el token recien se borra despues de intentar
    // desuscribir el push - esa llamada necesita ir autenticada. Sin esto,
    // un dispositivo compartido (mostrador, tablet del local) seguiria
    // recibiendo las notificaciones del usuario anterior despues de que
    // otro inicie sesion ahi.
    setUsuario(null);
    desuscribirsePush().catch(() => {}).finally(borrarToken);
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout, aplicarToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
