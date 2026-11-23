import { describe, expect, it } from 'vitest';
import { MESSAGES, translateDbError } from './errors';

describe('translateDbError', () => {
  it('23505 con el índice del teléfono da el mensaje de la regla 2', () => {
    const msg = 'duplicate key value violates unique constraint "customers_phone_key"';
    expect(translateDbError({ code: '23505', message: msg })).toBe(MESSAGES.duplicatePhone);
  });
  it('23505 de anulación duplicada', () => {
    const msg = 'duplicate key value violates unique constraint "activities_void_once_key"';
    expect(translateDbError({ code: '23505', message: msg })).toBe('Esa actividad ya fue anulada.');
  });
  it('23505 desconocido no revela detalles', () => {
    const msg = 'duplicate key value violates unique constraint "profiles_email_key"';
    expect(translateDbError({ code: '23505', message: msg })).toBe(MESSAGES.checkFallback);
  });
  it('23514 de negocio muestra el mensaje de la base', () => {
    const msg = 'Límite alcanzado: máximo 10 vendedores activos';
    expect(translateDbError({ code: '23514', message: msg })).toBe(msg);
  });
  it('23514 de una restricción CHECK no muestra el texto técnico', () => {
    const msg = 'new row for relation "opportunities" violates check constraint "opportunities_won_fields"';
    expect(translateDbError({ code: '23514', message: msg })).toBe('Revisa los datos e inténtalo de nuevo.');
  });
  it('42501 es falta de permiso', () => {
    expect(translateDbError({ code: '42501', message: 'permission denied' })).toBe('No tienes permiso para hacer esto.');
  });
  it('23503 y 23001 son datos relacionados', () => {
    expect(translateDbError({ code: '23503' })).toBe('No se puede completar: hay datos relacionados.');
    expect(translateDbError({ code: '23001' })).toBe('No se puede completar: hay datos relacionados.');
  });
  it('cualquier otro código, o ninguno, da el mensaje general', () => {
    expect(translateDbError({ code: 'XX000', message: 'boom at line 3' })).toBe('Algo salió mal. Inténtalo de nuevo.');
    expect(translateDbError(null)).toBe('Algo salió mal. Inténtalo de nuevo.');
    expect(translateDbError(undefined)).toBe('Algo salió mal. Inténtalo de nuevo.');
  });
});
