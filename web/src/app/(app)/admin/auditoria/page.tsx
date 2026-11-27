import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ListChecks } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { Field } from '@/components/ui/field';
import { FilterForm } from '@/components/ui/filter-form';
import { Input } from '@/components/ui/input';
import { Pager } from '@/components/ui/pager';
import { Select } from '@/components/ui/select';
import { AUDIT_ACTION_LABEL, auditActionLabel, auditDetail, auditElement, auditTimestamp, auditWho, type AuditNames, type AuditRow } from '@/lib/audit';
import { requireProfile } from '@/lib/current-profile';
import { readFailure } from '@/lib/data';
import { isValidIsoDate, localInputToIso } from '@/lib/dates';
import { pageInfo, pageRange, parsePage } from '@/lib/pagination';
import { firstParam, type SearchParams } from '@/lib/params';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Auditoría · CRM-123' };

/** Límites del día en hora de Madrid, como instantes. «Hasta» incluye todo ese día. */
function dayStart(date: string): string | null {
  return isValidIsoDate(date) ? localInputToIso(`${date}T00:00`) : null;
}
function nextDayStart(date: string): string | null {
  if (!isValidIsoDate(date)) return null;
  const next = new Date(Date.UTC(Number(date.slice(0, 4)), Number(date.slice(5, 7)) - 1, Number(date.slice(8, 10)) + 1));
  return dayStart(next.toISOString().slice(0, 10));
}

const ids = (values: (string | null)[]): string[] => [...new Set(values.filter((v): v is string => typeof v === 'string'))];

export default async function AuditoriaPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireProfile();
  const supabase = await createClient();
  const sp = await searchParams;

  const actionRaw = firstParam(sp.accion);
  const action = actionRaw in AUDIT_ACTION_LABEL ? actionRaw : '';
  const from = firstParam(sp.desde);
  const to = firstParam(sp.hasta);
  const fromIso = dayStart(from);
  const toIso = nextDayStart(to);
  const page = parsePage(sp.pagina);
  const [rangeFrom, rangeTo] = pageRange(page);

  let query = supabase
    .from('audit_log')
    .select('id, action, actor_id, actor_role, entity_type, entity_id, details, created_at', { count: 'exact' });
  if (action) query = query.eq('action', action);
  if (fromIso) query = query.gte('created_at', fromIso);
  if (toIso) query = query.lt('created_at', toIso);
  const { data, count, error } = await query.order('created_at', { ascending: false }).order('id', { ascending: false }).range(rangeFrom, rangeTo);
  if (error?.code === 'PGRST103') redirect('/admin/auditoria');
  if (error) return readFailure('auditoria', error);

  const rows: AuditRow[] = data ?? [];

  // Nombres de las personas, clientes y oportunidades que aparecen en esta página (una consulta por tipo).
  const detailProfileIds = rows.flatMap((row) => {
    const d = row.details;
    return d && typeof d === 'object' && !Array.isArray(d) ? [(d as Record<string, unknown>).from, (d as Record<string, unknown>).to].filter((v): v is string => typeof v === 'string') : [];
  });
  const profileIds = ids([...rows.map((r) => r.actor_id), ...rows.filter((r) => r.entity_type === 'profile').map((r) => r.entity_id), ...detailProfileIds]);
  const customerIds = ids(rows.filter((r) => r.entity_type === 'customer').map((r) => r.entity_id));
  const opportunityIds = ids(rows.filter((r) => r.entity_type === 'opportunity').map((r) => r.entity_id));
  const [profilesResult, customersResult, opportunitiesResult] = await Promise.all([
    profileIds.length ? supabase.from('profiles').select('id, full_name').in('id', profileIds) : Promise.resolve({ data: [], error: null }),
    customerIds.length ? supabase.from('customers').select('id, first_name, last_name').in('id', customerIds) : Promise.resolve({ data: [], error: null }),
    opportunityIds.length ? supabase.from('opportunities').select('id, title').in('id', opportunityIds) : Promise.resolve({ data: [], error: null }),
  ]);
  const failed = [profilesResult, customersResult, opportunitiesResult].find((r) => r.error);
  if (failed?.error) return readFailure('auditoria-nombres', failed.error);

  const names: AuditNames = {
    profiles: new Map((profilesResult.data ?? []).map((p) => [p.id, p.full_name])),
    customers: new Map((customersResult.data ?? []).map((c) => [c.id, `${c.first_name} ${c.last_name}`])),
    opportunities: new Map((opportunitiesResult.data ?? []).map((o) => [o.id, o.title])),
  };
  const info = pageInfo(page, count ?? 0);
  const params = { accion: action || undefined, desde: from || undefined, hasta: to || undefined };

  return (
    <>
      <FilterForm>
        <Field id="accion" label="Acción" className="w-64">
          <Select id="accion" name="accion" defaultValue={action}>
            <option value="">Todas</option>
            {Object.entries(AUDIT_ACTION_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
        <Field id="desde" label="Desde" className="w-44">
          <Input id="desde" name="desde" type="date" defaultValue={from} />
        </Field>
        <Field id="hasta" label="Hasta" className="w-44">
          <Input id="hasta" name="hasta" type="date" defaultValue={to} />
        </Field>
      </FilterForm>

      <div className="panel">
        {rows.length === 0 ? (
          <EmptyState icon={ListChecks} title="No hay registros con esos filtros." />
        ) : (
          <>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Fecha y hora</th>
                  <th>Quién</th>
                  <th>Acción</th>
                  <th>Elemento</th>
                  <th>Detalle breve</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const detail = auditDetail(row, names);
                  return (
                    <tr key={row.id}>
                      <td>{auditTimestamp(row)}</td>
                      <td>{auditWho(row, names)}</td>
                      <td>
                        <span className="tag">{auditActionLabel(row.action)}</span>
                      </td>
                      <td>{auditElement(row, names)}</td>
                      <td>{detail ?? <span className="text-ink-2">—</span>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="pager">
              <span>
                {info.first}–{info.last} de {info.total}
              </span>
              <span className="ml-auto">Solo lectura</span>
            </div>
            {info.pages > 1 ? <Pager info={info} basePath="/admin/auditoria" params={params} /> : null}
          </>
        )}
      </div>
    </>
  );
}
