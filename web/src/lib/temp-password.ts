import { randomBytes } from 'node:crypto';
import { isStrongPassword } from './password';

// Contraseña temporal (TECHNICAL_SPEC §6.1.3): 14 caracteres aleatorios con crypto.randomBytes.
// Sin caracteres que se confunden al dictarla (0/O, 1/l/I). Siempre cumple la política: letras y números.
const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const DIGITS = '23456789';
const ALL = LETTERS + DIGITS;

/** Elige un índice sin sesgo (descarta los bytes que romperían el reparto equitativo). */
function pick(alphabet: string): string {
  const limit = 256 - (256 % alphabet.length);
  for (;;) {
    const [byte] = randomBytes(1);
    if (byte < limit) return alphabet[byte % alphabet.length];
  }
}

export function generateTempPassword(length = 14): string {
  // Dos letras y dos cifras garantizadas; el resto, de todo el alfabeto; después se mezclan.
  const chars = [pick(LETTERS), pick(LETTERS), pick(DIGITS), pick(DIGITS)];
  while (chars.length < length) chars.push(pick(ALL));
  for (let i = chars.length - 1; i > 0; i -= 1) {
    const limit = 256 - (256 % (i + 1));
    let byte = randomBytes(1)[0];
    while (byte >= limit) byte = randomBytes(1)[0];
    const j = byte % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  const password = chars.join('');
  return isStrongPassword(password) ? password : generateTempPassword(length);
}
