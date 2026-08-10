export function formatoMoneda(valor) {
  if (valor == null || valor === '') return '-';
  const numero = Number(valor);
  const signo = numero < 0 ? '-' : '';
  return signo + '$' + Math.abs(numero).toLocaleString('es-AR', { maximumFractionDigits: 2 });
}

export function formatoFechaHora(valor) {
  if (!valor) return null;
  const fecha = new Date(valor);
  if (isNaN(fecha.getTime())) return null;
  return fecha.toLocaleString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
