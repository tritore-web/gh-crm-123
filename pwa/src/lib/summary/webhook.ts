// Llamada de la aplicación al webhook de n8n (TECHNICAL_SPEC §11 paso 10): POST con la cabecera X-CRM-Secret,
// solo el identificador de la ejecución (ningún dato de clientes), 10 s como máximo y sin seguir redirecciones.
const TIMEOUT_MS = 10_000;

export type WebhookConfig = { url: URL; secret: string };

/** Lee la configuración del entorno. Devuelve null (y el motivo, sin valores) si falta algo o no es válida. */
export function readWebhookConfig(env: Record<string, string | undefined> = process.env): { config: WebhookConfig | null; missing: string[] } {
  const missing: string[] = [];
  if (!env.N8N_WEBHOOK_URL) missing.push('N8N_WEBHOOK_URL');
  if (!env.N8N_WEBHOOK_SECRET) missing.push('N8N_WEBHOOK_SECRET');
  if (missing.length > 0) return { config: null, missing };
  try {
    const url = new URL(env.N8N_WEBHOOK_URL as string);
    const local = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    if (url.protocol !== 'https:' && !(url.protocol === 'http:' && local)) return { config: null, missing: ['N8N_WEBHOOK_URL (debe ser https)'] };
    return { config: { url, secret: env.N8N_WEBHOOK_SECRET as string }, missing: [] };
  } catch {
    return { config: null, missing: ['N8N_WEBHOOK_URL (no es una dirección válida)'] };
  }
}

/** true si n8n aceptó la petición (respuesta 2xx). Cualquier fallo de red, 4xx, 5xx o redirección es false. */
export async function triggerWebhook(config: WebhookConfig, runId: string): Promise<boolean> {
  try {
    const response = await fetch(config.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CRM-Secret': config.secret },
      body: JSON.stringify({ run_id: runId }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      redirect: 'manual',
    });
    return response.ok;
  } catch {
    return false;
  }
}
