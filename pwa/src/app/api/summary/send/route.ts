import { z } from 'zod';
import { badRequest, conflict, json, serverError, unauthorized } from '@/lib/api';
import { getCurrentProfile } from '@/lib/current-profile';
import { logDbError } from '@/lib/errors';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { countActiveRecipients, failStaleRuns, markRunFailed } from '@/lib/summary/runs';
import { cooldownRemainingMinutes } from '@/lib/summary/status';
import { readWebhookConfig, triggerWebhook } from '@/lib/summary/webhook';

const bodySchema = z.object({ confirm_recipients: z.number().int().min(0).max(1000) });
const forbidden = () => json({ error: 'No tienes permiso para hacer esto.' }, 403);

/**
 * Envío manual del resumen (TECHNICAL_SPEC §11). Cada paso falla de forma segura con un mensaje genérico.
 * Solo POST (cualquier otro método devuelve 405 automáticamente).
 */
export async function POST(request: Request) {
  // 1. Contenido JSON.
  if (!request.headers.get('content-type')?.toLowerCase().includes('application/json')) return json({ error: 'Solicitud no válida.' }, 415);
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return badRequest();

  // 2. Origen exacto de la aplicación (anti-CSRF).
  const appOrigin = process.env.APP_ORIGIN;
  if (!appOrigin) {
    console.error('[resumen-manual] falta la variable APP_ORIGIN');
    return serverError();
  }
  if (request.headers.get('origin') !== appOrigin) return forbidden();

  // 3. Sesión válida (getUser, nunca solo getSession).
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return unauthorized();

  // 4. Rol leído de profiles: supervisor y activo.
  const profile = await getCurrentProfile();
  if (!profile || !profile.isActive || profile.role !== 'supervisor') return forbidden();

  // 5. Configuración mínima del webhook.
  const { config, missing } = readWebhookConfig();
  if (!config) {
    console.error('[resumen-manual] configuración incompleta', { missing });
    return serverError();
  }

  // 6. Intervalo mínimo entre envíos manuales.
  const { data: settings, error: settingsError } = await supabase.from('settings').select('manual_send_min_interval_minutes').eq('id', 1).maybeSingle();
  if (settingsError || !settings) {
    logDbError('resumen-manual-ajustes', settingsError ?? {});
    return serverError();
  }
  const { data: lastManual, error: lastError } = await supabase
    .from('summary_runs')
    .select('started_at')
    .eq('trigger_type', 'manual')
    .order('started_at', { ascending: false })
    .limit(1);
  if (lastError) {
    logDbError('resumen-manual-ultimo', lastError);
    return serverError();
  }
  if (cooldownRemainingMinutes(lastManual?.[0]?.started_at ?? null, Date.now(), settings.manual_send_min_interval_minutes) > 0) {
    return json({ error: 'Espera unos minutos antes de volver a enviar.' }, 429);
  }

  // 7. Sin ejecuciones simultáneas (las colgadas de más de 30 minutos se dan por fallidas).
  const admin = createAdminClient();
  await failStaleRuns(admin);
  const { data: running, error: runningError } = await admin.from('summary_runs').select('id').eq('status', 'en_curso').limit(1);
  if (runningError) {
    logDbError('resumen-manual-en-curso', runningError);
    return serverError();
  }
  if ((running?.length ?? 0) > 0) return conflict('Ya hay un envío en curso.');

  // 8. Confirmación explícita: el número que vio la persona debe coincidir con el real.
  const recipients = await countActiveRecipients(admin);
  if (recipients === null) return serverError();
  if (recipients !== body.data.confirm_recipients) {
    return json({ error: 'El número de destinatarios cambió. Vuelve a confirmar.', recipients }, 409);
  }

  // 9. Registro previo (clave de servicio): la ejecución y la auditoría, con la identidad del supervisor.
  const { data: run, error: runError } = await admin
    .from('summary_runs')
    .insert({ trigger_type: 'manual', requested_by: profile.id })
    .select('id')
    .single();
  if (runError?.code === '23505') return conflict('Ya hay un envío en curso.'); // el índice único también lo garantiza
  if (runError || !run) {
    logDbError('resumen-manual-crear', runError ?? {});
    return serverError();
  }
  const { error: auditError } = await admin.from('audit_log').insert({
    actor_id: profile.id,
    actor_role: profile.role,
    action: 'resumen_manual_solicitado',
    entity_type: 'summary_run',
    entity_id: run.id,
    details: { recipients },
  });
  if (auditError) logDbError('resumen-manual-auditoria', auditError);

  // 10. Llamada a n8n: 10 s, sin redirecciones, sin datos de clientes. Si falla, la ejecución se cierra como fallida.
  if (!(await triggerWebhook(config, run.id))) {
    await markRunFailed(admin, run.id, 'No se pudo iniciar el envío');
    return json({ error: 'No se pudo iniciar el envío. Inténtalo de nuevo más tarde.' }, 502);
  }

  // 11. Aceptado: la pantalla consulta el estado cada 3 segundos.
  return json({ run_id: run.id }, 202);
}
