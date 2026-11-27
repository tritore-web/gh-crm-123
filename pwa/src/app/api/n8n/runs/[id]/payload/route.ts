import { z } from 'zod';
import { badRequest, conflict, json, serverError, unauthorized } from '@/lib/api';
import { logDbError } from '@/lib/errors';
import { isN8nAuthorized } from '@/lib/n8n-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { buildPayload } from '@/lib/summary/payload';
import { isStale } from '@/lib/summary/status';

const idSchema = z.uuid();

/** Entrega destinatarios y contenido de cada correo (TECHNICAL_SPEC §10.5). Solo mientras la ejecución está en curso. */
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!isN8nAuthorized(request)) return unauthorized();
  const id = idSchema.safeParse((await context.params).id);
  if (!id.success) return badRequest();

  const admin = createAdminClient();
  const { data: run, error } = await admin.from('summary_runs').select('id, status, started_at').eq('id', id.data).maybeSingle();
  if (error) {
    logDbError('n8n-payload-lectura', error);
    return serverError();
  }
  if (!run || run.status !== 'en_curso' || isStale(run.started_at, Date.now())) return conflict();

  const { data: today, error: todayError } = await admin.rpc('app_today');
  if (todayError || !today) {
    logDbError('n8n-payload-hoy', todayError ?? {});
    return serverError();
  }
  const testRecipient = process.env.SUMMARY_TEST_RECIPIENT?.trim() || undefined;
  const recipients = await buildPayload(admin, today, { testRecipient });
  if (!recipients) return serverError();

  const { error: updateError } = await admin.from('summary_runs').update({ recipients_total: recipients.length }).eq('id', run.id).eq('status', 'en_curso');
  if (updateError) {
    logDbError('n8n-payload-total', updateError);
    return serverError();
  }

  const from = process.env.RESEND_FROM;
  if (!from) {
    console.error('[n8n-payload] falta la variable RESEND_FROM');
    return serverError();
  }
  return json({ run_id: run.id, from, test_mode: Boolean(testRecipient), recipients });
}
