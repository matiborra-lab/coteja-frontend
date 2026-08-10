import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { AuthCard, Campo, Boton } from '../components/ui';

export default function DefinirClave() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { aplicarToken } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  if (!token) {
    return (
      <AuthCard titulo="Link invalido">
        <p className="text-sm text-gray-600">
          Este link no es válido o ya lo usaste. Pedí uno nuevo desde{' '}
          <Link to="/olvide-clave" className="text-coteja-azul-700 underline">acá</Link>.
        </p>
      </AuthCard>
    );
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden');
      return;
    }
    setCargando(true);
    try {
      const data = await api.post('/api/auth/definir-password', { token, password }, { auth: false });
      aplicarToken(data.token, data.usuario);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <AuthCard titulo="Elegí tu contraseña" subtitulo="Tiene que tener al menos 8 caracteres.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Campo label="Contraseña nueva" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        <Campo label="Repetir contraseña" type="password" required value={confirmar} onChange={(e) => setConfirmar(e.target.value)} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Boton type="submit" cargando={cargando}>{cargando ? 'Guardando...' : 'Guardar y entrar'}</Boton>
      </form>
    </AuthCard>
  );
}
