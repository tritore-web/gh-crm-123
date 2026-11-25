'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

/**
 * Menú desplegable sencillo y accesible (botón + lista): se cierra con Esc, al hacer clic fuera o al elegir.
 * Los elementos son enlaces o botones normales, así que funcionan con teclado sin código adicional.
 */
export function Menu({
  label,
  icon,
  variant = 'secondary',
  align = 'right',
  children,
}: {
  label: string;
  icon?: ReactNode;
  variant?: 'primary' | 'secondary';
  align?: 'left' | 'right';
  children: (close: () => void) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (root.current && !root.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={root} className="relative">
      <Button type="button" variant={variant} aria-haspopup="menu" aria-expanded={open} aria-controls={open ? listId : undefined} onClick={() => setOpen((v) => !v)}>
        {icon}
        {label}
        <ChevronDown className="i" size={16} aria-hidden="true" />
      </Button>
      {open ? (
        <ul
          id={listId}
          role="menu"
          className={cn(
            'absolute top-full z-20 mt-1 flex min-w-44 list-none flex-col rounded-md border border-line bg-surface p-1 shadow-dialog',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {children(() => setOpen(false))}
        </ul>
      ) : null}
    </div>
  );
}

export const menuItemClass =
  'flex h-8 w-full items-center gap-2 rounded-sm px-2.5 text-left text-[14px] text-ink hover:bg-row-hover focus-visible:bg-row-hover';
