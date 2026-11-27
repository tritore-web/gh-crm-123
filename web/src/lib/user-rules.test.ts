import { describe, expect, it } from 'vitest';
import { LAST_SUPERVISOR_MESSAGE, LIMIT_MESSAGE, isLastActiveSupervisor, roleIsFull, userRuleMessage } from './user-rules';

describe('límites de usuarios', () => {
  it('10 vendedores y 2 supervisores activos son el máximo', () => {
    expect(roleIsFull('vendedor', { vendedor: 9, supervisor: 2 })).toBe(false);
    expect(roleIsFull('vendedor', { vendedor: 10, supervisor: 2 })).toBe(true);
    expect(roleIsFull('supervisor', { vendedor: 0, supervisor: 2 })).toBe(true);
    expect(roleIsFull('supervisor', { vendedor: 0, supervisor: 1 })).toBe(false);
  });
  it('detecta al último supervisor activo', () => {
    const counts = { vendedor: 5, supervisor: 1 };
    expect(isLastActiveSupervisor({ role: 'supervisor', isActive: true }, counts)).toBe(true);
    expect(isLastActiveSupervisor({ role: 'supervisor', isActive: true }, { ...counts, supervisor: 2 })).toBe(false);
    expect(isLastActiveSupervisor({ role: 'vendedor', isActive: true }, counts)).toBe(false);
    expect(isLastActiveSupervisor({ role: 'supervisor', isActive: false }, counts)).toBe(false);
  });
});

describe('userRuleMessage: mensajes de la base → textos del brief', () => {
  it('traduce los límites y la regla del último supervisor', () => {
    expect(userRuleMessage('Límite alcanzado: máximo 10 vendedores activos')).toBe(LIMIT_MESSAGE.vendedor);
    expect(userRuleMessage('Límite alcanzado: máximo 2 supervisores activos')).toBe('Ya hay 2 supervisores activos.');
    expect(userRuleMessage('Debe existir al menos un supervisor activo')).toBe(LAST_SUPERVISOR_MESSAGE);
  });
  it('devuelve null para cualquier otro mensaje', () => {
    expect(userRuleMessage('otro')).toBeNull();
    expect(userRuleMessage(null)).toBeNull();
    expect(userRuleMessage(undefined)).toBeNull();
  });
});
