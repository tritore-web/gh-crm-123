import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Botones del diseño: principal (verde), secundario (borde) y discreto. Archivar, Anular y Desactivar son
// secundarios, nunca rojos (README.handoff §6).
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-sm border border-transparent font-medium leading-none transition-colors disabled:cursor-not-allowed disabled:opacity-55 aria-disabled:cursor-not-allowed aria-disabled:opacity-55',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary-hover',
        secondary: 'bg-surface border-line-strong text-ink hover:bg-row-hover',
        ghost: 'text-primary hover:bg-primary-tint px-2',
      },
      size: {
        default: 'h-8 px-3 text-[14px]',
        sm: 'h-7 px-2.5 text-[13px]',
        lg: 'h-9 px-3 text-[14px]',
      },
      block: { true: 'w-full', false: '' },
    },
    defaultVariants: { variant: 'primary', size: 'default', block: false },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, block, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size, block }), className)} {...props} />;
  },
);
Button.displayName = 'Button';
