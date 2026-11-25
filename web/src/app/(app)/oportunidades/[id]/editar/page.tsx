import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { OpportunityForm } from '@/components/opportunities/opportunity-form';
import { requireProfile } from '@/lib/current-profile';
import { readFailure } from '@/lib/data';
import { isClosedStage } from '@/lib/labels';
import { formatEuros } from '@/lib/money';
import { uuidOrNull } from '@/lib/params';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Editar oportunidad · CRM-123' };

export default async function EditarOportunidadPage({ params }: { params: Promise<{ id: string }> }) {
  await requireProfile();
  const id = uuidOrNull((await params).id);
  if (!id) notFound();

  const supabase = await createClient();
  const { data: opportunity, error } = await supabase
    .from('opportunities')
    .select('id, title, type, stage, estimated_amount, next_action_date, next_action_text, notes, archived_at, customers(first_name, last_name)')
    .eq('id', id)
    .maybeSingle();
  if (error) return readFailure('oportunidad-editar', error);
  if (!opportunity) notFound();
  if (opportunity.archived_at) redirect(`/oportunidades/${id}`); // una oportunidad archivada no se edita: primero se recupera

  const customerName = opportunity.customers ? `${opportunity.customers.first_name} ${opportunity.customers.last_name}` : '';

  return (
    <OpportunityForm
      mode="edit"
      opportunityId={opportunity.id}
      customer={{ id: '', label: customerName }}
      customerLocked
      closed={isClosedStage(opportunity.stage)}
      initial={{
        title: opportunity.title,
        type: opportunity.type,
        estimated_amount: formatEuros(opportunity.estimated_amount).replace(/\s?€$/, ''),
        stage: opportunity.stage,
        next_action_date: opportunity.next_action_date ?? '',
        next_action_text: opportunity.next_action_text ?? '',
        notes: opportunity.notes ?? '',
      }}
      cancelHref={`/oportunidades/${id}`}
    />
  );
}
