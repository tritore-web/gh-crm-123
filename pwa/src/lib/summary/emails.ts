import { daysBetween, formatDate, weekdayName } from '@/lib/dates';
import { formatEuros } from '@/lib/money';
import { OPEN_STAGES, STAGE_LABEL, lostReasonLabel } from '@/lib/labels';
import { formatPhone } from '@/lib/phone';

// Correos del resumen matutino (TECHNICAL_SPEC §10.3). Todo texto de usuario se escapa para HTML, cada correo
// lleva también versión de texto plano y no hay imágenes externas. Esta aplicación decide el contenido; n8n solo envía.
export type Email = { subject: string; html: string; text: string };

export type ActionItem = { customerName: string; phone: string; title: string; text: string; date: string };
export type StageRow = { stage: string; count: number; total: number };
export type SellerInput = { name: string; today: string; todayActions: ActionItem[]; overdueActions: ActionItem[]; pipeline: StageRow[] };
export type TeamRow = {
  name: string;
  openCount: number;
  openTotal: number;
  wonCount: number;
  wonTotal: number;
  lostCount: number;
  overdueCount: number;
};
export type LostReasonRow = { reason: string; count: number };
export type SupervisorInput = { name: string; today: string; rows: TeamRow[]; lostReasons: LostReasonRow[] };

const FOOTER = 'Mensaje automático de CRM-123.';

export function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Un asunto nunca puede llevar saltos de línea (evita la inyección de cabeceras). */
export function safeSubject(value: string): string {
  return value.replace(/[\p{Cc}\p{Zl}\p{Zp}]+/gu, ' ').replace(/\s+/g, ' ').trim();
}

/** Modo de prueba (§10.4): todo va a la cuenta de pruebas y el asunto indica a quién iba. */
export function applyTestMode(realTo: string, subject: string, testRecipient: string | undefined): { to: string; subject: string } {
  const test = testRecipient?.trim();
  if (!test) return { to: realTo, subject: safeSubject(subject) };
  return { to: test, subject: safeSubject(`[PRUEBA para ${realTo}] ${subject}`) };
}

const STYLE = {
  body: 'font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#2b2118;line-height:1.5',
  h: 'font-size:16px;color:#4a3426;margin:20px 0 8px',
  table: 'border-collapse:collapse;width:100%',
  th: 'text-align:left;padding:6px 8px;border-bottom:1px solid #e6decf;font-size:12px;color:#6b5b4b',
  td: 'padding:6px 8px;border-bottom:1px solid #e6decf;font-size:13px;vertical-align:top',
  num: 'text-align:right;white-space:nowrap',
  muted: 'color:#6b5b4b',
  late: 'color:#b3402a;font-weight:bold',
} as const;

const wrap = (title: string, inner: string) =>
  `<!doctype html><html lang="es"><head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head><body style="${STYLE.body}">${inner}<p style="${STYLE.muted};margin-top:24px;font-size:12px">${FOOTER}</p></body></html>`;

const cell = (value: string, style: string = STYLE.td) => `<td style="${style}">${escapeHtml(value)}</td>`;
const header = (labels: string[]) => `<tr>${labels.map((l, i) => `<th style="${STYLE.th}${i > 0 && /Cant|Monto|Abiertas|Ganadas|Perdidas|Atras/.test(l) ? ';text-align:right' : ''}">${escapeHtml(l)}</th>`).join('')}</tr>`;

function actionsHtml(title: string, items: ActionItem[], today: string, overdue: boolean): string {
  if (items.length === 0) return '';
  const rows = items
    .map((item) => {
      const when = overdue ? `Atrasada · ${daysBetween(item.date, today)} ${daysBetween(item.date, today) === 1 ? 'día' : 'días'}` : 'Hoy';
      return `<tr>${cell(item.customerName)}${cell(formatPhone(item.phone))}${cell(item.title)}${cell(item.text)}<td style="${STYLE.td}${overdue ? `;${STYLE.late}` : ''}">${escapeHtml(when)}</td></tr>`;
    })
    .join('');
  return `<h2 style="${STYLE.h}">${escapeHtml(title)}</h2><table style="${STYLE.table}">${header(['Cliente', 'Teléfono', 'Oportunidad', 'Acción', overdue ? 'Atraso' : 'Fecha'])}${rows}</table>`;
}

function actionsText(title: string, items: ActionItem[], today: string, overdue: boolean): string {
  if (items.length === 0) return '';
  const lines = items.map((item) => {
    const days = daysBetween(item.date, today);
    const when = overdue ? ` (atrasada ${days} ${days === 1 ? 'día' : 'días'})` : '';
    return `- ${item.customerName} · ${formatPhone(item.phone)} · ${item.title}: ${item.text}${when}`;
  });
  return `${title}\n${lines.join('\n')}\n\n`;
}

/** Correo personal de un vendedor. */
export function buildSellerEmail(input: SellerInput): Email {
  const { name, today, todayActions, overdueActions, pipeline } = input;
  const subject = safeSubject(`CRM-123 · Tu resumen del ${weekdayName(today)} ${formatDate(today)}`);
  const noActions = todayActions.length === 0 && overdueActions.length === 0;

  const byStage = new Map(pipeline.map((row) => [row.stage, row]));
  const stageRows = OPEN_STAGES.map((stage) => ({ label: STAGE_LABEL[stage], count: byStage.get(stage)?.count ?? 0, total: byStage.get(stage)?.total ?? 0 }));
  const totalCount = stageRows.reduce((sum, row) => sum + row.count, 0);
  const totalAmount = stageRows.reduce((sum, row) => sum + row.total, 0);

  const pipelineHtml =
    `<h2 style="${STYLE.h}">Tus oportunidades abiertas</h2><table style="${STYLE.table}">${header(['Etapa', 'Cantidad', 'Monto estimado'])}` +
    stageRows.map((r) => `<tr>${cell(r.label)}${cell(String(r.count), `${STYLE.td};${STYLE.num}`)}${cell(formatEuros(r.total), `${STYLE.td};${STYLE.num}`)}</tr>`).join('') +
    `<tr><td style="${STYLE.td};font-weight:bold">Total</td>${cell(String(totalCount), `${STYLE.td};${STYLE.num};font-weight:bold`)}${cell(formatEuros(totalAmount), `${STYLE.td};${STYLE.num};font-weight:bold`)}</tr></table>`;

  const html = wrap(
    subject,
    `<p>Buenos días, ${escapeHtml(name)}</p>` +
      (noActions
        ? `<p><b>Sin acciones pendientes</b></p>`
        : actionsHtml('Acciones de hoy', todayActions, today, false) + actionsHtml('Acciones atrasadas', overdueActions, today, true)) +
      pipelineHtml,
  );

  const text =
    `Buenos días, ${name}\n\n` +
    (noActions ? 'Sin acciones pendientes\n\n' : actionsText('Acciones de hoy', todayActions, today, false) + actionsText('Acciones atrasadas', overdueActions, today, true)) +
    `Tus oportunidades abiertas\n${stageRows.map((r) => `- ${r.label}: ${r.count} · ${formatEuros(r.total)}`).join('\n')}\n- Total: ${totalCount} · ${formatEuros(totalAmount)}\n\n${FOOTER}\n`;

  return { subject, html, text };
}

/** Resumen del equipo para un supervisor. */
export function buildSupervisorEmail(input: SupervisorInput): Email {
  const { name, today, rows, lostReasons } = input;
  const subject = safeSubject(`CRM-123 · Resumen del equipo del ${formatDate(today)}`);
  const sum = (pick: (row: TeamRow) => number) => rows.reduce((total, row) => total + pick(row), 0);
  const totals: TeamRow = {
    name: 'Total',
    openCount: sum((r) => r.openCount),
    openTotal: sum((r) => r.openTotal),
    wonCount: sum((r) => r.wonCount),
    wonTotal: sum((r) => r.wonTotal),
    lostCount: sum((r) => r.lostCount),
    overdueCount: sum((r) => r.overdueCount),
  };
  const labels = ['Vendedor', 'Abiertas', 'Monto abierto', 'Ganadas del mes', 'Monto ganado', 'Perdidas del mes', 'Acciones atrasadas'];
  const line = (row: TeamRow, bold: boolean) => {
    const num = `${STYLE.td};${STYLE.num}${bold ? ';font-weight:bold' : ''}`;
    return `<tr><td style="${STYLE.td}${bold ? ';font-weight:bold' : ''}">${escapeHtml(row.name)}</td>${cell(String(row.openCount), num)}${cell(formatEuros(row.openTotal), num)}${cell(String(row.wonCount), num)}${cell(formatEuros(row.wonTotal), num)}${cell(String(row.lostCount), num)}${cell(String(row.overdueCount), num)}</tr>`;
  };

  const reasonRows = lostReasons.filter((r) => r.count > 0);
  const html = wrap(
    subject,
    `<p>Buenos días, ${escapeHtml(name)}</p><h2 style="${STYLE.h}">Resumen del equipo</h2><table style="${STYLE.table}">${header(labels)}${rows.map((r) => line(r, false)).join('')}${line(totals, true)}</table>` +
      `<h2 style="${STYLE.h}">Motivos de pérdida del mes</h2>` +
      (reasonRows.length === 0
        ? `<p style="${STYLE.muted}">Ninguna oportunidad perdida este mes.</p>`
        : `<table style="${STYLE.table}">${header(['Motivo', 'Cantidad'])}${reasonRows.map((r) => `<tr>${cell(lostReasonLabel(r.reason))}${cell(String(r.count), `${STYLE.td};${STYLE.num}`)}</tr>`).join('')}</table>`),
  );

  const text =
    `Buenos días, ${name}\n\nResumen del equipo\n` +
    [...rows, totals]
      .map((r) => `- ${r.name}: ${r.openCount} abiertas (${formatEuros(r.openTotal)}), ${r.wonCount} ganadas (${formatEuros(r.wonTotal)}), ${r.lostCount} perdidas, ${r.overdueCount} atrasadas`)
      .join('\n') +
    `\n\nMotivos de pérdida del mes\n${reasonRows.length === 0 ? 'Ninguna oportunidad perdida este mes.' : reasonRows.map((r) => `- ${lostReasonLabel(r.reason)}: ${r.count}`).join('\n')}\n\n${FOOTER}\n`;

  return { subject, html, text };
}
