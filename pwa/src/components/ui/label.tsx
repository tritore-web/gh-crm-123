import * as React from 'react';
import { cn } from '@/lib/utils';

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className, ...props }, ref) => (
    <label ref={ref} className={cn('text-[14px] leading-[20px] font-medium text-ink', className)} {...props} />
  ),
);
Label.displayName = 'Label';
