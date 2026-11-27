import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { getCurrentProfile } from '@/lib/current-profile';
import { createClient } from '@/lib/supabase/server';
import type { CurrentProfile } from '@/lib/profile';
import { logDbError, translateDbError, type DbErrorLike } from '@/lib/errors';
import { fail } from '@/lib/action-result';

export const SESSION_ENDED = 'Tu sesión terminó. Ingresa de nuevo.';

export type ActionContext = { profile: CurrentProfile; supabase: SupabaseClient<Database> };

/**
 * Cada Server Action vuelve a comprobar la sesión y el rol (el proxy no es la única barrera).
 * Devuelve null si no hay sesión válida, el usuario está desactivado o debe cambiar la contraseña.
 */
export async function getActionContext(): Promise<ActionContext | null> {
  const profile = await getCurrentProfile();
  if (!profile || !profile.isActive || profile.mustChangePassword) return null;
  return { profile, supabase: await createClient() };
}

export const sessionEnded = () => fail(SESSION_ENDED);

/** Un alta repetida con el mismo identificador (reintento tras un corte) cuenta como éxito, no como duplicado. */
export function isRetryOfSameInsert(error: DbErrorLike | null | undefined, primaryKeyName: string): boolean {
  return error?.code === '23505' && (error.message ?? '').includes(primaryKeyName);
}

/** Error de base de datos → resultado con mensaje en español; en el registro solo queda el código. */
export function dbFailure(context: string, error: DbErrorLike | null | undefined) {
  logDbError(context, error);
  return fail(translateDbError(error));
}
