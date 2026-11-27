import { Search } from 'lucide-react';

/** Búsqueda móvil: 48 px de alto y texto de 16 px (evita el zoom involuntario). */
export function SearchFilter({ defaultValue, placeholder, label }: { defaultValue: string; placeholder: string; label: string }) {
  return (
    <div className="relative">
      <Search className="i pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-ink-2" size={18} aria-hidden="true" />
      <input
        name="q"
        type="search"
        aria-label={label}
        defaultValue={defaultValue}
        placeholder={placeholder}
        maxLength={60}
        autoComplete="off"
        className="h-12 w-full rounded-sm border border-line-strong bg-surface pr-3 pl-10 text-[16px] text-ink placeholder:text-ink-2"
      />
    </div>
  );
}
