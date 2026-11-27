import type { Metadata } from 'next';
import { SummaryControls } from '@/components/summary/summary-controls';
import { MobileHeader } from '@/components/shell/mobile-header';
import { requireProfile } from '@/lib/current-profile';
import { readFailure } from '@/lib/data';
import { isRunStatus, isRunTrigger } from '@/lib/summary/status';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Resumen · CRM-123' };

export default async function ResumenPage() {
  await requireProfile();
  const supabase = await createClient();

  const [settings, lastRun] = await Promise.all([
    supabase.from('settings').select('morning_summary_enabled').eq('id', 1).maybeSingle(),
    supabase.from('summary_runs').select('trigger_type, status, recipients_sent, recipients_total, started_at').order('started_at', { ascending: false }).limit(1),
  ]);
  if (settings.error || !settings.data) return readFailure('resumen-ajustes', settings.error ?? {});
  if (lastRun.error) return readFailure('resumen-ultimo', lastRun.error);

  const row = lastRun.data?.[0];
  const run =
    row && isRunStatus(row.status) && isRunTrigger(row.trigger_type)
      ? { startedAt: row.started_at, trigger: row.trigger_type, status: row.status, sent: row.recipients_sent, total: row.recipients_total }
      : null;
  // Modo de prueba (TECHNICAL_SPEC §10.4): lo fija la variable SUMMARY_TEST_RECIPIENT; la aplicación decide el destino.
  const testMode = Boolean(process.env.SUMMARY_TEST_RECIPIENT?.trim());

  return (
    <>
      <MobileHeader title="Resumen" />
      <main className="flex flex-1 flex-col gap-3 p-4">
        <SummaryControls initialEnabled={settings.data.morning_summary_enabled} initialRun={run} testMode={testMode} />
      </main>
    </>
  );
}
