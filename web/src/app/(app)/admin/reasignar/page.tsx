import type { Metadata } from 'next';
import { ReassignFlow, type ReassignCustomer } from '@/components/admin/reassign-flow';
import { Field } from '@/components/ui/field';
import { FilterForm } from '@/components/ui/filter-form';
import { Select } from '@/components/ui/select';
import { requireProfile } from '@/lib/current-profile';
import { readFailure, readSellers } from '@/lib/data';
import { firstParam, uuidOrNull, type SearchParams } from '@/lib/params';
import { formatPhone } from '@/lib/phone';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Reasignar · CRM-123' };

const LIST_LIMIT = 1000;

export default async function ReasignarPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireProfile();
  const supabase = await createClient();
  const sellers = await readSellers(supabase);
  const originId = uuidOrNull(firstParam((await searchParams).origen));
  const origin = sellers.find((s) => s.id === originId);

  let customers: ReassignCustomer[] = [];
  let truncated = false;
  if (origin) {
    const [customersResult, opportunitiesResult] = await Promise.all([
      supabase
        .from('customers')
        .select('id, first_name, last_name, phone, archived_at')
        .eq('owner_id', origin.id)
        .order('last_name')
        .order('first_name')
        .order('id')
        .limit(LIST_LIMIT),
      // La oportunidad siempre es del mismo vendedor que su cliente: se cuentan por vendedor y no por lista de clientes.
      supabase.from('opportunities').select('customer_id').eq('owner_id', origin.id).limit(5000),
    ]);
    if (customersResult.error) return readFailure('reasignar-clientes', customersResult.error);
    if (opportunitiesResult.error) return readFailure('reasignar-oportunidades', opportunitiesResult.error);

    const counts = new Map<string, number>();
    for (const row of opportunitiesResult.data ?? []) counts.set(row.customer_id, (counts.get(row.customer_id) ?? 0) + 1);
    customers = (customersResult.data ?? []).map((row) => ({
      id: row.id,
      name: `${row.first_name} ${row.last_name}`,
      phone: formatPhone(row.phone),
      archived: row.archived_at !== null,
      opportunities: counts.get(row.id) ?? 0,
    }));
    truncated = (customersResult.data?.length ?? 0) >= LIST_LIMIT;
  }

  return (
    <>
      <div className="flex items-center gap-2 text-ink-2" aria-label="Pasos">
        <span className={origin ? '' : 'font-semibold text-ink'}>1. Origen</span>
        <span aria-hidden="true">›</span>
        <span className={origin ? 'font-semibold text-ink' : ''}>2. Clientes</span>
        <span aria-hidden="true">›</span>
        <span>3. Destino</span>
        <span aria-hidden="true">›</span>
        <span>4. Confirmar</span>
      </div>

      <FilterForm>
        <Field id="origen" label="Vendedor de origen" className="w-64">
          <Select id="origen" name="origen" defaultValue={origin?.id ?? ''}>
            <option value="">Elige un vendedor</option>
            {sellers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
                {s.active ? '' : ' (desactivado)'}
              </option>
            ))}
          </Select>
        </Field>
      </FilterForm>

      {origin ? (
        <ReassignFlow
          // Solo al cambiar de vendedor de origen el flujo empieza limpio (no al refrescar: así se conserva el aviso de éxito).
          key={origin.id}
          originId={origin.id}
          originName={origin.name}
          customers={customers}
          destinations={sellers.filter((s) => s.active && s.id !== origin.id).map((s) => ({ id: s.id, name: s.name }))}
          truncated={truncated}
        />
      ) : null}
    </>
  );
}
