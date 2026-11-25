/** Esqueleto de una lista: la forma de una tabla, nunca una pantalla en blanco. */
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Cargando…
      </p>
      <div className="mb-3 flex gap-3">
        <div className="sk h-8 flex-1" />
        <div className="sk h-8 w-44" />
      </div>
      <div className="panel flex flex-col gap-3 p-4">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="sk" />
        ))}
      </div>
    </div>
  );
}
