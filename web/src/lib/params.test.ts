import { describe, expect, it } from 'vitest';
import { firstParam, uuidOrNull } from './params';

describe('parámetros de la dirección', () => {
  it('firstParam toma el primer valor y tolera lo que falta', () => {
    expect(firstParam('a')).toBe('a');
    expect(firstParam(['a', 'b'])).toBe('a');
    expect(firstParam(undefined)).toBe('');
    expect(firstParam([])).toBe('');
  });
  it('uuidOrNull solo deja pasar UUID válidos', () => {
    expect(uuidOrNull('3f2b8c1e-5d4a-4b6e-9c7d-1a2b3c4d5e6f')).toBe('3f2b8c1e-5d4a-4b6e-9c7d-1a2b3c4d5e6f');
    expect(uuidOrNull('x')).toBeNull();
    expect(uuidOrNull("1' or '1'='1")).toBeNull();
    expect(uuidOrNull('')).toBeNull();
  });
});
