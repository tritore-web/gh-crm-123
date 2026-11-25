import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Selector nativo con el aspecto del diseño (accesible por teclado y en móvil sin código extra). */
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative min-w-0">
      <select
        ref={ref}
        className={cn(
          'h-8 w-full min-w-0 appearance-none rounded-sm border border-line-strong bg-surface pr-8 pl-2.5 text-[14px] text-ink disabled:bg-neutral-tint disabled:text-ink-2 aria-[invalid=true]:border-2 aria-[invalid=true]:border-danger',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="i pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-ink-2" size={16} aria-hidden="true" />
    </div>
  ),
);
Select.displayName = 'Select';
