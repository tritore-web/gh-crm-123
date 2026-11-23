// Dinero: siempre euros (TECHNICAL_SPEC §5.1).
const NBSP_RE = / /g;

/** `1234.5` → `1.234,50 €`. Con `hideZeroDecimals`, un entero se muestra sin decimales (`4.200 €`, PWA). */
export function formatEuros(value: number, options: { hideZeroDecimals?: boolean } = {}): string {
  const whole = Number.isInteger(value);
  const decimals = options.hideZeroDecimals && whole ? 0 : 2;
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping: 'always', // es-ES omitiría el punto en 4 cifras (1234,50 €)
  })
    .format(value)
    .replace(NBSP_RE, ' ');
}

/**
 * Entrada de importes: acepta coma o punto decimal, con un máximo de dos decimales.
 * `1.234,50` y `1,234.50` se leen con el último separador como decimal; `2.500` (tres cifras tras
 * un único separador) se lee como miles. Devuelve `null` si no es un importe válido (≥ 0).
 */
export function parseAmount(input: string): number | null {
  const text = input.replace(/[\s€]/g, '');
  if (!/^[0-9.,]+$/.test(text) || !/[0-9]/.test(text)) return null;

  const lastSeparator = Math.max(text.lastIndexOf(','), text.lastIndexOf('.'));
  let integerPart = text;
  let decimalPart = '';

  if (lastSeparator >= 0) {
    const after = text.slice(lastSeparator + 1);
    const before = text.slice(0, lastSeparator);
    const separatorCount = (text.match(/[.,]/g) ?? []).length;
    const looksLikeThousands = after.length === 3 && separatorCount === 1 && before.length <= 3 && before.length > 0;
    if (!looksLikeThousands) {
      if (after.length === 0 || after.length > 2) return null;
      integerPart = before;
      decimalPart = after;
    }
  }

  // Lo que queda a la izquierda solo puede llevar separadores de miles bien formados.
  if (!/^([0-9]{1,3}([.,][0-9]{3})+|[0-9]+)$/.test(integerPart)) return null;
  const digits = integerPart.replace(/[.,]/g, '');
  const value = Number(decimalPart ? `${digits}.${decimalPart}` : digits);
  return Number.isFinite(value) ? value : null;
}
