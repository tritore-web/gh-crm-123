import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { ActivityDialog } from '@/components/activities/activity-dialog';
import { Button } from '@/components/ui/button';
import { TypeTag } from '@/components/ui/tags';
import { daysBetween, formatDate, overdueLabel } from '@/lib/dates';
import { formatPhone } from '@/lib/phone';

export type ActionRow = {
  opportunity_id: string;
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  title: string;
  type: string;
  next_action_date: string;
  next_action_text: string;
  owner_name: string;
};

/** Lista de acciones del Tablero: cliente, teléfono, oportunidad con tipo, acción, fecha y acciones de fila. */
export function ActionsTable({
  title,
  overdue,
  rows,
  today,
  supervisor,
}: {
  title: string;
  overdue?: boolean;
  rows: ActionRow[];
  today: string;
  supervisor: boolean;
}) {
  return (
    <section className="panel" aria-labelledby={overdue ? 'atrasadas-titulo' : 'hoy-titulo'}>
      <h2 id={overdue ? 'atrasadas-titulo' : 'hoy-titulo'} className="panel-h m-0">
        {overdue ? <AlertTriangle className="i text-danger" size={18} aria-hidden="true" /> : null}
        {title}
      </h2>
      <table className="tbl wrap">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Teléfono</th>
            <th>Oportunidad</th>
            <th>Acción</th>
            <th>Fecha</th>
            {supervisor ? <th>Vendedor</th> : null}
            <th>
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.opportunity_id}>
              <td>
                <Link className="font-semibold hover:underline" href={`/clientes/${row.customer_id}`}>
                  {row.customer_name}
                </Link>
              </td>
              <td>{formatPhone(row.customer_phone)}</td>
              <td>
                <div>{row.title}</div>
                <TypeTag type={row.type} />
              </td>
              <td>{row.next_action_text}</td>
              <td>
                {overdue ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-danger">
                    <AlertTriangle className="i" size={14} aria-hidden="true" />
                    {overdueLabel(daysBetween(row.next_action_date, today))}
                  </span>
                ) : (
                  <span className="font-semibold text-warning-text">Hoy</span>
                )}
                <br />
                <span className="text-ink-2">{formatDate(row.next_action_date)}</span>
              </td>
              {supervisor ? <td>{row.owner_name}</td> : null}
              <td>
                <span className="flex items-center gap-2">
                  <ActivityDialog customerId={row.customer_id} opportunityId={row.opportunity_id} suggestNextAction />
                  <Button asChild variant="ghost" size="sm">
                    <Link href={`/oportunidades/${row.opportunity_id}`}>Abrir</Link>
                  </Button>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
