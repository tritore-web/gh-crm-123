import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, BookOpen, Coffee, Plus } from 'lucide-react';
import { ActionsTable, type ActionRow } from '@/components/dashboard/actions-table';
import { Funnel } from '@/components/dashboard/funnel';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { FilterForm } from '@/components/ui/filter-form';
import { Select } from '@/components/ui/select';
import { Stat } from '@/components/ui/stat';
import { requireProfile } from '@/lib/current-profile';
import { readFailure, readSellers, readToday } from '@/lib/data';
import { formatDate, weekdayName } from '@/lib/dates';
import { OPEN_STAGES } from '@/lib/labels';
import { formatEuros } from '@/lib/money';
import { firstParam, uuidOrNull, type SearchParams } from '@/lib/params';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Tablero · CRM-123' };

const LIST_LIMIT = 200;

export default async function TableroPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const supervisor = profile.role === 'supervisor';
  const owner = supervisor ? (uuidOrNull(firstParam((await searchParams).vendedor)) ?? '') : '';

  // "Hoy" lo fija la base según la zona de settings (Europe/Madrid), nunca el navegador.
  const today = await readToday(supabase);

  let listQuery = supabase
    .from('v_next_actions')
    .select('opportunity_id, owner_name, customer_id, customer_name, customer_phone, title, type, next_action_date, next_action_text, is_overdue')
    .lte('next_action_date', today);
  let dueCount = supabase.from('v_next_actions').select('opportunity_id', { count: 'exact', head: true }).eq('next_action_date', today);
  let lateCount = supabase.from('v_next_actions').select('opportunity_id', { count: 'exact', head: true }).lt('next_action_date', today);
  let pipelineQuery = supabase.from('v_pipeline_summary').select('stage, opportunities_count, estimated_total').in('stage', [...OPEN_STAGES]);
  if (owner) {
    listQuery = listQuery.eq('owner_id', owner);
    dueCount = dueCount.eq('owner_id', owner);
    lateCount = lateCount.eq('owner_id', owner);
    pipelineQuery = pipelineQuery.eq('owner_id', owner);
  }

  const [listResult, dueResult, lateResult, pipelineResult, sellers] = await Promise.all([
    listQuery.order('next_action_date', { ascending: true }).order('opportunity_id').limit(LIST_LIMIT),
    dueCount,
    lateCount,
    pipelineQuery,
    supervisor ? readSellers(supabase) : Promise.resolve([]),
  ]);
  const failed = [listResult, dueResult, lateResult, pipelineResult].find((result) => result.error);
  if (failed?.error) return readFailure('tablero', failed.error);

  const rows: ActionRow[] = (listResult.data ?? []).flatMap((row) =>
    row.opportunity_id && row.customer_id && row.next_action_date && row.next_action_text
      ? [{
          opportunity_id: row.opportunity_id,
          customer_id: row.customer_id,
          customer_name: row.customer_name ?? '',
          customer_phone: row.customer_phone ?? '',
          title: row.title ?? '',
          type: row.type ?? '',
          next_action_date: row.next_action_date,
          next_action_text: row.next_action_text,
          owner_name: row.owner_name ?? '',
        }]
      : [],
  );
  const overdueRows = rows.filter((row) => row.next_action_date < today);
  const todayRows = rows.filter((row) => row.next_action_date === today);

  const funnelRows = new Map<string, { stage: string; count: number; total: number }>();
  for (const row of pipelineResult.data ?? []) {
    if (!row.stage) continue;
    const current = funnelRows.get(row.stage) ?? { stage: row.stage, count: 0, total: 0 };
    current.count += row.opportunities_count ?? 0;
    current.total += row.estimated_total ?? 0;
    funnelRows.set(row.stage, current);
  }
  const openCount = [...funnelRows.values()].reduce((sum, row) => sum + row.count, 0);
  const openTotal = [...funnelRows.values()].reduce((sum, row) => sum + row.total, 0);

  const due = dueResult.count ?? 0;
  const late = lateResult.count ?? 0;
  const firstName = profile.fullName.trim().split(/\s+/)[0] ?? profile.fullName;
  const nothing = due === 0 && late === 0 && openCount === 0;

  return (
    <>
      <div className="flex items-end gap-4">
        <div>
          <div className="font-semibold">Buenos días, {firstName}</div>
          <div className="text-ink-2">
            {weekdayName(today)}, {formatDate(today)}
          </div>
        </div>
        {supervisor ? (
          <div className="ml-auto">
            <FilterForm>
              <Field id="vendedor" label="Vendedor" className="w-52">
                <Select id="vendedor" name="vendedor" defaultValue={owner}>
                  <option value="">Todos los vendedores</option>
                  {sellers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                      {s.active ? '' : ' (desactivado)'}
                    </option>
                  ))}
                </Select>
              </Field>
            </FilterForm>
          </div>
        ) : null}
      </div>

      {nothing && !owner ? (
        <div className="panel">
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
            <Stat label="Para hoy" value={due} />
            <Stat label="Atrasadas" value={late} late={late > 0} icon={late > 0 ? <AlertTriangle className="i" size={14} aria-hidden="true" /> : undefined} />
            <Stat label="Oportunidades abiertas" value={openCount} sub={`${formatEuros(openTotal)} estimados`} />
          </div>

          {overdueRows.length > 0 ? <ActionsTable title="Atrasadas" overdue rows={overdueRows} today={today} supervisor={supervisor} /> : null}
          {todayRows.length > 0 ? <ActionsTable title="Para hoy" rows={todayRows} today={today} supervisor={supervisor} /> : null}
          {rows.length >= LIST_LIMIT ? <p className="m-0 text-xs text-ink-2">Se muestran las primeras {LIST_LIMIT} acciones.</p> : null}

          {due + late === 0 ? (
            <div className="panel">
              <EmptyState icon={Coffee} title="Todo al día: no tienes acciones para hoy.">
                <Button asChild>
                  <Link href="/oportunidades/nueva">
                    <Plus className="i" size={16} aria-hidden="true" />
                    Nueva oportunidad
                  </Link>
                </Button>
              </EmptyState>
            </div>
          ) : null}

          <div className="flex items-start gap-4">
            <section className="panel min-w-0 flex-1" aria-labelledby="embudo-titulo">
              <h2 id="embudo-titulo" className="panel-h m-0">
                {supervisor ? 'Embudo' : 'Mi embudo'}
              </h2>
              <div className="panel-b">
                <Funnel rows={[...funnelRows.values()]} />
              </div>
            </section>
            <div className="flex flex-col gap-2">
              <Button asChild variant="secondary">
                <Link href="/clientes/nuevo">
                  <Plus className="i" size={16} aria-hidden="true" />
                  Nuevo cliente
                </Link>
              </Button>
              <Button asChild variant="secondary">
                <Link href="/oportunidades/nueva">
                  <Plus className="i" size={16} aria-hidden="true" />
                  Nueva oportunidad
                </Link>
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
