import { describe, expect, it } from 'vitest';
import { PAGE_SIZE, pageInfo, pageRange, parsePage } from './pagination';

describe('paginación de 50 en 50', () => {
  it('parsePage acepta enteros positivos y descarta lo demás', () => {
    expect(PAGE_SIZE).toBe(50);
    expect(parsePage('3')).toBe(3);
    expect(parsePage(['2', '9'])).toBe(2);
    for (const bad of [undefined, '', '0', '-1', '1.5', 'x', '99999999']) expect(parsePage(bad)).toBe(1);
  });
  it('pageRange da el rango inclusivo de filas', () => {
    expect(pageRange(1)).toEqual([0, 49]);
    expect(pageRange(3)).toEqual([100, 149]);
  });
  it('pageInfo describe "1–8 de 8" y "Página 1 de 1"', () => {
    expect(pageInfo(1, 8)).toEqual({ first: 1, last: 8, total: 8, page: 1, pages: 1 });
    expect(pageInfo(2, 120)).toEqual({ first: 51, last: 100, total: 120, page: 2, pages: 3 });
    expect(pageInfo(1, 0)).toEqual({ first: 0, last: 0, total: 0, page: 1, pages: 1 });
  });
});
