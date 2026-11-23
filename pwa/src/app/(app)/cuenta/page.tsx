import type { Metadata } from 'next';
import { LogOut } from 'lucide-react';
import { signOut } from '@/app/(auth)/actions';
import { Button } from '@/components/ui/button';
import { MobileHeader } from '@/components/shell/mobile-header';
import { requireProfile } from '@/lib/current-profile';
import { ROLE_LABEL } from '@/lib/profile';

export const metadata: Metadata = { title: 'Cuenta · CRM-123' };

// Cuenta mínima del Hito 2: quién eres y Cerrar sesión (disponible en todas las pantallas, TECHNICAL_SPEC §6.1.6).
// Cambiar contraseña e instrucciones de instalación llegan con la pantalla completa en el Hito 4.
export default async function CuentaPage() {
  const profile = await requireProfile();
  return (
    <>
      <MobileHeader title="Cuenta" showUpdated={false} />
      <main className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex flex-col gap-1.5 rounded-md border border-line bg-surface p-3.5">
          <div className="font-semibold text-brown">{profile.fullName}</div>
          <div>
            <span className="inline-flex h-[22px] items-center rounded-sm bg-neutral-tint px-2 text-xs font-medium">
              {ROLE_LABEL[profile.role]}
            </span>
          </div>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="secondary" block className="text-danger">
            <LogOut className="i" size={16} aria-hidden="true" />
            Cerrar sesión
          </Button>
        </form>
      </main>
    </>
  );
}
