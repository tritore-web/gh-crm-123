import { describe, expect, it } from 'vitest';
import { safeEqual } from './safe-equal';

describe('safeEqual', () => {
  const secret = 'k3Y-0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKL';
  it('acepta el mismo secreto', () => {
    expect(safeEqual(secret, secret)).toBe(true);
  });
  it('rechaza un secreto casi igual (un carácter distinto)', () => {
    expect(safeEqual(`${secret.slice(0, -1)}X`, secret)).toBe(false);
  });
  it('rechaza longitudes distintas sin lanzar error', () => {
    expect(safeEqual(`${secret}x`, secret)).toBe(false);
    expect(safeEqual(secret.slice(1), secret)).toBe(false);
  });
  it('rechaza valores ausentes o vacíos, también si el esperado no está configurado', () => {
    expect(safeEqual(undefined, secret)).toBe(false);
    expect(safeEqual(null, secret)).toBe(false);
    expect(safeEqual('', secret)).toBe(false);
    expect(safeEqual(secret, undefined)).toBe(false);
    expect(safeEqual('', '')).toBe(false);
  });
  it('distingue mayúsculas de minúsculas', () => {
    expect(safeEqual(secret.toLowerCase(), secret)).toBe(false);
  });
});
