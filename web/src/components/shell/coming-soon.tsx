import { BookOpen } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

/** Sección aún no construida (BUILD_PLAN Hito 2). */
export function ComingSoon() {
  return (
    <div className="rounded-md border border-line bg-surface">
      <EmptyState icon={BookOpen} title="Esta sección se habilitará en el siguiente hito." />
    </div>
  );
}
