// Búsqueda de clientes por nombre o teléfono. El texto del usuario se limpia antes de entrar en un filtro de
// PostgREST: los caracteres , ( ) " \ * % romperían la sintaxis o ampliarían la búsqueda sin querer.
const MAX_TERM_LENGTH = 60;
const MAX_TERMS = 5;

export function sanitizeSearch(raw: string): string {
  return raw
    .replace(/[,()"\\*%\u0000-\u001f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_TERM_LENGTH);
}

export function searchTerms(raw: string): string[] {
  const clean = sanitizeSearch(raw);
  return clean === '' ? [] : clean.split(' ').slice(0, MAX_TERMS);
}

/**
 * Filtro `or(...)` para UNA palabra: nombre, apellidos o (si lleva cifras) teléfono.
 * Varias palabras se combinan con AND, una llamada a `.or()` por palabra.
 */
export function customerTermFilter(term: string): string {
  const parts = [`first_name.ilike.*${term}*`, `last_name.ilike.*${term}*`];
  const digits = term.replace(/\D/g, '');
  if (digits.length >= 2) parts.push(`phone.ilike.*${digits}*`);
  return parts.join(',');
}
