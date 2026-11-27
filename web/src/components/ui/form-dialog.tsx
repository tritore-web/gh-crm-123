'use client';

import { useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Button, type ButtonProps } from './button';
import { Dialog } from './dialog';
import { FormSummary, RetryBanner, SavingLabel } from './form-bits';
import { NETWORK_ERROR, useActionForm } from '@/lib/use-action-form';
import type { ActionResult, FieldErrors } from '@/lib/action-result';

type Action = (formData: FormData) => Promise<ActionResult<object>>;

type BodyProps = {
  action: Action;
  hidden?: Record<string, string>;
  /** Nombre del campo oculto que lleva un identificador nuevo (para que un reintento no duplique el alta). */
  newIdField?: string;
  submitLabel: string;
  intro?: ReactNode;
  onClose: () => void;
  onSuccess?: (result: object) => void;
  /** Por defecto se refresca la pantalla al guardar. Un flujo de varios pasos lo pospone hasta el último. */
  refreshOnSuccess?: boolean;
  secondary?: { label: string; onClick: () => void };
  children: (fieldErrors: FieldErrors) => ReactNode;
};

function Body({ action, hidden, newIdField, submitLabel, intro, onClose, onSuccess, refreshOnSuccess = true, secondary, children }: BodyProps) {
  const router = useRouter();
  const [draftId] = useState(() => (newIdField ? crypto.randomUUID() : ''));
  const { submit, pending, fieldErrors, error, networkError } = useActionForm(action);
  const last = useRef<FormData | null>(null);

  const send = (formData: FormData) => {
    last.current = formData;
    submit(formData, (result) => {
      if (!result.ok) return;
      if (refreshOnSuccess) router.refresh();
      if (onSuccess) onSuccess(result);
      else onClose();
    });
  };

  return (
    <form
      noValidate
      className="flex flex-col gap-3.5"
      onSubmit={(event) => {
        event.preventDefault();
        send(new FormData(event.currentTarget));
      }}
    >
      {intro}
      <FormSummary fieldErrors={fieldErrors} error={error} />
      {networkError ? <RetryBanner message={NETWORK_ERROR} onRetry={() => last.current && send(last.current)} disabled={pending} /> : null}
      {Object.entries(hidden ?? {}).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      {newIdField ? <input type="hidden" name={newIdField} value={draftId} /> : null}
      {children(fieldErrors)}
      <div className="mt-1 flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={secondary ? secondary.onClick : onClose} disabled={pending}>
          {secondary ? secondary.label : 'Cancelar'}
        </Button>
        <Button type="submit" disabled={pending} aria-busy={pending}>
          <SavingLabel pending={pending} label={submitLabel} />
        </Button>
      </div>
    </form>
  );
}

/** Diálogo con formulario conectado a una acción de servidor. Controlado por quien lo usa. */
export function FormDialog({ open, onClose, title, ...body }: Omit<BodyProps, 'onClose'> & { open: boolean; onClose: () => void; title: string }) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <Body {...body} onClose={onClose} />
    </Dialog>
  );
}

/** Botón que abre su propio FormDialog. */
export function FormDialogButton({
  trigger,
  ...dialog
}: Omit<BodyProps, 'onClose'> & {
  title: string;
  trigger: { label: string; icon?: ReactNode; variant?: ButtonProps['variant']; size?: ButtonProps['size']; className?: string };
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant={trigger.variant ?? 'secondary'} size={trigger.size} className={trigger.className} onClick={() => setOpen(true)}>
        {trigger.icon}
        {trigger.label}
      </Button>
      <FormDialog open={open} onClose={() => setOpen(false)} {...dialog} />
    </>
  );
}
