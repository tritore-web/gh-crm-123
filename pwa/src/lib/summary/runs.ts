import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { localInputToIso } from '@/lib/dates';
import { logDbError } from '@/lib/errors';
import { RUN_TIMEOUT_MINUTES } from './status';

type Admin = SupabaseClient<Database>;

/** Marca como fallida («Tiempo de espera agotado») toda ejecución en curso con más de 30 minutos. */
export async function failStaleRuns(admin: Admin, nowMs: number = Date.now()): Promise<void> {
  const cutoff = new Date(nowMs - RUN_TIMEOUT_MINUTES * 60_000).toISOString();
  const { error } = await admin
    .from('summary_runs')
    .update({ status: 'fallido', error_detail: 'Tiempo de espera agotado', finished_at: new Date(nowMs).toISOString() })
    .eq('status', 'en_curso')
    .lt('started_at', cutoff);
  if (error) logDbError('resumen-caducadas', error);
}

/** Cierra una ejecución como fallida con un detalle genérico (nunca claves ni rutas internas). */
export async function markRunFailed(admin: Admin, runId: string, detail: string): Promise<void> {
  const { error } = await admin
    .from('summary_runs')
    .update({ status: 'fallido', error_detail: detail, finished_at: new Date().toISOString() })
    .eq('id', runId)
    .eq('status', 'en_curso');
  if (error) logDbError('resumen-fallida', error);
}

/** Inicio del día de hoy (hora de Madrid) como instante, para «ya enviado hoy». */
export const dayStartIso = (today: string): string | null => localInputToIso(`${today}T00:00`);

/** Número de personas que recibirían el resumen: todos los usuarios activos (vendedores y supervisores). */
export async function countActiveRecipients(admin: Admin): Promise<number | null> {
  const { count, error } = await admin.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', true);
  if (error) {
    logDbError('resumen-destinatarios', error);
    return null;
  }
  return count ?? 0;
}
