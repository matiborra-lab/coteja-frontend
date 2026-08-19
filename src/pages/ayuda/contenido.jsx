import { Mock, Senalar, MBoton, MCampo, MSelect, MCheckbox, MRadio, MBadge, MTabla, MAvatar, MMenuItem, MCard, MToggle } from './mockups';

function Sparkline() {
  return (
    <svg viewBox="0 0 220 70" className="w-full h-16">
      <polyline points="0,50 30,45 60,48 90,30 120,34 150,18 180,22 220,10" fill="none" stroke="#02662e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="0,55 30,58 60,52 90,54 120,50 150,52 180,48 220,46" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="220" cy="10" r="3" fill="#02662e" />
      <circle cx="220" cy="46" r="3" fill="#9ca3af" />
    </svg>
  );
}

export const SECCIONES = [
  // ============================================================
  {
    id: 'primeros-pasos',
    titulo: 'Primeros pasos',
    articulos: [
      {
        id: 'bienvenida',
        titulo: 'Bienvenida a COTEJA',
        resumen: 'Qué es COTEJA y qué vas a poder hacer con la plataforma.',
        pasos: [
          {
            titulo: 'Para qué sirve',
            texto: 'COTEJA monitorea automáticamente los precios de tu competencia y te avisa cuando cambian, para que siempre sepas cómo estás posicionado sin tener que revisar cada carta a mano, todos los días.',
          },
          {
            titulo: 'Las cuatro piezas de la plataforma',
            texto: 'Artículos (qué productos comparás), Tiendas (tu local y tus competidores), Panel (la comparación en vivo) y Alertas (los avisos automáticos). Las vas a usar en ese orden la primera vez.',
            mock: (
              <Mock>
                <div className="grid grid-cols-2 gap-2">
                  <MCard><p className="text-xs font-semibold text-coteja-azul-800">1. Artículos</p><p className="text-[11px] text-gray-500 mt-0.5">Qué comparar</p></MCard>
                  <MCard><p className="text-xs font-semibold text-coteja-azul-800">2. Tiendas</p><p className="text-[11px] text-gray-500 mt-0.5">Tu local y competencia</p></MCard>
                  <MCard><p className="text-xs font-semibold text-coteja-azul-800">3. Panel</p><p className="text-[11px] text-gray-500 mt-0.5">Comparación en vivo</p></MCard>
                  <MCard><p className="text-xs font-semibold text-coteja-azul-800">4. Alertas</p><p className="text-[11px] text-gray-500 mt-0.5">Avisos automáticos</p></MCard>
                </div>
              </Mock>
            ),
          },
          {
            titulo: 'Cada cuánto se actualizan los precios',
            texto: 'La mayoría de las tiendas se revisan automáticamente cada 30 minutos. Algunas plataformas más pesadas de leer se revisan cada 12 horas. Si necesitás un dato al instante, tenés un botón de "Actualizar precios" manual en el Panel (con un margen de espera entre usos).',
          },
        ],
      },
      {
        id: 'configurar-marca',
        titulo: 'Configurar tu marca',
        resumen: 'Cargar el nombre, logo, teléfono y mail de alertas de tu marca desde "Mi cuenta".',
        pasos: [
          {
            titulo: 'Entrá a "Mi cuenta"',
            texto: 'Tocá tu foto de perfil arriba a la derecha y elegí "Mi cuenta".',
            mock: (
              <Mock ancho="max-w-xs">
                <div className="flex items-center gap-2 mb-2">
                  <MAvatar letra="F" />
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="currentColor" className="text-gray-400"><path d="M5.23 7.21a.75.75 0 011.06.02L10 11.29l3.71-4.06a.75.75 0 111.08 1.04l-4.24 4.65a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" /></svg>
                </div>
                <div className="border border-gray-100 rounded-lg overflow-hidden">
                  <div className="px-3 py-2 border-b border-gray-100 text-[11px] text-gray-500">vos@tumarca.com</div>
                  <Senalar><MMenuItem destacado>Mi cuenta</MMenuItem></Senalar>
                  <MMenuItem>Salir</MMenuItem>
                </div>
              </Mock>
            ),
          },
          {
            titulo: 'Completá los datos de tu marca',
            texto: 'Nombre de la marca, un logo (opcional, hasta 800KB), un teléfono de contacto y el mail donde querés recibir las alertas por correo.',
            mock: (
              <Mock>
                <MCampo label="Nombre de la marca" valor="Fat Burger" />
                <MCampo label="Mail para alertas" valor="alertas@fatburger.com" />
                <MCampo label="Teléfono" valor="351 123 4567" />
                <div className="mt-2"><MBoton>Guardar cambios</MBoton></div>
              </Mock>
            ),
          },
        ],
      },
      {
        id: 'crear-marca-multimarca',
        titulo: 'Cómo crear una marca',
        resumen: 'Tu plan Multimarca te permite manejar hasta 3 marcas distintas desde la misma cuenta.',
        soloMultimarca: true,
        pasos: [
          {
            titulo: 'Andá a "Mi cuenta" → "Mis marcas"',
            texto: 'Al final de "Mi cuenta" vas a encontrar la sección "Mis marcas", con el listado de las que ya tenés y un botón para agregar otra.',
            mock: (
              <Mock ancho="max-w-xs">
                <p className="text-xs font-medium text-gray-900 mb-2">Mis marcas</p>
                <div className="border border-gray-100 rounded-lg divide-y divide-gray-100 mb-2">
                  <div className="px-3 py-1.5 text-xs text-gray-700">Fat Burger</div>
                  <div className="px-3 py-1.5 text-xs text-gray-700">Demo COTEJA</div>
                </div>
                <Senalar><p className="text-xs text-coteja-azul-700 font-medium">+ Agregar marca</p></Senalar>
              </Mock>
            ),
          },
          {
            titulo: 'Ponele un nombre y creala',
            texto: 'Con el nombre alcanza para arrancar - el logo, el teléfono y el mail de alertas se cargan después, igual que con cualquier otra marca.',
            mock: (
              <Mock ancho="max-w-xs">
                <div className="flex items-center gap-2">
                  <input disabled value="Fat Burger Nueva Córdoba" className="flex-1 text-xs border border-gray-300 rounded-lg px-2 py-1.5 text-gray-500" />
                  <MBoton>Crear</MBoton>
                </div>
              </Mock>
            ),
          },
          {
            titulo: 'Completá sus datos arriba',
            texto: 'Apenas la creás, la sección de arriba ("Datos de...") cambia a la marca nueva - ahí le subís el logo y le cargás el teléfono, igual que a cualquier otra.',
          },
          {
            titulo: 'Para pasar de una marca a otra',
            texto: 'Tocá tu foto de perfil arriba a la derecha - ahí vas a ver el listado de tus marcas para saltar de una a otra en cualquier momento, sin tener que pasar por "Mi cuenta".',
            mock: (
              <Mock ancho="max-w-xs">
                <div className="border border-gray-100 rounded-lg overflow-hidden divide-y divide-gray-100">
                  <Senalar>
                    <div className="flex items-center gap-2 px-3 py-1.5">
                      <MAvatar letra="F" />
                      <span className="text-xs text-gray-700">Fat Burger</span>
                    </div>
                  </Senalar>
                  <div className="flex items-center gap-2 px-3 py-1.5">
                    <MAvatar letra="D" color="verde" />
                    <span className="text-xs text-gray-700">Demo COTEJA</span>
                  </div>
                </div>
              </Mock>
            ),
          },
        ],
      },
    ],
  },

  // ============================================================
  {
    id: 'articulos-a-cotejar',
    titulo: 'Artículos a cotejar',
    articulos: [
      {
        id: 'que-es-articulo',
        titulo: 'Qué es un "artículo a cotejar"',
        resumen: 'No es lo mismo que tu carta: es el producto de referencia que vas a comparar.',
        pasos: [
          {
            titulo: 'La distinción importante',
            texto: 'Un "artículo a cotejar" es un producto de referencia que vos creás en COTEJA (por ejemplo "Hamburguesa simple"). No es directamente tu carta - es el concepto que después vinculás con tu propio producto real y con el producto equivalente de cada competidor, para que la comparación tenga sentido.',
          },
          {
            titulo: 'Un ejemplo concreto',
            texto: 'Creás el artículo "Hamburguesa simple". Después lo vinculás con "Hamburguesa Clásica" de tu propia carta, con "Burger Simple" de la competencia A y con "Hamburguesa x1" de la competencia B - aunque cada uno se llame distinto, todos representan el mismo producto para vos.',
            mock: (
              <Mock ancho="max-w-lg">
                <div className="text-center mb-2">
                  <MBadge color="verde">Artículo a cotejar</MBadge>
                  <p className="text-sm font-semibold text-gray-900 mt-1">Hamburguesa simple</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <MCard><p className="text-[10px] text-gray-400">Tu carta</p><p className="text-[11px] font-medium">Hamburguesa Clásica</p></MCard>
                  <MCard><p className="text-[10px] text-gray-400">Competencia A</p><p className="text-[11px] font-medium">Burger Simple</p></MCard>
                  <MCard><p className="text-[10px] text-gray-400">Competencia B</p><p className="text-[11px] font-medium">Hamburguesa x1</p></MCard>
                </div>
              </Mock>
            ),
          },
          {
            titulo: 'Por qué se hace en este orden',
            texto: 'Siempre se recomienda crear primero tus artículos a cotejar, y recién después cargar/vincular tu carta y la de la competencia a esos artículos. Así cada vínculo nuevo ya tiene a qué artículo asociarse, en vez de crear artículos sueltos sobre la marcha.',
          },
        ],
      },
      {
        id: 'cargar-articulos',
        titulo: 'Cómo cargar tus artículos a cotejar',
        resumen: 'Alta de un artículo nuevo, con categoría, desde la sección Artículos.',
        pasos: [
          {
            titulo: 'Andá a "Artículos"',
            texto: 'Es la primera sección del menú principal.',
          },
          {
            titulo: 'Tocá "+ Nuevo artículo"',
            texto: 'Completá el nombre y elegí una categoría existente, o creá una nueva con "+ Crear categoría nueva" si ninguna encaja.',
            mock: (
              <Mock>
                <MCampo label="Nombre del artículo" valor="Hamburguesa simple" />
                <MSelect label="Categoría" valor="Hamburguesas" />
                <div className="mt-2"><MBoton>Guardar artículo</MBoton></div>
              </Mock>
            ),
          },
          {
            titulo: 'Repetí para cada producto',
            texto: 'Podés reordenarlos y editarlos después con el lápiz de cada fila - el orden que definas acá es el mismo que después vas a ver en el Panel.',
          },
        ],
      },
      {
        id: 'que-productos-elegir',
        titulo: 'Qué productos conviene elegir',
        resumen: 'Priorizá lo comparable en el tiempo, evitá promociones y productos de vigencia corta.',
        pasos: [
          {
            titulo: 'Elegí productos "estables"',
            texto: 'La comparación de COTEJA vale más cuando el producto se mantiene igual mes a mes. Un combo de temporada, una promo por tiempo limitado o un plato "especial del día" no sirven como referencia: en un mes capaz ni existen.',
            mock: (
              <Mock>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 text-sm">✓</span>
                    <span className="text-xs text-gray-700">Hamburguesa clásica <span className="text-gray-400">- está siempre en la carta</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600 text-sm">✓</span>
                    <span className="text-xs text-gray-700">Papas fritas medianas <span className="text-gray-400">- producto de catálogo fijo</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-500 text-sm">✗</span>
                    <span className="text-xs text-gray-700">Combo del mes <span className="text-gray-400">- vence el 30/08</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-red-500 text-sm">✗</span>
                    <span className="text-xs text-gray-700">2x1 fin de semana <span className="text-gray-400">- es una promoción, no un precio real</span></span>
                  </div>
                </div>
              </Mock>
            ),
          },
          {
            titulo: 'Menos productos, bien elegidos',
            texto: 'Conviene empezar con los productos que más volumen de venta tienen para vos (tus "clásicos"), y sumar de a poco. Un Panel con 8 productos bien comparados es más útil que uno con 40 productos a medio vincular.',
          },
        ],
      },
    ],
  },

  // ============================================================
  {
    id: 'cargar-tu-carta',
    titulo: 'Cargar tu carta',
    articulos: [
      {
        id: 'cargar-tu-carta',
        titulo: 'Cargar tu carta y vincularla a tus artículos',
        resumen: 'Con tienda online se lee sola; sin tienda online, cargás el precio a mano.',
        pasos: [
          {
            titulo: 'Primero los artículos, después la carta',
            texto: 'Esto solo tiene sentido una vez que ya creaste tus artículos a cotejar (sección anterior) - "tu carta" son los precios reales de tu negocio, que vas a vincular a esos artículos.',
          },
          {
            titulo: 'Si tenés tienda online',
            texto: 'En "Tiendas" vas a ver una tarjeta especial "Mi tienda". Cargá el link de tu propia tienda igual que harías con un competidor (ver la sección "Competencia") y COTEJA va a leer tus precios solo.',
          },
          {
            titulo: 'Si no tenés tienda online',
            texto: 'No pasa nada: cargás el precio de cada artículo a mano. Ese precio queda como referencia fija hasta que vos lo actualices - no hay ninguna plataforma externa de la que leerlo automáticamente.',
            mock: (
              <Mock>
                <MCard>
                  <p className="text-xs font-medium text-gray-700">Hamburguesa simple</p>
                  <MCampo label="Tu precio" valor="$12.500" />
                  <div className="mt-1"><MBoton>Guardar precio</MBoton></div>
                </MCard>
              </Mock>
            ),
          },
        ],
      },
    ],
  },

  // ============================================================
  {
    id: 'competencia',
    titulo: 'Competencia',
    articulos: [
      {
        id: 'agregar-tienda',
        titulo: 'Cómo agregar una tienda de competencia',
        resumen: 'Desde "Tiendas", pegando el link de la carta online del competidor.',
        pasos: [
          {
            titulo: 'Andá a "Tiendas"',
            texto: 'Ahí vas a ver, además de "Mi tienda", una tarjeta por cada competidor que ya agregaste.',
          },
          {
            titulo: 'Tocá "+ Agregar tienda"',
            texto: 'Pegá el link de la carta online del competidor y ponele un nombre. Si la plataforma es una de las soportadas, COTEJA la reconoce sola por el link.',
            mock: (
              <Mock>
                <MCampo label="Nombre del competidor" valor="Burgueses" />
                <MCampo label="Link de su carta online" valor="https://cucina.link/burgueses" />
                <div className="mt-2"><MBoton>Agregar tienda</MBoton></div>
              </Mock>
            ),
          },
          {
            titulo: 'Si no tiene tienda online',
            texto: 'Dejá el link en blanco, creá la tienda igual y después subí una foto o PDF de su carta - ver el artículo "Cargar la carta de un competidor a mano".',
          },
        ],
      },
      {
        id: 'plataformas-soportadas',
        titulo: 'Qué plataformas se vinculan solas',
        resumen: 'La mayoría de los sistemas de pedidos online se leen automáticamente. Algunas van manual.',
        pasos: [
          {
            titulo: 'Se leen y actualizan solas',
            texto: 'Pedix, Cucina Link (incluida su versión de solo carta, sin pedido activo), másDelivery, FUDO, Cartanube, Bistrosoft, Maxirest, Tucán, Toteat y Grow Brands. Si el competidor usa alguna de estas, alcanza con pegar el link de su carta.',
            mock: (
              <Mock>
                <div className="flex flex-wrap gap-1.5">
                  {['Pedix', 'Cucina Link', 'másDelivery', 'FUDO', 'Cartanube', 'Bistrosoft', 'Maxirest', 'Tucán', 'Toteat', 'Grow Brands'].map((p) => (
                    <MBadge key={p} color="verde">{p}</MBadge>
                  ))}
                </div>
              </Mock>
            ),
          },
          {
            titulo: 'Van a carga manual',
            texto: 'Resto Online, PedidosYa, Uber Eats, o un sitio propio del competidor sin ninguna de las integraciones de arriba. En estos casos cargás la carta con foto/PDF (ver el próximo artículo) o precio por precio a mano.',
            mock: (
              <Mock>
                <div className="flex flex-wrap gap-1.5">
                  {['Resto Online', 'PedidosYa', 'Uber Eats', 'Sitio propio'].map((p) => (
                    <MBadge key={p} color="gris">{p}</MBadge>
                  ))}
                </div>
              </Mock>
            ),
          },
          {
            titulo: 'Si no estás seguro',
            texto: 'Cargá el link igual - COTEJA intenta reconocerlo solo, y si no lo logra te va a marcar la tienda para revisión manual sin perder lo ya cargado.',
          },
        ],
      },
      {
        id: 'carta-manual-ia',
        titulo: 'Cargar la carta de un competidor a mano',
        resumen: 'Subís una foto o PDF de la carta y una IA te devuelve los productos y precios detectados.',
        pasos: [
          {
            titulo: 'Entrá a la tienda del competidor',
            texto: 'Tocá la tarjeta del competidor en "Tiendas" para abrir su ficha.',
          },
          {
            titulo: 'Subí la foto o el PDF de su carta',
            texto: 'Podés subir varias fotos (por ejemplo, una por página del menú) o un PDF. Una IA lee el documento y te devuelve una lista de productos con nombre y precio detectado.',
            mock: (
              <Mock>
                <div className="border-2 border-dashed border-gray-300 rounded-lg py-4 text-center">
                  <p className="text-xs text-gray-400">Arrastrá una foto o PDF de la carta</p>
                </div>
                <div className="mt-2"><MBoton>Leer carta con IA</MBoton></div>
              </Mock>
            ),
          },
          {
            titulo: 'Revisá lo que se detectó',
            texto: 'La IA no siempre acierta el 100% (letra manuscrita o fotos de baja calidad pueden fallar) - revisá la lista antes de vincular cada producto con tu artículo correspondiente.',
          },
        ],
      },
      {
        id: 'vincular-articulos',
        titulo: 'Vincular tus artículos con los productos de la competencia',
        resumen: 'El paso que hace que la comparación funcione: decirle a COTEJA qué producto del competidor corresponde a cuál de tus artículos.',
        pasos: [
          {
            titulo: 'Entrá a la pestaña "Actualización" de la tienda',
            texto: 'Ahí vas a ver la lista de productos "Sin vincular" que COTEJA detectó (automático o por IA) en la carta del competidor.',
          },
          {
            titulo: 'Elegí a qué artículo corresponde',
            texto: 'Para cada producto sin vincular, elegí de la lista desplegable el artículo a cotejar que representa - por ejemplo, vincular "Burger Simple" con tu artículo "Hamburguesa simple".',
            mock: (
              <Mock>
                <div className="text-xs">
                  <p className="font-medium text-gray-900 mb-1">Burger Simple <span className="text-gray-400 font-normal">$13.500</span></p>
                  <Senalar>
                    <MSelect valor="→ Vincular con: Hamburguesa simple" />
                  </Senalar>
                </div>
              </Mock>
            ),
          },
          {
            titulo: '¿No aparece el producto que buscás?',
            texto: 'Con el link "¿No aparece? Cargalo a mano" podés agregar un producto puntual del competidor que la lectura automática no haya detectado.',
          },
        ],
      },
      {
        id: 'ver-vinculaciones',
        titulo: 'Ver y manejar tus vinculaciones',
        resumen: 'Repasá qué está vinculado a cada artículo, y editá o quitá un vínculo cuando haga falta.',
        pasos: [
          {
            titulo: 'Pestaña "Artículos vinculados"',
            texto: 'Dentro de la ficha de cada tienda (tuya o de un competidor), esta pestaña muestra únicamente los productos ya vinculados, con su último precio y cuándo se actualizó por última vez.',
            mock: (
              <Mock>
                <div className="flex gap-1 border-b border-gray-100 mb-2">
                  <span className="text-[11px] font-medium text-gray-400 px-2 py-1">Actualización</span>
                  <span className="text-[11px] font-medium text-coteja-azul-800 border-b-2 border-coteja-azul-800 px-2 py-1">Artículos vinculados (3)</span>
                  <span className="text-[11px] font-medium text-gray-400 px-2 py-1">Configuración</span>
                </div>
                <MTabla
                  columnas={['Artículo', 'Precio', 'Actualizado']}
                  filas={[
                    { celdas: ['Hamburguesa simple', '$13.500', 'hace 20 min'] },
                    { celdas: ['Papas medianas', '$7.000', 'hace 20 min'] },
                  ]}
                />
              </Mock>
            ),
          },
          {
            titulo: 'Desde la sección "Artículos" también podés ver los vínculos',
            texto: 'Cada artículo muestra una etiqueta con la cantidad de tiendas donde está vinculado (incluyendo la tuya). Tocando el artículo vas a poder revisar y desvincular tiendas puntuales sin tener que entrar una por una.',
            mock: (
              <Mock ancho="max-w-xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-900 font-medium">Hamburguesa simple</span>
                  <MBadge color="azul">4 vinculados</MBadge>
                </div>
              </Mock>
            ),
          },
        ],
      },
    ],
  },

  // ============================================================
  {
    id: 'el-panel',
    titulo: 'El Panel',
    articulos: [
      {
        id: 'leer-el-panel',
        titulo: 'Cómo leer el Panel',
        resumen: 'Tu precio contra el de cada competidor, el promedio y la diferencia porcentual.',
        pasos: [
          {
            titulo: 'Una fila por artículo',
            texto: 'Cada fila es uno de tus artículos a cotejar. Vas a ver tu precio, el precio de cada competidor vinculado, el promedio de la competencia, y cuánto te diferenciás de ese promedio.',
            mock: (
              <Mock ancho="max-w-lg">
                <MTabla
                  columnas={['Artículo', 'Tu precio', 'Burgueses', 'Promedio', 'Diferencia']}
                  filas={[
                    { destacada: true, celdas: ['Hamburguesa simple', '$12.500', '$13.500', '$13.554', '-7,8%'] },
                    { celdas: ['Papas medianas', '$9.600', '$11.800', '$10.460', '-8,2%'] },
                  ]}
                />
              </Mock>
            ),
          },
          {
            titulo: 'Los colores importan',
            texto: 'Verde/rojo en la diferencia te dicen de un vistazo si estás más barato o más caro que el promedio de la competencia para ese producto puntual.',
          },
          {
            titulo: 'Guiones en vez de precio',
            texto: 'Un guión (-) en la celda de un competidor significa que ese competidor no tiene ese artículo vinculado o cargado, no que sea gratis.',
          },
        ],
      },
      {
        id: 'filtros',
        titulo: 'Filtros y filtros guardados',
        resumen: 'Acotá la vista por categoría, competencia o producto, y guardá las combinaciones que más usás.',
        pasos: [
          {
            titulo: 'Abrí el panel de filtros',
            texto: 'Podés filtrar por categoría, por competidores puntuales, o buscar un producto por nombre.',
            mock: (
              <Mock>
                <div className="flex flex-wrap gap-1.5">
                  <MBadge color="azul">Hamburguesas ✕</MBadge>
                  <MBadge color="azul">Burgueses ✕</MBadge>
                </div>
              </Mock>
            ),
          },
          {
            titulo: 'Guardá una combinación',
            texto: 'Si volvés seguido a la misma combinación de filtros, guardala con un nombre - la vas a poder aplicar de nuevo en un toque, sin tener que rearmarla cada vez.',
          },
        ],
      },
      {
        id: 'evolucion',
        titulo: 'Evolución de precios en el tiempo',
        resumen: 'Un gráfico por producto para ver cómo se movió tu precio y el de la competencia.',
        pasos: [
          {
            titulo: 'Elegí un producto',
            texto: 'Desde la vista "Por artículo" del Panel, tocá un producto para ver su gráfico de evolución - tu línea contra la de cada competidor, en el rango de fechas que elijas (15 días, 1 mes o 1 año).',
            mock: (
              <Mock>
                <Sparkline />
                <div className="flex gap-3 text-[10px] text-gray-500 mt-1">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-coteja-verde-700 inline-block" /> Tu precio</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400 inline-block" /> Competencia</span>
                </div>
              </Mock>
            ),
          },
        ],
      },
      {
        id: 'actualizar-manual',
        titulo: 'Actualizar precios manualmente',
        resumen: 'Un botón para forzar un chequeo fuera del ciclo automático, con un margen de espera entre usos.',
        pasos: [
          {
            titulo: 'Botón "Actualizar precios"',
            texto: 'Está arriba del Panel. Fuerza a COTEJA a revisar los precios de esa marca ya mismo, en vez de esperar al próximo ciclo automático.',
            mock: (
              <Mock ancho="max-w-xs">
                <MBoton variante="secundario">↻ Actualizar precios</MBoton>
              </Mock>
            ),
          },
          {
            titulo: 'Tiene un margen de espera',
            texto: 'Para no sobrecargar las tiendas que se leen, hay unos minutos de espera entre un uso y el siguiente - si lo tocás durante ese margen, te avisa cuánto falta en vez de repetir el pedido.',
          },
        ],
      },
    ],
  },

  // ============================================================
  {
    id: 'alertas',
    titulo: 'Alertas',
    articulos: [
      {
        id: 'crear-alerta',
        titulo: 'Cómo crear una alerta y sus condiciones',
        resumen: 'Elegí cuándo querés que te avisen: cualquier cambio, una variación mínima, o solo promociones.',
        pasos: [
          {
            titulo: 'Andá a "Alertas" y tocá "+ Nueva alerta"',
            texto: 'Elegí el tipo "Cambios de precios de competidores" para que te avise cuando algo se mueva.',
          },
          {
            titulo: 'Elegí la condición',
            texto: 'Cualquier cambio, o solo si el precio varía más de un porcentaje que definís, o solo cuando se aplica una promoción.',
            mock: (
              <Mock>
                <div className="space-y-1.5">
                  <MRadio label="Cambie el precio" marcado />
                  <MRadio label="El precio varíe más de un porcentaje" />
                  <MRadio label="Se aplique una promoción" />
                </div>
              </Mock>
            ),
          },
          {
            titulo: 'Elegí qué competidores y qué productos monitorear',
            texto: 'Podés elegir todos los competidores o solo algunos puntuales, y todos tus productos o solo una selección.',
          },
        ],
      },
      {
        id: 'automatica-vs-programada',
        titulo: 'Automática vs. programada',
        resumen: 'Un aviso apenas se detecta un cambio, o un resumen periódico.',
        pasos: [
          {
            titulo: 'Las dos modalidades',
            texto: '',
            mock: (
              <Mock ancho="max-w-lg">
                <div className="grid grid-cols-2 gap-2">
                  <MCard>
                    <p className="text-xs font-semibold text-gray-900">Automática</p>
                    <p className="text-[11px] text-gray-500 mt-1">Te avisa apenas detecta un cambio (agrupando avisos de una misma hora en un solo mail).</p>
                  </MCard>
                  <MCard>
                    <p className="text-xs font-semibold text-gray-900">Programada</p>
                    <p className="text-[11px] text-gray-500 mt-1">Un resumen periódico (diario, semanal o mensual) con todo lo que pasó, aunque no haya cambios.</p>
                  </MCard>
                </div>
              </Mock>
            ),
          },
          {
            titulo: 'Reporte de posicionamiento',
            texto: 'Si elegís el tipo de alerta "Reporte general de posicionamiento" en vez de "Cambios de precios", vas a recibir un resumen de cómo estás parado contra la competencia en general, no solo los cambios puntuales.',
          },
        ],
      },
      {
        id: 'notificaciones',
        titulo: 'Activar notificaciones por mail y push',
        resumen: 'El mail llega siempre; el push es opcional y hay que habilitarlo en el navegador.',
        pasos: [
          {
            titulo: 'El mail ya está activo',
            texto: 'Todas las alertas llegan por mail a la dirección que configuraste en "Mi cuenta" - no hace falta activar nada aparte.',
          },
          {
            titulo: 'Push: un aviso en el celular o la computadora',
            texto: 'Es opcional y adicional al mail. Al tildar "Enviar notificación push" en una alerta automática, el navegador te va a pedir permiso - aceptalo para que te lleguen los avisos aunque no tengas COTEJA abierto.',
            mock: (
              <Mock>
                <div className="flex items-start gap-2">
                  <span className="text-base leading-none">🔔</span>
                  <p className="text-[11px] text-coteja-azul-900">Activá las notificaciones y permití recibir alertas push en tu celular o computadora.</p>
                </div>
                <div className="mt-2"><MBoton>Activar notificaciones</MBoton></div>
              </Mock>
            ),
          },
          {
            titulo: 'Si ya las bloqueaste sin querer',
            texto: 'Los navegadores no dejan volver a pedir el permiso una vez que lo rechazaste - hay que habilitarlo a mano desde la configuración del sitio en el navegador (el ícono de candado al lado de la dirección).',
          },
        ],
      },
    ],
  },

  // ============================================================
  {
    id: 'seguimiento',
    titulo: 'Seguimiento',
    articulos: [
      {
        id: 'actividad',
        titulo: 'Actividad y exportar a CSV',
        resumen: 'Un historial cronológico de todos los cambios de precio, propios y de competencia.',
        pasos: [
          {
            titulo: 'Un feed agrupado por fecha y tienda',
            texto: 'A diferencia del Panel (que muestra el estado actual), Actividad es un historial: cada cambio de precio que pasó, ordenado por fecha.',
            mock: (
              <Mock>
                <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">16 de agosto</p>
                <div className="text-xs mb-2">
                  <p className="font-medium text-gray-700">Burgueses</p>
                  <p className="text-gray-500">Hamburguesa simple: $13.000 → $13.500 <span className="text-red-500">(+3,8%)</span></p>
                </div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase mb-1">15 de agosto</p>
                <div className="text-xs">
                  <p className="font-medium text-gray-700">Mi tienda</p>
                  <p className="text-gray-500">Papas medianas: $9.200 → $9.600 <span className="text-red-500">(+4,3%)</span></p>
                </div>
              </Mock>
            ),
          },
          {
            titulo: 'Filtrá por fecha, categoría, competencia o producto',
            texto: 'Los mismos filtros que el Panel, más un rango de fechas (hoy, 7 días, 15 días, 1 mes o un rango personalizado de hasta 31 días).',
          },
          {
            titulo: 'Exportar reporte',
            texto: 'El botón "Exportar reporte" descarga un CSV con los cambios filtrados - útil para armar tus propios análisis o compartirlo con tu equipo.',
            mock: (
              <Mock ancho="max-w-xs">
                <MBoton variante="secundario">⬇ Exportar reporte</MBoton>
              </Mock>
            ),
          },
        ],
      },
    ],
  },

  // ============================================================
  {
    id: 'extra',
    titulo: 'Extra',
    articulos: [
      {
        id: 'instalar-app',
        titulo: 'Instalar COTEJA como app',
        resumen: 'En el celular o la computadora, sin pasar por ninguna tienda de aplicaciones.',
        pasos: [
          {
            titulo: 'El ícono de instalación',
            texto: 'En el header vas a ver un ícono de nube con flecha. En Android y en la computadora (Chrome/Edge), tocarlo abre directamente el instalador nativo del navegador.',
            mock: (
              <Mock ancho="max-w-xs">
                <div className="flex justify-end">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#17304e" strokeWidth="1.5"><path d="M10 3v9m0 0l-3-3m3 3l3-3M4 15h12" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
              </Mock>
            ),
          },
          {
            titulo: 'En iPhone es un poco distinto',
            texto: 'Safari no permite instalar apps automáticamente. Tocando el mismo ícono te va a mostrar el paso a paso: ícono de Compartir → "Agregar a pantalla de inicio" → "Agregar".',
          },
          {
            titulo: 'Para qué sirve',
            texto: 'Una vez instalada, COTEJA abre como una app normal (ícono propio, sin la barra del navegador) y es la única forma de recibir notificaciones push en iPhone.',
          },
        ],
      },
    ],
  },
];

// tipoCuenta filtra los articulos marcados soloMultimarca cuando el que
// pregunta no es Multimarca (ej: "Como crear una marca") - sin tipoCuenta
// (uso interno, sin usuario todavia) no filtra nada.
export function todosLosArticulos(tipoCuenta) {
  return SECCIONES.flatMap((s) => s.articulos.map((a) => ({ ...a, seccionId: s.id, seccionTitulo: s.titulo })))
    .filter((a) => !a.soloMultimarca || tipoCuenta === 'MULTIMARCA');
}
