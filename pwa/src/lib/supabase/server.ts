import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/database';
import { supabasePublicEnv } from '@/lib/env';

/** Cliente de servidor con la sesión del usuario (la RLS aplica). Es el cliente por defecto. */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = supabasePublicEnv();
  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
        } catch {
          // Un Server Component no puede escribir cookies; la sesión la renueva src/proxy.ts.
        }
      },
    },
  });
}
