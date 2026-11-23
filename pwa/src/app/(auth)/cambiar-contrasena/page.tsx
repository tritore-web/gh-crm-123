import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/current-profile';
import { AuthCard } from '../auth-card';
import { PasswordForm } from './password-form';

export const metadata: Metadata = { title: 'Cambiar contraseña · CRM-123' };

export default async function CambiarContrasenaPage() {
  const profile = await getCurrentProfile();
  if (!profile || !profile.isActive) redirect('/ingresar');
  if (!profile.mustChangePassword) redirect('/');
  return (
    <AuthCard>
      <PasswordForm />
    </AuthCard>
  );
}
