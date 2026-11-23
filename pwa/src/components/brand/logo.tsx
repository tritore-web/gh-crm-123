import { cn } from '@/lib/utils';

/** Marca: nombre CRM-123 con un libro abierto estilizado (propuesta de diseño). */
export function Logo({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 text-[18px] leading-6 font-bold text-brown', className)}>
      <svg className="i" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 6C10 4.5 7 4 3 4.5V19c4-.5 7 0 9 1.5 2-1.5 5-2 9-1.5V4.5C17 4 14 4.5 12 6zM12 6v14.5" />
      </svg>
      <span>CRM-123</span>
    </span>
  );
}
