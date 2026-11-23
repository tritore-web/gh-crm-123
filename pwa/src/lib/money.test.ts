import { describe, expect, it } from 'vitest';
import { formatEuros, parseAmount } from './money';

describe('formatEuros', () => {
  it('usa formato es-ES con dos decimales', () => {
    expect(formatEuros(1234.5)).toBe('1.234,50 €');
    expect(formatEuros(0)).toBe('0,00 €');
    expect(formatEuros(500)).toBe('500,00 €');
    expect(formatEuros(1234567.89)).toBe('1.234.567,89 €');
  });
  it('agrupa también los importes de cuatro cifras', () => {
    expect(formatEuros(4200)).toBe('4.200,00 €');
  });
  it('quita los decimales de los enteros en modo PWA, pero no los de los no enteros', () => {
    expect(formatEuros(4200, { hideZeroDecimals: true })).toBe('4.200 €');
    expect(formatEuros(4200.5, { hideZeroDecimals: true })).toBe('4.200,50 €');
  });
});

describe('parseAmount', () => {
  it('acepta coma o punto decimal', () => {
    expect(parseAmount('500')).toBe(500);
    expect(parseAmount('500,5')).toBe(500.5);
    expect(parseAmount('500.50')).toBe(500.5);
    expect(parseAmount('1234,56')).toBe(1234.56);
  });
  it('acepta separador de miles', () => {
    expect(parseAmount('1.234,50')).toBe(1234.5);
    expect(parseAmount('1,234.50')).toBe(1234.5);
    expect(parseAmount('2.500')).toBe(2500);
    expect(parseAmount('1.234.567,89')).toBe(1234567.89);
  });
  it('ignora espacios y el símbolo €', () => {
    expect(parseAmount(' 1.234,50 € ')).toBe(1234.5);
  });
  it('rechaza más de dos decimales, texto, negativos y vacíos', () => {
    expect(parseAmount('12,345678')).toBeNull();
    expect(parseAmount('12,')).toBeNull();
    expect(parseAmount('abc')).toBeNull();
    expect(parseAmount('-5')).toBeNull();
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('1.2.3')).toBeNull();
  });
});
