import type { ReactNode } from 'react';
import { Logo } from '@/components/brand/logo';

/** Marco común de Ingreso y Cambiar contraseña: logo y tarjeta de 380 px centrados. */
export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-10">
      <Logo size={32} className="text-2xl" />
      <div className="flex w-full max-w-[420px] flex-col gap-4 sm:rounded-md sm:border sm:border-line sm:bg-surface sm:p-8">
        {children}
      </div>
    </main>
  );
}
