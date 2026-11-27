import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Archive, ArchiveRestore } from 'lucide-react';
import { ActionButton } from '@/components/ui/action-button';
import { EmptyState } from '@/components/ui/empty-state';
import { Pager } from '@/components/ui/pager';
import { StageTag, TypeTag } from '@/components/ui/tags';
import { requireProfile } from '@/lib/current-profile';
import { readFailure } from '@/lib/data';
import { formatInstantDate } from '@/lib/dates';
import { sourceLabel } from '@/lib/labels';
import { formatEuros } from '@/lib/money';
import { pageInfo, pageRange, parsePage } from '@/lib/pagination';
import { firstParam, type SearchParams } from '@/lib/params';
import { formatPhone } from '@/lib/phone';
import { createClient } from '@/lib/supabase/server';
import { recoverCustomer } from '../clientes/actions';
import { recoverOpportunity } from '../oportunidades/actions';

export const metadata: Metadata = { title: 'Archivados · CRM-123' };

const restoreIcon = <ArchiveRestore className="i" size={16} aria-hidden="true" />;

export default async function ArchivadosPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireProfile();
  const supabase = await createClient();
  const sp = await searchParams;
  const tab = firstParam(sp.pestana) === 'oportunidades' ? 'oportunidades' : 'clientes';
  const page = parsePage(sp.pagina);
  const [from, to] = pageRange(page);

  const customers =
    tab === 'clientes'
      ? await supabase
          .from('customers')
          .select('id, first_name, last_name, phone, source, archived_at', { count: 'exact' })
          .not('archived_at', 'is', null)
          .order('archived_at', { ascending: false })
          .order('id')
          .range(from, to)
      : null;
  const opportunities =
    tab === 'oportunidades'
      ? await supabase
          .from('opportunities')
          .select('id, title, type, stage, estimated_amount, archived_at, customers(first_name, last_name)', { count: 'exact' })
          .not('archived_at', 'is', null)
          .order('archived_at', { ascending: false })
          .order('id')
          .range(from, to)
      : null;

  const result = customers ?? opportunities;
  if (result?.error?.code === 'PGRST103') redirect(`/archivados${tab === 'oportunidades' ? '?pestana=oportunidades' : ''}`);
  if (result?.error) return readFailure('archivados', result.error);
  const info = pageInfo(page, result?.count ?? 0);
  const params = { pestana: tab === 'oportunidades' ? 'oportunidades' : undefined };

  return (
    <>
      <nav className="tabs" aria-label="Elementos archivados">
        <Link href="/archivados" className={`tab${tab === 'clientes' ? ' on' : ''}`} aria-current={tab === 'clientes' ? 'page' : undefined}>
          Clientes
        </Link>
        <Link href="/archivados?pestana=oportunidades" className={`tab${tab === 'oportunidades' ? ' on' : ''}`} aria-current={tab === 'oportunidades' ? 'page' : undefined}>
          Oportunidades
        </Link>
      </nav>

      <div className="panel">
        {info.total === 0 ? (
          <EmptyState icon={Archive} title="No hay elementos archivados." />
        ) : tab === 'clientes' ? (
          <>
            <table className="tbl">
              <thead>
                <tr>
                  <th>Nombre completo</th>
                  <th>Teléfono</th>
                  <th>Origen</th>
                  <th>Archivado</th>
                  <th>
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {(customers?.data ?? []).map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link className="font-semibold hover:underline" href={`/clientes/${row.id}`}>
                        {row.first_name} {row.last_name}
                      </Link>
                    </td>
                    <td>{formatPhone(row.phone)}</td>
                    <td>{sourceLabel(row.source)}</td>
                    <td>Archivado el {row.archived_at ? formatInstantDate(row.archived_at) : '—'}</td>
                    <td>
                      <ActionButton action={recoverCustomer} fields={{ id: row.id }} label="Recuperar" size="sm" icon={restoreIcon} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pager info={info} basePath="/archivados" params={params} />
          </>
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
                  <th>Archivado</th>
                  <th>
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {(opportunities?.data ?? []).map((row) => (
                  <tr key={row.id}>
                    <td>
                      <Link className="font-semibold hover:underline" href={`/oportunidades/${row.id}`}>
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
                    <td>Archivado el {row.archived_at ? formatInstantDate(row.archived_at) : '—'}</td>
                    <td>
                      <ActionButton action={recoverOpportunity} fields={{ id: row.id }} label="Recuperar" size="sm" icon={restoreIcon} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pager info={info} basePath="/archivados" params={params} />
          </>
        )}
      </div>
    </>
  );
}
