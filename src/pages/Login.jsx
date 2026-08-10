import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthCard, Campo, Boton } from '../components/ui';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <AuthCard subtitulo="Ingresá a tu cuenta">
      <form onSubmit={onSubmit} className="space-y-4">
        <Campo label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
        <Campo label="Contraseña" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Boton type="submit" cargando={cargando}>{cargando ? 'Ingresando...' : 'Ingresar'}</Boton>
      </form>
      <Link to="/olvide-clave" className="block text-center text-sm text-coteja-azul-700 hover:underline mt-4">
        Olvidé mi contraseña
      </Link>
    </AuthCard>
  );
}
