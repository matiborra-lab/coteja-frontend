// Arma el nombre para mostrar de un producto de competencia a partir de su
// nombre base + los agregados/variaciones seleccionados al vincularlo (ver
// columna productos_competencia.agregados en el backend) - nunca se guarda
// un string ya concatenado, siempre se arma en pantalla para poder elegir
// completo (detalle) o resumido (listados) desde el mismo dato.
function nombresAgregados(agregados) {
  return Array.isArray(agregados) ? agregados.map((a) => a.nombre).filter(Boolean) : [];
}

export function nombreCompleto({ nombre, agregados }) {
  const extras = nombresAgregados(agregados);
  return extras.length === 0 ? nombre : nombre + ' + ' + extras.join(' + ');
}

// Ej: con 5 agregados y max=2 -> "Base + Cream Roll + Tori Cheese + 3
// artículos más". Con 0 o 1 agregados da exactamente lo mismo que
// nombreCompleto (sin "más" de por medio) - para no truncar donde no hace
// falta.
export function nombreCompacto({ nombre, agregados }, max = 2) {
  const extras = nombresAgregados(agregados);
  if (extras.length <= max) return nombreCompleto({ nombre, agregados });
  const restantes = extras.length - max;
  return nombre + ' + ' + extras.slice(0, max).join(' + ') + ' + ' + restantes + (restantes === 1 ? ' artículo más' : ' artículos más');
}
