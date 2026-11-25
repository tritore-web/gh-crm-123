import * as React from 'react';
import { cn } from '@/lib/utils';

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        'min-h-[72px] w-full rounded-sm border border-line-strong bg-surface px-2.5 py-1.5 text-[14px] text-ink placeholder:text-ink-2 aria-[invalid=true]:border-2 aria-[invalid=true]:border-danger',
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';
