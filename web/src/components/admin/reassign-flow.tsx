'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRightLeft } from 'lucide-react';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { Field, fieldAria } from '@/components/ui/field';
import { RetryBanner, SavingLabel } from '@/components/ui/form-bits';
import { Select } from '@/components/ui/select';
import { NETWORK_ERROR, useActionForm } from '@/lib/use-action-form';
import { reassignCustomers } from '@/app/(app)/admin/reasignar/actions';

export type ReassignCustomer = { id: string; name: string; phone: string; archived: boolean; opportunities: number };

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Pasos 2 a 4 del flujo: elegir clientes, elegir destino y confirmar con el resumen. */
export function ReassignFlow({
  originId,
  originName,
  customers,
  destinations,
  truncated,
}: {
  originId: string;
  originName: string;
  customers: ReassignCustomer[];
  destinations: { id: string; name: string }[];
  truncated: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(() => new Set(customers.map((c) => c.id)));
  const [dest, setDest] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [done, setDone] = useState<{ customers: number; opportunities: number; to: string } | null>(null);
  const { submit, pending, error, networkError, fieldErrors } = useActionForm(reassignCustomers);

  const chosen = useMemo(() => customers.filter((c) => selected.has(c.id)), [customers, selected]);
  const opportunities = chosen.reduce((sum, c) => sum + c.opportunities, 0);
  const destName = destinations.find((d) => d.id === dest)?.name ?? '';
  const allSelected = customers.length > 0 && selected.size === customers.length;
  const canReassign = chosen.length > 0 && dest !== '';

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const send = () => {
    const formData = new FormData();
    formData.set('origin_id', originId);
    formData.set('dest_id', dest);
    for (const customer of chosen) formData.append('customer_id', customer.id);
    submit(formData, (result) => {
      if (!result.ok) return;
      const counts = result as { customers?: number; opportunities?: number };
      setConfirming(false);
      setDone({ customers: counts.customers ?? 0, opportunities: counts.opportunities ?? 0, to: destName });
      router.refresh();
    });
  };

  if (customers.length === 0) {
    return (
      <>
        {done ? (
          <Banner tone="success">
            Reasignación completada: se pasaron {plural(done.customers, 'cliente', 'clientes')} y {plural(done.opportunities, 'oportunidad', 'oportunidades')} de {originName} a {done.to}.
          </Banner>
        ) : null}
        <div className="panel flex flex-col items-center gap-3 px-6 py-12 text-center text-ink-2">
          <div className="text-[15px] font-medium text-ink">{originName} no tiene clientes.</div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-end gap-3">
        <Field id="dest" label="Vendedor de destino" className="w-64" error={fieldErrors.dest_id}>
          <Select id="dest" value={dest} onChange={(event) => setDest(event.target.value)} {...fieldAria('dest', fieldErrors.dest_id)}>
            <option value="">Elige un vendedor</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <section className="panel" aria-labelledby="clientes-origen">
        <div className="panel-h">
          <h2 id="clientes-origen" className="m-0 text-base font-semibold">
            Clientes de {originName}
          </h2>
          <label className="ml-auto flex items-center gap-2 text-[14px] font-normal text-ink">
            <input
              type="checkbox"
              className="size-4 accent-primary"
              checked={allSelected}
              onChange={() => setSelected(allSelected ? new Set() : new Set(customers.map((c) => c.id)))}
            />
            Seleccionar todos
          </label>
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>
                <span className="sr-only">Elegir</span>
              </th>
              <th>Cliente</th>
              <th>Teléfono</th>
              <th>Oportunidades</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id}>
                <td>
                  <input
                    type="checkbox"
                    className="size-4 accent-primary"
                    checked={selected.has(customer.id)}
                    onChange={() => toggle(customer.id)}
                    aria-label={`Elegir a ${customer.name}`}
                  />
                </td>
                <td>
                  <span className="font-semibold">{customer.name}</span>
                  {customer.archived ? <span className="tag ml-2">Archivado</span> : null}
                </td>
                <td>{customer.phone}</td>
                <td>{plural(customer.opportunities, 'oportunidad', 'oportunidades')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {truncated ? <p className="m-0 text-xs text-ink-2">Se muestran los primeros {customers.length} clientes. Reasigna y vuelve a abrir esta pantalla para ver el resto.</p> : null}

      <div>
        <Button type="button" disabled={!canReassign} onClick={() => setConfirming(true)}>
          <ArrowRightLeft className="i" size={16} aria-hidden="true" />
          Reasignar
        </Button>
      </div>

      <Dialog open={confirming} onClose={() => !pending && setConfirming(false)} title="Confirmar reasignación">
        <p className="m-0">
          Se pasarán <b>{plural(chosen.length, 'cliente', 'clientes')}</b> y <b>{plural(opportunities, 'oportunidad', 'oportunidades')}</b> de {originName} a {destName}.
        </p>
        {error ? <Banner tone="error">{error}</Banner> : null}
        {networkError ? <RetryBanner message={NETWORK_ERROR} onRetry={send} disabled={pending} /> : null}
        <div className="mt-1 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={() => setConfirming(false)} disabled={pending}>
            Cancelar
          </Button>
          <Button type="button" onClick={send} disabled={pending} aria-busy={pending}>
            <SavingLabel pending={pending} label="Reasignar" pendingLabel="Reasignando…" />
          </Button>
        </div>
      </Dialog>
    </>
  );
}
