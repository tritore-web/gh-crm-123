import { z } from 'zod';
import { badRequest, json, serverError, unauthorized } from '@/lib/api';
import { logDbError } from '@/lib/errors';
import { isN8nAuthorized } from '@/lib/n8n-auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { dayStartIso, failStaleRuns } from '@/lib/summary/runs';

const bodySchema = z.object({ trigger: z.literal('automatico') });

/** Inicia una ejecución automática (TECHNICAL_SPEC §10.5). Solo n8n, con su clave. */
export async function POST(request: Request) {
  if (!isN8nAuthorized(request)) return unauthorized();
  const body = bodySchema.safeParse(await request.json().catch(() => null));
  if (!body.success) return badRequest();

  const admin = createAdminClient();
  await failStaleRuns(admin);

  const { data: settings, error: settingsError } = await admin.from('settings').select('morning_summary_enabled').eq('id', 1).maybeSingle();
  if (settingsError || !settings) {
    logDbError('n8n-inicio-ajustes', settingsError ?? {});
    return serverError();
  }
  if (!settings.morning_summary_enabled) return json({ skip: true, reason: 'interruptor_desactivado' });

  const { data: today, error: todayError } = await admin.rpc('app_today');
  const start = today ? dayStartIso(today) : null;
  if (todayError || !start) {
    logDbError('n8n-inicio-hoy', todayError ?? {});
    return serverError();
  }

  // «Ya enviado hoy»: una ejecución automática que terminó con envíos (correcta o con errores) desde las 00:00 de Madrid.
  const { data: sent, error: sentError } = await admin
    .from('summary_runs')
    .select('id')
    .eq('trigger_type', 'automatico')
    .in('status', ['correcto', 'con_errores'])
    .gte('finished_at', start)
    .limit(1);
  if (sentError) {
    logDbError('n8n-inicio-hoy-enviado', sentError);
    return serverError();
  }
  if ((sent?.length ?? 0) > 0) return json({ skip: true, reason: 'ya_enviado_hoy' });

  const { data: running, error: runningError } = await admin.from('summary_runs').select('id').eq('status', 'en_curso').limit(1);
  if (runningError) {
    logDbError('n8n-inicio-en-curso', runningError);
    return serverError();
  }
  if ((running?.length ?? 0) > 0) return json({ skip: true, reason: 'ya_en_curso' });

  const { data: created, error } = await admin.from('summary_runs').insert({ trigger_type: 'automatico' }).select('id').single();
  // El índice único «solo una ejecución en curso» protege la carrera entre dos disparos simultáneos.
  if (error?.code === '23505') return json({ skip: true, reason: 'ya_en_curso' });
  if (error || !created) {
    logDbError('n8n-inicio-crear', error ?? {});
    return serverError();
  }
  return json({ skip: false, run_id: created.id });
}
