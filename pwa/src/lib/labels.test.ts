import { describe, expect, it } from 'vitest';
import {
  ACTIVITY_LABEL, LOST_REASON_LABEL, OPEN_STAGES, SOURCE_LABEL, STAGES, STAGE_LABEL, TYPE_LABEL,
  isOpenStage, isStage, lostReasonLabel, stageLabel,
} from './labels';

describe('etiquetas de valores cerrados (SCRIPTS-SQL §2.3)', () => {
  it('cada etapa y cada lista tiene la etiqueta del brief', () => {
    expect(STAGES.map((s) => STAGE_LABEL[s])).toEqual(['Nueva', 'Contactada', 'Propuesta enviada', 'Negociación', 'Ganada', 'Perdida']);
    expect(Object.values(SOURCE_LABEL)).toEqual(['Tienda', 'Web', 'Redes sociales', 'Recomendación']);
    expect(Object.values(TYPE_LABEL)).toEqual(['Evento privado', 'Catering', 'Club de lectura o suscripción', 'Pedido grande de libros', 'Venta a grupos']);
    expect(Object.values(LOST_REASON_LABEL)).toEqual(['Precio', 'Sin respuesta', 'Eligió otra opción', 'Ya no le interesa', 'Otro']);
    expect(Object.values(ACTIVITY_LABEL)).toEqual(['Llamada', 'Mensaje', 'Reunión o visita', 'Nota']);
  });
  it('las etapas abiertas son las cuatro primeras', () => {
    expect([...OPEN_STAGES]).toEqual(['nueva', 'contactada', 'propuesta_enviada', 'negociacion']);
    expect(isOpenStage('negociacion')).toBe(true);
    expect(isOpenStage('ganada')).toBe(false);
    expect(isStage('perdida')).toBe(true);
    expect(isStage('otra')).toBe(false);
  });
  it('un valor desconocido se muestra tal cual, sin romper la pantalla', () => {
    expect(stageLabel('rara')).toBe('rara');
    expect(lostReasonLabel('precio')).toBe('Precio');
  });
});
