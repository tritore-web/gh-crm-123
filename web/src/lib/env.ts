// Variables de entorno públicas. Sin valores por defecto inventados: si falta una, se nombra la variable (no su valor).
// Las variables NEXT_PUBLIC_* deben leerse de forma literal para que Next las sustituya en el navegador.
export function supabasePublicEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw new Error('Falta la variable de entorno NEXT_PUBLIC_SUPABASE_URL');
  if (!anonKey) throw new Error('Falta la variable de entorno NEXT_PUBLIC_SUPABASE_ANON_KEY');
  return { url, anonKey };
}
