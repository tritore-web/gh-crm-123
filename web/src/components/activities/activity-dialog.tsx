'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field, fieldAria } from '@/components/ui/field';
import { FormDialog } from '@/components/ui/form-dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ACTIVITY_LABEL, ACTIVITY_TYPES } from '@/lib/labels';
import { toLocalInput } from '@/lib/dates';
import { registerActivity } from '@/app/(app)/actividades/actions';
import { setNextAction } from '@/app/(app)/oportunidades/actions';

/**
 * «Registrar actividad». Si la actividad es de una oportunidad abierta, al guardarla se propone definir la
 * siguiente acción (fecha + texto) o dejarla sin acción (DESIGN_BRIEF §7, flujo 2).
 */
export function ActivityDialog({
  customerId,
  opportunityId,
  suggestNextAction,
  label = 'Registrar actividad',
  variant = 'secondary',
  size = 'sm',
}: {
  customerId: string;
  opportunityId?: string;
  suggestNextAction?: boolean;
  label?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'default' | 'sm';
}) {
  const [step, setStep] = useState<'closed' | 'activity' | 'next'>('closed');
  // "Ahora" se calcula al abrir, en hora de Madrid, y no al cargar la página.
  const [now, setNow] = useState('');
  const close = () => setStep('closed');

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        onClick={() => {
          setNow(toLocalInput(new Date()));
          setStep('activity');
        }}
      >
        <Plus className="i" size={16} aria-hidden="true" />
        {label}
      </Button>

      <FormDialog
        open={step === 'activity'}
        onClose={close}
        title="Registrar actividad"
        action={registerActivity}
        newIdField="id"
        hidden={{ customer_id: customerId, opportunity_id: opportunityId ?? '' }}
        submitLabel="Guardar"
        onSuccess={() => (suggestNextAction && opportunityId ? setStep('next') : close())}
      >
        {(errors) => (
          <>
            <div className="grid grid-cols-2 gap-4">
              <Field id="activity_type" label="Tipo" error={errors.type}>
                <Select id="activity_type" name="type" defaultValue="llamada" {...fieldAria('activity_type', errors.type)}>
                  {ACTIVITY_TYPES.map((value) => (
                    <option key={value} value={value}>
                      {ACTIVITY_LABEL[value]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field id="activity_when" label="Fecha y hora" error={errors.occurred_at}>
                <Input id="activity_when" name="occurred_at" type="datetime-local" defaultValue={now} {...fieldAria('activity_when', errors.occurred_at)} />
              </Field>
            </div>
            <Field id="activity_description" label="Descripción" error={errors.description}>
              <Textarea id="activity_description" name="description" maxLength={2000} {...fieldAria('activity_description', errors.description)} />
            </Field>
          </>
        )}
      </FormDialog>

      {opportunityId ? (
        <FormDialog
          open={step === 'next'}
          onClose={close}
          title="Actividad guardada"
          action={setNextAction}
          hidden={{ id: opportunityId }}
          submitLabel="Guardar acción"
          secondary={{ label: 'Dejar sin acción', onClick: close }}
          intro={<p className="m-0 text-ink-2">¿Cuál es la siguiente acción de esta oportunidad?</p>}
        >
          {(errors) => <NextActionFields errors={errors} />}
        </FormDialog>
      ) : null}
    </>
  );
}

export function NextActionFields({
  errors,
  date = '',
  text = '',
}: {
  errors: Record<string, string>;
  date?: string;
  text?: string;
}) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Field id="next_date" label="Fecha" error={errors.next_action_date}>
        <Input id="next_date" name="next_action_date" type="date" defaultValue={date} {...fieldAria('next_date', errors.next_action_date)} />
      </Field>
      <Field id="next_text" label="Texto" error={errors.next_action_text}>
        <Input id="next_text" name="next_action_text" defaultValue={text} maxLength={200} placeholder="Qué hay que hacer" autoComplete="off" {...fieldAria('next_text', errors.next_action_text)} />
      </Field>
    </div>
  );
}
