import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Archive, ArchiveRestore, CalendarClock, Pencil, Phone } from 'lucide-react';
import { ActivityDialog } from '@/components/activities/activity-dialog';
import { ActivityTimeline } from '@/components/activities/timeline';
import { CloseLostDialog, CloseWonDialog, NextActionDialog, ReopenDialog, StageMenu } from '@/components/opportunities/opportunity-actions';
import { StageSteps } from '@/components/opportunities/stage-steps';
import { ActionButton } from '@/components/ui/action-button';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { TypeTag } from '@/components/ui/tags';
import { buildTimeline } from '@/lib/activities';
import { requireProfile } from '@/lib/current-profile';
import { readFailure, readNames, readToday } from '@/lib/data';
import { formatDate } from '@/lib/dates';
import { isClosedStage, lostReasonLabel } from '@/lib/labels';
import { formatEuros } from '@/lib/money';
import { uuidOrNull } from '@/lib/params';
import { createClient } from '@/lib/supabase/server';
import { archiveOpportunity, clearNextAction, recoverOpportunity } from '../actions';

export const metadata: Metadata = { title: 'Oportunidad · CRM-123' };

const ACTIVITY_LIMIT = 50;

export default async function FichaOportunidadPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile();
  const id = uuidOrNull((await params).id);
  if (!id) notFound();
  const supabase = await createClient();

  const { data: opportunity, error } = await supabase
    .from('opportunities')
    .select(
      'id, title, type, stage, estimated_amount, final_amount, closed_on, lost_reason, next_action_date, next_action_text, notes, owner_id, customer_id, archived_at, customers(id, first_name, last_name)',
    )
    .eq('id', id)
    .maybeSingle();
  if (error) return readFailure('oportunidad', error);
  if (!opportunity) notFound();

  const [today, activitiesResult, names] = await Promise.all([
    readToday(supabase),
    supabase
      .from('activities')
      .select('id, type, description, occurred_at, voids_activity_id, created_by, opportunity_id')
      .eq('opportunity_id', id)
      .order('occurred_at', { ascending: false })
      .order('id')
      .limit(ACTIVITY_LIMIT),
    readNames(supabase),
  ]);
  if (activitiesResult.error) return readFailure('oportunidad-actividades', activitiesResult.error);

  const timeline = buildTimeline(activitiesResult.data ?? [], profile, names);
  const archived = opportunity.archived_at !== null;
  const closed = isClosedStage(opportunity.stage);
  const customerName = opportunity.customers ? `${opportunity.customers.first_name} ${opportunity.customers.last_name}` : 'Cliente';
  const ownerName = names.get(opportunity.owner_id) ?? (opportunity.owner_id === profile.id ? profile.fullName : 'Vendedor');
  const nextDate = opportunity.next_action_date;
  const hasNext = nextDate !== null && opportunity.next_action_text !== null;
  const lateNext = hasNext && nextDate < today;

  return (
    <>
      {archived ? (
        <Banner tone="info">
          <span className="flex w-full items-center gap-3">
            <b>Oportunidad archivada</b>
            <span className="ml-auto">
              <ActionButton action={recoverOpportunity} fields={{ id }} label="Recuperar" size="sm" icon={<ArchiveRestore className="i" size={16} aria-hidden="true" />} />
            </span>
          </span>
        </Banner>
      ) : null}

      <div className="panel flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <h2 className="m-0 text-base font-semibold text-brown">{opportunity.title}</h2>
          <TypeTag type={opportunity.type} />
          <span className="ml-auto font-semibold">
            {formatEuros(opportunity.estimated_amount)} <span className="font-normal text-ink-2">estimado</span>
          </span>
        </div>
        <div className="flex items-center gap-2 text-ink-2">
          <span>
            Cliente:{' '}
            {opportunity.customers ? (
              <Link className="link" href={`/clientes/${opportunity.customers.id}`}>
                {customerName}
              </Link>
            ) : (
              customerName
            )}
          </span>
          <span aria-hidden="true">·</span>
          <span>Vendedor: {ownerName}</span>
        </div>

        <StageSteps stage={opportunity.stage} />

        {opportunity.stage === 'ganada' ? (
          <Banner tone="success">
            <span className="flex flex-wrap gap-x-6">
              <span>
                <b>Monto final:</b> {formatEuros(opportunity.final_amount ?? 0)}
              </span>
              <span>
                <b>Fecha de cierre:</b> {opportunity.closed_on ? formatDate(opportunity.closed_on) : '—'}
              </span>
            </span>
          </Banner>
        ) : null}
        {opportunity.stage === 'perdida' ? (
          <Banner tone="error">
            <span className="flex flex-wrap gap-x-6">
              <span>
                <b>Motivo:</b> {opportunity.lost_reason ? lostReasonLabel(opportunity.lost_reason) : '—'}
              </span>
              <span>
                <b>Fecha de cierre:</b> {opportunity.closed_on ? formatDate(opportunity.closed_on) : '—'}
              </span>
            </span>
          </Banner>
        ) : null}

        {archived ? null : (
          <div className="flex flex-wrap items-start gap-2">
            {closed ? (
              <ReopenDialog opportunityId={id} />
            ) : (
              <>
                <StageMenu opportunityId={id} current={opportunity.stage} />
                <CloseWonDialog opportunityId={id} estimated={opportunity.estimated_amount} today={today} />
                <CloseLostDialog opportunityId={id} today={today} />
              </>
            )}
            <Button asChild variant="secondary">
              <Link href={`/oportunidades/${id}/editar`}>
                <Pencil className="i" size={16} aria-hidden="true" />
                Editar
              </Link>
            </Button>
            <ActionButton
              action={archiveOpportunity}
              fields={{ id }}
              label="Archivar"
              icon={<Archive className="i" size={16} aria-hidden="true" />}
              confirm={{ title: '¿Archivar?', text: 'Podrás recuperarlo después.', confirmLabel: 'Archivar' }}
            />
          </div>
        )}
      </div>

      {closed ? null : (
        <div className={`box-next${lateNext ? ' late' : ''}`}>
          <CalendarClock className="i" size={20} aria-hidden="true" />
          <div className="flex-1">
            <div className="text-xs text-ink-2">Próxima acción</div>
            {hasNext ? (
              <div>
                {lateNext ? <span className="sr-only">Atrasada. </span> : null}
                <b>{formatDate(nextDate)}</b> · {opportunity.next_action_text}
              </div>
            ) : (
              <div className="text-ink-2">Define la próxima acción</div>
            )}
          </div>
          {archived ? null : (
            <>
              <NextActionDialog opportunityId={id} hasAction={hasNext} date={nextDate ?? ''} text={opportunity.next_action_text ?? ''} />
              {hasNext ? <ActionButton action={clearNextAction} fields={{ id }} label="Quitar" size="sm" /> : null}
            </>
          )}
        </div>
      )}

      {opportunity.notes ? (
        <section className="panel" aria-labelledby="notas-titulo">
          <h2 id="notas-titulo" className="panel-h m-0">
            Notas
          </h2>
          <div className="panel-b whitespace-pre-wrap">{opportunity.notes}</div>
        </section>
      ) : null}

      <section className="panel" aria-labelledby="historial-titulo">
        <div className="panel-h">
          <h2 id="historial-titulo" className="m-0 text-base font-semibold">
            Historial de actividades
          </h2>
          {archived || timeline.length === 0 ? null : (
            <span className="ml-auto">
              <ActivityDialog customerId={opportunity.customer_id} opportunityId={id} suggestNextAction={!closed} />
            </span>
          )}
        </div>
        {timeline.length === 0 ? (
          <EmptyState icon={Phone} title="Todavía no hay actividad en esta oportunidad.">
            {archived ? null : <ActivityDialog customerId={opportunity.customer_id} opportunityId={id} suggestNextAction={!closed} variant="primary" size="default" />}
          </EmptyState>
        ) : (
          <div className="panel-b">
            <ActivityTimeline items={timeline} />
            {(activitiesResult.data?.length ?? 0) >= ACTIVITY_LIMIT ? (
              <p className="m-0 pt-2 text-xs text-ink-2">Se muestran las {ACTIVITY_LIMIT} actividades más recientes.</p>
            ) : null}
          </div>
        )}
      </section>
    </>
  );
}
