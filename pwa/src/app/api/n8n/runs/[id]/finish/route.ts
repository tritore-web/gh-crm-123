import { z } from 'zod';
import { badRequest, conflict, json, serverError, unauthorized } from '@/lib/api';
import { logDbError } from '@/lib/errors';
import { isN8nAuthorized } from '@/lib/n8n-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { finalStatus } from '@/lib/summary/status';

const idSchema = z.uuid();
const bodySchema = z.object({
  sent: z.number().int().min(0).max(1000),
  failed: z.number().int().min(0).max(1000),
  errors: z
    .array(z.object({ to: z.string().max(320), message: z.string() }))
    .max(12)
    .default([]),
});

/** Cierra la ejecución con el resultado (TECHNICAL_SPEC §10.5). Una ejecución solo se cierra una vez. */
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isN8nAuthorized(request)) return unauthorized();
  const id = idSchema.safeParse((await context.params).id);
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!id.success || !body.success) return badRequest();

  const admin = createAdminClient();
  const { data: run, error } = await admin.from('summary_runs').select('id, status, trigger_type, recipients_total').eq('id', id.data).maybeSingle();
  if (error) {
    logDbError('n8n-cierre-lectura', error);
    return serverError();
  }
  if (!run || run.status !== 'en_curso') return conflict('La ejecución ya está cerrada.');

  const { sent, failed, errors } = body.data;
  const status = finalStatus({ sent, failed, errors: errors.length, total: run.recipients_total });
  const recordedSent = Math.min(sent, run.recipients_total); // la base exige enviados ≤ total
  const detail = errors.map((e) => `${e.to}: ${e.message.slice(0, 200)}`).join('\n').slice(0, 4000);

  // Solo si sigue en curso: dos cierres a la vez no pueden pisarse.
  const { data: closed, error: closeError } = await admin
    .from('summary_runs')
    .update({ status, recipients_sent: recordedSent, error_detail: detail === '' ? null : detail, finished_at: new Date().toISOString() })
    .eq('id', run.id)
    .eq('status', 'en_curso')
    .select('id');
  if (closeError) {
    logDbError('n8n-cierre', closeError);
    return serverError();
  }
  if (!closed || closed.length === 0) return conflict('La ejecución ya está cerrada.');

  const { error: auditError } = await admin.from('audit_log').insert({
    action: 'resumen_finalizado',
    entity_type: 'summary_run',
    entity_id: run.id,
    details: { status, sent: recordedSent, failed, total: run.recipients_total, trigger: run.trigger_type },
  });
  if (auditError) logDbError('n8n-cierre-auditoria', auditError);
  return json({ ok: true, status });
}
