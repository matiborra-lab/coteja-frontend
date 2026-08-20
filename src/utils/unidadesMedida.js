// Mismos 4 valores que valida el backend (UNIDADES_MEDIDA_VALIDAS en
// src/server/index.js) - solo importan si la marca tiene activo
// permite_ajuste_unidad (ver Mi cuenta).
export const UNIDADES_MEDIDA = [
  { value: 'UNIDAD', label: 'Unidad' },
  { value: 'RACION', label: 'Ración' },
  { value: 'KILOGRAMO', label: 'Kilogramo' },
  { value: 'LITRO', label: 'Litro' },
];

export function unidadMedidaLabel(valor) {
  return UNIDADES_MEDIDA.find((u) => u.value === valor)?.label || 'Unidad';
}

// Acepta coma o punto como separador decimal (formato Argentina: "5,5") y
// devuelve un Number, o null si no es un numero valido/mayor a 0.
export function parsearCantidad(texto) {
  const normalizado = String(texto ?? '').trim().replace(',', '.');
  if (normalizado === '') return null;
  const n = Number(normalizado);
  if (isNaN(n) || n <= 0) return null;
  return n;
}
