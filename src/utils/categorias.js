// Sugerencia de categoria por palabras clave en el nombre del articulo -
// solo una ayuda para no escribir todo a mano, el cliente puede cambiarla o
// dejarla vacia.
const PALABRAS_CLAVE = [
  { patron: /burger|hamburgues/i, categoria: 'Hamburguesas' },
  { patron: /papa|fritas|guarnici/i, categoria: 'Papas y guarniciones' },
  { patron: /gaseosa|bebida|agua|jugo|cerveza|limonada|licuado/i, categoria: 'Bebidas' },
  { patron: /combo/i, categoria: 'Combos' },
  { patron: /postre|helado|flan|torta|brownie|cheesecake/i, categoria: 'Postres' },
  { patron: /pizza|muzzarella/i, categoria: 'Pizzas' },
  { patron: /lomo|sandwich|sanguche/i, categoria: 'Sandwiches' },
  { patron: /ensalada/i, categoria: 'Ensaladas' },
  { patron: /pancho|hot ?dog/i, categoria: 'Panchos' },
];

export const CATEGORIAS_DEFAULT = ['Hamburguesas', 'Papas y guarniciones', 'Bebidas', 'Combos', 'Postres'];

export function sugerirCategoria(nombre) {
  const encontrada = PALABRAS_CLAVE.find((p) => p.patron.test(String(nombre || '')));
  return encontrada?.categoria || '';
}
