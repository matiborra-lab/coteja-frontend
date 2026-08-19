// Mapea el texto guardado en competidores.plataforma al logo correspondiente
// en public/plataformas/. Ese campo es texto libre y conviven dos
// convenciones en los datos reales: el nombre "lindo" que arma
// detectarPlataforma() en utils/plataformas.js (ej. "Cucina Link",
// "Tucán / Loveat") y el codigo de sistema en mayusculas que usa el
// scraping (ver src/scraping/index.js en el backend: CUCINA_LINK, TUCAN,
// RESTONLINE, etc). Para no depender de cual de las dos se guardo,
// normalizamos (mayusculas, sin acentos, sin espacios/guiones/barras) y
// matcheamos contra esa forma normalizada.
function normalizar(texto) {
  const sinAcentos = String(texto || '')
    .normalize('NFD')
    .replace(new RegExp('[̀-ͯ]', 'g'), '');
  return sinAcentos.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

const LOGOS_POR_CLAVE_NORMALIZADA = {
  PEDIX: '/plataformas/Pedix.png',
  MASDELIVERY: '/plataformas/MasDelivery.png',
  CUCINALINK: '/plataformas/CucinaLink.png',
  FUDO: '/plataformas/FUDO.png',
  CARTANUBE: '/plataformas/Cartanube.png',
  BISTROSOFT: '/plataformas/Bistrosoft.png',
  MAXIREST: '/plataformas/Maxirest.png',
  RESTONLINE: '/plataformas/RestoOnline.png',
  RESTOONLINE: '/plataformas/RestoOnline.png',
  TUCAN: '/plataformas/Tucan.png',
  TUCANLOVEAT: '/plataformas/Tucan.png',
  TOTEAT: '/plataformas/Toteat.png',
  GROWBRANDS: '/plataformas/GrowBrands.png',
  RAPPI: '/plataformas/Rappi.jpg',
};

export function logoDePlataforma(nombre) {
  return LOGOS_POR_CLAVE_NORMALIZADA[normalizar(nombre)] || null;
}
