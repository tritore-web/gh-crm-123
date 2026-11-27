import { describe, expect, it } from 'vitest';
import { authorName, buildTimeline, type ActivityRow } from './activities';

const seller = { id: 's1', role: 'vendedor' as const, fullName: 'Ana Martín' };
const supervisor = { id: 'p1', role: 'supervisor' as const, fullName: 'Carmen Ortega' };
const names = new Map([['s1', 'Ana Martín'], ['p1', 'Carmen Ortega']]);
const row = (over: Partial<ActivityRow>): ActivityRow => ({
  id: 'a', type: 'llamada', description: 'x', occurred_at: '2026-11-20T10:00:00Z', voids_activity_id: null, created_by: 's1', opportunity_id: null, ...over,
});

describe('authorName', () => {
  it('el supervisor ve siempre el nombre', () => {
    expect(authorName('s1', supervisor, names)).toBe('Ana Martín');
    expect(authorName('p1', supervisor, names)).toBe('Carmen Ortega');
  });
  it('el vendedor ve su nombre y «Supervisor» para cualquier otro autor (sin filtrar el nombre)', () => {
    expect(authorName('s1', seller, names)).toBe('Ana Martín');
    expect(authorName('p1', seller, new Map())).toBe('Supervisor');
  });
});

describe('buildTimeline', () => {
  const rows = [
    row({ id: 'a3', type: 'anulacion', voids_activity_id: 'a2', description: 'Anulada', created_by: 's1' }),
    row({ id: 'a2', description: 'Envié el presupuesto por WhatsApp.' }),
    row({ id: 'a1', description: 'Visita', created_by: 'p1' }),
  ];
  it('oculta las anulaciones y marca la original como anulada', () => {
    const items = buildTimeline(rows, seller, names);
    expect(items.map((i) => i.id)).toEqual(['a2', 'a1']);
    expect(items.find((i) => i.id === 'a2')?.voided).toBe(true);
    expect(items.find((i) => i.id === 'a1')?.voided).toBe(false);
  });
  it('el vendedor solo puede anular las suyas que no estén ya anuladas', () => {
    const items = buildTimeline(rows, seller, names);
    expect(items.find((i) => i.id === 'a2')?.canVoid).toBe(false); // ya anulada
    expect(items.find((i) => i.id === 'a1')?.canVoid).toBe(false); // del supervisor
    const own = buildTimeline([row({ id: 'a9' })], seller, names);
    expect(own[0].canVoid).toBe(true);
  });
  it('el supervisor puede anular cualquiera que no esté anulada', () => {
    const items = buildTimeline(rows, supervisor, names);
    expect(items.find((i) => i.id === 'a1')?.canVoid).toBe(true);
    expect(items.find((i) => i.id === 'a2')?.canVoid).toBe(false);
  });
});
