// Esqueleto con la forma del Panel (nunca una pantalla en blanco).
export default function Loading() {
  return (
    <div aria-busy="true" className="flex flex-1 flex-col">
      <p className="sr-only" role="status">
        Cargando…
      </p>
      <div className="flex h-14 items-center border-b border-line bg-surface px-4">
        <div className="sk h-6 w-24" />
      </div>
      <div className="flex flex-col gap-3 p-4">
        <div className="grid grid-cols-2 gap-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex flex-col gap-2 rounded-md border border-line bg-surface p-3.5">
              <div className="sk w-20" />
              <div className="sk h-7 w-14" />
            </div>
          ))}
        </div>
        {[0, 1, 2].map((i) => (
          <div key={i} className="sk h-16" />
        ))}
      </div>
    </div>
  );
}
