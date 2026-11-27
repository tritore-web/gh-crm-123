import { afterEach, describe, expect, it, vi } from 'vitest';
import { readWebhookConfig, triggerWebhook } from './webhook';

const good = { N8N_WEBHOOK_URL: 'https://mi-n8n.app.n8n.cloud/webhook/crm123-resumen-manual', N8N_WEBHOOK_SECRET: 'secreto-largo-de-prueba' };
afterEach(() => vi.restoreAllMocks());

describe('readWebhookConfig', () => {
  it('con URL https y secreto es válida', () => {
    const { config, missing } = readWebhookConfig(good);
    expect(missing).toEqual([]);
    expect(config?.url.hostname).toBe('mi-n8n.app.n8n.cloud');
  });
  it('nombra la variable que falta, sin mostrar valores', () => {
    expect(readWebhookConfig({ N8N_WEBHOOK_SECRET: 'x' }).missing).toEqual(['N8N_WEBHOOK_URL']);
    expect(readWebhookConfig({ N8N_WEBHOOK_URL: 'https://a.es' }).missing).toEqual(['N8N_WEBHOOK_SECRET']);
    expect(readWebhookConfig({}).missing).toEqual(['N8N_WEBHOOK_URL', 'N8N_WEBHOOK_SECRET']);
    expect(JSON.stringify(readWebhookConfig({ N8N_WEBHOOK_URL: 'https://a.es' }))).not.toContain('secreto');
  });
  it('rechaza http fuera de localhost y direcciones inválidas', () => {
    expect(readWebhookConfig({ ...good, N8N_WEBHOOK_URL: 'http://evil.example/hook' }).config).toBeNull();
    expect(readWebhookConfig({ ...good, N8N_WEBHOOK_URL: 'no-es-una-url' }).config).toBeNull();
    expect(readWebhookConfig({ ...good, N8N_WEBHOOK_URL: 'http://localhost:5678/hook' }).config).not.toBeNull();
  });
});

describe('triggerWebhook', () => {
  const config = readWebhookConfig(good).config!;
  it('envía solo el run_id, con la cabecera del secreto, sin redirecciones y con tiempo máximo', async () => {
    const spy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('{}', { status: 200 }));
    expect(await triggerWebhook(config, 'abc')).toBe(true);
    const [, init] = spy.mock.calls[0];
    expect(init?.method).toBe('POST');
    expect(init?.body).toBe('{"run_id":"abc"}');
    expect((init?.headers as Record<string, string>)['X-CRM-Secret']).toBe('secreto-largo-de-prueba');
    expect(init?.redirect).toBe('manual');
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });
  it('4xx, 5xx, redirección y fallos de red cuentan como fallo', async () => {
    for (const status of [400, 401, 404, 500, 502]) {
      vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response('', { status }));
      expect(await triggerWebhook(config, 'abc')).toBe(false);
    }
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(new Response(null, { status: 302, headers: { location: 'https://otro.example' } }));
    expect(await triggerWebhook(config, 'abc')).toBe(false);
    vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('timeout'));
    expect(await triggerWebhook(config, 'abc')).toBe(false);
  });
});
