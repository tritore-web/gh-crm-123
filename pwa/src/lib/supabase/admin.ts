import 'server-only';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { supabasePublicEnv } from '@/lib/env';

/**
 * Cliente administrador (clave de servicio). Ignora la RLS.
 * Solo se importa desde las operaciones de TECHNICAL_SPEC §8.3, y solo después de verificar
 * el rol del llamador con getCurrentProfile(). Nunca en un componente de cliente.
 */
export function createAdminClient() {
  const { url } = supabasePublicEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error('Falta la variable de entorno SUPABASE_SERVICE_ROLE_KEY');
  return createClient<Database>(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
