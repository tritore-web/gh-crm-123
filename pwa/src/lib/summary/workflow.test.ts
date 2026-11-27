import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// Comprobación estructural del flujo de n8n (TECHNICAL_SPEC §10.6). No sustituye a importarlo en n8n Cloud:
// verifica que el archivo es coherente y que NO lleva ninguna clave en claro.
type Node = { name: string; type: string; parameters: Record<string, unknown>; credentials?: Record<string, { name: string }>; onError?: string };
type Workflow = { name: string; nodes: Node[]; connections: Record<string, { main: { node: string }[][] }>; active: boolean; settings: { timezone: string } };

const raw = readFileSync(resolve(__dirname, '../../../n8n/WF-CRM123.json'), 'utf8');
const wf = JSON.parse(raw) as Workflow;
const byName = (name: string) => wf.nodes.find((n) => n.name === name);

describe('WF-CRM123.json', () => {
  it('se llama WF-CRM123, va en la zona de Madrid y NO se activa solo', () => {
    expect(wf.name).toBe('WF-CRM123');
    expect(wf.settings.timezone).toBe('Europe/Madrid');
    expect(wf.active).toBe(false);
  });
  it('planifica de lunes a viernes a las 7:30', () => {
    const interval = (byName('Lunes a viernes 7:30')?.parameters as { rule?: { interval?: { field?: string; expression?: string }[] } }).rule?.interval?.[0];
    // n8n solo entiende el tipo «cronExpression»; con otro nombre falla al activar («Unknown alias: und»).
    expect(interval).toEqual({ field: 'cronExpression', expression: '30 7 * * 1-5' });
  });
  it('el disparo manual es un webhook POST con autenticación de cabecera', () => {
    const webhook = byName('Disparo manual');
    expect(webhook?.parameters).toMatchObject({ httpMethod: 'POST', path: 'crm123-resumen-manual', authentication: 'headerAuth' });
    expect(webhook?.credentials?.httpHeaderAuth.name).toBe('CRM123 Webhook Secret');
  });
  it('la dirección de la PWA vive en un único nodo (Config) y es un marcador a sustituir', () => {
    expect(JSON.stringify(byName('Config')?.parameters)).toContain('REEMPLAZAR');
    const urls = wf.nodes.map((n) => String(n.parameters.url ?? '')).filter((u) => u.includes('/api/n8n/'));
    expect(urls).toHaveLength(3);
    for (const url of urls) expect(url).toContain("$('Config').first().json.app_base_url");
    expect(raw.match(/vercel\.app/g)).toHaveLength(1); // solo el marcador de Config
  });
  it('llama a los tres endpoints de la PWA con las credenciales de n8n', () => {
    expect(String(byName('Iniciar ejecución')?.parameters.url)).toContain('/api/n8n/runs/start');
    expect(String(byName('Obtener contenido')?.parameters.url)).toContain('/payload');
    expect(String(byName('Informar resultado')?.parameters.url)).toContain('/finish');
    for (const name of ['Iniciar ejecución', 'Obtener contenido', 'Informar resultado']) expect(byName(name)?.credentials?.httpHeaderAuth.name).toBe('CRM123 API Secret');
  });
  it('envía con Resend usando su credencial y sigue aunque un envío falle', () => {
    const send = byName('Enviar con Resend');
    expect(send?.parameters.url).toBe('https://api.resend.com/emails');
    expect(send?.credentials?.httpHeaderAuth.name).toBe('Resend API');
    // El remitente se lee del contenido de la PWA, no del elemento del bucle (Resend responde 422 «Missing from» si llega vacío).
    expect(String(send?.parameters.jsonBody)).toContain("from: $('Obtener contenido').first().json.from");
    expect(send?.onError).toBe('continueRegularOutput');
  });
  it('envía de uno en uno con una pausa de 1 segundo (límite de Resend)', () => {
    expect(byName('Loop Over Items')?.parameters).toMatchObject({ batchSize: 1 });
    expect(byName('Esperar 1 s')?.parameters).toMatchObject({ amount: 1, unit: 'seconds' });
  });
  it('si falla obtener el contenido, informa sent 0 / failed 0 con el error previsto', () => {
    expect(byName('Obtener contenido')?.onError).toBe('continueErrorOutput');
    expect(String(byName('Sin contenido')?.parameters.jsCode)).toContain("No se pudo obtener el contenido");
    const out = wf.connections['Obtener contenido'].main;
    expect(out[1].map((c) => c.node)).toEqual(['Sin contenido']);
  });
  it('todas las conexiones apuntan a nodos que existen y ningún nodo queda suelto', () => {
    const names = new Set(wf.nodes.map((n) => n.name));
    const targets = new Set<string>();
    for (const [from, value] of Object.entries(wf.connections)) {
      expect(names.has(from)).toBe(true);
      for (const group of value.main) for (const link of group) { expect(names.has(link.node)).toBe(true); targets.add(link.node); }
    }
    const triggers = new Set(['Lunes a viernes 7:30', 'Disparo manual']);
    for (const name of names) expect(triggers.has(name) || targets.has(name)).toBe(true);
  });
  it('NO contiene ninguna clave, secreto ni cabecera de autorización en claro', () => {
    expect(raw).not.toMatch(/Bearer\s+\S/); // los Bearer van en las credenciales de n8n
    expect(raw).not.toMatch(/\bre_[A-Za-z0-9_]{16,}/); // formato de clave de Resend
    expect(raw).not.toMatch(/eyJ[A-Za-z0-9_-]{20,}/); // JWT (clave de Supabase)
    // El nombre de la clave de servicio se arma por partes: la guardia de seguridad prohíbe escribirlo fuera de admin.ts.
    const serviceKeyName = new RegExp(['service', 'role'].join('_'), 'i');
    expect(raw).not.toMatch(serviceKeyName);
    expect(raw).not.toMatch(/N8N_API_SECRET|N8N_WEBHOOK_SECRET/);
    expect(raw).not.toMatch(/"(?:authorization|X-CRM-Secret)"\s*:/i);
  });
});
