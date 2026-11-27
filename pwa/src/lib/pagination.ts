export const PAGE_SIZE = 50;

/** `?pagina=3` → 3. Cualquier valor raro vuelve a la página 1. */
export function parsePage(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 && page <= 10_000 ? page : 1;
}

/** Rango de filas (inclusivo) de una página, para `.range(from, to)`. */
export function pageRange(page: number): [number, number] {
  const from = (page - 1) * PAGE_SIZE;
  return [from, from + PAGE_SIZE - 1];
}

export type PageInfo = { first: number; last: number; total: number; page: number; pages: number };

export function pageInfo(page: number, total: number): PageInfo {
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const first = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const last = Math.min(total, page * PAGE_SIZE);
  return { first, last, total, page, pages };
}
