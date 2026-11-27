import { describe, expect, it } from 'vitest';
import { customerTermFilter, sanitizeSearch, searchTerms } from './search';

describe('sanitizeSearch', () => {
  it('quita los caracteres que rompen un filtro y limpia espacios', () => {
    expect(sanitizeSearch('  Gómez,  Ríos) ')).toBe('Gómez Ríos');
    expect(sanitizeSearch('a*b%c"d\\e(f)')).toBe('a b c d e f');
  });
  it('recorta la longitud', () => {
    expect(sanitizeSearch('x'.repeat(200))).toHaveLength(60);
  });
});

describe('searchTerms', () => {
  it('separa por palabras, con un máximo de 5', () => {
    expect(searchTerms('marta gómez')).toEqual(['marta', 'gómez']);
    expect(searchTerms('a b c d e f g')).toHaveLength(5);
    expect(searchTerms('  ,, ')).toEqual([]);
  });
});

describe('customerTermFilter', () => {
  it('un nombre busca en nombre y apellidos, no en el teléfono', () => {
    expect(customerTermFilter('Ana')).toBe('first_name.ilike.*Ana*,last_name.ilike.*Ana*');
  });
  it('un número busca también en el teléfono, solo con sus cifras', () => {
    expect(customerTermFilter('600111')).toBe('first_name.ilike.*600111*,last_name.ilike.*600111*,phone.ilike.*600111*');
    expect(customerTermFilter('+34')).toContain('phone.ilike.*34*');
  });
});
