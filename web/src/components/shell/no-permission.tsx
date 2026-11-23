import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';

/** Estado "Sin permiso" (DESIGN_BRIEF §4). */
export function NoPermission() {
  return (
    <div className="rounded-md border border-line bg-surface">
      <EmptyState icon={Lock} title="No tienes permiso para ver esto.">
        <Button asChild variant="secondary">
          <Link href="/">Volver</Link>
        </Button>
      </EmptyState>
    </div>
  );
}
