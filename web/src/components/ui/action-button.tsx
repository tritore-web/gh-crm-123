'use client';

import { useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './button';
import { Dialog } from './dialog';
import { RetryBanner, SavingLabel } from './form-bits';
import { Banner } from './banner';
import { NETWORK_ERROR, useActionForm } from '@/lib/use-action-form';
import type { ActionResult } from '@/lib/action-result';

type Props = {
  action: (formData: FormData) => Promise<ActionResult>;
  fields: Record<string, string>;
  label: string;
  icon?: ReactNode;
  size?: 'default' | 'sm';
  variant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
  /** Si se indica, pide confirmación en un diálogo antes de ejecutar. */
  confirm?: { title: string; text: string; confirmLabel: string };
};

/**
 * Botón que ejecuta una acción simple (archivar, recuperar, anular, quitar…), con confirmación opcional.
 * Muestra el resultado en el sitio y refresca la pantalla al terminar.
 */
export function ActionButton({ action, fields, label, icon, size = 'default', variant = 'secondary', className, confirm }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { submit, pending, error, networkError } = useActionForm(action);

  const run = () => {
    const formData = new FormData();
    for (const [key, value] of Object.entries(fields)) formData.set(key, value);
    submit(formData, (result) => {
      if (result.ok) {
        setOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <>
      <Button type="button" variant={variant} size={size} className={className} disabled={pending && !confirm} onClick={() => (confirm ? setOpen(true) : run())}>
        {confirm ? (
          <>
            {icon}
            {label}
          </>
        ) : pending ? (
          <SavingLabel pending label={label} pendingLabel={label} />
        ) : (
          <>
            {icon}
            {label}
          </>
        )}
      </Button>
      {!confirm && (error || networkError) ? (
        <span role="alert" className="text-xs text-danger">
          {networkError ? NETWORK_ERROR : error}
        </span>
      ) : null}
      {confirm ? (
        <Dialog open={open} onClose={() => setOpen(false)} title={confirm.title}>
          <p className="m-0 text-ink-2">{confirm.text}</p>
          {error ? <Banner tone="error">{error}</Banner> : null}
          {networkError ? <RetryBanner message={NETWORK_ERROR} onRetry={run} disabled={pending} /> : null}
          <div className="mt-1 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
              Cancelar
            </Button>
            <Button type="button" onClick={run} disabled={pending} aria-busy={pending}>
              <SavingLabel pending={pending} label={confirm.confirmLabel} pendingLabel="Guardando…" />
            </Button>
          </div>
        </Dialog>
      ) : null}
    </>
  );
}
