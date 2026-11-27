'use server';

import { fail, formToObject, zodFieldErrors, type ActionResult } from '@/lib/action-result';
import { dbFailure, getActionContext, isRetryOfSameInsert, sessionEnded } from '@/lib/action-context';
import { OPEN_STAGES } from '@/lib/labels';
import {
  buildArchive, buildClearNextAction, buildCloseLost, buildCloseWon, buildNextAction, buildRecover, buildReopen, buildStageChange,
  type OpportunityUpdate,
} from '@/lib/opportunity-ops';
import { closeLostSchema, closeWonSchema, idSchema, nextActionSchema, opportunityEditSchema, opportunitySchema, reopenSchema } from '@/lib/schemas';

const NOT_FOUND = 'No encontramos esa oportunidad.';
const ALREADY_CLOSED = 'Esta oportunidad ya está cerrada.';
const NOT_CLOSED = 'Esta oportunidad no está cerrada.';
const ARCHIVED_CUSTOMER = 'No se puede crear una oportunidad para un cliente archivado.';
const CLOSED_STAGES = ['ganada', 'perdida'] as const;

export async function createOpportunity(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const ctx = await getActionContext();
  if (!ctx) return sessionEnded();

  const parsed = opportunitySchema.safeParse(formToObject(formData));
  if (!parsed.success) return fail('Revisa el formulario.', zodFieldErrors(parsed.error));
  const input = parsed.data;

  // La oportunidad siempre es del mismo vendedor que su cliente (la RLS solo deja ver los clientes permitidos).
  const { data: customer, error: customerError } = await ctx.supabase
    .from('customers')
    .select('id, owner_id, archived_at')
    .eq('id', input.customer_id)
    .maybeSingle();
  if (customerError) return dbFailure('crear-oportunidad-cliente', customerError);
  if (!customer) return fail('Revisa el formulario.', { customer_id: 'Elige un cliente.' });
  if (customer.archived_at) return fail('Revisa el formulario.', { customer_id: ARCHIVED_CUSTOMER });

  const id = input.id ?? crypto.randomUUID();
  const { error } = await ctx.supabase.from('opportunities').insert({
    id,
    customer_id: customer.id,
    owner_id: customer.owner_id,
    title: input.title,
    type: input.type,
    stage: input.stage,
    estimated_amount: input.estimated_amount,
    next_action_date: input.next_action_date,
    next_action_text: input.next_action_text,
    notes: input.notes,
  });
  if (error && !isRetryOfSameInsert(error, 'opportunities_pkey')) return dbFailure('crear-oportunidad', error);
  return { ok: true, id };
}

export async function updateOpportunity(formData: FormData): Promise<ActionResult<{ id: string }>> {
  const ctx = await getActionContext();
  if (!ctx) return sessionEnded();

  const raw = formToObject(formData);
  const idResult = idSchema.safeParse({ id: raw.opportunity_id });
  if (!idResult.success) return fail(NOT_FOUND);
  const parsed = opportunityEditSchema.safeParse(raw);
  if (!parsed.success) return fail('Revisa el formulario.', zodFieldErrors(parsed.error));
  const input = parsed.data;

  const { data: current, error: readError } = await ctx.supabase.from('opportunities').select('stage').eq('id', idResult.data.id).maybeSingle();
  if (readError) return dbFailure('editar-oportunidad-lectura', readError);
  if (!current) return fail(NOT_FOUND);

  const update: OpportunityUpdate = {
    title: input.title,
    type: input.type,
    estimated_amount: input.estimated_amount,
    notes: input.notes,
  };
  // Una oportunidad cerrada no cambia de etapa ni lleva próxima acción (la base lo exige).
  if (!(CLOSED_STAGES as readonly string[]).includes(current.stage)) {
    if (input.stage) update.stage = input.stage;
    if (input.next_action_date !== undefined && input.next_action_text !== undefined) {
      Object.assign(update, input.next_action_date && input.next_action_text ? buildNextAction({ date: input.next_action_date, text: input.next_action_text }) : buildClearNextAction());
    }
  }

  const { data, error } = await ctx.supabase.from('opportunities').update(update).eq('id', idResult.data.id).select('id');
  if (error) return dbFailure('editar-oportunidad', error);
  if (!data || data.length === 0) return fail(NOT_FOUND);
  return { ok: true, id: idResult.data.id };
}

/** Aplica una operación a una oportunidad que debe estar en alguna de las etapas indicadas. */
async function applyUpdate(
  context: string,
  id: string,
  update: OpportunityUpdate,
  onlyIn: readonly string[],
  wrongState: string,
): Promise<ActionResult> {
  const ctx = await getActionContext();
  if (!ctx) return sessionEnded();
  const { data, error } = await ctx.supabase.from('opportunities').update(update).eq('id', id).in('stage', [...onlyIn]).select('id');
  if (error) return dbFailure(context, error);
  if (!data || data.length === 0) return fail(wrongState);
  return { ok: true };
}

export async function changeStage(formData: FormData): Promise<ActionResult> {
  const raw = formToObject(formData);
  const parsed = reopenSchema.safeParse({ stage: raw.stage });
  const idResult = idSchema.safeParse({ id: raw.id });
  if (!parsed.success || !idResult.success) return fail('Revisa los datos e inténtalo de nuevo.');
  return applyUpdate('cambiar-etapa', idResult.data.id, buildStageChange(parsed.data.stage), OPEN_STAGES, ALREADY_CLOSED);
}

export async function closeAsWon(formData: FormData): Promise<ActionResult> {
  const raw = formToObject(formData);
  const idResult = idSchema.safeParse({ id: raw.id });
  const parsed = closeWonSchema.safeParse(raw);
  if (!idResult.success) return fail(NOT_FOUND);
  if (!parsed.success) return fail('Revisa el formulario.', zodFieldErrors(parsed.error));
  return applyUpdate('cerrar-ganada', idResult.data.id, buildCloseWon({ finalAmount: parsed.data.final_amount, closedOn: parsed.data.closed_on }), OPEN_STAGES, ALREADY_CLOSED);
}

export async function closeAsLost(formData: FormData): Promise<ActionResult> {
  const raw = formToObject(formData);
  const idResult = idSchema.safeParse({ id: raw.id });
  const parsed = closeLostSchema.safeParse(raw);
  if (!idResult.success) return fail(NOT_FOUND);
  if (!parsed.success) return fail('Revisa el formulario.', zodFieldErrors(parsed.error));
  return applyUpdate('cerrar-perdida', idResult.data.id, buildCloseLost({ lostReason: parsed.data.lost_reason, closedOn: parsed.data.closed_on }), OPEN_STAGES, ALREADY_CLOSED);
}

/** Reabrir: lo pueden hacer el propietario y el supervisor (la RLS lo garantiza). */
export async function reopenOpportunity(formData: FormData): Promise<ActionResult> {
  const raw = formToObject(formData);
  const idResult = idSchema.safeParse({ id: raw.id });
  const parsed = reopenSchema.safeParse(raw);
  if (!idResult.success) return fail(NOT_FOUND);
  if (!parsed.success) return fail('Revisa el formulario.', zodFieldErrors(parsed.error));
  return applyUpdate('reabrir', idResult.data.id, buildReopen(parsed.data.stage), CLOSED_STAGES, NOT_CLOSED);
}

export async function setNextAction(formData: FormData): Promise<ActionResult> {
  const raw = formToObject(formData);
  const idResult = idSchema.safeParse({ id: raw.id });
  const parsed = nextActionSchema.safeParse(raw);
  if (!idResult.success) return fail(NOT_FOUND);
  if (!parsed.success) return fail('Revisa el formulario.', zodFieldErrors(parsed.error));
  return applyUpdate('proxima-accion', idResult.data.id, buildNextAction({ date: parsed.data.next_action_date, text: parsed.data.next_action_text }), OPEN_STAGES, ALREADY_CLOSED);
}

export async function clearNextAction(formData: FormData): Promise<ActionResult> {
  const idResult = idSchema.safeParse({ id: formToObject(formData).id });
  if (!idResult.success) return fail(NOT_FOUND);
  return applyUpdate('quitar-accion', idResult.data.id, buildClearNextAction(), OPEN_STAGES, ALREADY_CLOSED);
}

async function setArchived(formData: FormData, archive: boolean): Promise<ActionResult> {
  const ctx = await getActionContext();
  if (!ctx) return sessionEnded();
  const idResult = idSchema.safeParse({ id: formToObject(formData).id });
  if (!idResult.success) return fail(NOT_FOUND);
  const { data, error } = await ctx.supabase
    .from('opportunities')
    .update(archive ? buildArchive(new Date().toISOString()) : buildRecover())
    .eq('id', idResult.data.id)
    .select('id');
  if (error) return dbFailure(archive ? 'archivar-oportunidad' : 'recuperar-oportunidad', error);
  if (!data || data.length === 0) return fail(NOT_FOUND);
  return { ok: true };
}

export async function archiveOpportunity(formData: FormData): Promise<ActionResult> {
  return setArchived(formData, true);
}

export async function recoverOpportunity(formData: FormData): Promise<ActionResult> {
  return setArchived(formData, false);
}
