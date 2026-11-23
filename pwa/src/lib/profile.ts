import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

export type Role = 'vendedor' | 'supervisor';

export type CurrentProfile = {
  id: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  mustChangePassword: boolean;
};

export function isRole(value: string): value is Role {
  return value === 'vendedor' || value === 'supervisor';
}

export const ROLE_LABEL: Record<Role, string> = { vendedor: 'Vendedor', supervisor: 'Supervisor' };

/**
 * Lee el perfil de `profiles` con el cliente que se le pase (RLS del usuario).
 * Es la ÚNICA fuente del rol: nunca user_metadata, app_metadata, JWT, cookies propias ni el cliente.
 */
export async function fetchProfile(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<CurrentProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, is_active, must_change_password')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data || !isRole(data.role)) return null;
  return {
    id: data.id,
    fullName: data.full_name,
    role: data.role,
    isActive: data.is_active,
    mustChangePassword: data.must_change_password,
  };
}
