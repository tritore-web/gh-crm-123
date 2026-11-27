'use server';

import { fail, zodFieldErrors, type ActionResult } from '@/lib/action-result';
import { dbFailure, getActionContext, sessionEnded } from '@/lib/action-context';
import { MESSAGES } from '@/lib/errors';
import { bulkReassignSchema } from '@/lib/schemas';

const CHUNK = 100; // las direcciones muy largas fallan: se trabaja en lotes
const BAD_ORIGIN = 'Esos clientes ya no son de ese vendedor. Actualiza la pantalla.';

/**
 * Reasignación en bloque (solo supervisor). La base mueve también las oportunidades de cada cliente
 * (trigger) y deja cada cambio en la auditoría. Se exige que el cliente siga siendo del vendedor de origen.
 */
export async function reassignCustomers(formData: FormData): Promise<ActionResult<{ customers: number; opportunities: number }>> {
  const ctx = await getActionContext();
  if (!ctx) return sessionEnded();
  if (ctx.profile.role !== 'supervisor') return fail(MESSAGES.forbidden);

  const parsed = bulkReassignSchema.safeParse({
    origin_id: formData.get('origin_id'),
    dest_id: formData.get('dest_id'),
    customer_ids: [...new Set(formData.getAll('customer_id').filter((v): v is string => typeof v === 'string'))],
  });
  if (!parsed.success) return fail('Revisa el formulario.', zodFieldErrors(parsed.error));
  const { origin_id: origin, dest_id: dest, customer_ids: ids } = parsed.data;

  let customers = 0;
  let opportunities = 0;
  for (let start = 0; start < ids.length; start += CHUNK) {
    const chunk = ids.slice(start, start + CHUNK);
    // Oportunidades que se moverán con este lote (se cuentan antes de que el trigger las cambie).
    const { count, error: countError } = await ctx.supabase
      .from('opportunities')
      .select('id', { count: 'exact', head: true })
      .in('customer_id', chunk)
      .eq('owner_id', origin);
    if (countError) return dbFailure('reasignar-bloque-contar', countError);

    const { data, error } = await ctx.supabase
      .from('customers')
      .update({ owner_id: dest })
      .in('id', chunk)
      .eq('owner_id', origin)
      .select('id');
    if (error) {
      const partial = customers > 0 ? ` Ya se pasaron ${customers} clientes antes del error.` : '';
      const failure = dbFailure('reasignar-bloque', error);
      return { ...failure, error: `${failure.error}${partial}` };
    }
    customers += data?.length ?? 0;
    opportunities += count ?? 0;
  }
  if (customers === 0) return fail(BAD_ORIGIN);
  return { ok: true, customers, opportunities };
}
