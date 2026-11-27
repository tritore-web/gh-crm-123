import { Banner } from './banner';
import { Button } from './button';
import type { FieldErrors } from '@/lib/action-result';

/** Resumen al inicio del formulario: «Revisa el formulario: …» (DESIGN_BRIEF §4). */
export function FormSummary({ fieldErrors, error }: { fieldErrors: FieldErrors; error?: string }) {
  const messages = Object.values(fieldErrors);
  if (messages.length === 1) return <Banner tone="error">Revisa el formulario: {messages[0]}</Banner>;
  if (messages.length > 1) return <Banner tone="error">Revisa el formulario: hay {messages.length} campos con errores.</Banner>;
  if (error) return <Banner tone="error">{error}</Banner>;
  return null;
}

/** Corte de conexión: el formulario no se pierde y se puede reintentar con lo mismo. */
export function RetryBanner({ message, onRetry, disabled }: { message: string; onRetry: () => void; disabled?: boolean }) {
  return (
    <Banner tone="error">
      <span className="flex flex-wrap items-center gap-3">
        <span>{message}</span>
        <Button type="button" size="sm" variant="secondary" onClick={onRetry} disabled={disabled}>
          Reintentar
        </Button>
      </span>
    </Banner>
  );
}

export function SavingLabel({ pending, label, pendingLabel = 'Guardando…' }: { pending: boolean; label: string; pendingLabel?: string }) {
  return pending ? (
    <>
      <span className="spin" aria-hidden="true" />
      {pendingLabel}
    </>
  ) : (
    <>{label}</>
  );
}
