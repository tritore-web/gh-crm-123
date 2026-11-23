import { createHash, timingSafeEqual } from 'node:crypto';

// Comparación de secretos en tiempo constante (TECHNICAL_SPEC §12). Nunca se compara un secreto con ===.
// timingSafeEqual exige longitudes iguales: se comparan los digestos SHA-256 de ambos valores.
const digest = (value: string) => createHash('sha256').update(value, 'utf8').digest();

export function safeEqual(received: string | null | undefined, expected: string | undefined): boolean {
  if (!received || !expected) return false;
  return timingSafeEqual(digest(received), digest(expected));
}
