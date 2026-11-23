import type { Metadata } from 'next';
import { Coffee } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { ComingSoon } from '@/components/shell/coming-soon';
import { MobileHeader } from '@/components/shell/mobile-header';
import { requireProfile } from '@/lib/current-profile';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Panel · CRM-123' };

export default async function PanelPage() {
  await requireProfile();
  const supabase = await createClient();

  // Lectura real de la vista del equipo (solo vendedores activos). El detalle se construye en el Hito 4.
  const { data, error } = await supabase
    .from('v_team_summary')
    .select('open_count, won_month_count, lost_month_count, overdue_actions_count');
  if (error) {
    console.error('[panel] error de lectura', { code: error.code });
    throw new Error('No se pudo cargar el panel');
  }

  const rows = data ?? [];
  const hasActivity = rows.some(
    (row) => (row.open_count ?? 0) + (row.won_month_count ?? 0) + (row.lost_month_count ?? 0) + (row.overdue_actions_count ?? 0) > 0,
  );

  return (
    <>
      <MobileHeader title="Panel" />
      <main className="flex flex-1 flex-col gap-3 p-4">
        {hasActivity ? (
          <ComingSoon />
        ) : (
          <EmptyState icon={Coffee} title="Aún no hay actividad este mes." />
        )}
      </main>
    </>
  );
}
