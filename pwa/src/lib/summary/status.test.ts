import { describe, expect, it } from 'vitest';
import { cooldownRemainingMinutes, finalStatus, isStale, runMessage } from './status';

const T0 = new Date('2026-11-23T08:00:00Z').getTime();
const minutes = (n: number) => new Date(T0 + n * 60_000).toISOString();

describe('runMessage: textos de la tarjeta «Último envío»', () => {
  it('cada estado tiene su frase del brief', () => {
    expect(runMessage({ status: 'en_curso', sent: 0, total: 9 })).toBe('Enviando…');
    expect(runMessage({ status: 'correcto', sent: 9, total: 9 })).toBe('Se enviaron 9 de 9 correos.');
    expect(runMessage({ status: 'con_errores', sent: 7, total: 9 })).toBe('Se enviaron 7 de 9. Algunos correos no salieron.');
    expect(runMessage({ status: 'fallido', sent: 0, total: 9 })).toBe('No se pudo enviar el resumen. Inténtalo de nuevo más tarde.');
  });
});

describe('cooldownRemainingMinutes: intervalo mínimo de 10 minutos entre envíos manuales', () => {
  it('sin envíos previos se puede enviar', () => {
    expect(cooldownRemainingMinutes(null, T0, 10)).toBe(0);
  });
  it('dentro del intervalo faltan minutos (redondeados hacia arriba)', () => {
    expect(cooldownRemainingMinutes(minutes(-1), T0, 10)).toBe(9);
    expect(cooldownRemainingMinutes(minutes(-9.5), T0, 10)).toBe(1);
    expect(cooldownRemainingMinutes(minutes(0), T0, 10)).toBe(10);
  });
  it('al cumplirse el intervalo ya se puede enviar', () => {
    expect(cooldownRemainingMinutes(minutes(-10), T0, 10)).toBe(0);
    expect(cooldownRemainingMinutes(minutes(-45), T0, 10)).toBe(0);
  });
  it('respeta el intervalo configurado y tolera fechas inválidas', () => {
    expect(cooldownRemainingMinutes(minutes(-30), T0, 60)).toBe(30);
    expect(cooldownRemainingMinutes('no es una fecha', T0, 10)).toBe(0);
  });
});

describe('isStale: ejecuciones colgadas', () => {
  it('más de 30 minutos en curso se da por fallida; justo 30 todavía no', () => {
    expect(isStale(minutes(-31), T0)).toBe(true);
    expect(isStale(minutes(-30), T0)).toBe(false);
    expect(isStale(minutes(-1), T0)).toBe(false);
    expect(isStale('x', T0)).toBe(false);
  });
});

describe('finalStatus: cómo se cierra una ejecución', () => {
  it('sin fallos es correcto', () => {
    expect(finalStatus({ sent: 9, failed: 0, errors: 0, total: 9 })).toBe('correcto');
  });
  it('con enviados y fallos es «con errores»', () => {
    expect(finalStatus({ sent: 7, failed: 2, errors: 2, total: 9 })).toBe('con_errores');
  });
  it('nada enviado es fallido', () => {
    expect(finalStatus({ sent: 0, failed: 9, errors: 9, total: 9 })).toBe('fallido');
  });
  it('si n8n no pudo ni obtener el contenido (0 enviados, 0 fallos, error informado) es fallido', () => {
    expect(finalStatus({ sent: 0, failed: 0, errors: 1, total: 0 })).toBe('fallido');
  });
  it('0 enviados con destinatarios pendientes es fallido; sin destinatarios es correcto', () => {
    expect(finalStatus({ sent: 0, failed: 0, errors: 0, total: 5 })).toBe('fallido');
    expect(finalStatus({ sent: 0, failed: 0, errors: 0, total: 0 })).toBe('correcto');
  });
});
