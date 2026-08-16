import { useEffect, useState } from 'react';
import {
  LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { api } from '../api/client';
import { Campo, Boton, Modal, Leyenda, Toast } from '../components/ui';
import { formatoMoneda } from '../utils/formato';

const COLOR_CORRESPONDIENTE = '#9ca3af';
const COLOR_ABONADO = '#02662e';
const COLOR_PENDIENTE = '#dc2626';
const COLORES_DONUT = ['#011c3b', '#02662e', '#9ca3af', '#dc2626'];

const BILLING_METHODS = [
  { value: 'MERCADO_PAGO_SUBSCRIPTION', label: 'Mercado Pago (suscripción)' },
  { value: 'MANUAL', label: 'Manual' },
  { value: 'COMPLIMENTARY', label: 'Cortesía' },
];
const PLANES = [
  { value: 'CLIENTE', label: 'Cliente' },
  { value: 'CLIENTE_MULTIMARCA', label: 'Cliente multimarca' },
];
const ESTADOS = [
  { value: 'ACTIVA', label: 'Activa' },
  { value: 'PAUSADA', label: 'Pausada' },
  { value: 'CANCELADA', label: 'Cancelada' },
];

function labelDe(lista, valor) {
  return lista.find((o) => o.value === valor)?.label || valor;
}

function mesLabel(fechaIso) {
  return new Date(fechaIso).toLocaleDateString('es-AR', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

const BADGE_BILLING = {
  MERCADO_PAGO_SUBSCRIPTION: 'bg-coteja-azul-100 text-coteja-azul-800',
  MANUAL: 'bg-gray-100 text-gray-700',
  COMPLIMENTARY: 'bg-purple-100 text-purple-700',
};
const BADGE_ESTADO = {
  ACTIVA: 'bg-green-100 text-green-700',
  PAUSADA: 'bg-amber-100 text-amber-700',
  CANCELADA: 'bg-red-100 text-red-700',
};

// Genera la lista de periodos (primer dia de cada mes, YYYY-MM-01) entre
// dos <input type="month"> value ("YYYY-MM") inclusive.
function periodosEntre(desdeMes, hastaMes) {
  if (!desdeMes || !hastaMes) return [];
  const [ya, ma] = desdeMes.split('-').map(Number);
  const [yb, mb] = hastaMes.split('-').map(Number);
  let actual = new Date(Date.UTC(ya, ma - 1, 1));
  const fin = new Date(Date.UTC(yb, mb - 1, 1));
  const periodos = [];
  while (actual <= fin) {
    periodos.push(actual.toISOString().slice(0, 10));
    actual = new Date(Date.UTC(actual.getUTCFullYear(), actual.getUTCMonth() + 1, 1));
  }
  return periodos;
}

function ModalBilling({ cliente, onClose, onGuardado }) {
  const [billingMethod, setBillingMethod] = useState(cliente.billing_method);
  const [plan, setPlan] = useState(cliente.subscription_plan || 'CLIENTE');
  const [estado, setEstado] = useState(cliente.subscription_status);
  const [precioFijo, setPrecioFijo] = useState(!!cliente.precio_personalizado);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function guardar(e) {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await api.patch('/api/admin/usuarios/' + cliente.id + '/billing', {
        billing_method: billingMethod,
        subscription_plan: plan,
        subscription_status: estado,
      });
      if (cliente.billing_method === 'MERCADO_PAGO_SUBSCRIPTION' && precioFijo !== !!cliente.precio_personalizado) {
        await api.patch('/api/admin/usuarios/' + cliente.id + '/precio-fijo', { precio_personalizado: precioFijo });
      }
      onGuardado();
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <Modal titulo={'Facturación de ' + cliente.email} onClose={onClose}>
      <form onSubmit={guardar} className="space-y-4">
        {cliente.billing_method === 'MERCADO_PAGO_SUBSCRIPTION' && billingMethod !== 'MERCADO_PAGO_SUBSCRIPTION' && (
          <Leyenda>
            Esta cuenta tiene una suscripción real de Mercado Pago. Cambiarla a Manual/Cortesía no la cancela en Mercado
            Pago ni borra su historial de pagos - solo deja de sincronizarse automáticamente desde acá.
          </Leyenda>
        )}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Método de facturación</label>
          <select value={billingMethod} onChange={(e) => setBillingMethod(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2">
            {BILLING_METHODS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Plan</label>
          <select value={plan} onChange={(e) => setPlan(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2">
            {PLANES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estado de la suscripción</label>
          <select value={estado} onChange={(e) => setEstado(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2">
            {ESTADOS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        {cliente.billing_method === 'MERCADO_PAGO_SUBSCRIPTION' && (
          <label className="flex items-start gap-2 text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
            <input type="checkbox" className="mt-0.5" checked={precioFijo} onChange={(e) => setPrecioFijo(e.target.checked)} />
            <span>
              Precio fijo - cuando subas el precio de este plan desde "Precios de planes", esta cuenta queda excluida y
              mantiene el monto con el que se suscribió.
            </span>
          </label>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Boton type="submit" cargando={cargando}>Guardar</Boton>
      </form>
    </Modal>
  );
}

function EditorPrecios({ onCambio }) {
  const [planes, setPlanes] = useState(null);
  const [editando, setEditando] = useState(null); // id del plan en edicion
  const [monto, setMonto] = useState('');
  const [impacto, setImpacto] = useState(null); // {afectados, excluidos} una vez pedido el preview
  const [resultado, setResultado] = useState(null); // {actualizados, fallidos} tras confirmar
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function cargar() {
    const data = await api.get('/api/admin/planes');
    setPlanes(data);
  }

  useEffect(() => {
    cargar();
  }, []);

  function empezarEdicion(p) {
    setEditando(p.id);
    setMonto(String(p.monto));
    setImpacto(null);
    setResultado(null);
    setError('');
  }

  async function pedirImpacto() {
    setError('');
    if (!monto || !(Number(monto) > 0)) {
      setError('Ingresá un monto válido');
      return;
    }
    setCargando(true);
    try {
      const data = await api.get('/api/admin/planes/' + editando + '/impacto');
      setImpacto(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  async function confirmar() {
    setCargando(true);
    setError('');
    try {
      const data = await api.patch('/api/admin/planes/' + editando, { monto: Number(monto) });
      setResultado(data);
      await cargar();
      onCambio();
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  function cerrar() {
    setEditando(null);
    setImpacto(null);
    setResultado(null);
  }

  if (!planes) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 space-y-3">
      <h3 className="text-sm font-medium text-gray-700">Precios de planes</h3>
      {planes.map((p) => (
        <div key={p.id} className="flex items-center justify-between gap-3 text-sm border-b border-gray-50 last:border-0 pb-2 last:pb-0">
          <span className="text-gray-700">{p.label}</span>
          {editando === p.id ? (
            <div className="flex-1 max-w-sm space-y-2">
              {!resultado ? (
                <>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      value={monto}
                      onChange={(e) => { setMonto(e.target.value); setImpacto(null); }}
                      className="w-32 rounded-lg border border-gray-300 px-2 py-1"
                    />
                    {impacto === null ? (
                      <Boton onClick={pedirImpacto} cargando={cargando}>Continuar</Boton>
                    ) : (
                      <Boton onClick={confirmar} cargando={cargando}>Confirmar</Boton>
                    )}
                    <button type="button" onClick={cerrar} className="text-xs text-gray-400">Cancelar</button>
                  </div>
                  {impacto !== null && (
                    <Leyenda>
                      Esto va a actualizar el monto real en Mercado Pago de <strong>{impacto.afectados}</strong>{' '}
                      {impacto.afectados === 1 ? 'suscripción activa' : 'suscripciones activas'}
                      {impacto.excluidos > 0 ? ' (' + impacto.excluidos + ' con precio fijo quedan excluidas)' : ''}. Los
                      clientes Manual/Cortesía de este plan no necesitan ningún cambio aparte.
                    </Leyenda>
                  )}
                  {error && <p className="text-xs text-red-600">{error}</p>}
                </>
              ) : (
                <div className="text-xs space-y-1">
                  <p className="text-coteja-verde-700 font-medium">
                    Precio actualizado. {resultado.actualizados.length}{' '}
                    {resultado.actualizados.length === 1 ? 'suscripción de Mercado Pago actualizada' : 'suscripciones de Mercado Pago actualizadas'}.
                  </p>
                  {resultado.fallidos.length > 0 && (
                    <div className="text-red-600">
                      <p className="font-medium">{resultado.fallidos.length} fallaron - revisalas a mano:</p>
                      <ul className="list-disc list-inside">
                        {resultado.fallidos.map((f) => <li key={f.suscripcion_id}>{f.mp_payer_email}: {f.error}</li>)}
                      </ul>
                    </div>
                  )}
                  <button type="button" onClick={cerrar} className="text-coteja-azul-700 underline">Cerrar</button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="font-medium text-gray-900">{formatoMoneda(p.monto)}</span>
              <button onClick={() => empezarEdicion(p)} className="text-coteja-azul-700 hover:underline text-xs">Editar</button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ModalHistorial({ cliente, onClose, onCambio }) {
  const [pagos, setPagos] = useState(null);
  const [error, setError] = useState('');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [monto, setMonto] = useState('');
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [desdeMes, setDesdeMes] = useState('');
  const [hastaMes, setHastaMes] = useState('');
  const [nota, setNota] = useState('');
  const [cargando, setCargando] = useState(false);

  async function cargar() {
    const data = await api.get('/api/admin/usuarios/' + cliente.id + '/pagos');
    setPagos(data);
  }

  useEffect(() => {
    cargar();
  }, [cliente.id]);

  const periodos = periodosEntre(desdeMes, hastaMes);

  async function registrarPago(e) {
    e.preventDefault();
    setError('');
    if (!periodos.length) {
      setError('Elegí el rango de meses que cubre este pago');
      return;
    }
    setCargando(true);
    try {
      await api.post('/api/admin/usuarios/' + cliente.id + '/pagos-manuales', {
        monto: Number(monto),
        paid_at: paidAt,
        periodos,
        nota: nota || undefined,
      });
      setMonto('');
      setDesdeMes('');
      setHastaMes('');
      setNota('');
      setMostrarForm(false);
      await cargar();
      onCambio();
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  async function borrarPago(id) {
    if (!confirm('¿Borrar este pago manual? Los meses que cubría vuelven a quedar pendientes.')) return;
    await api.del('/api/admin/pagos-manuales/' + id);
    await cargar();
    onCambio();
  }

  const todos = pagos
    ? [...pagos.manuales, ...pagos.mercadopago].sort((a, b) => new Date(b.paid_at) - new Date(a.paid_at))
    : [];

  return (
    <Modal titulo={'Historial de pagos - ' + cliente.email} onClose={onClose} ancho="max-w-2xl">
      <div className="space-y-4">
        {!mostrarForm ? (
          <Boton onClick={() => setMostrarForm(true)}>+ Registrar pago manual</Boton>
        ) : (
          <form onSubmit={registrarPago} className="bg-gray-50 rounded-lg p-4 space-y-3 border border-gray-200">
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Monto" type="number" min="1" required value={monto} onChange={(e) => setMonto(e.target.value)} />
              <Campo label="Fecha del pago" type="date" required value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Campo label="Cubre desde (mes)" type="month" required value={desdeMes} onChange={(e) => setDesdeMes(e.target.value)} />
              <Campo label="Cubre hasta (mes)" type="month" required value={hastaMes} onChange={(e) => setHastaMes(e.target.value)} />
            </div>
            {periodos.length > 0 && (
              <p className="text-xs text-gray-500">Cubre {periodos.length} mes{periodos.length > 1 ? 'es' : ''}: {periodos.map(mesLabel).join(', ')}</p>
            )}
            <Campo label="Nota (opcional)" value={nota} onChange={(e) => setNota(e.target.value)} placeholder="ej: transferencia, efectivo..." />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="flex gap-2">
              <Boton type="submit" cargando={cargando}>Registrar</Boton>
              <button type="button" onClick={() => setMostrarForm(false)} className="text-sm text-gray-500 px-3">Cancelar</button>
            </div>
          </form>
        )}

        <div className="divide-y divide-gray-100 border border-gray-200 rounded-lg overflow-hidden">
          {todos.length === 0 && <p className="text-sm text-gray-400 p-4 text-center">Todavía no hay pagos registrados.</p>}
          {todos.map((p) => (
            <div key={p.origen + '-' + p.id} className="p-3 flex items-start justify-between gap-3 text-sm">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">{formatoMoneda(p.monto)}</span>
                  <span className={'text-xs px-2 py-0.5 rounded-full ' + (p.origen === 'MANUAL' ? 'bg-gray-100 text-gray-600' : 'bg-coteja-azul-100 text-coteja-azul-700')}>
                    {p.origen === 'MANUAL' ? 'Manual' : 'Mercado Pago'}
                  </span>
                </div>
                <p className="text-gray-500 text-xs mt-0.5">
                  Pagado el {new Date(p.paid_at).toLocaleDateString('es-AR')} ·{' '}
                  {p.origen === 'MANUAL' ? 'cubre ' + p.periodos.map(mesLabel).join(', ') : 'cubre ' + mesLabel(p.periodo)}
                </p>
                {p.nota && <p className="text-gray-400 text-xs italic mt-0.5">"{p.nota}"</p>}
              </div>
              {p.editable && (
                <button onClick={() => borrarPago(p.id)} className="text-red-500 hover:text-red-700 text-xs shrink-0">
                  Borrar
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

function TarjetaResumen({ etiqueta, valor, destacado }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
      <p className="text-xs text-gray-500">{etiqueta}</p>
      <p className={'text-xl font-semibold mt-1 ' + (destacado || 'text-gray-900')}>{valor}</p>
    </div>
  );
}

function Reportes() {
  const [datos, setDatos] = useState(null);
  const [filtroPlan, setFiltroPlan] = useState('');
  const [filtroBilling, setFiltroBilling] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  useEffect(() => {
    const params = new URLSearchParams();
    if (filtroPlan) params.set('plan', filtroPlan);
    if (filtroBilling) params.set('billing_method', filtroBilling);
    if (filtroEstado) params.set('estado', filtroEstado);
    api.get('/api/admin/reportes' + (params.toString() ? '?' + params.toString() : '')).then(setDatos).catch(() => setDatos(null));
  }, [filtroPlan, filtroBilling, filtroEstado]);

  if (!datos) return <p className="text-gray-400 text-sm py-8 text-center">Cargando reportes...</p>;

  const evolucion = datos.evolucion.map((f) => ({ ...f, mesLabel: mesLabel(f.mes) }));
  const porPlanMonto = datos.por_plan.map((p) => ({ name: labelDe(PLANES, p.plan), value: p.monto_mensual }));
  const porPlanClientes = datos.por_plan.map((p) => ({ name: labelDe(PLANES, p.plan), value: p.clientes }));
  const porMetodo = datos.por_metodo_pago.map((m) => ({ name: labelDe(BILLING_METHODS, m.billing_method), value: m.clientes }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <select value={filtroPlan} onChange={(e) => setFiltroPlan(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="">Todos los planes</option>
          {PLANES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={filtroBilling} onChange={(e) => setFiltroBilling(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="">Todos los métodos</option>
          {BILLING_METHODS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="">Todos los estados</option>
          {ESTADOS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <TarjetaResumen etiqueta="Clientes activos" valor={datos.resumen.clientes_activos} />
        <TarjetaResumen etiqueta="Cortesías (no cuentan como ingreso)" valor={datos.resumen.clientes_complementarios} />
        <TarjetaResumen etiqueta="MRR esperado" valor={formatoMoneda(datos.resumen.mrr_esperado)} />
        <TarjetaResumen etiqueta="Pendiente del mes actual" valor={formatoMoneda(datos.resumen.pendiente_mes_actual)} destacado={datos.resumen.pendiente_mes_actual > 0 ? 'text-red-600' : 'text-gray-900'} />
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Evolución mensual (correspondiente vs. abonado vs. pendiente)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={evolucion}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="mesLabel" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => '$' + (v / 1000) + 'k'} />
            <Tooltip formatter={(v) => formatoMoneda(v)} />
            <Legend />
            <Line type="monotone" dataKey="correspondiente" name="Correspondiente" stroke={COLOR_CORRESPONDIENTE} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="abonado" name="Abonado" stroke={COLOR_ABONADO} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="pendiente" name="Pendiente" stroke={COLOR_PENDIENTE} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-1">Distribución de planes - cantidad de clientes</h3>
          <p className="text-xs text-gray-400 mb-2">Cuenta clientes, no dinero (incluye cortesías).</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={porPlanClientes} dataKey="value" nameKey="name" outerRadius={80} label>
                {porPlanClientes.map((_, i) => <Cell key={i} fill={COLORES_DONUT[i % COLORES_DONUT.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <h3 className="text-sm font-medium text-gray-700 mb-1">Distribución de planes - monto mensual esperado</h3>
          <p className="text-xs text-gray-400 mb-2">Dinero, no clientes (excluye cortesías - nunca cuentan como ingreso).</p>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={porPlanMonto} dataKey="value" nameKey="name" outerRadius={80} label={(e) => formatoMoneda(e.value)}>
                {porPlanMonto.map((_, i) => <Cell key={i} fill={COLORES_DONUT[i % COLORES_DONUT.length]} />)}
              </Pie>
              <Tooltip formatter={(v) => formatoMoneda(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <h3 className="text-sm font-medium text-gray-700 mb-1">Método de pago - cantidad de clientes</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={porMetodo} dataKey="value" nameKey="name" outerRadius={80} label>
              {porMetodo.map((_, i) => <Cell key={i} fill={COLORES_DONUT[i % COLORES_DONUT.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function ListaClientes() {
  const [clientes, setClientes] = useState(null);
  const [modalBilling, setModalBilling] = useState(null);
  const [modalHistorial, setModalHistorial] = useState(null);
  const [toast, setToast] = useState('');

  async function cargar() {
    const data = await api.get('/api/admin/cobranzas');
    setClientes(data);
  }

  useEffect(() => {
    cargar();
  }, []);

  if (!clientes) return <p className="text-gray-400 text-sm py-8 text-center">Cargando...</p>;

  return (
    <div className="space-y-3">
      <EditorPrecios onCambio={cargar} />

      <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="text-left px-4 py-2">Cliente</th>
              <th className="text-left px-4 py-2">Plan</th>
              <th className="text-left px-4 py-2">Método</th>
              <th className="text-left px-4 py-2">Estado</th>
              <th className="text-left px-4 py-2">Último pago</th>
              <th className="text-left px-4 py-2">Deuda</th>
              <th className="text-right px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clientes.map((c) => (
              <tr key={c.id}>
                <td className="px-4 py-2">
                  <div className="font-medium text-gray-900">{c.email}</div>
                  {!c.activo && <span className="text-xs text-red-500">Deshabilitado</span>}
                </td>
                <td className="px-4 py-2 text-gray-600">{labelDe(PLANES, c.subscription_plan)} · {formatoMoneda(c.monto_mensual)}</td>
                <td className="px-4 py-2">
                  <span className={'text-xs px-2 py-1 rounded-full ' + BADGE_BILLING[c.billing_method]}>{labelDe(BILLING_METHODS, c.billing_method)}</span>
                </td>
                <td className="px-4 py-2">
                  <span className={'text-xs px-2 py-1 rounded-full ' + BADGE_ESTADO[c.subscription_status]}>{labelDe(ESTADOS, c.subscription_status)}</span>
                </td>
                <td className="px-4 py-2 text-gray-500">{c.ultimo_pago ? new Date(c.ultimo_pago).toLocaleDateString('es-AR') : 'nunca'}</td>
                <td className="px-4 py-2">
                  {c.periodos_pendientes > 0 ? (
                    <span className="text-red-600 font-medium">{c.periodos_pendientes} mes{c.periodos_pendientes > 1 ? 'es' : ''}</span>
                  ) : (
                    <span className="text-green-600">al día</span>
                  )}
                </td>
                <td className="px-4 py-2 text-right whitespace-nowrap">
                  <button onClick={() => setModalHistorial(c)} className="text-coteja-azul-700 hover:underline text-xs mr-3">Pagos</button>
                  <button onClick={() => setModalBilling(c)} className="text-coteja-azul-700 hover:underline text-xs">Editar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {clientes.map((c) => (
          <div key={c.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 space-y-2">
            <div className="font-medium text-gray-900">{c.email}</div>
            <div className="flex flex-wrap gap-2">
              <span className={'text-xs px-2 py-1 rounded-full ' + BADGE_BILLING[c.billing_method]}>{labelDe(BILLING_METHODS, c.billing_method)}</span>
              <span className={'text-xs px-2 py-1 rounded-full ' + BADGE_ESTADO[c.subscription_status]}>{labelDe(ESTADOS, c.subscription_status)}</span>
            </div>
            <p className="text-sm text-gray-600">{labelDe(PLANES, c.subscription_plan)} · {formatoMoneda(c.monto_mensual)}</p>
            <p className="text-sm">
              {c.periodos_pendientes > 0 ? (
                <span className="text-red-600 font-medium">{c.periodos_pendientes} mes{c.periodos_pendientes > 1 ? 'es' : ''} pendientes</span>
              ) : (
                <span className="text-green-600">Al día</span>
              )}
            </p>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setModalHistorial(c)} className="text-coteja-azul-700 hover:underline text-xs">Pagos</button>
              <button onClick={() => setModalBilling(c)} className="text-coteja-azul-700 hover:underline text-xs">Editar</button>
            </div>
          </div>
        ))}
      </div>

      {modalBilling && (
        <ModalBilling
          cliente={modalBilling}
          onClose={() => setModalBilling(null)}
          onGuardado={async () => {
            setModalBilling(null);
            setToast('Facturación actualizada.');
            await cargar();
          }}
        />
      )}
      {modalHistorial && (
        <ModalHistorial cliente={modalHistorial} onClose={() => setModalHistorial(null)} onCambio={cargar} />
      )}
      {toast && <Toast mensaje={toast} onCerrar={() => setToast('')} />}
    </div>
  );
}

export default function Cobranzas() {
  const [tab, setTab] = useState('clientes');

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-gray-200">
        <button
          onClick={() => setTab('clientes')}
          className={'text-sm px-3 py-2 font-medium border-b-2 ' + (tab === 'clientes' ? 'border-coteja-azul-800 text-coteja-azul-800' : 'border-transparent text-gray-500')}
        >
          Clientes
        </button>
        <button
          onClick={() => setTab('reportes')}
          className={'text-sm px-3 py-2 font-medium border-b-2 ' + (tab === 'reportes' ? 'border-coteja-azul-800 text-coteja-azul-800' : 'border-transparent text-gray-500')}
        >
          Reportes
        </button>
      </div>
      {tab === 'clientes' ? <ListaClientes /> : <Reportes />}
    </div>
  );
}
