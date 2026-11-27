'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Menu, menuItemClass } from '@/components/ui/menu';
import { titleFor } from './nav-items';
import { QuickSearch } from './quick-search';

/** Barra superior de 56 px: título, búsqueda rápida y «+ Nuevo» (Cliente, Oportunidad). */
export function Topbar() {
  const pathname = usePathname();
  return (
    <header className="flex h-14 flex-none items-center gap-4 border-b border-line bg-surface px-6">
      <h1 className="m-0 mr-auto text-[20px] leading-7 font-semibold text-brown">{titleFor(pathname)}</h1>
      <QuickSearch />
      <Menu label="Nuevo" variant="primary" icon={<Plus className="i" size={16} aria-hidden="true" />}>
        {(close) => (
          <>
            <li role="none">
              <Link role="menuitem" className={menuItemClass} href="/clientes/nuevo" onClick={close}>
                Cliente
              </Link>
            </li>
            <li role="none">
              <Link role="menuitem" className={menuItemClass} href="/oportunidades/nueva" onClick={close}>
                Oportunidad
              </Link>
            </li>
          </>
        )}
      </Menu>
    </header>
  );
}
