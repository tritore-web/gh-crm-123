import { describe, expect, it } from 'vitest';
import {
  buildArchive, buildClearNextAction, buildCloseLost, buildCloseWon, buildNextAction, buildRecover, buildReopen, buildStageChange,
} from './opportunity-ops';

describe('cerrar como Ganada', () => {
  it('fija etapa, monto final y fecha, y limpia motivo y próxima acción', () => {
    expect(buildCloseWon({ finalAmount: 1750, closedOn: '2026-11-23' })).toEqual({
      stage: 'ganada', final_amount: 1750, closed_on: '2026-11-23', lost_reason: null, next_action_date: null, next_action_text: null,
    });
  });
});

describe('cerrar como Perdida', () => {
  it('fija etapa, motivo y fecha, y limpia monto final y próxima acción', () => {
    expect(buildCloseLost({ lostReason: 'precio', closedOn: '2026-11-23' })).toEqual({
      stage: 'perdida', lost_reason: 'precio', closed_on: '2026-11-23', final_amount: null, next_action_date: null, next_action_text: null,
    });
  });
});

describe('reabrir', () => {
  it('limpia monto final, fecha de cierre y motivo a la vez, y no toca nada más', () => {
    const update = buildReopen('negociacion');
    expect(update).toEqual({ stage: 'negociacion', final_amount: null, closed_on: null, lost_reason: null });
    expect(Object.keys(update).sort()).toEqual(['closed_on', 'final_amount', 'lost_reason', 'stage']);
  });
});

describe('etapa, próxima acción y archivado', () => {
  it('cambiar de etapa solo cambia la etapa', () => {
    expect(buildStageChange('contactada')).toEqual({ stage: 'contactada' });
  });
  it('la próxima acción va siempre en pareja (ambos o ninguno)', () => {
    expect(buildNextAction({ date: '2026-11-27', text: 'Enviar menú' })).toEqual({ next_action_date: '2026-11-27', next_action_text: 'Enviar menú' });
    expect(buildClearNextAction()).toEqual({ next_action_date: null, next_action_text: null });
  });
  it('archivar fija la fecha y recuperar la limpia', () => {
    expect(buildArchive('2026-11-23T10:00:00.000Z')).toEqual({ archived_at: '2026-11-23T10:00:00.000Z' });
    expect(buildRecover()).toEqual({ archived_at: null });
  });
});
