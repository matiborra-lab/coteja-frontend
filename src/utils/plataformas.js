// Deteccion de plataforma a partir del dominio de la URL de la tienda -
// mismos dominios que usan los modulos de scraping en el backend
// (src/scraping/*.js). Es solo para sugerir el campo "Plataforma" al cargar
// un nuevo competidor - el usuario lo puede sobrescribir si hace falta.
const DOMINIOS = [
  { patron: /pedix\.app/i, plataforma: 'Pedix' },
  { patron: /masdelivery\.com/i, plataforma: 'másDelivery' },
  { patron: /cucina\.link|oraclecloudapps\.com/i, plataforma: 'Cucina Link' },
  { patron: /fu\.do/i, plataforma: 'FUDO' },
  { patron: /cartanube\.com/i, plataforma: 'Cartanube' },
  { patron: /bistrosoft\.com/i, plataforma: 'Bistrosoft' },
  { patron: /maxirest\.com/i, plataforma: 'Maxirest' },
  { patron: /restonline\.com\.ar/i, plataforma: 'Resto Online' },
  { patron: /tucan\.la|loveat\.la/i, plataforma: 'Tucán / Loveat' },
  { patron: /toteat\.shop/i, plataforma: 'Toteat' },
];

export function detectarPlataforma(url) {
  const encontrada = DOMINIOS.find((d) => d.patron.test(String(url || '')));
  return encontrada?.plataforma || '';
}

export function esCucinaLink(url) {
  return /cucina\.link|oraclecloudapps\.com/i.test(String(url || ''));
}
