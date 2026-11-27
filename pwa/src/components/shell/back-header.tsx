import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

/** Cabecera de una pantalla de detalle: flecha de volver (objetivo táctil de 44 px) y título. */
export function BackHeader({ title, href, label }: { title: string; href: string; label: string }) {
  return (
    <header className="sticky top-0 z-10 flex h-14 flex-none items-center gap-1 border-b border-line bg-surface pr-4 pl-1">
      <Link href={href} aria-label={label} className="flex size-11 items-center justify-center rounded-sm text-brown">
        <ArrowLeft className="i" size={22} aria-hidden="true" />
      </Link>
      <h1 className="m-0 truncate text-[20px] leading-7 font-semibold text-brown">{title}</h1>
    </header>
  );
}
