'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { fetchProfile } from '@/lib/profile';
import { isStrongPassword } from '@/lib/password';
import { safeNextPath } from '@/lib/redirect';
import { MESSAGES } from '@/lib/errors';
import { LOGIN_MESSAGES } from './login-messages';

export type FormState = { error?: string; email?: string };

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(1).max(200),
});

const passwordSchema = z
  .object({ password: z.string().max(200), confirm: z.string().max(200) })
  .refine((v) => isStrongPassword(v.password), { path: ['password'] })
  .refine((v) => v.password === v.confirm, { path: ['confirm'] });

export async function signIn(_prev: FormState, formData: FormData): Promise<FormState> {
  const rawEmail = formData.get('email');
  const email = typeof rawEmail === 'string' ? rawEmail.slice(0, 200) : '';
  const parsed = loginSchema.safeParse({ email, password: formData.get('password') });
  // Mismo mensaje para un correo mal escrito y para una contraseña equivocada: no se indica cuál falló.
  if (!parsed.success) return { error: LOGIN_MESSAGES.invalid, email };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === 'user_banned') return { error: LOGIN_MESSAGES.disabled, email };
    if (error.code === 'invalid_credentials' || error.status === 400) return { error: LOGIN_MESSAGES.invalid, email };
    console.error('[signIn] fallo de autenticación', { code: error.code ?? 'desconocido' });
    return { error: MESSAGES.generic, email };
  }

  // Segunda barrera: el rol y el estado se leen de profiles, no de la sesión.
  const { data } = await supabase.auth.getUser();
  const profile = data.user ? await fetchProfile(supabase, data.user.id) : null;
  if (!profile || !profile.isActive) {
    await supabase.auth.signOut();
    return { error: profile ? LOGIN_MESSAGES.disabled : LOGIN_MESSAGES.noAccess, email };
  }

  redirect(profile.mustChangePassword ? '/cambiar-contrasena' : safeNextPath(formData.get('siguiente')));
}

export async function changePassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = passwordSchema.safeParse({ password: formData.get('password'), confirm: formData.get('confirm') });
  if (!parsed.success) return { error: 'Usa al menos 10 caracteres, con letras y números.' };

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect('/ingresar?motivo=caducada');

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === 'weak_password') return { error: 'Usa al menos 10 caracteres, con letras y números.' };
    if (error.code === 'same_password') return { error: 'Elige una contraseña distinta de la actual.' };
    console.error('[changePassword] fallo al guardar', { code: error.code ?? 'desconocido' });
    return { error: MESSAGES.generic };
  }

  // La contraseña ya cambió; se marca en el perfil (un reintento cubre un fallo puntual).
  let marked = await supabase.rpc('mark_password_changed');
  if (marked.error) marked = await supabase.rpc('mark_password_changed');
  if (marked.error) {
    console.error('[changePassword] no se pudo marcar el cambio', { code: marked.error.code ?? 'desconocido' });
    return { error: MESSAGES.generic };
  }

  redirect('/');
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/ingresar');
}
