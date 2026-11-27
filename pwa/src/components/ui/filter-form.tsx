'use client';

import { useRef, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/** Filtros en la dirección (?q=…&filtro=…): el texto se aplica al dejar de escribir o con Enter. */
export function FilterForm({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const apply = (form: HTMLFormElement) => {
    const query = new URLSearchParams();
    for (const [key, value] of new FormData(form).entries()) if (typeof value === 'string' && value !== '') query.set(key, value);
    const text = query.toString();
    router.replace(text ? `${pathname}?${text}` : pathname);
  };

  return (
    <form
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        if (timer.current) clearTimeout(timer.current);
        apply(event.currentTarget);
      }}
      onChange={(event) => {
        const form = event.currentTarget;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => apply(form), 400);
      }}
    >
      {children}
    </form>
  );
}
