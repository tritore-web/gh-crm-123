import Link from 'next/link';
import type { PageInfo } from '@/lib/pagination';
import { PAGE_SIZE } from '@/lib/pagination';

function href(basePath: string, params: Record<string, string | undefined>, page: number) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) if (value) query.set(key, value);
  if (page > 1) query.set('pagina', String(page));
  const text = query.toString();
  return text ? `${basePath}?${text}` : basePath;
}

/** Pie de tabla: "1–8 de 8", "Página 1 de 1 · 50 por página" y enlaces de página. */
export function Pager({ info, basePath, params }: { info: PageInfo; basePath: string; params: Record<string, string | undefined> }) {
  return (
    <div className="pager">
      <span>
        {info.first}–{info.last} de {info.total}
      </span>
      <span className="ml-auto flex items-center gap-3">
        {info.page > 1 ? (
          <Link className="link" href={href(basePath, params, info.page - 1)} rel="prev">
            Anterior
          </Link>
        ) : null}
        <span>
          Página {info.page} de {info.pages} · {PAGE_SIZE} por página
        </span>
        {info.page < info.pages ? (
          <Link className="link" href={href(basePath, params, info.page + 1)} rel="next">
            Siguiente
          </Link>
        ) : null}
      </span>
    </div>
  );
}
