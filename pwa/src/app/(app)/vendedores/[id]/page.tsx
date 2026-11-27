import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import { BackHeader } from '@/components/shell/back-header';
import { BarRow } from '@/components/ui/bar-row';
import { EmptyState } from '@/components/ui/empty-state';
import { NextActionLine } from '@/components/opportunities/next-action-line';
import { requireProfile } from '@/lib/current-profile';
import { readFailure, readToday } from '@/lib/data';
import { OPEN_STAGES, STAGE_LABEL } from '@/lib/labels';
import { formatEuros } from '@/lib/money';
import { uuidOrNull } from '@/lib/params';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Vendedor · CRM-123' };

export default async function DetalleVendedorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireProfile();
  const id = uuidOrNull((await params).id);
  if (!id) notFound();
  const supabase = await createClient();

  const [today, team, pipeline, overdue] = await Promise.all([
    readToday(supabase),
    supabase
      .from('v_team_summary')
      .select('owner_name, open_count, open_estimated_total, won_month_total, lost_month_count, overdue_actions_count')
      .eq('owner_id', id)
      .maybeSingle(),
    supabase.from('v_pipeline_summary').select('stage, opportunities_count, estimated_total').eq('owner_id', id).in('stage', [...OPEN_STAGES]),
    supabase
      .from('v_next_actions')
      .select('opportunity_id, title, customer_name, next_action_date, next_action_text')
      .eq('owner_id', id)
      .eq('is_overdue', true)
      .order('next_action_date', { ascending: true })
      .order('opportunity_id')
      .limit(50),
  ]);
  if (team.error) return readFailure('vendedor-resumen', team.error);
  if (pipeline.error) return readFailure('vendedor-embudo', pipeline.error);
  if (overdue.error) return readFailure('vendedor-atrasadas', overdue.error);
  if (!team.data) notFound(); // la vista solo incluye vendedores activos

  const row = team.data;
  const byStage = new Map((pipeline.data ?? []).map((r) => [r.stage ?? '', r]));
  const maxCount = Math.max(0, ...OPEN_STAGES.map((s) => byStage.get(s)?.opportunities_count ?? 0));
  const lateCount = row.overdue_actions_count ?? 0;

  return (
    <>
      <BackHeader title={row.owner_name ?? 'Vendedor'} href="/" label="Volver al Panel" />
      <main className="flex flex-1 flex-col gap-3 p-4">
        <div className="m-grid">
          <div className="m-card m-kpi">
            <div className="l">Abiertas</div>
            <div className="n">{row.open_count ?? 0}</div>
            <div className="s">{formatEuros(row.open_estimated_total ?? 0, { hideZeroDecimals: true })}</div>
          </div>
          <div className="m-card m-kpi">
            <div className="l">Ganadas del mes</div>
            <div className="n">{formatEuros(row.won_month_total ?? 0, { hideZeroDecimals: true })}</div>
            <div className="s" />
          </div>
          <div className="m-card m-kpi">
            <div className="l">Perdidas del mes</div>
            <div className="n">{row.lost_month_count ?? 0}</div>
            <div className="s" />
          </div>
          <div className="m-card m-kpi">
            <div className="l">Atrasadas</div>
            <div className={`n${lateCount > 0 ? ' late' : ''}`}>{lateCount}</div>
            <div className="s" />
          </div>
        </div>

        <div className="m-card gap-3">
          <h2 className="m-sec m-0">Embudo</h2>
          {OPEN_STAGES.map((stage) => {
            const r = byStage.get(stage);
            const count = r?.opportunities_count ?? 0;
            return <BarRow key={stage} label={STAGE_LABEL[stage]} value={count} max={maxCount} right={`${count} · ${formatEuros(r?.estimated_total ?? 0, { hideZeroDecimals: true })}`} />;
          })}
        </div>

        <h2 className="m-sec m-0">Acciones atrasadas</h2>
        {(overdue.data ?? []).length === 0 ? (
          <div className="m-card">
            <EmptyState icon={CheckCircle2} title="Sin acciones atrasadas." />
          </div>
        ) : (
          (overdue.data ?? []).map((a) => (
            <div key={a.opportunity_id} className="m-card">
              <div className="font-semibold text-brown">{a.title}</div>
              <div className="text-ink-2">{a.customer_name}</div>
              <NextActionLine date={a.next_action_date} text={a.next_action_text} today={today} />
            </div>
          ))
        )}
      </main>
    </>
  );
}
