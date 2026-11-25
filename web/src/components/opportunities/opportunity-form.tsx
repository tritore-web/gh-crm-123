'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CustomerPicker } from '@/components/customers/customer-picker';
import { Button } from '@/components/ui/button';
import { Field, fieldAria } from '@/components/ui/field';
import { FormSummary, RetryBanner, SavingLabel } from '@/components/ui/form-bits';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { OPEN_STAGES, OPPORTUNITY_TYPES, STAGE_LABEL, TYPE_LABEL } from '@/lib/labels';
import { NETWORK_ERROR, useActionForm } from '@/lib/use-action-form';
import { createOpportunity, updateOpportunity } from '@/app/(app)/oportunidades/actions';

export type OpportunityFormValues = {
  title: string;
  type: string;
  estimated_amount: string;
  stage: string;
  next_action_date: string;
  next_action_text: string;
  notes: string;
};

type Props = {
  mode: 'new' | 'edit';
  draftId?: string;
  opportunityId?: string;
  /** Cliente ya elegido (desde una ficha) o, al editar, el de la oportunidad: no se puede cambiar. */
  customer: { id: string; label: string } | null;
  customerLocked: boolean;
  initial: OpportunityFormValues;
  /** Una oportunidad cerrada no lleva etapa ni próxima acción. */
  closed?: boolean;
  cancelHref: string;
};

export function OpportunityForm({ mode, draftId, opportunityId, customer, customerLocked, initial, closed = false, cancelHref }: Props) {
  const router = useRouter();
  const { submit, pending, fieldErrors, error, networkError } = useActionForm(mode === 'new' ? createOpportunity : updateOpportunity);
  const last = useRef<FormData | null>(null);

  const send = (formData: FormData) => {
    last.current = formData;
    submit(formData, (result) => {
      if (!result.ok) return;
      router.push(`/oportunidades/${result.id}`);
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
        {mode === 'edit' && opportunityId ? <input type="hidden" name="opportunity_id" value={opportunityId} /> : null}

        {mode === 'new' ? (
          <CustomerPicker initial={customer} locked={customerLocked} error={fieldErrors.customer_id} />
        ) : customer ? (
          <Field id="customer_fixed" label="Cliente">
            <Input id="customer_fixed" value={customer.label} readOnly disabled />
          </Field>
        ) : null}

        <Field id="title" label="Título" error={fieldErrors.title}>
          <Input id="title" name="title" defaultValue={initial.title} maxLength={120} autoComplete="off" {...fieldAria('title', fieldErrors.title)} />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field id="type" label="Tipo" error={fieldErrors.type}>
            <Select id="type" name="type" defaultValue={initial.type} {...fieldAria('type', fieldErrors.type)}>
              <option value="">Elige el tipo</option>
              {OPPORTUNITY_TYPES.map((value) => (
                <option key={value} value={value}>
                  {TYPE_LABEL[value]}
                </option>
              ))}
            </Select>
          </Field>
          <Field id="estimated_amount" label="Monto estimado (€)" error={fieldErrors.estimated_amount}>
            <Input id="estimated_amount" name="estimated_amount" inputMode="decimal" defaultValue={initial.estimated_amount} placeholder="0,00" autoComplete="off" {...fieldAria('estimated_amount', fieldErrors.estimated_amount)} />
          </Field>
        </div>

        {closed ? null : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Field id="stage" label="Etapa" error={fieldErrors.stage}>
                <Select id="stage" name="stage" defaultValue={initial.stage} {...fieldAria('stage', fieldErrors.stage)}>
                  {OPEN_STAGES.map((value) => (
                    <option key={value} value={value}>
                      {STAGE_LABEL[value]}
                    </option>
                  ))}
                </Select>
              </Field>
              <div />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field id="next_action_date" label="Próxima acción: fecha" error={fieldErrors.next_action_date}>
                <Input id="next_action_date" name="next_action_date" type="date" defaultValue={initial.next_action_date} {...fieldAria('next_action_date', fieldErrors.next_action_date)} />
              </Field>
              <Field id="next_action_text" label="Próxima acción: texto" error={fieldErrors.next_action_text}>
                <Input id="next_action_text" name="next_action_text" defaultValue={initial.next_action_text} placeholder="Qué hay que hacer" maxLength={200} autoComplete="off" {...fieldAria('next_action_text', fieldErrors.next_action_text)} />
              </Field>
            </div>
          </>
        )}

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
