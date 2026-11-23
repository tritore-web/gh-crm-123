// Teléfono: identificador del cliente (TECHNICAL_SPEC §5.1).
const E164 = /^\+[1-9][0-9]{7,14}$/;
const SPANISH_NATIONAL = /^[6-9][0-9]{8}$/;

/** Quita espacios, puntos, guiones y paréntesis; `00…` pasa a `+…`; 9 dígitos españoles llevan `+34`. */
export function normalizePhone(raw: string): string {
  let value = raw.trim().replace(/[\s.\-()]/g, '');
  if (value.startsWith('00')) {
    value = `+${value.slice(2)}`;
  } else if (SPANISH_NATIONAL.test(value)) {
    value = `+34${value}`;
  }
  return value;
}

export function isValidPhone(normalized: string): boolean {
  return E164.test(normalized);
}

export type PhoneResult = { ok: true; value: string } | { ok: false };

/** Normaliza y valida. El valor devuelto es el que se guarda en la base. */
export function parsePhone(raw: string): PhoneResult {
  const value = normalizePhone(raw);
  return isValidPhone(value) ? { ok: true, value } : { ok: false };
}

/** `+34600111222` se muestra como `+34 600 111 222`; otros prefijos se muestran tal cual. */
export function formatPhone(e164: string): string {
  const match = /^\+34([0-9]{3})([0-9]{3})([0-9]{3})$/.exec(e164);
  return match ? `+34 ${match[1]} ${match[2]} ${match[3]}` : e164;
}
