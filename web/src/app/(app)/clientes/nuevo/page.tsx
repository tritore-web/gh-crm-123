import type { Metadata } from 'next';
import { CustomerForm } from '@/components/customers/customer-form';
import { requireProfile } from '@/lib/current-profile';
import { readSellers } from '@/lib/data';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Nuevo cliente · CRM-123' };

export default async function NuevoClientePage() {
  const profile = await requireProfile();
  const supervisor = profile.role === 'supervisor';
  const sellers = supervisor ? (await readSellers(await createClient())).filter((s) => s.active) : undefined;

  return (
    <CustomerForm
      mode="new"
      draftId={crypto.randomUUID()}
      initial={{ first_name: '', last_name: '', phone: '', email: '', source: '', accepts_communications: false, notes: '', owner_id: '' }}
      sellers={sellers?.map((s) => ({ id: s.id, name: s.name }))}
      cancelHref="/clientes"
    />
  );
}
