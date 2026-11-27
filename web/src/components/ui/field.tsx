import type { ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Label } from './label';
import { cn } from '@/lib/utils';

/** Campo con etiqueta visible, ayuda y error asociado al control (DESIGN_BRIEF §9). */
export function Field({
  id,
  label,
  help,
  error,
  className,
  children,
}: {
  id: string;
  label: string;
  help?: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error ? (
        <p id={`${id}-error`} className="m-0 flex items-start gap-1 text-xs leading-4 text-danger">
          <AlertTriangle className="i mt-px" size={12} aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : help ? (
        <p id={`${id}-help`} className="m-0 text-xs leading-4 text-ink-2">
          {help}
        </p>
      ) : null}
    </div>
  );
}

/** Atributos de accesibilidad de un control según tenga error o ayuda. */
export function fieldAria(id: string, error?: string, help?: string) {
  return {
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? `${id}-error` : help ? `${id}-help` : undefined,
  } as const;
}
