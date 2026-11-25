import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Archive, ArchiveRestore, CircleDot, Mail, Pencil, Phone, Plus } from 'lucide-react';
import { ActivityDialog } from '@/components/activities/activity-dialog';
import { ActivityTimeline } from '@/components/activities/timeline';
import { ReassignDialog } from '@/components/customers/reassign-dialog';
import { OpportunityCard } from '@/components/opportunities/opportunity-card';
import { ActionButton } from '@/components/ui/action-button';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { buildTimeline } from '@/lib/activities';
import { requireProfile } from '@/lib/current-profile';
import { readFailure, readNames, readSellers, readToday } from '@/lib/data';
import { sourceLabel } from '@/lib/labels';
import { uuidOrNull } from '@/lib/params';
import { formatPhone } from '@/lib/phone';
import { createClient } from '@/lib/supabase/server';
import { archiveCustomer, recoverCustomer } from '../actions';

export const metadata: Metadata = { title: 'Cliente · CRM-123' };

const ACTIVITY_LIMIT = 50;

export default async function FichaClientePage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile();
  const id = uuidOrNull((await params).id);
  if (!id) notFound();
  const supabase = await createClient();
  const supervisor = profile.role === 'supervisor';

  const { data: customer, error } = await supabase
    .from('customers')
    .select('id, first_name, last_name, phone, email, source, accepts_communications, notes, owner_id, archived_at')
    .eq('id', id)
    .maybeSingle();
  if (error) return readFailure('cliente', error);
  if (!customer) notFound();

  const [today, opportunitiesResult, activitiesResult, names, sellers] = await Promise.all([
    readToday(supabase),
    supabase
      .from('opportunities')
      .select('id, title, type, stage, estimated_amount, next_action_date, next_action_text')
      .eq('customer_id', id)
      .is('archived_at', null)
      .order('created_at', { ascending: false })
      .order('id'),
    supabase
      .from('activities')
      .select('id, type, description, occurred_at, voids_activity_id, created_by, opportunity_id')
      .eq('customer_id', id)
      .order('occurred_at', { ascending: false })
      .order('id')
      .limit(ACTIVITY_LIMIT),
    readNames(supabase),
    supervisor ? readSellers(supabase) : Promise.resolve([]),
  ]);
  if (opportunitiesResult.error) return readFailure('cliente-oportunidades', opportunitiesResult.error);
  if (activitiesResult.error) return readFailure('cliente-actividades', activitiesResult.error);

  const opportunities = opportunitiesResult.data ?? [];
  const timeline = buildTimeline(activitiesResult.data ?? [], profile, names);
  const fullName = `${customer.first_name} ${customer.last_name}`;
  const archived = customer.archived_at !== null;
  const ownerName = names.get(customer.owner_id) ?? (customer.owner_id === profile.id ? profile.fullName : 'Vendedor');
  const reassignOptions = sellers.filter((s) => s.active && s.id !== customer.owner_id).map((s) => ({ id: s.id, name: s.name }));

  return (
    <>
      {archived ? (
        <Banner tone="info">
          <span className="flex w-full items-center gap-3">
            <b>Cliente archivado</b>
            <span className="ml-auto">
              <ActionButton
                action={recoverCustomer}
                fields={{ id }}
                label="Recuperar"
                size="sm"
                icon={<ArchiveRestore className="i" size={16} aria-hidden="true" />}
              />
            </span>
          </span>
        </Banner>
      ) : null}

      <div className="panel flex items-start gap-4 p-4">
        <div className="flex flex-col gap-2">
          <h2 className="m-0 text-base font-semibold text-brown">{fullName}</h2>
          <div className="flex flex-wrap items-center gap-2 text-ink-2">
            <span className="inline-flex items-center gap-1">
              <Phone className="i" size={14} aria-hidden="true" />
              {formatPhone(customer.phone)}
            </span>
            {customer.email ? (
              <>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1">
                  <Mail className="i" size={14} aria-hidden="true" />
                  {customer.email}
                </span>
              </>
            ) : null}
            <span aria-hidden="true">·</span>
            <span>Origen: {sourceLabel(customer.source)}</span>
          </div>
          <div className="flex items-center gap-3">
            {customer.accepts_communications ? <span className="tag won">Acepta comunicaciones</span> : <span className="tag">No acepta comunicaciones</span>}
            <span className="text-ink-2">Vendedor: {ownerName}</span>
          </div>
        </div>
        {archived ? null : (
          <div className="ml-auto flex flex-wrap justify-end gap-2">
            <Button asChild variant="secondary">
              <Link href={`/oportunidades/nueva?cliente=${id}`}>
                <Plus className="i" size={16} aria-hidden="true" />
                Oportunidad
              </Link>
            </Button>
            <ActivityDialog customerId={id} label="Actividad" size="default" />
            <Button asChild variant="secondary">
              <Link href={`/clientes/${id}/editar`}>
                <Pencil className="i" size={16} aria-hidden="true" />
                Editar
              </Link>
            </Button>
            <ActionButton
              action={archiveCustomer}
              fields={{ id }}
              label="Archivar"
              icon={<Archive className="i" size={16} aria-hidden="true" />}
              confirm={{ title: `¿Archivar a ${fullName}?`, text: 'Podrás recuperarlo después.', confirmLabel: 'Archivar' }}
            />
            {supervisor ? <ReassignDialog customerId={id} customerName={fullName} opportunityCount={opportunities.length} options={reassignOptions} /> : null}
          </div>
        )}
      </div>

      <div className="flex items-start gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <section className="panel" aria-labelledby="oportunidades-titulo">
            <h2 id="oportunidades-titulo" className="panel-h m-0">
              Oportunidades
            </h2>
            {opportunities.length === 0 ? (
              <EmptyState icon={CircleDot} title="Este cliente no tiene oportunidades. Crea la primera.">
                {archived ? null : (
                  <Button asChild>
                    <Link href={`/oportunidades/nueva?cliente=${id}`}>
                      <Plus className="i" size={16} aria-hidden="true" />
                      Oportunidad
                    </Link>
                  </Button>
                )}
              </EmptyState>
            ) : (
              <div className="panel-b flex flex-col gap-3">
                {opportunities.map((opportunity) => (
                  <OpportunityCard key={opportunity.id} opportunity={opportunity} today={today} />
                ))}
              </div>
            )}
          </section>
          {customer.notes ? (
            <section className="panel" aria-labelledby="notas-titulo">
              <h2 id="notas-titulo" className="panel-h m-0">
                Notas
              </h2>
              <div className="panel-b whitespace-pre-wrap">{customer.notes}</div>
            </section>
          ) : null}
        </div>

        <section className="panel min-w-0 flex-1" aria-labelledby="historial-titulo">
          <div className="panel-h">
            <h2 id="historial-titulo" className="m-0 text-base font-semibold">
              Historial de actividades
            </h2>
            {archived || timeline.length === 0 ? null : (
              <span className="ml-auto">
                <ActivityDialog customerId={id} />
              </span>
            )}
          </div>
          {timeline.length === 0 ? (
            <EmptyState icon={Phone} title="Todavía no hay actividad con este cliente.">
              {archived ? null : <ActivityDialog customerId={id} variant="primary" size="default" />}
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
      </div>
    </>
  );
}
