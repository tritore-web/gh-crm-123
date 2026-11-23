import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

/** Estado vacío sobrio: un dibujo pequeño, un mensaje breve y la acción siguiente. */
export function EmptyState({
  icon: Icon,
  title,
  text,
  children,
}: {
  icon: LucideIcon;
  title: string;
  text?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center text-ink-2">
      <Icon size={40} strokeWidth={1.2} aria-hidden="true" />
      <div className="text-[15px] font-medium text-ink">{title}</div>
      {text ? <div>{text}</div> : null}
      {children}
    </div>
  );
}
