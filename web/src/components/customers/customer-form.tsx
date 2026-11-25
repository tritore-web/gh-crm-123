'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Field, fieldAria } from '@/components/ui/field';
import { FormSummary, RetryBanner, SavingLabel } from '@/components/ui/form-bits';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { SOURCES, SOURCE_LABEL } from '@/lib/labels';
import { NETWORK_ERROR, useActionForm } from '@/lib/use-action-form';
import { createCustomer, updateCustomer } from '@/app/(app)/clientes/actions';

export type CustomerFormValues = {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  source: string;
  accepts_communications: boolean;
  notes: string;
  owner_id: string;
};

type Props = {
  mode: 'new' | 'edit';
  /** Identificador generado al abrir la pantalla: un reintento tras un corte no duplica el cliente. */
  draftId?: string;
  customerId?: string;
  initial: CustomerFormValues;
  /** Solo para el supervisor: vendedores entre los que elegir. */
  sellers?: { id: string; name: string }[];
  cancelHref: string;
};

export function CustomerForm({ mode, draftId, customerId, initial, sellers, cancelHref }: Props) {
  const router = useRouter();
  const action = mode === 'new' ? createCustomer : updateCustomer;
  const { submit, pending, fieldErrors, error, networkError } = useActionForm(action);
  const last = useRef<FormData | null>(null);

  const send = (formData: FormData) => {
    last.current = formData;
    submit(formData, (result) => {
      if (!result.ok) return;
      router.push(`/clientes/${result.id}`);
      router.refresh();
    });
  };

  return (
    <div className="panel">
      <form
        noValidate
        className="flex flex-col gap-4 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          send(new FormData(event.currentTarget));
        }}
      >
        <FormSummary fieldErrors={fieldErrors} error={error} />
        {networkError ? <RetryBanner message={NETWORK_ERROR} onRetry={() => last.current && send(last.current)} disabled={pending} /> : null}
        {mode === 'new' && draftId ? <input type="hidden" name="id" value={draftId} /> : null}
        {mode === 'edit' && customerId ? <input type="hidden" name="customer_id" value={customerId} /> : null}

        <div className="grid grid-cols-2 gap-4">
          <Field id="first_name" label="Nombre" error={fieldErrors.first_name}>
            <Input id="first_name" name="first_name" defaultValue={initial.first_name} maxLength={80} autoComplete="off" {...fieldAria('first_name', fieldErrors.first_name)} />
          </Field>
          <Field id="last_name" label="Apellidos" error={fieldErrors.last_name}>
            <Input id="last_name" name="last_name" defaultValue={initial.last_name} maxLength={120} autoComplete="off" {...fieldAria('last_name', fieldErrors.last_name)} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field id="phone" label="Teléfono" error={fieldErrors.phone} help="Se usa para identificar al cliente. No se puede repetir.">
            <Input id="phone" name="phone" type="tel" inputMode="tel" defaultValue={initial.phone} placeholder="600 111 222" autoComplete="off" {...fieldAria('phone', fieldErrors.phone, 'x')} />
          </Field>
          <Field id="email" label="Correo (opcional)" error={fieldErrors.email}>
            <Input id="email" name="email" type="email" defaultValue={initial.email} placeholder="nombre@dominio.es" maxLength={200} autoComplete="off" {...fieldAria('email', fieldErrors.email)} />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field id="source" label="Origen" error={fieldErrors.source}>
            <Select id="source" name="source" defaultValue={initial.source} {...fieldAria('source', fieldErrors.source)}>
              <option value="">Elige el origen</option>
              {SOURCES.map((value) => (
                <option key={value} value={value}>
                  {SOURCE_LABEL[value]}
                </option>
              ))}
            </Select>
          </Field>
          {sellers ? (
            <Field id="owner_id" label="Vendedor asignado" error={fieldErrors.owner_id}>
              <Select id="owner_id" name="owner_id" defaultValue={initial.owner_id} {...fieldAria('owner_id', fieldErrors.owner_id)}>
                <option value="">Elige un vendedor</option>
                {sellers.map((seller) => (
                  <option key={seller.id} value={seller.id}>
                    {seller.name}
                  </option>
                ))}
              </Select>
            </Field>
          ) : (
            <div />
          )}
        </div>

        <label className="flex items-center gap-2">
          <input type="checkbox" name="accepts_communications" defaultChecked={initial.accepts_communications} className="size-4 accent-primary" />
          <span>Acepta comunicaciones</span>
        </label>

        <Field id="notes" label="Notas (opcional)" error={fieldErrors.notes}>
          <Textarea id="notes" name="notes" defaultValue={initial.notes} maxLength={2000} {...fieldAria('notes', fieldErrors.notes)} />
        </Field>

        <div className="flex items-center gap-2">
          <Button type="submit" disabled={pending} aria-busy={pending}>
            <SavingLabel pending={pending} label="Guardar" />
          </Button>
          <Button asChild variant="secondary">
            <Link href={cancelHref}>Cancelar</Link>
          </Button>
        </div>
      </form>
    </div>
  );
}
