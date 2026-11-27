import { z } from 'zod';

export type SearchParams = Record<string, string | string[] | undefined>;

/** Primer valor de un parámetro de la dirección (?q=a&q=b → "a"). */
export function firstParam(value: string | string[] | undefined): string {
  const v = Array.isArray(value) ? value[0] : value;
  return typeof v === 'string' ? v : '';
}

/** Un identificador solo se usa en una consulta si es un UUID válido (si no, la base daría un error técnico). */
export function uuidOrNull(value: string): string | null {
  return z.uuid().safeParse(value).success ? value : null;
}
