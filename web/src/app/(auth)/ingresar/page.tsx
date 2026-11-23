import type { Metadata } from 'next';
import { AuthCard } from '../auth-card';
import { LoginForm } from './login-form';
import { LOGIN_MESSAGES } from '../login-messages';
import { safeNextPath } from '@/lib/redirect';

export const metadata: Metadata = { title: 'Ingresar · CRM-123' };

const NOTICES: Record<string, { text: string; locked?: boolean }> = {
  caducada: { text: 'Tu sesión terminó. Ingresa de nuevo para volver a donde ibas.' },
  desactivado: { text: LOGIN_MESSAGES.disabled, locked: true },
  'sin-acceso': { text: LOGIN_MESSAGES.noAccess, locked: true },
};

export default async function IngresarPage({
  searchParams,
}: {
  searchParams: Promise<{ motivo?: string; siguiente?: string }>;
}) {
  const { motivo, siguiente } = await searchParams;
  const notice = motivo ? NOTICES[motivo] : undefined;
  return (
    <AuthCard>
      <LoginForm notice={notice} next={safeNextPath(siguiente)} />
    </AuthCard>
  );
}
