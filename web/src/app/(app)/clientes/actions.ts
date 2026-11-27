'use server';

import { z } from 'zod';
import { fail, formToObject, zodFieldErrors, type ActionResult } from '@/lib/action-result';
import { dbFailure, getActionContext, isRetryOfSameInsert, sessionEnded } from '@/lib/action-context';
import { MESSAGES } from '@/lib/errors';
import { buildArchive, buildRecover } from '@/lib/opportunity-ops';
import { customerSchema, idSchema, ownerSchema } from '@/lib/schemas';
import { customerTermFilter, searchTerms } from '@/lib/search';
import { formatPhone } from '@/lib/phone';

const NOT_FOUND = 'No encontramos ese cliente.';
const OWNER_REQUIRED = 'Elige un vendedor.';

function customerFailure(context: string, error: { code?: string | null; message?: string | null }) {
  if (error.code === '23505' && (error.message ?? '').includes('customers_phone_key')) {
    return fail(MESSAGES.duplicatePhone, { phone: MESSAGES.duplicatePhone });
  }
  return dbFailure(context, error);
}

export async function createCustomer(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const ctx = await getActionContext();
  if (!ctx) return sessionEnded();

  const parsed = customerSchema.safeParse(formToObject(formData));
  if (!parsed.success) return fail('Revisa el formulario.', zodFieldErrors(parsed.error));
  const input = parsed.data;

  // El vendedor siempre crea clientes propios; el supervisor elige el vendedor.
  const ownerId = ctx.profile.role === 'vendedor' ? ctx.profile.id : input.owner_id;
  if (!ownerId) return fail('Revisa el formulario.', { owner_id: OWNER_REQUIRED });

  const id = input.id ?? crypto.randomUUID();
  const { error } = await ctx.supabase.from('customers').insert({
    id,
    owner_id: ownerId,
    first_name: input.first_name,
    last_name: input.last_name,
    phone: input.phone,
    email: input.email,
    source: input.source,
    accepts_communications: input.accepts_communications,
    notes: input.notes,
  });
  if (error && !isRetryOfSameInsert(error, 'customers_pkey')) return customerFailure('crear-cliente', error);
  return { ok: true, id };
}

export async function updateCustomer(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const ctx = await getActionContext();
  if (!ctx) return sessionEnded();

  const raw = formToObject(formData);
  const idResult = idSchema.safeParse({ id: raw.customer_id });
  if (!idResult.success) return fail(NOT_FOUND);
  const parsed = customerSchema.safeParse(raw);
  if (!parsed.success) return fail('Revisa el formulario.', zodFieldErrors(parsed.error));
  const input = parsed.data;

  const { data, error } = await ctx.supabase
    .from('customers')
    .update({
      first_name: input.first_name,
      last_name: input.last_name,
      phone: input.phone,
      email: input.email,
      source: input.source,
      accepts_communications: input.accepts_communications,
      notes: input.notes,
      // Solo el supervisor puede cambiar el vendedor (la base también lo impide al vendedor).
      ...(ctx.profile.role === 'supervisor' && input.owner_id ? { owner_id: input.owner_id } : {}),
    })
    .eq('id', idResult.data.id)
    .select('id');
  if (error) return customerFailure('editar-cliente', error);
  if (!data || data.length === 0) return fail(NOT_FOUND);
  return { ok: true, id: idResult.data.id };
}

async function setArchived(formData: FormData, archive: boolean): Promise<ActionResult> {
  const ctx = await getActionContext();
  if (!ctx) return sessionEnded();
  const parsed = idSchema.safeParse({ id: formToObject(formData).id });
  if (!parsed.success) return fail(NOT_FOUND);

  const { data, error } = await ctx.supabase
    .from('customers')
    .update(archive ? buildArchive(new Date().toISOString()) : buildRecover())
    .eq('id', parsed.data.id)
    .select('id');
  if (error) return dbFailure(archive ? 'archivar-cliente' : 'recuperar-cliente', error);
  if (!data || data.length === 0) return fail(NOT_FOUND);
  return { ok: true };
}

export async function archiveCustomer(formData: FormData): Promise<ActionResult> {
  return setArchived(formData, true);
}

export async function recoverCustomer(formData: FormData): Promise<ActionResult> {
  return setArchived(formData, false);
}

/** Cambiar vendedor: solo el supervisor. La base mueve también las oportunidades del cliente y lo registra. */
export async function reassignCustomer(formData: FormData): Promise<ActionResult> {
  const ctx = await getActionContext();
  if (!ctx) return sessionEnded();
  if (ctx.profile.role !== 'supervisor') return fail(MESSAGES.forbidden);

  const parsed = ownerSchema.safeParse(formToObject(formData));
  if (!parsed.success) return fail('Revisa el formulario.', zodFieldErrors(parsed.error));

  const { data, error } = await ctx.supabase
    .from('customers')
    .update({ owner_id: parsed.data.owner_id })
    .eq('id', parsed.data.id)
    .select('id');
  if (error) return dbFailure('reasignar-cliente', error);
  if (!data || data.length === 0) return fail(NOT_FOUND);
  return { ok: true };
}

export type CustomerHit = { id: string; name: string; phone: string; archived: boolean };

const searchInput = z.object({ query: z.string().max(200), includeArchived: z.boolean() });

/** Búsqueda rápida por nombre o teléfono (la RLS limita los resultados a los clientes visibles). */
export async function searchCustomers(query: string, includeArchived: boolean): Promise<CustomerHit[]> {
  const ctx = await getActionContext();
  const parsed = searchInput.safeParse({ query, includeArchived });
  if (!ctx || !parsed.success) return [];
  const terms = searchTerms(parsed.data.query);
  if (terms.length === 0) return [];

  let request = ctx.supabase.from('customers').select('id, first_name, last_name, phone, archived_at');
  if (!parsed.data.includeArchived) request = request.is('archived_at', null);
  for (const term of terms) request = request.or(customerTermFilter(term));
  const { data, error } = await request
    .order('last_name')
    .order('first_name')
    .order('id')
    .limit(8);
  if (error) {
    console.error('[buscar-clientes] error de lectura', { code: error.code });
    return [];
  }
  return (data ?? []).map((row) => ({
    id: row.id,
    name: `${row.first_name} ${row.last_name}`,
    phone: formatPhone(row.phone),
    archived: row.archived_at !== null,
  }));
}
