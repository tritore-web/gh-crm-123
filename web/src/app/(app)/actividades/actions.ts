'use server';

import { fail, formToObject, zodFieldErrors, type ActionResult } from '@/lib/action-result';
import { dbFailure, getActionContext, isRetryOfSameInsert, sessionEnded } from '@/lib/action-context';
import { activitySchema, idSchema } from '@/lib/schemas';

const NOT_FOUND = 'No encontramos esa actividad.';

/** Registrar una actividad (solo se añaden: nunca se editan ni se borran). */
export async function registerActivity(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const ctx = await getActionContext();
  if (!ctx) return sessionEnded();

  const parsed = activitySchema.safeParse(formToObject(formData));
  if (!parsed.success) return fail('Revisa el formulario.', zodFieldErrors(parsed.error));
  const input = parsed.data;

  const id = input.id ?? crypto.randomUUID();
  const { error } = await ctx.supabase.from('activities').insert({
    id,
    customer_id: input.customer_id,
    opportunity_id: input.opportunity_id ?? null,
    type: input.type,
    description: input.description,
    ...(input.occurred_at ? { occurred_at: input.occurred_at } : {}),
  });
  if (error && !isRetryOfSameInsert(error, 'activities_pkey')) return dbFailure('registrar-actividad', error);
  return { ok: true, id };
}

/**
 * Anular una actividad: se inserta una actividad de tipo «anulacion» que apunta a la original.
 * La original sigue visible, tachada. Un vendedor solo anula las suyas (lo garantiza la base).
 */
export async function voidActivity(formData: FormData): Promise<ActionResult> {
  const ctx = await getActionContext();
  if (!ctx) return sessionEnded();

  const parsed = idSchema.safeParse({ id: formToObject(formData).id });
  if (!parsed.success) return fail(NOT_FOUND);

  const { data: original, error: readError } = await ctx.supabase
    .from('activities')
    .select('id, customer_id, opportunity_id, type')
    .eq('id', parsed.data.id)
    .maybeSingle();
  if (readError) return dbFailure('anular-actividad-lectura', readError);
  if (!original || original.type === 'anulacion') return fail(NOT_FOUND);

  const { error } = await ctx.supabase.from('activities').insert({
    customer_id: original.customer_id,
    opportunity_id: original.opportunity_id,
    type: 'anulacion',
    description: 'Actividad anulada',
    voids_activity_id: original.id,
  });
  if (error) return dbFailure('anular-actividad', error);
  return { ok: true };
}
