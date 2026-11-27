import { describe, expect, it } from 'vitest';
import { daysBetween, formatClock, formatDate, formatDateTime, formatInstantDate, isValidIsoDate, localInputToIso, overdueLabel, toLocalInput, weekdayName } from './dates';

describe('formatDate', () => {
  it('muestra dd/mm/aaaa', () => {
    expect(formatDate('2026-11-23')).toBe('23/11/2026');
    expect(formatDate('2026-01-05')).toBe('05/01/2026');
  });
  it('devuelve vacío si el valor no es una fecha', () => {
    expect(formatDate('')).toBe('');
    expect(formatDate('23/11/2026')).toBe('');
  });
});

describe('formatDateTime', () => {
  it('usa la hora de Madrid (invierno, UTC+1)', () => {
    expect(formatDateTime('2026-11-23T07:30:00Z')).toBe('23/11/2026 08:30');
  });
  it('usa la hora de Madrid (verano, UTC+2) y pasa al día siguiente', () => {
    expect(formatDateTime('2026-07-01T22:30:00Z')).toBe('02/07/2026 00:30');
  });
  it('devuelve vacío si no es un instante válido', () => {
    expect(formatDateTime('nada')).toBe('');
  });
});

describe('weekdayName', () => {
  it('da el día de la semana en español', () => {
    expect(weekdayName('2026-11-23')).toBe('lunes');
    expect(weekdayName('2026-11-22')).toBe('domingo');
  });
});

describe('daysBetween / overdueLabel', () => {
  it('cuenta días naturales, también al cambiar de mes y de hora de verano', () => {
    expect(daysBetween('2026-11-22', '2026-11-23')).toBe(1);
    expect(daysBetween('2026-10-30', '2026-11-02')).toBe(3);
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
  });
  it('usa singular y plural', () => {
    expect(overdueLabel(1)).toBe('Atrasada · 1 día');
    expect(overdueLabel(3)).toBe('Atrasada · 3 días');
  });
});

describe('formatInstantDate', () => {
  it('da la fecha en la zona de Madrid', () => {
    expect(formatInstantDate('2026-11-23T23:30:00Z')).toBe('24/11/2026');
    expect(formatInstantDate('2026-11-23T12:00:00Z')).toBe('23/11/2026');
    expect(formatInstantDate('x')).toBe('');
  });
});

describe('campos de fecha y hora (hora de Madrid)', () => {
  it('toLocalInput y localInputToIso son inversos, en invierno y en verano', () => {
    expect(toLocalInput(new Date('2026-11-23T08:12:00Z'))).toBe('2026-11-23T09:12');
    expect(localInputToIso('2026-11-23T09:12')).toBe('2026-11-23T08:12:00.000Z');
    expect(localInputToIso('2026-07-01T00:30')).toBe('2026-06-30T22:30:00.000Z');
  });
  it('rechaza formatos inválidos y horas que no existen (salto de horario)', () => {
    expect(localInputToIso('23/11/2026 09:12')).toBeNull();
    expect(localInputToIso('')).toBeNull();
    expect(localInputToIso('2026-03-29T02:30')).toBeNull();
  });
});

describe('isValidIsoDate', () => {
  it('acepta fechas reales y rechaza las imposibles', () => {
    expect(isValidIsoDate('2026-02-28')).toBe(true);
    expect(isValidIsoDate('2026-02-30')).toBe(false);
    expect(isValidIsoDate('2026-13-01')).toBe(false);
    expect(isValidIsoDate('')).toBe(false);
  });
});

describe('formatClock', () => {
  it('da la hora de Madrid en invierno y en verano', () => {
    expect(formatClock(new Date('2026-11-23T07:44:00Z'))).toBe('08:44');
    expect(formatClock(new Date('2026-07-01T22:30:00Z'))).toBe('00:30');
  });
});
