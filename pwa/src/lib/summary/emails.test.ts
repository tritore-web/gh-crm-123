import { describe, expect, it } from 'vitest';
import { applyTestMode, buildSellerEmail, buildSupervisorEmail, escapeHtml, safeSubject, type ActionItem, type SellerInput } from './emails';

const action = (over: Partial<ActionItem> = {}): ActionItem => ({
  customerName: 'Marta Gómez Ríos', phone: '+34600111222', title: 'Cena de empresa', text: 'Llamar para cerrar menú', date: '2026-11-23', ...over,
});
const seller = (over: Partial<SellerInput> = {}): SellerInput => ({
  name: 'Ana Martín', today: '2026-11-23', todayActions: [action()], overdueActions: [action({ title: 'Catering boda', text: 'Enviar presupuesto', date: '2026-11-18' })],
  pipeline: [{ stage: 'nueva', count: 3, total: 3650 }, { stage: 'negociacion', count: 2, total: 2320.5 }], ...over,
});

describe('escapeHtml y safeSubject', () => {
  it('escapa los cinco caracteres peligrosos', () => {
    expect(escapeHtml(`<script>alert("x")</script> & 'y'`)).toBe('&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;y&#39;');
  });
  it('el asunto no admite saltos de línea ni caracteres de control', () => {
    expect(safeSubject('Hola\r\nBcc: otro@x.es')).toBe('Hola Bcc: otro@x.es');
    expect(safeSubject('  a\u0000b c  ')).toBe('a b c');
  });
});

describe('buildSellerEmail', () => {
  const email = buildSellerEmail(seller());
  it('asunto: «CRM-123 · Tu resumen del <día> dd/mm/aaaa»', () => {
    expect(email.subject).toBe('CRM-123 · Tu resumen del lunes 23/11/2026');
  });
  it('lleva saludo, acciones de hoy y atrasadas con su atraso, y el pie', () => {
    expect(email.html).toContain('Buenos días, Ana Martín');
    expect(email.html).toContain('Acciones de hoy');
    expect(email.html).toContain('Acciones atrasadas');
    expect(email.html).toContain('Atrasada · 5 días');
    expect(email.html).toContain('+34 600 111 222');
    expect(email.html).toContain('Mensaje automático de CRM-123.');
    expect(email.text).toContain('Mensaje automático de CRM-123.');
  });
  it('tabla de oportunidades abiertas con importes es-ES y total', () => {
    expect(email.html).toContain('Tus oportunidades abiertas');
    expect(email.html).toContain('3.650,00 €');
    expect(email.html).toContain('2.320,50 €');
    expect(email.html).toContain('5.970,50 €');
    expect(email.text).toContain('- Total: 5 · 5.970,50 €');
  });
  it('incluye siempre las cuatro etapas abiertas, también con cantidad 0', () => {
    for (const label of ['Nueva', 'Contactada', 'Propuesta enviada', 'Negociación']) expect(email.html).toContain(label);
  });
  it('sin acciones muestra «Sin acciones pendientes»', () => {
    const empty = buildSellerEmail(seller({ todayActions: [], overdueActions: [] }));
    expect(empty.html).toContain('Sin acciones pendientes');
    expect(empty.text).toContain('Sin acciones pendientes');
    expect(empty.html).not.toContain('Acciones de hoy');
  });
  it('1 día de atraso va en singular', () => {
    expect(buildSellerEmail(seller({ overdueActions: [action({ date: '2026-11-22' })] })).html).toContain('Atrasada · 1 día');
  });
  it('NO deja pasar HTML en nombres, títulos ni acciones (escape)', () => {
    const evil = buildSellerEmail(
      seller({ name: '<img src=x onerror=alert(1)>', todayActions: [action({ customerName: '<b>Cliente</b>', title: '"><script>x</script>', text: "a & b <i>" })] }),
    );
    expect(evil.html).not.toContain('<img src=x');
    expect(evil.html).not.toContain('<script>');
    expect(evil.html).not.toContain('<b>Cliente</b>');
    expect(evil.html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(evil.html).toContain('&lt;b&gt;Cliente&lt;/b&gt;');
    expect(evil.html).toContain('a &amp; b &lt;i&gt;');
  });
  it('sin imágenes externas y con versión de texto plano sin etiquetas', () => {
    expect(email.html).not.toMatch(/<img|https?:\/\//);
    expect(email.text).not.toMatch(/<[a-z]/i);
  });
});

describe('buildSupervisorEmail', () => {
  const rows = [
    { name: 'Ana Martín', openCount: 11, openTotal: 14350, wonCount: 3, wonTotal: 3400, lostCount: 1, overdueCount: 2 },
    { name: 'Pablo Ruiz', openCount: 8, openTotal: 9120, wonCount: 2, wonTotal: 4100, lostCount: 0, overdueCount: 1 },
  ];
  const email = buildSupervisorEmail({ name: 'Carmen Ortega', today: '2026-11-23', rows, lostReasons: [{ reason: 'precio', count: 3 }, { reason: 'otro', count: 0 }] });
  it('asunto del equipo con la fecha', () => {
    expect(email.subject).toBe('CRM-123 · Resumen del equipo del 23/11/2026');
  });
  it('tabla por vendedor con fila de totales', () => {
    expect(email.html).toContain('Ana Martín');
    expect(email.html).toContain('14.350,00 €');
    expect(email.html).toContain('Total');
    expect(email.html).toContain('23.470,00 €'); // 14.350 + 9.120
    expect(email.html).toContain('7.500,00 €'); // 3.400 + 4.100
    expect(email.text).toContain('- Total: 19 abiertas (23.470,00 €), 5 ganadas (7.500,00 €), 1 perdidas, 3 atrasadas');
  });
  it('motivos de pérdida del mes (solo los que tienen cantidad)', () => {
    expect(email.html).toContain('Motivos de pérdida del mes');
    expect(email.html).toContain('Precio');
    expect(email.html).not.toContain('>Otro<');
  });
  it('sin pérdidas lo dice; escapa nombres', () => {
    const none = buildSupervisorEmail({ name: 'C', today: '2026-11-23', rows: [{ ...rows[0], name: '<u>Ana</u>' }], lostReasons: [] });
    expect(none.html).toContain('Ninguna oportunidad perdida este mes.');
    expect(none.html).not.toContain('<u>Ana</u>');
    expect(none.html).toContain('&lt;u&gt;Ana&lt;/u&gt;');
  });
});

describe('applyTestMode (TECHNICAL_SPEC §10.4)', () => {
  it('con destinatario de pruebas, todo va a esa cuenta y el asunto dice a quién iba', () => {
    expect(applyTestMode('ana@libreria.es', 'CRM-123 · Tu resumen del lunes 23/11/2026', 'owner@mi-cuenta.com')).toEqual({
      to: 'owner@mi-cuenta.com',
      subject: '[PRUEBA para ana@libreria.es] CRM-123 · Tu resumen del lunes 23/11/2026',
    });
  });
  it('sin destinatario de pruebas (vacío o ausente) va al destinatario real y sin prefijo', () => {
    for (const test of [undefined, '', '   ']) expect(applyTestMode('ana@libreria.es', 'Asunto', test)).toEqual({ to: 'ana@libreria.es', subject: 'Asunto' });
  });
  it('el asunto sigue sin admitir saltos de línea', () => {
    expect(applyTestMode('a@x.es', 'Hola\nBcc: z', 't@x.es').subject).not.toMatch(/[\r\n]/);
  });
});
