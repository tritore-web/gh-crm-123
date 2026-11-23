import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'h-12 w-full min-w-0 rounded-sm border border-line-strong bg-surface px-3 text-[16px] text-ink placeholder:text-ink-2 disabled:bg-neutral-tint disabled:text-ink-2 aria-[invalid=true]:border-2 aria-[invalid=true]:border-danger',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
