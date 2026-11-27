import { describe, expect, it } from 'vitest';
import { activitySchema, closeLostSchema, closeWonSchema, customerSchema, nextActionSchema, opportunitySchema, reopenSchema } from './schemas';

const uuid = '3f2b8c1e-5d4a-4b6e-9c7d-1a2b3c4d5e6f';
const customer = { first_name: ' Marta ', last_name: 'Gómez Ríos', phone: '600 111 222', email: ' MARTA@Correo.es ', source: 'web', notes: '' };

describe('customerSchema', () => {
  it('normaliza el teléfono y el correo, y no pide ningún documento de identidad', () => {
    const out = customerSchema.parse(customer);
    expect(out).toMatchObject({ first_name: 'Marta', phone: '+34600111222', email: 'marta@correo.es', accepts_communications: false, notes: null });
    expect(Object.keys(out).some((k) => /dni|nie|nif|passport|pasaporte/i.test(k))).toBe(false);
  });
  it('el correo y las notas son opcionales', () => {
    expect(customerSchema.parse({ ...customer, email: '' }).email).toBeNull();
  });
  it('la casilla de comunicaciones se activa con "on"', () => {
    expect(customerSchema.parse({ ...customer, accepts_communications: 'on' }).accepts_communications).toBe(true);
  });
  it('da errores junto a cada campo (teléfono "abc", correo mal escrito, origen vacío)', () => {
    const r = customerSchema.safeParse({ ...customer, phone: 'abc', email: 'marta@', source: '' });
    expect(r.success).toBe(false);
    const msgs = Object.fromEntries((r.error?.issues ?? []).map((i) => [String(i.path[0]), i.message]));
    expect(msgs.phone).toBe('Escribe un teléfono válido, por ejemplo 600 111 222.');
    expect(msgs.email).toBe('Escribe un correo válido.');
    expect(msgs.source).toBe('Elige el origen.');
  });
  it('rechaza un identificador que no sea UUID', () => {
    expect(customerSchema.safeParse({ ...customer, id: 'no-uuid' }).success).toBe(false);
    expect(customerSchema.safeParse({ ...customer, owner_id: 'x' }).success).toBe(false);
  });
});

const opp = { customer_id: uuid, title: 'Cena de empresa', type: 'evento_privado', estimated_amount: '1.800,00', stage: 'nueva', next_action_date: '', next_action_text: '', notes: '' };

describe('opportunitySchema', () => {
  it('acepta una oportunidad sin próxima acción', () => {
    expect(opportunitySchema.parse(opp)).toMatchObject({ title: 'Cena de empresa', estimated_amount: 1800, next_action_date: null, next_action_text: null });
  });
  it('el monto vacío es 0 y el negativo se rechaza con su mensaje', () => {
    expect(opportunitySchema.parse({ ...opp, estimated_amount: '' }).estimated_amount).toBe(0);
    const r = opportunitySchema.safeParse({ ...opp, estimated_amount: '-5' });
    expect(r.error?.issues[0].message).toBe('El monto no puede ser negativo.');
  });
  it('el título necesita 2 caracteres', () => {
    const r = opportunitySchema.safeParse({ ...opp, title: 'C' });
    expect(r.error?.issues[0].message).toBe('Escribe un título de al menos 2 caracteres.');
  });
  it('la próxima acción es fecha y texto juntos', () => {
    const onlyDate = opportunitySchema.safeParse({ ...opp, next_action_date: '2026-11-27' });
    expect(onlyDate.error?.issues[0]).toMatchObject({ path: ['next_action_text'], message: 'Escribe qué hay que hacer.' });
    const onlyText = opportunitySchema.safeParse({ ...opp, next_action_text: 'Llamar' });
    expect(onlyText.error?.issues[0].path).toEqual(['next_action_date']);
    expect(opportunitySchema.parse({ ...opp, next_action_date: '2026-11-27', next_action_text: 'Llamar' }).next_action_text).toBe('Llamar');
  });
  it('no admite crear directamente en una etapa cerrada ni un cliente que no sea UUID', () => {
    expect(opportunitySchema.safeParse({ ...opp, stage: 'ganada' }).success).toBe(false);
    expect(opportunitySchema.safeParse({ ...opp, customer_id: 'x' }).success).toBe(false);
  });
});

describe('cierres, reapertura y próxima acción', () => {
  it('Ganada exige monto final y fecha', () => {
    expect(closeWonSchema.parse({ final_amount: '1.750,00', closed_on: '2026-11-23' })).toEqual({ final_amount: 1750, closed_on: '2026-11-23' });
    expect(closeWonSchema.safeParse({ final_amount: '', closed_on: '2026-11-23' }).success).toBe(false);
    expect(closeWonSchema.safeParse({ final_amount: '10', closed_on: '2026-02-30' }).success).toBe(false);
  });
  it('Perdida exige un motivo de la lista', () => {
    expect(closeLostSchema.parse({ lost_reason: 'precio', closed_on: '2026-11-23' }).lost_reason).toBe('precio');
    expect(closeLostSchema.safeParse({ lost_reason: '', closed_on: '2026-11-23' }).error?.issues[0].message).toBe('Elige un motivo.');
    expect(closeLostSchema.safeParse({ lost_reason: 'otra', closed_on: '2026-11-23' }).success).toBe(false);
  });
  it('reabrir solo admite etapas abiertas', () => {
    expect(reopenSchema.parse({ stage: 'negociacion' }).stage).toBe('negociacion');
    expect(reopenSchema.safeParse({ stage: 'ganada' }).success).toBe(false);
  });
  it('la próxima acción exige las dos partes', () => {
    expect(nextActionSchema.safeParse({ next_action_date: '2026-11-27', next_action_text: '' }).success).toBe(false);
    expect(nextActionSchema.safeParse({ next_action_date: '', next_action_text: 'x' }).success).toBe(false);
    expect(nextActionSchema.parse({ next_action_date: '2026-11-27', next_action_text: ' Llamar ' }).next_action_text).toBe('Llamar');
  });
});

describe('activitySchema', () => {
  const base = { customer_id: uuid, opportunity_id: '', type: 'llamada', description: ' Confirmó 40 personas ', occurred_at: '2026-11-23T09:12' };
  it('convierte la hora de Madrid a un instante y la oportunidad vacía a ausente', () => {
    const out = activitySchema.parse(base);
    expect(out).toMatchObject({ description: 'Confirmó 40 personas', occurred_at: '2026-11-23T08:12:00.000Z' });
    expect(out.opportunity_id).toBeUndefined();
  });
  it('la fecha vacía deja que la base use "ahora"', () => {
    expect(activitySchema.parse({ ...base, occurred_at: '' }).occurred_at).toBeNull();
  });
  it('no se puede crear una anulación desde el formulario ni dejar la descripción vacía', () => {
    expect(activitySchema.safeParse({ ...base, type: 'anulacion' }).success).toBe(false);
    expect(activitySchema.safeParse({ ...base, description: '  ' }).error?.issues[0].message).toBe('Escribe qué pasó.');
  });
});
