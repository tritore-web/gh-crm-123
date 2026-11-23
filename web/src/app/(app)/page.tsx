import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, BookOpen, Coffee, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Stat } from '@/components/ui/stat';
import { ComingSoon } from '@/components/shell/coming-soon';
import { requireProfile } from '@/lib/current-profile';
import { createClient } from '@/lib/supabase/server';
import { formatDate, weekdayName } from '@/lib/dates';
import { formatEuros } from '@/lib/money';

export const metadata: Metadata = { title: 'Tablero · CRM-123' };

const OPEN_STAGES = ['nueva', 'contactada', 'propuesta_enviada', 'negociacion'];

export default async function TableroPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  // "Hoy" lo fija la base según la zona de settings (Europe/Madrid), nunca el navegador.
  const todayResult = await supabase.rpc('app_today');
  const today = todayResult.data;

  const [dueResult, lateResult, pipelineResult] = await Promise.all([
    supabase.from('v_next_actions').select('opportunity_id', { count: 'exact', head: true }).eq('next_action_date', today ?? ''),
    supabase.from('v_next_actions').select('opportunity_id', { count: 'exact', head: true }).eq('is_overdue', true),
    supabase.from('v_pipeline_summary').select('stage, opportunities_count, estimated_total').in('stage', OPEN_STAGES),
  ]);

  const failed = [todayResult, dueResult, lateResult, pipelineResult].find((result) => result.error);
  if (failed?.error || !today) {
    console.error('[tablero] error de lectura', { code: failed?.error?.code ?? 'sin-fecha' });
    throw new Error('No se pudo cargar el tablero');
  }

  const dueCount = dueResult.count ?? 0;
  const lateCount = lateResult.count ?? 0;
  const pipeline = pipelineResult.data ?? [];
  const openCount = pipeline.reduce((sum, row) => sum + (row.opportunities_count ?? 0), 0);
  const openTotal = pipeline.reduce((sum, row) => sum + (row.estimated_total ?? 0), 0);

  const firstName = profile.fullName.trim().split(/\s+/)[0] ?? profile.fullName;
  const hasNothing = dueCount === 0 && lateCount === 0 && openCount === 0;

  return (
    <>
      <div>
        <div className="font-semibold">Buenos días, {firstName}</div>
        <div className="text-ink-2">
          {weekdayName(today)}, {formatDate(today)}
        </div>
      </div>

      {hasNothing ? (
        <div className="rounded-md border border-line bg-surface">
          <EmptyState icon={BookOpen} title="Aún no hay datos" text="Crea tu primer cliente para empezar.">
            <Button asChild>
              <Link href="/clientes/nuevo">
                <Plus className="i" size={16} aria-hidden="true" />
                Nuevo cliente
              </Link>
            </Button>
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4">
            <Stat label="Para hoy" value={dueCount} />
            <Stat
              label="Atrasadas"
              value={lateCount}
              late={lateCount > 0}
              icon={lateCount > 0 ? <AlertTriangle className="i" size={14} aria-hidden="true" /> : undefined}
            />
            <Stat label="Oportunidades abiertas" value={openCount} sub={`${formatEuros(openTotal)} estimados`} />
          </div>
          {dueCount + lateCount === 0 ? (
            <div className="rounded-md border border-line bg-surface">
              <EmptyState icon={Coffee} title="Todo al día: no tienes acciones para hoy.">
                <Button asChild>
                  <Link href="/oportunidades/nueva">
                    <Plus className="i" size={16} aria-hidden="true" />
                    Nueva oportunidad
                  </Link>
                </Button>
              </EmptyState>
            </div>
          ) : (
            <ComingSoon />
          )}
        </>
      )}
    </>
  );
}
