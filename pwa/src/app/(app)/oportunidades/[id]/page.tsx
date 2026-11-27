import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { MessageSquare, Phone, StickyNote, Users } from 'lucide-react';
import { BackHeader } from '@/components/shell/back-header';
import { Banner } from '@/components/ui/banner';
import { StageTag, TypeTag } from '@/components/ui/tags';
import { NextActionLine } from '@/components/opportunities/next-action-line';
import { buildTimeline } from '@/lib/activities';
import { requireProfile } from '@/lib/current-profile';
import { readFailure, readNames, readToday } from '@/lib/data';
import { formatDateTime } from '@/lib/dates';
import { lostReasonLabel } from '@/lib/labels';
import { formatEuros } from '@/lib/money';
import { uuidOrNull } from '@/lib/params';
import { formatPhone } from '@/lib/phone';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Oportunidad · CRM-123' };

const ICONS = { llamada: Phone, mensaje: MessageSquare, reunion: Users, nota: StickyNote } as const;

export default async function DetalleOportunidadPage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile();
  const id = uuidOrNull((await params).id);
  if (!id) notFound();
  const supabase = await createClient();

  const { data: opportunity, error } = await supabase
    .from('opportunities')
    .select('id, title, type, stage, estimated_amount, final_amount, lost_reason, next_action_date, next_action_text, owner_id, customers(first_name, last_name, phone)')
    .eq('id', id)
    .maybeSingle();
  if (error) return readFailure('oportunidad', error);
  if (!opportunity) notFound();

  const [today, names, activities] = await Promise.all([
    readToday(supabase),
    readNames(supabase),
    supabase
      .from('activities')
      .select('id, type, description, occurred_at, voids_activity_id, created_by, opportunity_id')
      .eq('opportunity_id', id)
      .order('occurred_at', { ascending: false })
      .order('id')
      .limit(20),
  ]);
  if (activities.error) return readFailure('oportunidad-actividades', activities.error);

  const recent = buildTimeline(activities.data ?? [], profile, names).slice(0, 5);
  const closed = opportunity.stage === 'ganada' || opportunity.stage === 'perdida';
  const customer = opportunity.customers;

  return (
    <>
      <BackHeader title="Oportunidad" href="/oportunidades" label="Volver a Oportunidades" />
      <main className="flex flex-1 flex-col gap-3 p-4">
        <div className="m-card">
          <h2 className="m-0 text-base font-semibold text-brown">{opportunity.title}</h2>
          <div className="flex items-center gap-2">
            <StageTag stage={opportunity.stage} />
            <TypeTag type={opportunity.type} />
          </div>
          <div className="font-semibold">{formatEuros(opportunity.estimated_amount, { hideZeroDecimals: true })}</div>
          <div className="text-ink-2">Monto estimado</div>
          {opportunity.stage === 'ganada' ? (
            <div className="flex items-center gap-2">
              <span className="tag won">Monto final</span>
              <span className="font-semibold">{formatEuros(opportunity.final_amount ?? 0, { hideZeroDecimals: true })}</span>
            </div>
          ) : null}
          {opportunity.stage === 'perdida' ? (
            <Banner tone="error">
              <b>Motivo de pérdida:</b> {opportunity.lost_reason ? lostReasonLabel(opportunity.lost_reason) : '—'}
            </Banner>
          ) : null}
        </div>

        <div className="m-card">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{customer ? `${customer.first_name} ${customer.last_name}` : 'Cliente'}</span>
            {customer ? (
              <a href={`tel:${customer.phone}`} className="ml-auto inline-flex min-h-11 items-center gap-1.5 font-medium text-primary no-underline">
                <Phone className="i" size={16} aria-hidden="true" />
                {formatPhone(customer.phone)}
              </a>
            ) : null}
          </div>
          <div className="text-ink-2">Vendedor: {names.get(opportunity.owner_id) ?? '—'}</div>
        </div>

        {closed ? null : (
          <div className="m-card">
            <h3 className="m-sec m-0">Próxima acción</h3>
            {opportunity.next_action_date && opportunity.next_action_text ? (
              <NextActionLine date={opportunity.next_action_date} text={opportunity.next_action_text} today={today} />
            ) : (
              <div className="text-ink-2">Sin próxima acción</div>
            )}
          </div>
        )}

        <div className="m-card">
          <h3 className="m-sec m-0">Últimas actividades</h3>
          {recent.length === 0 ? (
            <div className="text-ink-2">Todavía no hay actividad en esta oportunidad.</div>
          ) : (
            <ul className="tl">
              {recent.map((item) => {
                const Icon = ICONS[item.type as keyof typeof ICONS] ?? StickyNote;
                return (
                  <li key={item.id} className={item.voided ? 'void' : undefined}>
                    <span className="ic">
                      <Icon className="i" size={14} aria-hidden="true" />
                    </span>
                    <div>
                      <div className="d">
                        {item.description}
                        {item.voided ? <span className="tag ml-2">Anulada</span> : null}
                      </div>
                      <div className="m">
                        {item.author} · {formatDateTime(item.occurred_at)}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}
