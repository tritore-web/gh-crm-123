import { describe, expect, it } from 'vitest';
import { AUDIT_ACTION_LABEL, auditActionLabel, auditDetail, auditElement, auditWho, type AuditNames, type AuditRow } from './audit';

const names: AuditNames = {
  profiles: new Map([['p1', 'Carmen Ortega'], ['p2', 'Diego Lara'], ['p3', 'Pablo Ruiz']]),
  customers: new Map([['c1', 'Marta Gómez Ríos']]),
  opportunities: new Map([['o1', 'Cena de empresa']]),
};
const row = (over: Partial<AuditRow>): AuditRow => ({
  id: 1, action: 'cliente_creado', actor_id: 'p1', actor_role: 'supervisor', entity_type: 'customer', entity_id: 'c1', details: {}, created_at: '2026-11-23T07:31:00Z', ...over,
});

describe('etiquetas de acción (DESIGN_BRIEF §5.2 W13)', () => {
  it('cubre las 16 acciones que registra el sistema', () => {
    expect(Object.keys(AUDIT_ACTION_LABEL)).toHaveLength(16);
    expect(auditActionLabel('oportunidad_etapa')).toBe('Cambio de etapa');
    expect(auditActionLabel('usuario_activado')).toBe('Usuario reactivado');
    expect(auditActionLabel('resumen_manual_solicitado')).toBe('Resumen manual solicitado');
  });
  it('una acción desconocida se muestra tal cual', () => {
    expect(auditActionLabel('rara')).toBe('rara');
  });
});

describe('auditWho / auditElement', () => {
  it('quién: nombre y rol, o «Sistema» sin actor', () => {
    expect(auditWho(row({}), names)).toBe('Carmen Ortega · Supervisor');
    expect(auditWho(row({ actor_id: null, actor_role: null }), names)).toBe('Sistema');
    expect(auditWho(row({ actor_id: 'zzz' }), names)).toBe('Usuario · Supervisor');
  });
  it('elemento afectado', () => {
    expect(auditElement(row({}), names)).toBe('Cliente Marta Gómez Ríos');
    expect(auditElement(row({ entity_type: 'opportunity', entity_id: 'o1' }), names)).toBe('Oportunidad Cena de empresa');
    expect(auditElement(row({ entity_type: 'profile', entity_id: 'p2' }), names)).toBe('Usuario Diego Lara');
    expect(auditElement(row({ entity_type: 'settings', entity_id: null }), names)).toBe('Resumen matutino');
    expect(auditElement(row({ entity_type: 'summary_run', entity_id: 'x' }), names)).toBe('Resumen matutino');
  });
});

describe('auditDetail', () => {
  it('reasignación: De X a Y', () => {
    expect(auditDetail(row({ action: 'cliente_reasignado', details: { from: 'p2', to: 'p3' } }), names)).toBe('De Diego Lara a Pablo Ruiz');
  });
  it('cambio de etapa, con el motivo si se pierde', () => {
    expect(auditDetail(row({ action: 'oportunidad_etapa', details: { from: 'contactada', to: 'negociacion' } }), names)).toBe('Contactada → Negociación');
    expect(auditDetail(row({ action: 'oportunidad_etapa', details: { from: 'negociacion', to: 'perdida', lost_reason: 'precio' } }), names)).toBe('Negociación → Perdida (Precio)');
  });
  it('oportunidad creada: tipo y monto en euros', () => {
    expect(auditDetail(row({ action: 'oportunidad_creada', details: { type: 'evento_privado', estimated_amount: 1020 } }), names)).toBe('Evento privado · 1.020,00 €');
  });
  it('usuarios: rol y cambio de rol', () => {
    expect(auditDetail(row({ action: 'usuario_creado', details: { role: 'vendedor' } }), names)).toBe('Vendedor');
    expect(auditDetail(row({ action: 'usuario_rol_cambiado', details: { from: 'vendedor', to: 'supervisor' } }), names)).toBe('Vendedor → Supervisor');
  });
  it('ajuste: interruptor activado o desactivado', () => {
    const d = (a: boolean, b: boolean) => ({ old: { morning_summary_enabled: a }, new: { morning_summary_enabled: b } });
    expect(auditDetail(row({ action: 'ajuste_actualizado', details: d(false, true) }), names)).toBe('Interruptor activado');
    expect(auditDetail(row({ action: 'ajuste_actualizado', details: d(true, false) }), names)).toBe('Interruptor desactivado');
  });
  it('resumen: «Manual» y «Enviados X de N»', () => {
    expect(auditDetail(row({ action: 'resumen_manual_solicitado' }), names)).toBe('Manual');
    expect(auditDetail(row({ action: 'resumen_finalizado', details: { sent: 9, total: 9 } }), names)).toBe('Enviados 9 de 9');
  });
  it('sin detalle útil o con datos raros devuelve null (no rompe)', () => {
    expect(auditDetail(row({ action: 'cliente_archivado' }), names)).toBeNull();
    expect(auditDetail(row({ action: 'cliente_reasignado', details: null }), names)).toBeNull();
    expect(auditDetail(row({ action: 'oportunidad_etapa', details: 'texto' }), names)).toBeNull();
  });
});
