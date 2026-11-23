import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database';
import { supabasePublicEnv } from '@/lib/env';

/** Cliente del navegador: URL + clave anónima. Solo para lecturas simples bajo RLS. */
export function createClient() {
  const { url, anonKey } = supabasePublicEnv();
  return createBrowserClient<Database>(url, anonKey);
}
