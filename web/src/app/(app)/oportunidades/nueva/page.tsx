import type { Metadata } from 'next';
import { OpportunityForm } from '@/components/opportunities/opportunity-form';
import { requireProfile } from '@/lib/current-profile';
import { readFailure } from '@/lib/data';
import { firstParam, uuidOrNull, type SearchParams } from '@/lib/params';
import { formatPhone } from '@/lib/phone';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Nueva oportunidad · CRM-123' };

export default async function NuevaOportunidadPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireProfile();
  const customerId = uuidOrNull(firstParam((await searchParams).cliente));

  // Si se llega desde una ficha, el cliente viene fijado. Un cliente archivado no se puede elegir.
  let customer: { id: string; label: string } | null = null;
  if (customerId) {
    const supabase = await createClient();
    const { data, error } = await supabase.from('customers').select('id, first_name, last_name, phone, archived_at').eq('id', customerId).maybeSingle();
    if (error) return readFailure('oportunidad-cliente', error);
    if (data && !data.archived_at) customer = { id: data.id, label: `${data.first_name} ${data.last_name} · ${formatPhone(data.phone)}` };
  }

  return (
    <OpportunityForm
      mode="new"
      draftId={crypto.randomUUID()}
      customer={customer}
      customerLocked={customer !== null}
      initial={{ title: '', type: '', estimated_amount: '', stage: 'nueva', next_action_date: '', next_action_text: '', notes: '' }}
      cancelHref={customer ? `/clientes/${customer.id}` : '/oportunidades'}
    />
  );
}
