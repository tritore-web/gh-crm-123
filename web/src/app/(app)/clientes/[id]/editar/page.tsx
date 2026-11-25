import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { CustomerForm } from '@/components/customers/customer-form';
import { requireProfile } from '@/lib/current-profile';
import { readFailure, readSellers } from '@/lib/data';
import { uuidOrNull } from '@/lib/params';
import { formatPhone } from '@/lib/phone';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Editar cliente · CRM-123' };

export default async function EditarClientePage({ params }: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile();
  const id = uuidOrNull((await params).id);
  if (!id) notFound();

  const supabase = await createClient();
  const { data: customer, error } = await supabase
    .from('customers')
    .select('id, first_name, last_name, phone, email, source, accepts_communications, notes, owner_id, archived_at')
    .eq('id', id)
    .maybeSingle();
  if (error) return readFailure('cliente-editar', error);
  if (!customer) notFound();
  if (customer.archived_at) redirect(`/clientes/${id}`); // un cliente archivado no se edita: primero se recupera

  const sellers = profile.role === 'supervisor' ? (await readSellers(supabase)).filter((s) => s.active || s.id === customer.owner_id) : undefined;

  return (
    <CustomerForm
      mode="edit"
      customerId={customer.id}
      initial={{
        first_name: customer.first_name,
        last_name: customer.last_name,
        phone: formatPhone(customer.phone),
        email: customer.email ?? '',
        source: customer.source,
        accepts_communications: customer.accepts_communications,
        notes: customer.notes ?? '',
        owner_id: customer.owner_id,
      }}
      sellers={sellers?.map((s) => ({ id: s.id, name: s.name }))}
      cancelHref={`/clientes/${id}`}
    />
  );
}
