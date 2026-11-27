import type { Metadata } from 'next';
import { PasswordForm } from '@/app/(auth)/cambiar-contrasena/password-form';
import { BackHeader } from '@/components/shell/back-header';
import { requireProfile } from '@/lib/current-profile';

export const metadata: Metadata = { title: 'Cambiar contraseña · CRM-123' };

export default async function CambiarContrasenaVoluntariaPage() {
  await requireProfile();
  return (
    <>
      <BackHeader title="Cambiar contraseña" href="/cuenta" label="Volver a Cuenta" />
      <main className="flex flex-1 flex-col gap-4 p-4">
        <PasswordForm mode="voluntary" />
      </main>
    </>
  );
}
