import type { TablesUpdate } from '@/types/database';
import type { LostReason, OpenStage } from './labels';

// Operaciones sobre una oportunidad: qué campos se FIJAN y cuáles se LIMPIAN (TECHNICAL_SPEC §5.1).
// Las restricciones de la base exigen estos pares; construirlos en un solo sitio evita estados imposibles.
export type OpportunityUpdate = TablesUpdate<'opportunities'>;

/** Ganada: pide monto final y fecha; limpia el motivo y la próxima acción. */
export function buildCloseWon(input: { finalAmount: number; closedOn: string }): OpportunityUpdate {
  return {
    stage: 'ganada',
    final_amount: input.finalAmount,
    closed_on: input.closedOn,
    lost_reason: null,
    next_action_date: null,
    next_action_text: null,
  };
}

/** Perdida: pide motivo y fecha; limpia el monto final y la próxima acción. */
export function buildCloseLost(input: { lostReason: LostReason; closedOn: string }): OpportunityUpdate {
  return {
    stage: 'perdida',
    lost_reason: input.lostReason,
    closed_on: input.closedOn,
    final_amount: null,
    next_action_date: null,
    next_action_text: null,
  };
}

/** Reabrir: pasa a una etapa abierta y limpia monto final, fecha de cierre y motivo en la misma operación. */
export function buildReopen(stage: OpenStage): OpportunityUpdate {
  return { stage, final_amount: null, closed_on: null, lost_reason: null };
}

/** Cambio entre etapas abiertas. */
export function buildStageChange(stage: OpenStage): OpportunityUpdate {
  return { stage };
}

/** La próxima acción se guarda siempre con fecha y texto juntos. */
export function buildNextAction(input: { date: string; text: string }): OpportunityUpdate {
  return { next_action_date: input.date, next_action_text: input.text };
}

/** Para quitarla se ponen ambos en nulo. */
export function buildClearNextAction(): OpportunityUpdate {
  return { next_action_date: null, next_action_text: null };
}

export const buildArchive = (nowIso: string): { archived_at: string } => ({ archived_at: nowIso });
export const buildRecover = (): { archived_at: null } => ({ archived_at: null });
