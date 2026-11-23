import type { Metadata } from 'next';
import { WifiOff } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

export const metadata: Metadata = { title: 'Sin conexión · CRM-123' };

// Pantalla pública y sin datos: el service worker la muestra cuando una navegación falla por falta de internet.
// "Reintentar" es un enlace normal (no necesita JavaScript, que sin conexión no podría cargar).
export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col justify-center p-4">
      <EmptyState icon={WifiOff} title="Sin conexión. Vuelve a intentarlo cuando tengas internet.">
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- recarga completa a propósito: sin conexión no hay JavaScript */}
        <a
          href="/"
          className="inline-flex h-12 items-center justify-center rounded-sm bg-primary px-[18px] text-[16px] leading-none font-medium text-white hover:bg-primary-hover"
        >
          Reintentar
        </a>
      </EmptyState>
    </main>
  );
}
