import { describe, expect, it } from 'vitest';
import { generateTempPassword } from './temp-password';
import { isStrongPassword } from './password';

describe('generateTempPassword', () => {
  it('tiene 14 caracteres y cumple la política (≥ 10, letras y números)', () => {
    for (let i = 0; i < 200; i += 1) {
      const p = generateTempPassword();
      expect(p).toHaveLength(14);
      expect(isStrongPassword(p)).toBe(true);
    }
  });
  it('solo usa caracteres que no se confunden (sin 0, O, 1, l, I)', () => {
    for (let i = 0; i < 200; i += 1) expect(generateTempPassword()).toMatch(/^[A-HJ-NP-Za-km-z2-9]{14}$/);
  });
  it('lleva siempre al menos dos letras y dos cifras', () => {
    for (let i = 0; i < 200; i += 1) {
      const p = generateTempPassword();
      expect(p.replace(/[^2-9]/g, '').length).toBeGreaterThanOrEqual(2);
      expect(p.replace(/[2-9]/g, '').length).toBeGreaterThanOrEqual(2);
    }
  });
  it('no se repite (aleatoria)', () => {
    const seen = new Set(Array.from({ length: 500 }, () => generateTempPassword()));
    expect(seen.size).toBe(500);
  });
});
