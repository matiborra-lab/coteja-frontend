// Mismos 12 valores que valida el backend (TIPOS_COMERCIO_VALIDOS en
// src/server/index.js) - se comparte entre AdminUsuarios.jsx y Planes.jsx
// para que la lista nunca quede desincronizada.
export const TIPOS_COMERCIO = [
  { value: 'COMIDA_RAPIDA', label: 'Comida rápida' },
  { value: 'HAMBURGUESERIA', label: 'Hamburguesería' },
  { value: 'COMERCIO', label: 'Comercio' },
  { value: 'HELADERIA', label: 'Heladería' },
  { value: 'CAFETERIA', label: 'Cafetería' },
  { value: 'LOMITERIA', label: 'Lomitería' },
  { value: 'SUSHI', label: 'Sushi' },
  { value: 'EMPANADAS', label: 'Empanadas' },
  { value: 'ETNICA', label: 'Étnica' },
  { value: 'SANDWICHES', label: 'Sandwiches' },
  { value: 'COMIDA_SALUDABLE', label: 'Comida saludable' },
  { value: 'VARIOS', label: 'Varios' },
];

export function tipoComercioLabel(valor) {
  return TIPOS_COMERCIO.find((t) => t.value === valor)?.label || '-';
}
