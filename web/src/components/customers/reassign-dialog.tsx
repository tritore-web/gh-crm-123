'use client';

import { UserRoundCog } from 'lucide-react';
import { Field, fieldAria } from '@/components/ui/field';
import { FormDialogButton } from '@/components/ui/form-dialog';
import { Select } from '@/components/ui/select';
import { reassignCustomer } from '@/app/(app)/clientes/actions';

/** «Cambiar vendedor» (solo supervisor): las oportunidades del cliente se mueven con él. */
export function ReassignDialog({
  customerId,
  customerName,
  opportunityCount,
  options,
}: {
  customerId: string;
  customerName: string;
  opportunityCount: number;
  options: { id: string; name: string }[];
}) {
  return (
    <FormDialogButton
      title="Cambiar vendedor"
      trigger={{ label: 'Cambiar vendedor', icon: <UserRoundCog className="i" size={16} aria-hidden="true" /> }}
      action={reassignCustomer}
      hidden={{ id: customerId }}
      submitLabel="Reasignar"
      intro={
        <p className="m-0 text-ink-2">
          Se moverán también todas las oportunidades de {customerName} ({opportunityCount}) al nuevo vendedor.
        </p>
      }
    >
      {(errors) => (
        <Field id="owner_id" label="Vendedor de destino" error={errors.owner_id}>
          <Select id="owner_id" name="owner_id" defaultValue="" {...fieldAria('owner_id', errors.owner_id)}>
            <option value="">Elige un vendedor</option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </Select>
        </Field>
      )}
    </FormDialogButton>
  );
}
