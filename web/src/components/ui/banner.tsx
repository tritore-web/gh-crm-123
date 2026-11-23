import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

const styles = {
  info: 'bg-neutral-tint text-ink',
  error: 'bg-danger-tint text-danger',
  warning: 'bg-warning-tint text-warning-text',
  success: 'bg-success-tint text-success',
} as const;

const icons = { info: Info, error: AlertTriangle, warning: AlertTriangle, success: CheckCircle2 } as const;

/** Franja de aviso. El color nunca es el único portador de significado: lleva icono y texto. */
export function Banner({
  tone = 'info',
  locked = false,
  children,
  className,
}: {
  tone?: keyof typeof styles;
  locked?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const Icon = locked ? Lock : icons[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex items-center gap-2 rounded-sm px-4 py-2.5 text-[13px]', styles[tone], className)}
    >
      <Icon className="i" size={16} aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
