'use server';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { fail, formToObject, zodFieldErrors, type ActionResult } from '@/lib/action-result';
import { getActionContext, sessionEnded, type ActionContext } from '@/lib/action-context';
import { logDbError, MESSAGES, translateDbError } from '@/lib/errors';
import { userActiveSchema, userCreateSchema } from '@/lib/schemas';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateTempPassword } from '@/lib/temp-password';
import {
  LAST_SUPERVISOR_MESSAGE, LIMIT_MESSAGE, SELF_DEACTIVATE_MESSAGE, isLastActiveSupervisor, roleIsFull, userRuleMessage, type ActiveCounts,
} from '@/lib/user-rules';
import { isRole } from '@/lib/profile';

// Administración de usuarios (TECHNICAL_SPEC §8.3). Cada acción: 1) sesión válida, 2) rol supervisor leído de profiles,
// 3) validación con Zod, 4) solo entonces el cliente administrador. La contraseña temporal no se registra nunca.
const NOT_FOUND = 'No encontramos a ese usuario.';
const EMAIL_TAKEN = 'Ese correo ya está registrado.';

async function supervisorContext(): Promise<ActionContext | 'session' | 'forbidden'> {
  const ctx = await getActionContext();
  if (!ctx) return 'session';
  return ctx.profile.role === 'supervisor' ? ctx : 'forbidden';
}

const denied = (ctx: 'session' | 'forbidden') => (ctx === 'session' ? sessionEnded() : fail(MESSAGES.forbidden));

async function readActiveCounts(supabase: SupabaseClient<Database>): Promise<ActiveCounts | null> {
  const { data, error } = await supabase.from('profiles').select('role').eq('is_active', true);
  if (error) {
    logDbError('contar-usuarios', error);
    return null;
  }
  const counts: ActiveCounts = { vendedor: 0, supervisor: 0 };
  for (const row of data ?? []) if (isRole(row.role)) counts[row.role] += 1;
  return counts;
}

function ruleFailure(context: string, error: { code?: string | null; message?: string | null }) {
  const rule = userRuleMessage(error.message);
  if (rule) return fail(rule);
  logDbError(context, error);
  return fail(translateDbError(error));
}

export async function createUser(formData: FormData): Promise<ActionResult<{ tempPassword: string }>> {
  const ctx = await supervisorContext();
  if (typeof ctx === 'string') return denied(ctx);

  const parsed = userCreateSchema.safeParse(formToObject(formData));
  if (!parsed.success) return fail('Revisa el formulario.', zodFieldErrors(parsed.error));
  const input = parsed.data;

  // Cupos: se explican antes de crear nada (la base los vuelve a comprobar como último recurso).
  const counts = await readActiveCounts(ctx.supabase);
  if (!counts) return fail(MESSAGES.generic);
  if (roleIsFull(input.role, counts)) return fail('Revisa el formulario.', { role: LIMIT_MESSAGE[input.role] });

  const admin = createAdminClient();
  const tempPassword = generateTempPassword();
  const created = await admin.auth.admin.createUser({ email: input.email, password: tempPassword, email_confirm: true });
  if (created.error || !created.data.user) {
    if (created.error?.code === 'email_exists') return fail('Revisa el formulario.', { email: EMAIL_TAKEN });
    console.error('[crear-usuario] fallo al crear la cuenta', { code: created.error?.code ?? 'desconocido' });
    return fail(MESSAGES.generic);
  }
  const userId = created.data.user.id;

  const { error } = await admin
    .from('profiles')
    .insert({ id: userId, full_name: input.full_name, email: input.email, role: input.role, must_change_password: true });
  if (error) {
    // COMPENSACION_ALTA_FALLIDA
    await admin.auth.admin.deleteUser(userId); // no dejar cuentas huérfanas si el perfil no se pudo crear
    if (error.code === '23505') return fail('Revisa el formulario.', { email: EMAIL_TAKEN });
    return ruleFailure('crear-usuario-perfil', error);
  }
  return { ok: true, tempPassword };
}

/** Desactivar o reactivar: perfil con la sesión del supervisor (RLS) y después el bloqueo de la cuenta de acceso. */
export async function setUserActive(formData: FormData): Promise<ActionResult> {
  const ctx = await supervisorContext();
  if (typeof ctx === 'string') return denied(ctx);

  const parsed = userActiveSchema.safeParse(formToObject(formData));
  if (!parsed.success) return fail(NOT_FOUND);
  const { id, active } = parsed.data;
  if (!active && id === ctx.profile.id) return fail(SELF_DEACTIVATE_MESSAGE);

  const { data: target, error: readError } = await ctx.supabase.from('profiles').select('id, role, is_active').eq('id', id).maybeSingle();
  if (readError) return ruleFailure('usuario-lectura', readError);
  if (!target || !isRole(target.role)) return fail(NOT_FOUND);
  if (target.is_active === active) return { ok: true };

  const counts = await readActiveCounts(ctx.supabase);
  if (!counts) return fail(MESSAGES.generic);
  if (active && roleIsFull(target.role, counts)) return fail(LIMIT_MESSAGE[target.role]);
  if (!active && isLastActiveSupervisor({ role: target.role, isActive: target.is_active }, counts)) return fail(LAST_SUPERVISOR_MESSAGE);

  const { data: updated, error } = await ctx.supabase.from('profiles').update({ is_active: active }).eq('id', id).select('id');
  if (error) return ruleFailure('usuario-estado', error);
  if (!updated || updated.length === 0) return fail(NOT_FOUND);

  const admin = createAdminClient();
  const { error: banError } = await admin.auth.admin.updateUserById(id, { ban_duration: active ? 'none' : '876000h' });
  if (banError) {
    console.error('[usuario-estado] fallo al actualizar el acceso', { code: banError.code ?? 'desconocido' });
    await ctx.supabase.from('profiles').update({ is_active: !active }).eq('id', id); // deshacer: perfil y acceso deben ir a la par
    return fail(MESSAGES.generic);
  }
  return { ok: true };
}

/** Restablecer: contraseña temporal nueva, que se muestra una sola vez; la persona deberá cambiarla al ingresar. */
export async function resetTempPassword(formData: FormData): Promise<ActionResult<{ tempPassword: string }>> {
  const ctx = await supervisorContext();
  if (typeof ctx === 'string') return denied(ctx);

  const parsed = userActiveSchema.pick({ id: true }).safeParse(formToObject(formData));
  if (!parsed.success) return fail(NOT_FOUND);
  const { id } = parsed.data;

  // Primero se marca el cambio pendiente; si la contraseña fallara después, no queda a nadie sin poder entrar.
  const { data: updated, error } = await ctx.supabase.from('profiles').update({ must_change_password: true }).eq('id', id).select('id');
  if (error) return ruleFailure('usuario-contrasena', error);
  if (!updated || updated.length === 0) return fail(NOT_FOUND);

  const tempPassword = generateTempPassword();
  const { error: passwordError } = await createAdminClient().auth.admin.updateUserById(id, { password: tempPassword });
  if (passwordError) {
    console.error('[usuario-contrasena] fallo al restablecer', { code: passwordError.code ?? 'desconocido' });
    return fail(MESSAGES.generic);
  }
  return { ok: true, tempPassword };
}
