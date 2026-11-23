import { LogOut } from 'lucide-react';
import { signOut } from '@/app/(auth)/actions';
import { Logo } from '@/components/brand/logo';
import { ROLE_LABEL, type CurrentProfile } from '@/lib/profile';
import { SidebarNav } from './sidebar-nav';

/** Barra lateral de 232 px. El bloque Administración solo se dibuja para el supervisor. */
export function Sidebar({ profile }: { profile: CurrentProfile }) {
  return (
    <aside className="sticky top-0 flex h-screen w-[232px] flex-none flex-col bg-brown px-3 py-4 text-sb-text">
      <Logo className="px-2.5 pb-4 text-white" />
      <SidebarNav showAdmin={profile.role === 'supervisor'} />
      <div className="mt-auto flex flex-col gap-1.5 border-t border-sb-active px-2.5 pt-3 text-[13px]">
        <div>
          <div className="font-semibold">{profile.fullName}</div>
          <div className="text-xs text-sb-text-2">{ROLE_LABEL[profile.role]}</div>
        </div>
        <form action={signOut}>
          <button type="submit" className="flex items-center gap-2 text-sb-text hover:text-white">
            <LogOut className="i" size={16} aria-hidden="true" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
