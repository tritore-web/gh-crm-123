// Esqueleto con la forma del Tablero (nunca una pantalla en blanco).
export default function Loading() {
  return (
    <div aria-busy="true">
      <p className="sr-only" role="status">
        Cargando…
      </p>
      <div className="grid grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className="flex flex-col gap-2 rounded-md border border-line bg-surface p-4">
            <div className="sk w-24" />
            <div className="sk h-7 w-16" />
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-col gap-3 rounded-md border border-line bg-surface p-4">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="sk" />
        ))}
      </div>
    </div>
  );
}
