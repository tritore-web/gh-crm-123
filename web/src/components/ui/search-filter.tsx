import { Search } from 'lucide-react';
import { Label } from './label';

/** Campo «Buscar» de las listas (se aplica al dejar de escribir). */
export function SearchFilter({ defaultValue, placeholder = 'Nombre o teléfono' }: { defaultValue: string; placeholder?: string }) {
  return (
    <div className="flex min-w-60 flex-1 flex-col gap-1">
      <Label htmlFor="q">Buscar</Label>
      <div className="relative">
        <Search className="i pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-ink-2" size={16} aria-hidden="true" />
        <input
          id="q"
          name="q"
          type="search"
          defaultValue={defaultValue}
          placeholder={placeholder}
          maxLength={60}
          autoComplete="off"
          className="h-8 w-full rounded-sm border border-line-strong bg-surface pr-2.5 pl-8 text-[14px] text-ink placeholder:text-ink-2"
        />
      </div>
    </div>
  );
}
