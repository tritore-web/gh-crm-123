'use client';

import { useRef, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/**
 * Barra de filtros: los selectores y casillas se aplican al cambiar; el texto, al dejar de escribir o con Enter.
 * Todo vive en la dirección (?q=…&origen=…), así que se puede compartir y funciona con Atrás/Adelante.
 */
export function FilterForm({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const apply = (form: HTMLFormElement) => {
    const query = new URLSearchParams();
    for (const [key, value] of new FormData(form).entries()) {
      if (typeof value === 'string' && value !== '') query.set(key, value);
    }
    const text = query.toString();
    router.replace(text ? `${pathname}?${text}` : pathname);
  };

  return (
    <form
      role="search"
      className="mb-3 flex flex-wrap items-end gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (timer.current) clearTimeout(timer.current);
        apply(event.currentTarget);
      }}
      onChange={(event) => {
        const form = event.currentTarget;
        const target = event.target as HTMLElement;
        if (timer.current) clearTimeout(timer.current);
        if (target instanceof HTMLInputElement && (target.type === 'search' || target.type === 'text')) {
          timer.current = setTimeout(() => apply(form), 400);
        } else {
          apply(form);
        }
      }}
    >
      {children}
    </form>
  );
}
