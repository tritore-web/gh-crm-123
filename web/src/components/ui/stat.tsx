import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Indicador numérico del Tablero (28 px, cifras tabulares). */
export function Stat({
  label,
  value,
  sub,
  late = false,
  icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  late?: boolean;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-md border border-line bg-surface p-4">
      <div className="flex items-center gap-1.5 text-[13px] text-ink-2">
        {icon}
        {label}
      </div>
      <div className={cn('text-[28px] leading-9 font-bold', late ? 'text-danger' : 'text-ink')}>{value}</div>
      <div className="text-[13px] text-ink-2">{sub ?? ' '}</div>
    </div>
  );
}
