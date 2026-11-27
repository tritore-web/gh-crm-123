import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

type Client = SupabaseClient<Database>;

/** Error de lectura: en el registro solo queda el código; la pantalla de error muestra el mensaje general. */
export function readFailure(context: string, error: { code?: string | null }): never {
  console.error(`[${context}] error de lectura`, { code: error.code ?? 'desconocido' });
  throw new Error('No se pudieron leer los datos');
}

/** "Hoy" según la zona de settings (Europe/Madrid), calculado por la base: nunca la fecha del navegador. */
export async function readToday(supabase: Client): Promise<string> {
  const { data, error } = await supabase.rpc('app_today');
  if (error || !data) return readFailure('hoy', error ?? {});
  return data;
}

export type Seller = { id: string; name: string; active: boolean };

/** Vendedores (la RLS hace que un vendedor solo vea el suyo y el supervisor, todos). */
export async function readSellers(supabase: Client): Promise<Seller[]> {
  const { data, error } = await supabase.from('profiles').select('id, full_name, is_active').eq('role', 'vendedor').order('full_name').order('id');
  if (error) return readFailure('vendedores', error);
  return (data ?? []).map((row) => ({ id: row.id, name: row.full_name, active: row.is_active }));
}

/** Nombres de las personas visibles (el supervisor ve a todas; el vendedor, solo a sí mismo). */
export async function readNames(supabase: Client): Promise<Map<string, string>> {
  const { data, error } = await supabase.from('profiles').select('id, full_name');
  if (error) return readFailure('nombres', error);
  return new Map((data ?? []).map((row) => [row.id, row.full_name]));
}
