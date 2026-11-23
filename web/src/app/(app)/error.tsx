'use client';

import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

// Estado de error común: mensaje claro y Reintentar. Nunca se muestra el detalle técnico.
export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="rounded-md border border-line bg-surface">
      <EmptyState icon={AlertTriangle} title="Algo salió mal. Inténtalo de nuevo.">
        <Button type="button" variant="secondary" onClick={() => reset()}>
          Reintentar
        </Button>
      </EmptyState>
    </div>
  );
}
