import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { AuthCard, Campo, Boton } from '../components/ui';

export default function OlvideClave() {
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setCargando(true);
    try {
      const data = await api.post('/api/auth/olvide-password', { email }, { auth: false });
      setMensaje(data.message);
    } catch (err) {
      setMensaje(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <AuthCard titulo="Olvidé mi contraseña" subtitulo="Te mandamos un link para restablecerla.">
      {mensaje ? (
        <p className="text-sm text-gray-700">{mensaje}</p>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <Campo label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <Boton type="submit" cargando={cargando}>{cargando ? 'Enviando...' : 'Enviar link'}</Boton>
        </form>
      )}
      <Link to="/login" className="block text-center text-sm text-coteja-azul-700 hover:underline mt-4">
        Volver al login
      </Link>
    </AuthCard>
  );
}
