'use client';

import { usePathname } from 'next/navigation';
import { ChevronDown, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PAGE_TITLES } from './nav-items';

const PENDING = 'Se habilitará en el siguiente hito';

/** Barra superior de 56 px. La búsqueda rápida y "+ Nuevo" se activan en el Hito 3. */
export function Topbar() {
  const pathname = usePathname();
  return (
    <header className="flex h-14 flex-none items-center gap-4 border-b border-line bg-surface px-6">
      <h1 className="m-0 mr-auto text-[20px] leading-7 font-semibold text-brown">{PAGE_TITLES[pathname] ?? ''}</h1>
      <div className="relative w-80" title={PENDING}>
        <Search className="i pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-ink-2" size={16} aria-hidden="true" />
        <input
          type="search"
          disabled
          aria-label="Buscar cliente por nombre o teléfono"
          placeholder="Buscar cliente por nombre o teléfono"
          className="h-8 w-full rounded-sm border border-line-strong bg-neutral-tint pr-8 pl-8 text-[14px] text-ink-2 placeholder:text-ink-2"
        />
        <span className="absolute top-1/2 right-2 -translate-y-1/2 rounded-[4px] border border-line px-[5px] text-[11px] text-ink-2">/</span>
      </div>
      <Button type="button" disabled title={PENDING}>
        <Plus className="i" size={16} aria-hidden="true" />
        Nuevo
        <ChevronDown className="i" size={16} aria-hidden="true" />
      </Button>
    </header>
  );
}
