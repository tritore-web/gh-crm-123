import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { fetchProfile, type CurrentProfile } from '@/lib/profile';

/**
 * Perfil del usuario validado con `auth.getUser()` (nunca solo `getSession()`), con el rol leído de `profiles`.
 * Devuelve null si no hay sesión válida o no existe el perfil.
 */
export const getCurrentProfile = cache(async (): Promise<CurrentProfile | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;
  return fetchProfile(supabase, data.user.id);
});

/** Para páginas autenticadas: exige sesión, usuario activo y contraseña ya cambiada. */
export async function requireProfile(): Promise<CurrentProfile> {
  const profile = await getCurrentProfile();
  if (!profile || !profile.isActive) redirect('/ingresar');
  if (profile.mustChangePassword) redirect('/cambiar-contrasena');
  return profile;
}
