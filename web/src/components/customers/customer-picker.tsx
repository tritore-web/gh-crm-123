'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { searchCustomers, type CustomerHit } from '@/app/(app)/clientes/actions';

type Selected = { id: string; label: string };

/**
 * Selector de cliente con búsqueda por nombre o teléfono. Los clientes archivados no se pueden elegir.
 * Si se llega desde una ficha, el cliente viene fijado (`locked`).
 */
export function CustomerPicker({ initial, locked, error }: { initial: Selected | null; locked: boolean; error?: string }) {
  const [selected, setSelected] = useState<Selected | null>(initial);
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<{ q: string; hits: CustomerHit[] } | null>(null);
  const [active, setActive] = useState(0);
  const text = query.trim();
  const shown = !locked && result && result.q === text && text.length >= 2 ? result.hits : null;
  const hits = shown ?? [];
  const searched = shown !== null;
  const requestId = useRef(0);
  const listId = useId();

  useEffect(() => {
    if (locked || text.length < 2) return;
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      const found = await searchCustomers(text, false).catch(() => []);
      if (id !== requestId.current) return;
      setResult({ q: text, hits: found });
      setActive(0);
    }, 250);
    return () => clearTimeout(timer);
  }, [text, locked]);

  const choose = (hit: CustomerHit) => {
    setSelected({ id: hit.id, label: `${hit.name} · ${hit.phone}` });
    setQuery('');
    setResult(null);
  };

  if (selected) {
    return (
      <Field id="customer_picker" label={locked ? 'Cliente' : 'Cliente (busca por nombre o teléfono)'} error={error}>
        <input type="hidden" name="customer_id" value={selected.id} />
        <div className="flex items-center gap-2">
          <Input id="customer_picker" value={selected.label} readOnly disabled={locked} aria-invalid={error ? true : undefined} />
          {locked ? null : (
            <Button type="button" variant="secondary" onClick={() => setSelected(null)}>
              <X className="i" size={16} aria-hidden="true" />
              Cambiar
            </Button>
          )}
        </div>
      </Field>
    );
  }

  return (
    <Field id="customer_picker" label="Cliente (busca por nombre o teléfono)" error={error}>
      <input type="hidden" name="customer_id" value="" />
      <div className="relative">
        <Input
          id="customer_picker"
          role="combobox"
          aria-expanded={searched}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          placeholder="Busca por nombre o teléfono"
          value={query}
          aria-invalid={error ? true : undefined}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown' && hits.length > 0) {
              event.preventDefault();
              setActive((i) => Math.min(i + 1, hits.length - 1));
            } else if (event.key === 'ArrowUp' && hits.length > 0) {
              event.preventDefault();
              setActive((i) => Math.max(i - 1, 0));
            } else if (event.key === 'Enter' && hits[active]) {
              event.preventDefault(); // Enter elige el resultado; no envía el formulario
              choose(hits[active]);
            } else if (event.key === 'Enter') {
              event.preventDefault();
            } else if (event.key === 'Escape') {
              setQuery('');
            }
          }}
        />
        {searched ? (
          <ul id={listId} role="listbox" className="absolute top-full z-20 mt-1 w-full list-none rounded-md border border-line bg-surface p-1 shadow-dialog">
            {hits.length === 0 ? (
              <li className="px-2.5 py-2 text-[13px] text-ink-2">No hay clientes con esa búsqueda.</li>
            ) : (
              hits.map((hit, index) => (
                <li key={hit.id} role="option" aria-selected={index === active}>
                  <button
                    type="button"
                    onClick={() => choose(hit)}
                    className={`flex w-full items-center justify-between gap-3 rounded-sm px-2.5 py-1.5 text-left text-[13px] ${index === active ? 'bg-row-hover' : ''}`}
                  >
                    <span className="font-semibold">{hit.name}</span>
                    <span className="text-ink-2">{hit.phone}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        ) : null}
      </div>
    </Field>
  );
}
