'use server';

import { fail, formToObject, type ActionResult } from '@/lib/action-result';
import { dbFailure, getActionContext, sessionEnded } from '@/lib/action-context';
import { MESSAGES } from '@/lib/errors';
import { isRunStatus, isRunTrigger, type RunStatus, type RunTrigger } from '@/lib/summary/status';

export type RunDto = { startedAt: string; trigger: RunTrigger; status: RunStatus; sent: number; total: number };

async function supervisorContext() {
  const ctx = await getActionContext();
  return ctx && ctx.profile.role === 'supervisor' ? ctx : null;
}

/** Interruptor «Resumen matutino activo»: solo el supervisor (RLS). La base registra «Ajuste actualizado» en la auditoría. */
export async function setMorningSummary(formData: FormData): Promise<ActionResult> {
  const ctx = await getActionContext();
  if (!ctx) return sessionEnded();
  if (ctx.profile.role !== 'supervisor') return fail(MESSAGES.forbidden);
  const value = formToObject(formData).enabled;
  if (value !== 'true' && value !== 'false') return fail(MESSAGES.generic);
  const { data, error } = await ctx.supabase.from('settings').update({ morning_summary_enabled: value === 'true' }).eq('id', 1).select('id');
  if (error) return dbFailure('resumen-interruptor', error);
  if (!data || data.length === 0) return fail(MESSAGES.forbidden);
  return { ok: true };
}

/** Última ejecución (para refrescar la tarjeta mientras está «En curso»). */
export async function getLastRun(): Promise<{ ok: true; run: RunDto | null } | { ok: false }> {
  const ctx = await supervisorContext();
  if (!ctx) return { ok: false };
  const { data, error } = await ctx.supabase
    .from('summary_runs')
    .select('trigger_type, status, recipients_sent, recipients_total, started_at')
    .order('started_at', { ascending: false })
    .limit(1);
  if (error) {
    console.error('[resumen-estado] error de lectura', { code: error.code });
    return { ok: false };
  }
  const row = data?.[0];
  if (!row || !isRunStatus(row.status) || !isRunTrigger(row.trigger_type)) return { ok: true, run: null };
  return { ok: true, run: { startedAt: row.started_at, trigger: row.trigger_type, status: row.status, sent: row.recipients_sent, total: row.recipients_total } };
}

/** «Se enviará a N personas»: usuarios activos (vendedores y supervisores). */
export async function countRecipients(): Promise<{ ok: true; count: number } | { ok: false }> {
  const ctx = await supervisorContext();
  if (!ctx) return { ok: false };
  const { count, error } = await ctx.supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', true);
  if (error || count === null) {
    console.error('[resumen-destinatarios] error de lectura', { code: error?.code ?? 'sin-total' });
    return { ok: false };
  }
  return { ok: true, count };
}
