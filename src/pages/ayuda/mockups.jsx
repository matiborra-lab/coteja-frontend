// Piezas visuales reutilizables para el Centro de Ayuda. No son capturas de
// pantalla reales (no hay forma de exportar una imagen real del navegador
// de desarrollo) - son recreaciones fieles hechas con los mismos tokens de
// color y las mismas clases de Tailwind que usa la app real, así que se ven
// igual a la interfaz de verdad. Todo el contenido de ejemplo (nombres de
// competidores, precios) es ficticio.

// Marco tipo "ventana" que envuelve cada ilustración - lo unico que las
// distingue de la app real es este marco con puntito de color, para que
// quede claro que es una ilustracion del paso, no una captura clickeable.
export function Mock({ children, ancho = 'max-w-md' }) {
  return (
    <div className={'w-full ' + ancho + ' mx-auto rounded-xl border border-gray-200 shadow-sm overflow-hidden bg-white'}>
      <div className="flex items-center gap-1.5 bg-gray-50 border-b border-gray-100 px-3 py-2">
        <span className="w-2.5 h-2.5 rounded-full bg-red-300" />
        <span className="w-2.5 h-2.5 rounded-full bg-amber-300" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-300" />
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// Anillo punteado para señalar "tocá acá" sobre cualquier elemento.
export function Senalar({ children }) {
  return (
    <span className="relative inline-block">
      <span className="absolute -inset-1.5 rounded-lg border-2 border-dashed border-coteja-verde-500 pointer-events-none" />
      {children}
    </span>
  );
}

export function MBoton({ children, variante = 'primario' }) {
  const clases =
    variante === 'primario'
      ? 'bg-coteja-verde-700 text-white'
      : variante === 'peligro'
      ? 'bg-white text-red-600 border border-red-200'
      : 'bg-white text-coteja-azul-700 border border-gray-300';
  return <span className={'inline-block text-xs font-medium rounded-lg px-3 py-1.5 ' + clases}>{children}</span>;
}

export function MCampo({ label, valor, placeholder }) {
  return (
    <div className="mb-2 last:mb-0">
      {label && <p className="text-[11px] font-medium text-gray-600 mb-1">{label}</p>}
      <div className={'rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs ' + (valor ? 'text-gray-900' : 'text-gray-400')}>
        {valor || placeholder}
      </div>
    </div>
  );
}

export function MSelect({ label, valor }) {
  return (
    <div className="mb-2 last:mb-0">
      {label && <p className="text-[11px] font-medium text-gray-600 mb-1">{label}</p>}
      <div className="flex items-center justify-between rounded-lg border border-gray-300 px-2.5 py-1.5 text-xs text-gray-900">
        <span>{valor}</span>
        <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor" className="text-gray-400"><path d="M5.23 7.21a.75.75 0 011.06.02L10 11.29l3.71-4.06a.75.75 0 111.08 1.04l-4.24 4.65a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" /></svg>
      </div>
    </div>
  );
}

export function MCheckbox({ label, marcado }) {
  return (
    <label className="flex items-center gap-2 text-xs text-gray-700">
      <span className={'w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ' + (marcado ? 'bg-coteja-verde-700 border-coteja-verde-700' : 'border-gray-300')}>
        {marcado && <svg width="9" height="9" viewBox="0 0 20 20" fill="white"><path d="M16.7 5.3a1 1 0 010 1.4l-7.4 7.4a1 1 0 01-1.4 0L4.3 10.5a1 1 0 111.4-1.4l3 3 6.7-6.7a1 1 0 011.3-.1z" /></svg>}
      </span>
      {label}
    </label>
  );
}

export function MRadio({ label, marcado }) {
  return (
    <label className="flex items-center gap-2 text-xs text-gray-700">
      <span className={'w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ' + (marcado ? 'border-coteja-verde-700' : 'border-gray-300')}>
        {marcado && <span className="w-1.5 h-1.5 rounded-full bg-coteja-verde-700" />}
      </span>
      {label}
    </label>
  );
}

export function MBadge({ children, color = 'gris' }) {
  const clases = {
    gris: 'bg-gray-100 text-gray-600',
    verde: 'bg-green-100 text-green-700',
    azul: 'bg-coteja-azul-100 text-coteja-azul-800',
    ambar: 'bg-amber-100 text-amber-700',
    rojo: 'bg-red-100 text-red-700',
    morado: 'bg-purple-100 text-purple-700',
  }[color];
  return <span className={'text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full ' + clases}>{children}</span>;
}

export function MTabla({ columnas, filas }) {
  return (
    <table className="w-full text-[11px]">
      <thead>
        <tr className="text-gray-400 uppercase text-[9px] border-b border-gray-100">
          {columnas.map((c) => <th key={c} className="text-left font-medium py-1 pr-2">{c}</th>)}
        </tr>
      </thead>
      <tbody>
        {filas.map((f, i) => (
          <tr key={i} className={'border-b border-gray-50 last:border-0 ' + (f.destacada ? 'bg-coteja-verde-50' : '')}>
            {f.celdas.map((c, j) => <td key={j} className="py-1.5 pr-2 text-gray-700">{c}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function MAvatar({ letra, color = 'azul' }) {
  const clases = { azul: 'bg-coteja-azul-800', verde: 'bg-coteja-verde-700' }[color];
  return <span className={'w-7 h-7 rounded-full text-white flex items-center justify-center text-[11px] font-semibold shrink-0 ' + clases}>{letra}</span>;
}

// Fila de menu tipo el desplegable de "Cuenta" del header.
export function MMenuItem({ children, destacado }) {
  return <div className={'px-3 py-2 text-xs rounded ' + (destacado ? 'text-coteja-azul-700 font-medium bg-coteja-azul-50' : 'text-gray-700')}>{children}</div>;
}

export function MCard({ children }) {
  return <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">{children}</div>;
}

export function MToggle({ activo }) {
  return (
    <span className={'inline-flex w-8 h-4.5 rounded-full p-0.5 transition ' + (activo ? 'bg-coteja-verde-700' : 'bg-gray-300')} style={{ height: 18 }}>
      <span className={'w-3.5 h-3.5 rounded-full bg-white transition ' + (activo ? 'translate-x-3.5' : '')} />
    </span>
  );
}
