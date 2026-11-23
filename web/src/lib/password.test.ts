import { describe, expect, it } from 'vitest';
import { checkPassword, isStrongPassword } from './password';

describe('política de contraseña', () => {
  it('acepta 10 caracteres con letras y números', () => {
    expect(isStrongPassword('abcde12345')).toBe(true);
    expect(isStrongPassword('Libreria2026-cafe')).toBe(true);
  });
  it('rechaza menos de 10 caracteres', () => {
    expect(checkPassword('abc12345').length).toBe(false);
    expect(isStrongPassword('abc12345')).toBe(false);
  });
  it('rechaza contraseñas sin números o sin letras', () => {
    expect(isStrongPassword('abcdefghijkl')).toBe(false);
    expect(isStrongPassword('1234567890123')).toBe(false);
  });
  it('cuenta letras con tilde y eñe', () => {
    expect(isStrongPassword('contraseña12')).toBe(true);
  });
});
