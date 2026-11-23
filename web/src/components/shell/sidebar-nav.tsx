'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ADMIN_NAV, MAIN_NAV, type NavItem } from './nav-items';

function isActive(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex h-9 items-center gap-2.5 rounded-sm px-2.5 font-medium text-sb-text hover:bg-sb-active/60',
        active && 'bg-sb-active font-semibold text-white',
      )}
    >
      <Icon className="i" size={18} aria-hidden="true" />
      {item.label}
    </Link>
  );
}

export function SidebarNav({ showAdmin }: { showAdmin: boolean }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Principal" className="flex flex-col gap-0.5">
      {MAIN_NAV.map((item) => (
        <NavLink key={item.href} item={item} pathname={pathname} />
      ))}
      {showAdmin ? (
        <>
          <div className="mx-2.5 mt-5 mb-1.5 text-[11px] leading-4 font-semibold tracking-[0.06em] text-sb-text-2 uppercase">
            Administración
          </div>
          {ADMIN_NAV.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </>
      ) : null}
    </nav>
  );
}
