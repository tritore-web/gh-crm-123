import type { z } from 'zod';

export type FieldErrors = Record<string, string>;
export type ActionResult<T extends object = object> = ({ ok: true } & T) | { ok: false; error: string; fieldErrors?: FieldErrors };

export const fail = (error: string, fieldErrors?: FieldErrors): { ok: false; error: string; fieldErrors?: FieldErrors } => ({
  ok: false,
  error,
  fieldErrors,
});

/** El primer mensaje de cada campo, para mostrarlo junto al campo. */
export function zodFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? '_');
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

/** FormData → objeto de textos (los archivos no se admiten). */
export function formToObject(formData: FormData): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of formData.entries()) if (typeof value === 'string') out[key] = value;
  return out;
}
