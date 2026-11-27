import { Archive, ArrowLeftRight, CircleDot, Home, ListChecks, Users, UserCog, type LucideIcon } from 'lucide-react';

export type NavItem = { href: string; label: string; icon: LucideIcon };

// Textos de navegación en un solo lugar (DESIGN_BRIEF §5.1).
export const MAIN_NAV: NavItem[] = [
  { href: '/', label: 'Tablero', icon: Home },
  { href: '/clientes', label: 'Clientes', icon: Users },
  { href: '/oportunidades', label: 'Oportunidades', icon: CircleDot },
  { href: '/archivados', label: 'Archivados', icon: Archive },
];

export const ADMIN_NAV: NavItem[] = [
  { href: '/admin/usuarios', label: 'Usuarios', icon: UserCog },
  { href: '/admin/reasignar', label: 'Reasignar', icon: ArrowLeftRight },
  { href: '/admin/auditoria', label: 'Auditoría', icon: ListChecks },
];

/** Título de la barra superior según la ruta (DESIGN_BRIEF §5.2). */
const EXACT_TITLES: Record<string, string> = {
  '/': 'Tablero',
  '/clientes': 'Clientes',
  '/clientes/nuevo': 'Nuevo cliente',
  '/oportunidades': 'Oportunidades',
  '/oportunidades/nueva': 'Nueva oportunidad',
  '/archivados': 'Archivados',
  '/admin/usuarios': 'Usuarios',
  '/admin/reasignar': 'Reasignar',
  '/admin/auditoria': 'Auditoría',
};

export function titleFor(pathname: string): string {
  const exact = EXACT_TITLES[pathname];
  if (exact) return exact;
  if (/^\/clientes\/[^/]+\/editar$/.test(pathname)) return 'Editar cliente';
  if (/^\/clientes\/[^/]+$/.test(pathname)) return 'Cliente';
  if (/^\/oportunidades\/[^/]+\/editar$/.test(pathname)) return 'Editar oportunidad';
  if (/^\/oportunidades\/[^/]+$/.test(pathname)) return 'Oportunidad';
  return '';
}
