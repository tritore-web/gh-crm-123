import { formatEuros } from './money';
import { formatDateTime } from './dates';
import { lostReasonLabel, stageLabel, typeLabel } from './labels';
import { ROLE_LABEL, isRole } from './profile';

// Auditoría (DESIGN_BRIEF §5.2 W13): etiquetas legibles y detalle breve de cada evento. Solo lectura.
export const AUDIT_ACTION_LABEL: Record<string, string> = {
  cliente_creado: 'Cliente creado',
  cliente_reasignado: 'Cliente reasignado',
  cliente_archivado: 'Cliente archivado',
  cliente_recuperado: 'Cliente recuperado',
  oportunidad_creada: 'Oportunidad creada',
  oportunidad_etapa: 'Cambio de etapa',
  oportunidad_reasignada: 'Oportunidad reasignada',
  oportunidad_archivada: 'Oportunidad archivada',
  oportunidad_recuperada: 'Oportunidad recuperada',
  usuario_creado: 'Usuario creado',
  usuario_rol_cambiado: 'Cambio de rol',
  usuario_desactivado: 'Usuario desactivado',
  usuario_activado: 'Usuario reactivado',
  ajuste_actualizado: 'Ajuste actualizado',
  resumen_manual_solicitado: 'Resumen manual solicitado',
  resumen_finalizado: 'Resumen finalizado',
};

export const auditActionLabel = (action: string): string => AUDIT_ACTION_LABEL[action] ?? action;

export type AuditRow = {
  id: number;
  action: string;
  actor_id: string | null;
  actor_role: string | null;
  entity_type: string;
  entity_id: string | null;
  details: unknown;
  created_at: string;
};

export type AuditNames = {
  profiles: Map<string, string>;
  customers: Map<string, string>;
  opportunities: Map<string, string>;
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
const asText = (value: unknown): string | null => (typeof value === 'string' ? value : null);
const asNumber = (value: unknown): number | null => (typeof value === 'number' ? value : null);

/** «Carmen Ortega · Supervisor», o «Sistema» cuando no hay actor (clave de servicio). */
export function auditWho(row: AuditRow, names: AuditNames): string {
  if (!row.actor_id) return 'Sistema';
  const name = names.profiles.get(row.actor_id) ?? 'Usuario';
  return row.actor_role && isRole(row.actor_role) ? `${name} · ${ROLE_LABEL[row.actor_role]}` : name;
}

/** «Cliente Marta Gómez Ríos», «Oportunidad Cena…», «Usuario Diego Lara», «Resumen matutino». */
export function auditElement(row: AuditRow, names: AuditNames): string {
  const id = row.entity_id;
  switch (row.entity_type) {
    case 'customer':
      return `Cliente ${(id && names.customers.get(id)) || ''}`.trim();
    case 'opportunity':
      return `Oportunidad ${(id && names.opportunities.get(id)) || ''}`.trim();
    case 'profile':
      return `Usuario ${(id && names.profiles.get(id)) || ''}`.trim();
    case 'settings':
    case 'summary_run':
      return 'Resumen matutino';
    default:
      return row.entity_type;
  }
}

/** Detalle breve; null si no hay nada que añadir (se muestra «—»). */
export function auditDetail(row: AuditRow, names: AuditNames): string | null {
  const d = asRecord(row.details);
  const profileName = (value: unknown) => {
    const id = asText(value);
    return id ? (names.profiles.get(id) ?? 'Usuario') : null;
  };
  switch (row.action) {
    case 'cliente_reasignado':
    case 'oportunidad_reasignada': {
      const from = profileName(d.from);
      const to = profileName(d.to);
      return from && to ? `De ${from} a ${to}` : null;
    }
    case 'oportunidad_etapa': {
      const from = asText(d.from);
      const to = asText(d.to);
      if (!from || !to) return null;
      const base = `${stageLabel(from)} → ${stageLabel(to)}`;
      const reason = asText(d.lost_reason);
      return to === 'perdida' && reason ? `${base} (${lostReasonLabel(reason)})` : base;
    }
    case 'oportunidad_creada': {
      const type = asText(d.type);
      const amount = asNumber(d.estimated_amount);
      if (!type) return null;
      return amount === null ? typeLabel(type) : `${typeLabel(type)} · ${formatEuros(amount)}`;
    }
    case 'usuario_creado': {
      const role = asText(d.role);
      return role && isRole(role) ? ROLE_LABEL[role] : null;
    }
    case 'usuario_rol_cambiado': {
      const from = asText(d.from);
      const to = asText(d.to);
      return from && to && isRole(from) && isRole(to) ? `${ROLE_LABEL[from]} → ${ROLE_LABEL[to]}` : null;
    }
    case 'ajuste_actualizado': {
      const before = asRecord(asRecord(d).old);
      const after = asRecord(asRecord(d).new);
      if (before.morning_summary_enabled !== after.morning_summary_enabled) {
        return after.morning_summary_enabled === true ? 'Interruptor activado' : 'Interruptor desactivado';
      }
      return 'Ajuste modificado';
    }
    case 'resumen_manual_solicitado':
      return 'Manual';
    case 'resumen_finalizado': {
      const sent = asNumber(d.sent);
      const total = asNumber(d.total);
      return sent !== null && total !== null ? `Enviados ${sent} de ${total}` : null;
    }
    default:
      return null;
  }
}

export const auditTimestamp = (row: AuditRow): string => formatDateTime(row.created_at);
