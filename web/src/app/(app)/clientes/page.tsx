import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Check, Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterForm } from '@/components/ui/filter-form';
import { Field } from '@/components/ui/field';
import { Pager } from '@/components/ui/pager';
import { SearchFilter } from '@/components/ui/search-filter';
import { Select } from '@/components/ui/select';
import { requireProfile } from '@/lib/current-profile';
import { readFailure, readSellers } from '@/lib/data';
import { formatInstantDate } from '@/lib/dates';
import { SOURCES, SOURCE_LABEL, isSource, sourceLabel } from '@/lib/labels';
import { pageInfo, pageRange, parsePage } from '@/lib/pagination';
import { firstParam, uuidOrNull, type SearchParams } from '@/lib/params';
import { formatPhone } from '@/lib/phone';
import { customerTermFilter, searchTerms } from '@/lib/search';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Clientes · CRM-123' };

export default async function ClientesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const profile = await requireProfile();
  const supabase = await createClient();
  const sp = await searchParams;

  const supervisor = profile.role === 'supervisor';
  const q = firstParam(sp.q).slice(0, 60);
  const originRaw = firstParam(sp.origen);
  const origin = isSource(originRaw) ? originRaw : '';
  const owner = supervisor ? (uuidOrNull(firstParam(sp.vendedor)) ?? '') : '';
  const page = parsePage(sp.pagina);
  const hasFilters = q !== '' || origin !== '' || owner !== '';

  const sellers = supervisor ? await readSellers(supabase) : [];
  const sellerName = new Map(sellers.map((s) => [s.id, s.name]));

  let query = supabase
    .from('customers')
    .select('id, first_name, last_name, phone, email, source, accepts_communications, created_at, owner_id', { count: 'exact' })
    .is('archived_at', null);
  for (const term of searchTerms(q)) query = query.or(customerTermFilter(term));
  if (origin) query = query.eq('source', origin);
  if (owner) query = query.eq('owner_id', owner);

  const [from, to] = pageRange(page);
  const { data, count, error } = await query.order('last_name').order('first_name').order('id').range(from, to);
  if (error?.code === 'PGRST103') redirect('/clientes'); // página fuera de rango: vuelve a la primera
  if (error) return readFailure('clientes', error);

  const rows = data ?? [];
  const info = pageInfo(page, count ?? 0);
  const params = { q: q || undefined, origen: origin || undefined, vendedor: owner || undefined };

  return (
    <>
      <div className="flex items-center gap-2">
        <span className="font-semibold">Clientes</span>
        <span className="ml-auto">
          <Button asChild>
            <Link href="/clientes/nuevo">
              <Plus className="i" size={16} aria-hidden="true" />
              Nuevo cliente
            </Link>
          </Button>
        </span>
      </div>

      {hasFilters || info.total > 0 ? (
        <FilterForm>
          <SearchFilter defaultValue={q} />
          <Field id="origen" label="Origen" className="w-44">
            <Select id="origen" name="origen" defaultValue={origin}>
              <option value="">Todos</option>
              {SOURCES.map((value) => (
                <option key={value} value={value}>
                  {SOURCE_LABEL[value]}
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
        </FilterForm>
      ) : null}

      <div className="panel">
        {rows.length === 0 ? (
          hasFilters ? (
            <EmptyState icon={Users} title="No hay clientes con esa búsqueda." />
          ) : (
            <EmptyState icon={Users} title="Aún no tienes clientes. Crea el primero.">
              <Button asChild>
                <Link href="/clientes/nuevo">
                  <Plus className="i" size={16} aria-hidden="true" />
                  Nuevo cliente
                </Link>
              </Button>
            </EmptyState>
          )
        ) : (
          <>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Nombre completo</th>
                  <th>Teléfono</th>
                  <th>Correo</th>
                  <th>Origen</th>
                  <th>Acepta comunicaciones</th>
                  {supervisor ? <th>Vendedor</th> : null}
                  <th>Fecha de alta</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="is-link">
                    <td>
                      <Link className="row-link" href={`/clientes/${row.id}`}>
                        {row.first_name} {row.last_name}
                      </Link>
                    </td>
                    <td>{formatPhone(row.phone)}</td>
                    <td>{row.email ?? <span className="text-ink-2">—</span>}</td>
                    <td>{sourceLabel(row.source)}</td>
                    <td>
                      {row.accepts_communications ? (
                        <>
                          <Check className="i text-success" size={16} aria-hidden="true" />
                          <span className="sr-only">Sí</span>
                        </>
                      ) : (
                        <span className="text-ink-2">No</span>
                      )}
                    </td>
                    {supervisor ? <td>{sellerName.get(row.owner_id) ?? '—'}</td> : null}
                    <td>{formatInstantDate(row.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pager info={info} basePath="/clientes" params={params} />
          </>
        )}
      </div>
    </>
  );
}
