import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AlertTriangle, CircleDot, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { FilterForm } from '@/components/ui/filter-form';
import { Pager } from '@/components/ui/pager';
import { Select } from '@/components/ui/select';
import { StageTag, TypeTag } from '@/components/ui/tags';
import { requireProfile } from '@/lib/current-profile';
import { readFailure, readSellers, readToday } from '@/lib/data';
import { formatDate } from '@/lib/dates';
import { OPEN_STAGES, OPPORTUNITY_TYPES, STAGES, STAGE_LABEL, TYPE_LABEL, isOpportunityType, isStage } from '@/lib/labels';
import { formatEuros } from '@/lib/money';
import { pageInfo, pageRange, parsePage } from '@/lib/pagination';
import { firstParam, uuidOrNull, type SearchParams } from '@/lib/params';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Oportunidades · CRM-123' };

const TOTALS_LIMIT = 5000;

export default async function OportunidadesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const sp = await searchParams;
  const supervisor = profile.role === 'supervisor';

  // Etapa: por defecto las abiertas; «todas» o una etapa concreta.
  const stageRaw = firstParam(sp.etapa);
  const stageFilter: 'abiertas' | 'todas' | (typeof STAGES)[number] = stageRaw === 'todas' ? 'todas' : isStage(stageRaw) ? stageRaw : 'abiertas';
  const typeRaw = firstParam(sp.tipo);
  const type = isOpportunityType(typeRaw) ? typeRaw : '';
  const owner = supervisor ? (uuidOrNull(firstParam(sp.vendedor)) ?? '') : '';
  const overdueOnly = firstParam(sp.atrasadas) === '1';
  const page = parsePage(sp.pagina);
  const hasFilters = stageFilter !== 'abiertas' || type !== '' || owner !== '' || overdueOnly;

  const [today, sellers] = await Promise.all([readToday(supabase), supervisor ? readSellers(supabase) : Promise.resolve([])]);
  const sellerName = new Map(sellers.map((s) => [s.id, s.name]));
  const [from, to] = pageRange(page);

  let list = supabase
    .from('opportunities')
    .select('id, title, type, stage, estimated_amount, next_action_date, owner_id, customer_id, customers(first_name, last_name)', { count: 'exact' })
    .is('archived_at', null);
  let totals = supabase.from('opportunities').select('estimated_amount').is('archived_at', null);

  if (stageFilter === 'abiertas') {
    list = list.in('stage', [...OPEN_STAGES]);
    totals = totals.in('stage', [...OPEN_STAGES]);
  } else if (stageFilter !== 'todas') {
    list = list.eq('stage', stageFilter);
    totals = totals.eq('stage', stageFilter);
  }
  if (type) {
    list = list.eq('type', type);
    totals = totals.eq('type', type);
  }
  if (owner) {
    list = list.eq('owner_id', owner);
    totals = totals.eq('owner_id', owner);
  }
  if (overdueOnly) {
    list = list.lt('next_action_date', today);
    totals = totals.lt('next_action_date', today);
  }

  const [listResult, totalsResult] = await Promise.all([
    list
      .order('next_action_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
      .order('id')
      .range(from, to),
    totals.range(0, TOTALS_LIMIT - 1),
  ]);
  if (listResult.error?.code === 'PGRST103') redirect('/oportunidades');
  if (listResult.error) return readFailure('oportunidades', listResult.error);
  if (totalsResult.error) return readFailure('oportunidades-totales', totalsResult.error);

  const rows = listResult.data ?? [];
  const info = pageInfo(page, listResult.count ?? 0);
  const totalAmount = (totalsResult.data ?? []).reduce((sum, row) => sum + row.estimated_amount, 0);
  const params = {
    etapa: stageFilter === 'abiertas' ? undefined : stageFilter,
    tipo: type || undefined,
    vendedor: owner || undefined,
    atrasadas: overdueOnly ? '1' : undefined,
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <span className="font-semibold">Oportunidades</span>
        <span className="ml-auto">
          <Button asChild>
            <Link href="/oportunidades/nueva">
              <Plus className="i" size={16} aria-hidden="true" />
              Nueva oportunidad
            </Link>
          </Button>
        </span>
      </div>

      <FilterForm>
        <Field id="etapa" label="Etapa" className="w-48">
          <Select id="etapa" name="etapa" defaultValue={stageFilter === 'abiertas' ? '' : stageFilter}>
            <option value="">Abiertas</option>
            <option value="todas">Todas</option>
            {STAGES.map((value) => (
              <option key={value} value={value}>
                {STAGE_LABEL[value]}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="tipo" label="Tipo" className="w-60">
          <Select id="tipo" name="tipo" defaultValue={type}>
            <option value="">Todos</option>
            {OPPORTUNITY_TYPES.map((value) => (
              <option key={value} value={value}>
                {TYPE_LABEL[value]}
              </option>
            ))}
          </Select>
        </Field>
        {supervisor ? (
          <Field id="vendedor" label="Vendedor" className="w-48">
            <Select id="vendedor" name="vendedor" defaultValue={owner}>
              <option value="">Todos</option>
              {sellers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                  {s.active ? '' : ' (desactivado)'}
                </option>
              ))}
            </Select>
          </Field>
        ) : null}
        <label className="flex h-8 items-center gap-2">
          <input type="checkbox" name="atrasadas" value="1" defaultChecked={overdueOnly} className="size-4 accent-primary" />
          <span>Solo con acción atrasada</span>
        </label>
      </FilterForm>

      <div className="panel">
        {rows.length === 0 ? (
          hasFilters ? (
            <EmptyState icon={CircleDot} title="No hay oportunidades con esos filtros." />
          ) : (
            <EmptyState icon={CircleDot} title="Aún no tienes oportunidades. Crea la primera.">
              <Button asChild>
                <Link href="/oportunidades/nueva">
                  <Plus className="i" size={16} aria-hidden="true" />
                  Nueva oportunidad
                </Link>
              </Button>
            </EmptyState>
          )
        ) : (
          <>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Título</th>
                  <th>Cliente</th>
                  <th>Tipo</th>
                  <th>Etapa</th>
                  <th className="num">Monto estimado</th>
                  <th>Próxima acción</th>
                  {supervisor ? <th>Vendedor</th> : null}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const date = row.next_action_date;
                  return (
                    <tr key={row.id} className="is-link">
                      <td>
                        <Link className="row-link" href={`/oportunidades/${row.id}`}>
                          {row.title}
                        </Link>
                      </td>
                      <td>{row.customers ? `${row.customers.first_name} ${row.customers.last_name}` : '—'}</td>
                      <td>
                        <TypeTag type={row.type} />
                      </td>
                      <td>
                        <StageTag stage={row.stage} />
                      </td>
                      <td className="num">{formatEuros(row.estimated_amount)}</td>
                      <td>
                        {!date ? (
                          <span className="text-ink-2">—</span>
                        ) : date < today ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-danger">
                            <AlertTriangle className="i" size={14} aria-hidden="true" />
                            <span className="sr-only">Atrasada: </span>
                            {formatDate(date)}
                          </span>
                        ) : date === today ? (
                          <span className="font-semibold text-warning-text">Hoy · {formatDate(date)}</span>
                        ) : (
                          <span className="text-ink-2">{formatDate(date)}</span>
                        )}
                      </td>
                      {supervisor ? <td>{sellerName.get(row.owner_id) ?? '—'}</td> : null}
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4}>
                    {info.total} {info.total === 1 ? 'oportunidad' : 'oportunidades'}
                  </td>
                  <td className="num">{formatEuros(totalAmount)}</td>
                  <td colSpan={supervisor ? 2 : 1} />
                </tr>
              </tfoot>
            </table>
            <Pager info={info} basePath="/oportunidades" params={params} />
          </>
        )}
      </div>
    </>
  );
}
