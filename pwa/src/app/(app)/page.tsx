import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, ChevronRight, Coffee } from 'lucide-react';
import { BarRow } from '@/components/ui/bar-row';
import { EmptyState } from '@/components/ui/empty-state';
import { MobileHeader } from '@/components/shell/mobile-header';
import { requireProfile } from '@/lib/current-profile';
import { readFailure } from '@/lib/data';
import { LOST_REASONS, lostReasonLabel } from '@/lib/labels';
import { formatEuros } from '@/lib/money';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Panel · CRM-123' };

export default async function PanelPage() {
  await requireProfile();
  const supabase = await createClient();

  // Lecturas reales de las vistas del equipo, con la sesión del supervisor (RLS). Solo cuentan vendedores activos.
  const [team, reasons] = await Promise.all([
    supabase
      .from('v_team_summary')
      .select('owner_id, owner_name, open_count, open_estimated_total, won_month_count, won_month_total, lost_month_count, overdue_actions_count'),
    supabase.from('v_lost_reasons_month').select('lost_reason, lost_count'),
  ]);
  if (team.error) return readFailure('panel-equipo', team.error);
  if (reasons.error) return readFailure('panel-motivos', reasons.error);

  const sellers = (team.data ?? []).flatMap((row) =>
    row.owner_id
      ? [{
          id: row.owner_id,
          name: row.owner_name ?? '',
          open: row.open_count ?? 0,
          openTotal: row.open_estimated_total ?? 0,
          won: row.won_month_count ?? 0,
          wonTotal: row.won_month_total ?? 0,
          lost: row.lost_month_count ?? 0,
          overdue: row.overdue_actions_count ?? 0,
        }]
      : [],
  );
  // Primero quien más acciones atrasadas tiene y, a igualdad, quien más ha ganado en el mes.
  sellers.sort((a, b) => b.overdue - a.overdue || b.wonTotal - a.wonTotal || a.name.localeCompare(b.name, 'es'));

  const sum = (pick: (s: (typeof sellers)[number]) => number) => sellers.reduce((total, s) => total + pick(s), 0);
  const totals = { open: sum((s) => s.open), openTotal: sum((s) => s.openTotal), won: sum((s) => s.won), wonTotal: sum((s) => s.wonTotal), lost: sum((s) => s.lost), overdue: sum((s) => s.overdue) };
  const byReason = new Map<string, number>();
  for (const row of reasons.data ?? []) if (row.lost_reason) byReason.set(row.lost_reason, (byReason.get(row.lost_reason) ?? 0) + (row.lost_count ?? 0));
  const maxReason = Math.max(0, ...LOST_REASONS.map((reason) => byReason.get(reason) ?? 0));
  const hasActivity = totals.open + totals.won + totals.lost + totals.overdue > 0;

  return (
    <>
      <MobileHeader title="Panel" />
      <main className="flex flex-1 flex-col gap-3 p-4">
        {!hasActivity ? (
          <EmptyState icon={Coffee} title="Aún no hay actividad este mes." />
        ) : (
          <>
            <div className="m-grid">
              <div className="m-card m-kpi">
                <div className="l">Abiertas</div>
                <div className="n">{totals.open}</div>
                <div className="s">{formatEuros(totals.openTotal, { hideZeroDecimals: true })}</div>
              </div>
              <div className="m-card m-kpi">
                <div className="l">Ganadas del mes</div>
                <div className="n">{formatEuros(totals.wonTotal, { hideZeroDecimals: true })}</div>
                <div className="s">
                  {totals.won} {totals.won === 1 ? 'oportunidad' : 'oportunidades'}
                </div>
              </div>
              <div className="m-card m-kpi">
                <div className="l">Perdidas del mes</div>
                <div className="n">{totals.lost}</div>
                <div className="s" />
              </div>
              <div className="m-card m-kpi">
                <div className="l">Acciones atrasadas</div>
                <div className={`n${totals.overdue > 0 ? ' late' : ''}`}>{totals.overdue}</div>
                <div className="s" />
              </div>
            </div>

            <h2 className="m-sec m-0">Por vendedor</h2>
            {sellers.map((s) => (
              <Link key={s.id} href={`/vendedores/${s.id}`} className="m-card text-ink no-underline" aria-label={`${s.name}: ${s.overdue} acciones atrasadas`}>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-brown">{s.name}</span>
                  <span className="ml-auto flex items-center gap-2">
                    {s.overdue > 0 ? (
                      <span className="badge">
                        <AlertTriangle className="i" size={12} aria-hidden="true" />
                        {s.overdue}
                      </span>
                    ) : null}
                    <ChevronRight className="i text-ink-2" size={20} aria-hidden="true" />
                  </span>
                </div>
                <div className="flex gap-2 text-ink-2">
                  <span>
                    {s.open} {s.open === 1 ? 'abierta' : 'abiertas'}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{formatEuros(s.openTotal, { hideZeroDecimals: true })}</span>
                </div>
                <div className="flex items-center">
                  <span className="text-ink-2">Ganadas del mes</span>
                  <span className="ml-auto font-semibold">{formatEuros(s.wonTotal, { hideZeroDecimals: true })}</span>
                </div>
              </Link>
            ))}

            <h2 className="m-sec m-0">Motivos de pérdida del mes</h2>
            <div className="m-card gap-3">
              {LOST_REASONS.map((reason) => {
                const count = byReason.get(reason) ?? 0;
                return <BarRow key={reason} label={lostReasonLabel(reason)} value={count} max={maxReason} right={String(count)} danger />;
              })}
            </div>
          </>
        )}
      </main>
    </>
  );
}
