'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CircleDot, LayoutDashboard, Mail, User, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

// Navegación inferior de 4 destinos (DESIGN_BRIEF §6.1). Objetivo táctil mínimo de 44 px.
const ITEMS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/', label: 'Panel', icon: LayoutDashboard },
  { href: '/oportunidades', label: 'Oportunidades', icon: CircleDot },
  { href: '/resumen', label: 'Resumen', icon: Mail },
  { href: '/cuenta', label: 'Cuenta', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Principal" className="sticky bottom-0 z-10 grid h-16 grid-cols-4 border-t border-line bg-surface">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex min-h-11 flex-col items-center justify-center gap-0.5 text-xs leading-4 text-ink-2',
              active && 'font-semibold text-primary',
            )}
          >
            <Icon className="i" size={24} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
