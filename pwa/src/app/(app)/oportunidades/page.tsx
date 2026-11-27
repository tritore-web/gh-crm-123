import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CircleDot } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { FilterForm } from '@/components/ui/filter-form';
import { Pager } from '@/components/ui/pager';
import { SearchFilter } from '@/components/ui/search-filter';
import { StageTag, TypeTag } from '@/components/ui/tags';
import { MobileHeader } from '@/components/shell/mobile-header';
import { requireProfile } from '@/lib/current-profile';
import { readFailure, readSellers, readToday } from '@/lib/data';
import { daysBetween, formatDate } from '@/lib/dates';
import { OPEN_STAGES } from '@/lib/labels';
import { formatEuros } from '@/lib/money';
import { pageInfo, pageRange, parsePage } from '@/lib/pagination';
import { firstParam, type SearchParams } from '@/lib/params';
import { customerTermFilter, sanitizeSearch, searchTerms } from '@/lib/search';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Oportunidades · CRM-123' };

const FILTERS = [
  { key: 'abiertas', label: 'Abiertas' },
  { key: 'ganadas', label: 'Ganadas' },
  { key: 'perdidas', label: 'Perdidas' },
  { key: 'atrasadas', label: 'Atrasadas' },
] as const;
type FilterKey = (typeof FILTERS)[number]['key'];

export default async function OportunidadesPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireProfile();
  const supabase = await createClient();
  const sp = await searchParams;

  const q = sanitizeSearch(firstParam(sp.q));
  const filterRaw = firstParam(sp.filtro);
  const filter: FilterKey = FILTERS.some((f) => f.key === filterRaw) ? (filterRaw as FilterKey) : 'abiertas';
  const page = parsePage(sp.pagina);
  const [from, to] = pageRange(page);

  const [today, sellers] = await Promise.all([readToday(supabase), readSellers(supabase)]);
  const sellerName = new Map(sellers.map((s) => [s.id, s.name]));

  let query = supabase
    .from('opportunities')
    .select('id, title, type, stage, estimated_amount, next_action_date, next_action_text, owner_id, customers(first_name, last_name)', { count: 'exact' })
    .is('archived_at', null);
  if (filter === 'abiertas') query = query.in('stage', [...OPEN_STAGES]);
  if (filter === 'ganadas') query = query.eq('stage', 'ganada');
  if (filter === 'perdidas') query = query.eq('stage', 'perdida');
  if (filter === 'atrasadas') query = query.in('stage', [...OPEN_STAGES]).lt('next_action_date', today);

  // Búsqueda por título o por cliente: primero se buscan los clientes que coinciden y luego se une con el título.
  const terms = searchTerms(q);
  if (terms.length > 0) {
    let customers = supabase.from('customers').select('id');
    for (const term of terms) customers = customers.or(customerTermFilter(term));
    const { data: matches, error: customersError } = await customers.limit(200);
    if (customersError) return readFailure('oportunidades-clientes', customersError);
    const ids = (matches ?? []).map((m) => m.id);
    query = query.or([`title.ilike.*${q}*`, ...(ids.length > 0 ? [`customer_id.in.(${ids.join(',')})`] : [])].join(','));
  }

  const { data, count, error } = await query
    .order('next_action_date', { ascending: true, nullsFirst: false })
    .order('created_at', { ascending: false })
    .order('id')
    .range(from, to);
  if (error?.code === 'PGRST103') redirect('/oportunidades');
  if (error) return readFailure('oportunidades', error);

  const rows = data ?? [];
  const info = pageInfo(page, count ?? 0);
  const hrefFor = (key: FilterKey) => {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (key !== 'abiertas') params.set('filtro', key);
    const text = params.toString();
    return text ? `/oportunidades?${text}` : '/oportunidades';
  };

  return (
    <>
      <MobileHeader title="Oportunidades" />
      <main className="flex flex-1 flex-col gap-3 p-4">
        <FilterForm>
          <input type="hidden" name="filtro" value={filter === 'abiertas' ? '' : filter} />
          <SearchFilter defaultValue={q} placeholder="Buscar por título o cliente" label="Buscar por título o cliente" />
        </FilterForm>
        <nav className="chips" aria-label="Filtro de oportunidades">
          {FILTERS.map((f) => (
            <Link key={f.key} href={hrefFor(f.key)} className={`chip${filter === f.key ? ' on' : ''}`} aria-current={filter === f.key ? 'true' : undefined}>
              {f.label}
            </Link>
          ))}
        </nav>

        {rows.length === 0 ? (
          <EmptyState icon={CircleDot} title={q ? 'No hay oportunidades con esa búsqueda.' : 'Aún no hay oportunidades.'} />
        ) : (
          <>
            {rows.map((row) => {
              const date = row.next_action_date;
              const late = date !== null && date < today;
              const isToday = date === today;
              return (
                <Link key={row.id} href={`/oportunidades/${row.id}`} className="m-card text-ink no-underline">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-brown">{row.title}</span>
                    <span className="ml-auto">{formatEuros(row.estimated_amount, { hideZeroDecimals: true })}</span>
                  </div>
                  <div className="text-ink-2">{row.customers ? `${row.customers.first_name} ${row.customers.last_name}` : '—'}</div>
                  <div className="flex items-center gap-2">
                    <TypeTag type={row.type} />
                    <StageTag stage={row.stage} />
                  </div>
                  {row.stage === 'ganada' || row.stage === 'perdida' ? null : date && row.next_action_text ? (
                    <div className={`next${late ? ' late' : isToday ? ' today' : ''}`}>
                      <span>
                        {late ? `Atrasada · ${daysBetween(date, today)} ${daysBetween(date, today) === 1 ? 'día' : 'días'} · ${formatDate(date)} · ` : isToday ? 'Hoy · ' : `${formatDate(date)} · `}
                        {row.next_action_text}
                      </span>
                    </div>
                  ) : (
                    <div className="next">
                      <span>Sin próxima acción</span>
                    </div>
                  )}
                  <div className="text-ink-2">Vendedor: {sellerName.get(row.owner_id) ?? '—'}</div>
                </Link>
              );
            })}
            <Pager info={info} basePath="/oportunidades" params={{ q: q || undefined, filtro: filter === 'abiertas' ? undefined : filter }} />
          </>
        )}
      </main>
    </>
  );
}
