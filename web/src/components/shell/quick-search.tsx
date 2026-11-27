'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { searchCustomers, type CustomerHit } from '@/app/(app)/clientes/actions';

/** Búsqueda rápida por nombre o teléfono: lleva a la ficha del cliente. El atajo «/» la enfoca. */
export function QuickSearch() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const requestId = useRef(0);
  const listId = useId();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<{ q: string; hits: CustomerHit[] } | null>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  // Solo se muestran resultados de lo que está escrito ahora (los de una búsqueda anterior no parpadean).
  const text = query.trim();
  const shown = result && result.q === text && text.length >= 2 ? result.hits : null;
  const hits = shown ?? [];
  const searched = shown !== null;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const el = event.target as HTMLElement | null;
      const typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable);
      if (event.key === '/' && !typing && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (text.length < 2) return;
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      const found = await searchCustomers(text, true).catch(() => []);
      if (id !== requestId.current) return; // llegó tarde: ya se escribió otra cosa
      setResult({ q: text, hits: found });
      setActive(0);
    }, 250);
    return () => clearTimeout(timer);
  }, [text]);

  const go = (hit: CustomerHit) => {
    setOpen(false);
    setQuery('');
    router.push(`/clientes/${hit.id}`);
  };

  return (
    <div
      className="relative w-80"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setOpen(false);
      }}
    >
      <Search className="i pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-ink-2" size={16} aria-hidden="true" />
      <input
        ref={inputRef}
        type="search"
        role="combobox"
        aria-expanded={open && searched}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label="Buscar cliente por nombre o teléfono"
        placeholder="Buscar cliente por nombre o teléfono"
        autoComplete="off"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            setOpen(false);
            setQuery('');
          } else if (event.key === 'ArrowDown' && hits.length > 0) {
            event.preventDefault();
            setActive((i) => Math.min(i + 1, hits.length - 1));
          } else if (event.key === 'ArrowUp' && hits.length > 0) {
            event.preventDefault();
            setActive((i) => Math.max(i - 1, 0));
          } else if (event.key === 'Enter' && hits[active]) {
            event.preventDefault();
            go(hits[active]);
          }
        }}
        className="h-8 w-full rounded-sm border border-line-strong bg-surface pr-7 pl-8 text-[14px] text-ink placeholder:text-ink-2"
      />
      <span className="pointer-events-none absolute top-1/2 right-2 -translate-y-1/2 rounded-[4px] border border-line px-[5px] text-[11px] text-ink-2">/</span>
      {open && searched ? (
        <ul id={listId} role="listbox" className="absolute top-full z-20 mt-1 w-full list-none rounded-md border border-line bg-surface p-1 shadow-dialog">
          {hits.length === 0 ? (
            <li className="px-2.5 py-2 text-[13px] text-ink-2">No hay clientes con esa búsqueda.</li>
          ) : (
            hits.map((hit, index) => (
              <li key={hit.id} role="option" aria-selected={index === active}>
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => go(hit)}
                  className={`flex w-full items-center justify-between gap-3 rounded-sm px-2.5 py-1.5 text-left text-[13px] ${index === active ? 'bg-row-hover' : ''}`}
                >
                  <span className="font-semibold">{hit.name}</span>
                  <span className="text-ink-2">
                    {hit.archived ? 'Archivado · ' : ''}
                    {hit.phone}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
