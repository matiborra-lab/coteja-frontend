import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { Campo, Boton, Modal } from '../components/ui';

const WHATSAPP_NUMERO = '5493512380620';
function linkWhatsapp(mensaje) {
  return 'https://wa.me/' + WHATSAPP_NUMERO + '?text=' + encodeURIComponent(mensaje);
}

const PLANES = [
  {
    id: 'CLIENTE',
    nombre: 'Cliente',
    descripcion: 'Para quien maneja una sola marca o local.',
    precio: 20000,
    destacado: false,
    beneficios: [
      '1 marca monitoreada',
      'Panel de precios con todos tus competidores',
      'Alertas por mail y notificación push',
      'Revisión diaria de precios',
      'Historial de precios propio y de la competencia',
    ],
  },
  {
    id: 'CLIENTE_MULTIMARCA',
    nombre: 'Cliente multimarca',
    descripcion: 'Para grupos o cadenas que operan más de una marca.',
    precio: 30000,
    destacado: true,
    beneficios: [
      'Hasta 3 marcas monitoreadas',
      'Panel y competidores independientes por marca',
      'Alertas por mail y notificación push',
      'Revisión diaria de precios',
      'Historial de precios propio y de la competencia',
    ],
  },
];

function TarjetaPlan({ plan, onContratar }) {
  return (
    <div
      className={
        'bg-white rounded-2xl p-8 flex flex-col shadow-sm border ' +
        (plan.destacado ? 'border-coteja-verde-600 shadow-lg relative' : 'border-gray-200')
      }
    >
      {plan.destacado && (
        <span className="absolute -top-3 left-8 bg-coteja-verde-700 text-white text-xs font-semibold uppercase tracking-wide px-3 py-1 rounded-full">
          Hasta 3 marcas
        </span>
      )}
      <h2 className="text-xl font-semibold text-gray-900">{plan.nombre}</h2>
      <p className="text-sm text-gray-500 mt-1">{plan.descripcion}</p>
      <div className="flex items-baseline gap-1 mt-6">
        <span className="text-4xl font-bold text-gray-900">${plan.precio.toLocaleString('es-AR')}</span>
        <span className="text-sm text-gray-400">ARS / mes</span>
      </div>
      <ul className="mt-6 space-y-3 flex-grow">
        {plan.beneficios.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm text-gray-600">
            <svg className="w-4 h-4 mt-0.5 text-coteja-verde-600 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M5 13l4 4L19 7" />
            </svg>
            {b}
          </li>
        ))}
      </ul>
      <Boton onClick={() => onContratar(plan)}>Contratar {plan.nombre}</Boton>
    </div>
  );
}

function ModalContratar({ plan, onClose }) {
  const [email, setEmail] = useState('');
  const [nombreMarca, setNombreMarca] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const { init_point } = await api.post(
        '/api/mercadopago/suscripciones',
        { email, nombre_marca: nombreMarca, plan: plan.id },
        { auth: false }
      );
      window.location.href = init_point;
    } catch (err) {
      setError(err.message);
      setCargando(false);
    }
  }

  return (
    <Modal titulo={'Contratar plan ' + plan.nombre} onClose={onClose}>
      <form onSubmit={enviar} className="space-y-4">
        <p className="text-sm text-gray-500">
          Te vamos a redirigir a Mercado Pago para completar el pago. Apenas se acredite, te llega un mail para crear tu contraseña y empezar.
        </p>
        <Campo
          label="Tu mail"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vos@tumarca.com"
        />
        <Campo
          label="Nombre de tu marca"
          required
          value={nombreMarca}
          onChange={(e) => setNombreMarca(e.target.value)}
          placeholder="ej: Fat Burger"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Boton type="submit" cargando={cargando}>
          {cargando ? 'Redirigiendo a Mercado Pago...' : 'Ir a pagar'}
        </Boton>
      </form>
    </Modal>
  );
}

export default function Planes() {
  const [planSeleccionado, setPlanSeleccionado] = useState(null);
  const [searchParams] = useSearchParams();
  const vuelveDePago = searchParams.get('suscripcion') === 'gracias';

  return (
    <div className="min-h-screen bg-coteja-humo">
      <header className="border-b border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <img src="/brand/coteja_logo_horizontal.png" alt="COTEJA" className="h-7" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16">
        {vuelveDePago && (
          <div className="mb-10 bg-coteja-verde-50 border border-coteja-verde-300 text-coteja-verde-900 rounded-xl px-5 py-4 text-sm">
            ¡Gracias! Si tu pago se acreditó, en unos minutos te llega un mail para crear tu contraseña y empezar. Si no te llega, escribinos por{' '}
            <a href={linkWhatsapp('Hola, pagué la suscripción a Coteja pero todavía no me llegó el mail de acceso.')} target="_blank" rel="noopener noreferrer" className="underline font-medium">
              WhatsApp
            </a>
            .
          </div>
        )}

        <div className="text-center max-w-xl mx-auto mb-14">
          <p className="text-coteja-verde-700 text-xs font-semibold uppercase tracking-widest">Planes y precios</p>
          <h1 className="text-3xl md:text-4xl font-bold text-coteja-azul-900 mt-2">Elegí el plan según cuántas marcas manejás</h1>
          <p className="text-gray-500 mt-4">
            Los dos planes incluyen el mismo panel, las mismas alertas y las mismas integraciones. La diferencia es cuántas marcas podés monitorear en simultáneo.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {PLANES.map((plan) => (
            <TarjetaPlan key={plan.id} plan={plan} onContratar={setPlanSeleccionado} />
          ))}
        </div>

        <p className="text-center text-sm text-gray-400 mt-12">
          ¿Tenés dudas o manejás más de 3 marcas?{' '}
          <a href={linkWhatsapp('Hola, tengo una consulta sobre los planes de Coteja.')} target="_blank" rel="noopener noreferrer" className="text-coteja-verde-700 underline font-medium">
            Escribinos por WhatsApp
          </a>
        </p>
      </main>

      {planSeleccionado && <ModalContratar plan={planSeleccionado} onClose={() => setPlanSeleccionado(null)} />}
    </div>
  );
}
