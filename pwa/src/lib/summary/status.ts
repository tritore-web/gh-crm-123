// Estados y reglas del resumen matutino (TECHNICAL_SPEC §10–§11, DESIGN_BRIEF §6.2 M6).
export type RunStatus = 'en_curso' | 'correcto' | 'con_errores' | 'fallido';
export type RunTrigger = 'automatico' | 'manual';

export const RUN_TIMEOUT_MINUTES = 30;
export const MAX_RECIPIENTS = 12;

export const STATUS_LABEL: Record<RunStatus, string> = {
  en_curso: 'En curso',
  correcto: 'Correcto',
  con_errores: 'Con errores',
  fallido: 'Fallido',
};
export const TRIGGER_LABEL: Record<RunTrigger, string> = { automatico: 'Automático', manual: 'Manual' };

export const isRunStatus = (v: string): v is RunStatus => v in STATUS_LABEL;
export const isRunTrigger = (v: string): v is RunTrigger => v in TRIGGER_LABEL;

export type RunSummary = { status: RunStatus; sent: number; total: number };

/** Texto de la tarjeta «Último envío» según el estado. */
export function runMessage(run: RunSummary): string {
  switch (run.status) {
    case 'en_curso':
      return 'Enviando…';
    case 'correcto':
      return `Se enviaron ${run.sent} de ${run.total} correos.`;
    case 'con_errores':
      return `Se enviaron ${run.sent} de ${run.total}. Algunos correos no salieron.`;
    case 'fallido':
      return 'No se pudo enviar el resumen. Inténtalo de nuevo más tarde.';
  }
}

/** Una ejecución «en curso» de más de 30 minutos se da por fallida. */
export function isStale(startedAtIso: string, nowMs: number, minutes: number = RUN_TIMEOUT_MINUTES): boolean {
  const started = new Date(startedAtIso).getTime();
  return Number.isFinite(started) && nowMs - started > minutes * 60_000;
}

/**
 * Intervalo mínimo entre envíos manuales (settings.manual_send_min_interval_minutes, 10 por defecto).
 * Devuelve los minutos que faltan (0 si ya se puede enviar).
 */
export function cooldownRemainingMinutes(lastManualStartedAtIso: string | null, nowMs: number, minIntervalMinutes: number): number {
  if (!lastManualStartedAtIso) return 0;
  const started = new Date(lastManualStartedAtIso).getTime();
  if (!Number.isFinite(started)) return 0;
  const remainingMs = started + minIntervalMinutes * 60_000 - nowMs;
  return remainingMs > 0 ? Math.ceil(remainingMs / 60_000) : 0;
}

/**
 * Estado final que n8n comunica al cerrar: sin fallos → correcto; con enviados y fallos → con errores;
 * nada enviado (con fallos, con errores informados o con destinatarios pendientes) → fallido.
 */
export function finalStatus(input: { sent: number; failed: number; errors: number; total: number }): Exclude<RunStatus, 'en_curso'> {
  const failures = Math.max(input.failed, input.errors);
  if (failures === 0) return input.sent === 0 && input.total > 0 ? 'fallido' : 'correcto';
  return input.sent > 0 ? 'con_errores' : 'fallido';
}
