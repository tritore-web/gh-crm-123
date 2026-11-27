'use client';

import { useCallback, useState, useTransition } from 'react';
import type { ActionResult } from '@/lib/action-result';

export const NETWORK_ERROR = 'No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.';

/**
 * Envía un formulario a una Server Action y conserva lo escrito si algo falla.
 * Un corte de conexión NO pierde el formulario: se muestra el aviso con "Reintentar", que reenvía lo mismo
 * (con el mismo identificador, para que un reintento no duplique el registro).
 */
export function useActionForm<T extends object>(action: (formData: FormData) => Promise<ActionResult<T>>) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult<T> | null>(null);
  const [networkError, setNetworkError] = useState(false);

  const submit = useCallback(
    (formData: FormData, onDone?: (result: ActionResult<T>) => void) => {
      setNetworkError(false);
      startTransition(async () => {
        try {
          const outcome = await action(formData);
          setResult(outcome);
          onDone?.(outcome);
        } catch {
          setNetworkError(true);
        }
      });
    },
    [action],
  );

  return { submit, pending, result, networkError, fieldErrors: result && !result.ok ? (result.fieldErrors ?? {}) : {}, error: result && !result.ok ? result.error : undefined };
}
