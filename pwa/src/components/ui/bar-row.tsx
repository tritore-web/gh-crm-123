/** Fila con etiqueta, valor y una barra simple (SVG: sin estilos en línea, compatible con la CSP). */
export function BarRow({ label, value, right, max, danger = false }: { label: string; value: number; right: string; max: number; danger?: boolean }) {
  const width = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span>{label}</span>
        <span className="ml-auto">{right}</span>
      </div>
      <svg className="h-3 w-full" aria-hidden="true" focusable="false">
        <rect width="100%" height="12" rx="6" fill="#efe7da" />
        {width > 0 ? <rect width={`${width}%`} height="12" rx="6" fill={danger ? '#b3402a' : '#8a7967'} /> : null}
      </svg>
    </div>
  );
}
