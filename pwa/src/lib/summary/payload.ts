import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';
import { OPEN_STAGES } from '@/lib/labels';
import { logDbError } from '@/lib/errors';
import { applyTestMode, buildSellerEmail, buildSupervisorEmail, type ActionItem, type StageRow, type TeamRow } from './emails';
import { MAX_RECIPIENTS } from './status';

type Admin = SupabaseClient<Database>;

export type PayloadRecipient = { to: string; kind: 'vendedor' | 'supervisor'; subject: string; html: string; text: string };
const PAGE = 1000; // PostgREST devuelve como máximo 1000 filas por consulta

async function fetchAll<T>(load: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { code?: string | null } | null }>): Promise<T[] | null> {
  const out: T[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await load(from, from + PAGE - 1);
    if (error) {
      logDbError('resumen-datos', error);
      return null;
    }
    out.push(...(data ?? []));
    if ((data?.length ?? 0) < PAGE) return out;
  }
}

/**
 * Destinatarios y contenido de cada correo. Se usa el cliente administrador (la clave de servicio ignora la RLS),
 * así que TODAS las consultas de un vendedor filtran explícitamente por su propietario.
 */
export async function buildPayload(
  admin: Admin,
  today: string,
  options: { testRecipient?: string },
): Promise<PayloadRecipient[] | null> {
  const { data: profiles, error } = await admin
    .from('profiles')
    .select('id, full_name, email, role')
    .eq('is_active', true)
    .order('role', { ascending: true })
    .order('full_name', { ascending: true })
    .order('id');
  if (error) {
    logDbError('resumen-perfiles', error);
    return null;
  }
  const people = (profiles ?? []).slice(0, MAX_RECIPIENTS);
  const sellers = people.filter((p) => p.role === 'vendedor');
  const supervisors = people.filter((p) => p.role === 'supervisor');
  const sellerIds = sellers.map((s) => s.id);

  type ActionRow = { owner_id: string; title: string; next_action_date: string | null; next_action_text: string | null; customers: { first_name: string; last_name: string; phone: string; archived_at: string | null } | null };
  let actionRows: ActionRow[] = [];
  let pipelineRows: { owner_id: string; stage: string; estimated_amount: number }[] = [];
  if (sellerIds.length > 0) {
    const [actions, pipeline] = await Promise.all([
      fetchAll<ActionRow>((from, to) =>
        admin
          .from('opportunities')
          .select('owner_id, title, next_action_date, next_action_text, customers(first_name, last_name, phone, archived_at)')
          .in('owner_id', sellerIds)
          .in('stage', [...OPEN_STAGES])
          .is('archived_at', null)
          .not('next_action_date', 'is', null)
          .lte('next_action_date', today)
          .order('next_action_date', { ascending: true })
          .order('id')
          .range(from, to),
      ),
      fetchAll<{ owner_id: string; stage: string; estimated_amount: number }>((from, to) =>
        admin
          .from('opportunities')
          .select('owner_id, stage, estimated_amount')
          .in('owner_id', sellerIds)
          .in('stage', [...OPEN_STAGES])
          .is('archived_at', null)
          .order('id')
          .range(from, to),
      ),
    ]);
    if (!actions || !pipeline) return null;
    actionRows = actions;
    pipelineRows = pipeline;
  }

  const result: PayloadRecipient[] = [];
  for (const seller of sellers) {
    const mine = actionRows.filter((row) => row.owner_id === seller.id && row.next_action_date && row.next_action_text && row.customers && !row.customers.archived_at);
    const toItem = (row: ActionRow): ActionItem => ({
      customerName: `${row.customers?.first_name ?? ''} ${row.customers?.last_name ?? ''}`.trim(),
      phone: row.customers?.phone ?? '',
      title: row.title,
      text: row.next_action_text ?? '',
      date: row.next_action_date ?? today,
    });
    const stages = new Map<string, StageRow>();
    for (const row of pipelineRows.filter((r) => r.owner_id === seller.id)) {
      const current = stages.get(row.stage) ?? { stage: row.stage, count: 0, total: 0 };
      current.count += 1;
      current.total += row.estimated_amount;
      stages.set(row.stage, current);
    }
    const email = buildSellerEmail({
      name: seller.full_name,
      today,
      todayActions: mine.filter((row) => row.next_action_date === today).map(toItem),
      overdueActions: mine.filter((row) => (row.next_action_date ?? today) < today).map(toItem),
      pipeline: [...stages.values()],
    });
    result.push({ kind: 'vendedor', ...applyTestMode(seller.email, email.subject, options.testRecipient), html: email.html, text: email.text });
  }

  if (supervisors.length > 0) {
    const [team, reasons] = await Promise.all([
      admin.from('v_team_summary').select('owner_name, open_count, open_estimated_total, won_month_count, won_month_total, lost_month_count, overdue_actions_count'),
      admin.from('v_lost_reasons_month').select('lost_reason, lost_count'),
    ]);
    if (team.error || reasons.error) {
      logDbError('resumen-equipo', team.error ?? reasons.error ?? {});
      return null;
    }
    const rows: TeamRow[] = (team.data ?? [])
      .map((r) => ({
        name: r.owner_name ?? '',
        openCount: r.open_count ?? 0,
        openTotal: r.open_estimated_total ?? 0,
        wonCount: r.won_month_count ?? 0,
        wonTotal: r.won_month_total ?? 0,
        lostCount: r.lost_month_count ?? 0,
        overdueCount: r.overdue_actions_count ?? 0,
      }))
      .sort((a, b) => b.overdueCount - a.overdueCount || b.wonTotal - a.wonTotal || a.name.localeCompare(b.name, 'es'));
    const byReason = new Map<string, number>();
    for (const r of reasons.data ?? []) if (r.lost_reason) byReason.set(r.lost_reason, (byReason.get(r.lost_reason) ?? 0) + (r.lost_count ?? 0));
    const lostReasons = [...byReason.entries()].map(([reason, count]) => ({ reason, count }));
    for (const supervisor of supervisors) {
      const email = buildSupervisorEmail({ name: supervisor.full_name, today, rows, lostReasons });
      result.push({ kind: 'supervisor', ...applyTestMode(supervisor.email, email.subject, options.testRecipient), html: email.html, text: email.text });
    }
  }
  return result;
}
