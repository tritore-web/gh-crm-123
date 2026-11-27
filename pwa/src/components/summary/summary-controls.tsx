'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, RefreshCw, XCircle } from 'lucide-react';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Sheet } from '@/components/ui/sheet';
import { formatDateTime } from '@/lib/dates';
import { MESSAGES } from '@/lib/errors';
import { TRIGGER_LABEL, runMessage } from '@/lib/summary/status';
import { cn } from '@/lib/utils';
import { countRecipients, getLastRun, setMorningSummary, type RunDto } from '@/app/(app)/resumen/actions';

const POLL_MS = 3000;
type Notice = { tone: 'info' | 'error'; text: string };

const SCHEDULE_TEXT = 'Se envía de lunes a viernes a las 7:30 (hora de Madrid) a cada vendedor, y el resumen del equipo a cada supervisor.';

function StatusLine({ run }: { run: RunDto }) {
  if (run.status === 'en_curso')
    return (
      <div className="flex items-center gap-1.5 font-semibold">
        <span className="spin" aria-hidden="true" />
        <span>En curso</span>
      </div>
    );
  const map = {
    correcto: { Icon: CheckCircle2, text: 'Correcto', cls: 'text-success' },
    con_errores: { Icon: AlertTriangle, text: 'Con errores', cls: 'text-warning-text' },
    fallido: { Icon: XCircle, text: 'Fallido', cls: 'text-danger' },
  } as const;
  const { Icon, text, cls } = map[run.status];
  return (
    <div className={cn('flex items-center gap-1.5 font-semibold', cls)}>
      <Icon className="i" size={16} aria-hidden="true" />
      <span>{text}</span>
    </div>
  );
}

/** Interruptor, «Enviar ahora» y tarjeta «Último envío» con todos sus estados (DESIGN_BRIEF §6.2 M6). */
export function SummaryControls({ initialEnabled, initialRun, testMode }: { initialEnabled: boolean; initialRun: RunDto | null; testMode: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [run, setRun] = useState<RunDto | null>(initialRun);
  const [sheet, setSheet] = useState<{ count: number } | null>(null);
  const [busy, setBusy] = useState<'count' | 'send' | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [loadError, setLoadError] = useState(false);
  const running = run?.status === 'en_curso';

  const refresh = useCallback(async () => {
    try {
      const result = await getLastRun();
      if (!result.ok) throw new Error('lectura');
      setRun(result.run);
      setLoadError(false);
    } catch {
      setLoadError(true);
    }
  }, []);

  // Mientras hay un envío en curso, la tarjeta se actualiza sola cada 3 segundos.
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(timer);
  }, [running, refresh]);

  const toggle = async () => {
    const next = !enabled;
    setEnabled(next);
    setNotice(null);
    try {
      const formData = new FormData();
      formData.set('enabled', String(next));
      const result = await setMorningSummary(formData);
      if (!result.ok) throw new Error(result.error);
    } catch {
      setEnabled(!next);
      setNotice({ tone: 'error', text: MESSAGES.generic });
    }
  };

  const openSheet = async () => {
    setBusy('count');
    setNotice(null);
    try {
      const result = await countRecipients();
      if (!result.ok) throw new Error('conteo');
      setSheet({ count: result.count });
    } catch {
      setNotice({ tone: 'error', text: MESSAGES.generic });
    } finally {
      setBusy(null);
    }
  };

  const confirm = async () => {
    if (!sheet) return;
    setBusy('send');
    try {
      const response = await fetch('/api/summary/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm_recipients: sheet.count }),
      });
      const body = (await response.json().catch(() => ({}))) as { recipients?: number };
      if (response.status === 202) {
        setSheet(null);
        setNotice(null);
        setRun({ startedAt: new Date().toISOString(), trigger: 'manual', status: 'en_curso', sent: 0, total: 0 });
        void refresh();
      } else if (response.status === 429) {
        setSheet(null);
        setNotice({ tone: 'info', text: 'Espera unos minutos antes de volver a enviar.' });
      } else if (response.status === 409 && typeof body.recipients === 'number') {
        setSheet({ count: body.recipients });
        setNotice({ tone: 'error', text: 'El número de destinatarios cambió. Revisa y confirma de nuevo.' });
      } else if (response.status === 409) {
        setSheet(null);
        setNotice({ tone: 'info', text: 'Ya hay un envío en curso.' });
        void refresh();
      } else if (response.status === 401 || response.status === 403) {
        setSheet(null);
        setNotice({ tone: 'error', text: response.status === 401 ? 'Tu sesión terminó. Ingresa de nuevo.' : MESSAGES.forbidden });
      } else {
        setSheet(null);
        setNotice({ tone: 'error', text: 'No se pudo enviar el resumen. Inténtalo de nuevo más tarde.' });
        void refresh();
      }
    } catch {
      setNotice({ tone: 'error', text: 'No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <div className="m-card">
        <div className="flex items-center gap-3">
          <span id="resumen-activo" className="grow font-semibold text-brown">
            Resumen matutino activo
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            aria-labelledby="resumen-activo"
            onClick={() => void toggle()}
            className={cn('relative h-[26px] w-11 flex-none rounded-[13px] transition-colors', enabled ? 'bg-primary' : 'bg-line-strong')}
          >
            <span className={cn('absolute top-[3px] size-5 rounded-full bg-white transition-all', enabled ? 'left-[21px]' : 'left-[3px]')} />
            <span className="absolute -inset-1.5" aria-hidden="true" />
          </button>
        </div>
        <div className="text-ink-2">{SCHEDULE_TEXT}</div>
      </div>

      {testMode ? <Banner tone="warning">Modo de prueba: los correos llegan solo a la cuenta de pruebas.</Banner> : null}

      <Button type="button" block disabled={busy !== null || running} aria-busy={busy !== null || running} onClick={() => void openSheet()}>
        {busy !== null || running ? (
          <>
            <span className="spin" aria-hidden="true" />
            Enviando…
          </>
        ) : (
          'Enviar ahora'
        )}
      </Button>

      {notice ? <Banner tone={notice.tone}>{notice.text}</Banner> : null}
      {!enabled && !notice ? <div className="text-ink-2">El envío automático está desactivado.</div> : null}

      {loadError ? (
        <div className="m-card">
          <EmptyState icon={RefreshCw} title="No se pudo cargar el estado del envío. Revisa tu conexión.">
            <Button type="button" variant="secondary" onClick={() => void refresh()}>
              Reintentar
            </Button>
          </EmptyState>
        </div>
      ) : (
        <div className={cn('m-card', !enabled && 'dim')}>
          <h2 className="m-sec m-0">Último envío</h2>
          {run ? (
            <>
              <div className="text-lg leading-[26px] font-semibold">
                {formatDateTime(run.startedAt)} · {TRIGGER_LABEL[run.trigger]}
              </div>
              <StatusLine run={run} />
              <div>{runMessage(run)}</div>
            </>
          ) : (
            <EmptyState icon={RefreshCw} title="Todavía no se ha enviado ningún resumen." />
          )}
        </div>
      )}

      <Sheet open={sheet !== null} onClose={() => busy === null && setSheet(null)} title="¿Enviar ahora?">
        <div>
          Se enviará a <b>{sheet?.count ?? 0} {sheet?.count === 1 ? 'persona' : 'personas'}</b>. ¿Enviar ahora?
        </div>
        {notice && sheet ? <Banner tone={notice.tone}>{notice.text}</Banner> : null}
        <div className="flex flex-col gap-2">
          <Button type="button" block disabled={busy === 'send'} aria-busy={busy === 'send'} onClick={() => void confirm()}>
            {busy === 'send' ? (
              <>
                <span className="spin" aria-hidden="true" />
                Enviando…
              </>
            ) : (
              'Enviar'
            )}
          </Button>
          <Button type="button" variant="secondary" block disabled={busy === 'send'} onClick={() => setSheet(null)}>
            Cancelar
          </Button>
        </div>
      </Sheet>
    </>
  );
}
