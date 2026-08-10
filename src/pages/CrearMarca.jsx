import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useMarca } from '../context/MarcaContext';
import { AuthCard, Campo, Boton } from '../components/ui';

export default function CrearMarca() {
  const { recargarMarcas } = useMarca();
  const navigate = useNavigate();
  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await api.post('/api/marcas', { nombre });
      await recargarMarcas();
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <AuthCard titulo="Creá tu marca" subtitulo="Es el nombre de tu negocio dentro de COTEJA.">
      <form onSubmit={onSubmit} className="space-y-4">
        <Campo label="Nombre" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Boton type="submit" cargando={cargando}>{cargando ? 'Creando...' : 'Crear y continuar'}</Boton>
      </form>
    </AuthCard>
  );
}
