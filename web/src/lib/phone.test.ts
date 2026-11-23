import { describe, expect, it } from 'vitest';
import { formatPhone, isValidPhone, normalizePhone, parsePhone } from './phone';

describe('normalizePhone', () => {
  it('antepone +34 a 9 dígitos que empiezan por 6, 7, 8 o 9', () => {
    for (const n of ['600111222', '711222333', '811222333', '911222333']) {
      expect(normalizePhone(n)).toBe(`+34${n}`);
    }
  });
  it('quita espacios, puntos, guiones y paréntesis', () => {
    expect(normalizePhone(' 600 111.222 ')).toBe('+34600111222');
    expect(normalizePhone('(600)-111-222')).toBe('+34600111222');
  });
  it('convierte 00 en +', () => {
    expect(normalizePhone('0034 600 111 222')).toBe('+34600111222');
    expect(normalizePhone('0044 20 7946 0958')).toBe('+442079460958');
  });
  it('conserva el + inicial', () => {
    expect(normalizePhone('+34 600 111 222')).toBe('+34600111222');
    expect(normalizePhone('+44 20 7946 0958')).toBe('+442079460958');
  });
  it('no antepone +34 a 9 dígitos que empiezan por 1-5 ni a otras longitudes', () => {
    expect(normalizePhone('500111222')).toBe('500111222');
    expect(normalizePhone('60011122')).toBe('60011122');
  });
});

describe('parsePhone / isValidPhone', () => {
  it('acepta el formato internacional', () => {
    expect(parsePhone('600111222')).toEqual({ ok: true, value: '+34600111222' });
    expect(isValidPhone('+34600111222')).toBe(true);
  });
  it('rechaza texto, números cortos, largos o sin prefijo', () => {
    expect(parsePhone('abc').ok).toBe(false);
    expect(parsePhone('').ok).toBe(false);
    expect(parsePhone('+1234567').ok).toBe(false); // 7 dígitos
    expect(parsePhone('+1234567890123456').ok).toBe(false); // 16 dígitos
    expect(parsePhone('+0600111222').ok).toBe(false); // empieza por 0
    expect(parsePhone('500111222').ok).toBe(false);
  });
  it('acepta el mínimo (8) y el máximo (15) de dígitos', () => {
    expect(isValidPhone('+12345678')).toBe(true);
    expect(isValidPhone('+123456789012345')).toBe(true);
  });
});

describe('formatPhone', () => {
  it('muestra los +34 con espacios', () => {
    expect(formatPhone('+34600111222')).toBe('+34 600 111 222');
  });
  it('deja intactos otros prefijos', () => {
    expect(formatPhone('+442079460958')).toBe('+442079460958');
  });
});
