import { describe, expect, it } from 'vitest';
import { safeNextPath } from './redirect';

describe('safeNextPath', () => {
  it('admite rutas internas, con su consulta', () => {
    expect(safeNextPath('/clientes')).toBe('/clientes');
    expect(safeNextPath('/oportunidades?x=1')).toBe('/oportunidades?x=1');
  });
  it('rechaza direcciones externas o ambiguas', () => {
    expect(safeNextPath('https://malo.example')).toBe('/');
    expect(safeNextPath('//malo.example')).toBe('/');
    expect(safeNextPath('/\\malo.example')).toBe('/');
    expect(safeNextPath('javascript:alert(1)')).toBe('/');
  });
  it('rechaza valores que no son texto y las rutas de acceso', () => {
    expect(safeNextPath(undefined)).toBe('/');
    expect(safeNextPath(null)).toBe('/');
    expect(safeNextPath('/ingresar')).toBe('/');
    expect(safeNextPath('/cambiar-contrasena')).toBe('/');
  });
});
