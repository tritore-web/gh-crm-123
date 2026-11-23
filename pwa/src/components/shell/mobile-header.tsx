import { formatClock } from '@/lib/dates';

/** Cabecera fina de 56 px: título y hora de la última actualización (hora de Madrid). */
export function MobileHeader({ title, showUpdated = true }: { title: string; showUpdated?: boolean }) {
  return (
    <header className="sticky top-0 z-10 flex h-14 flex-none items-center gap-2 border-b border-line bg-surface px-4">
      <h1 className="m-0 text-[20px] leading-7 font-semibold text-brown">{title}</h1>
      {showUpdated ? (
        <span className="ml-auto text-right text-xs leading-4 text-ink-2">Actualizado {formatClock(new Date())}</span>
      ) : null}
    </header>
  );
}
