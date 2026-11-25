import type { CurrentProfile } from './profile';

export type ActivityRow = {
  id: string;
  type: string;
  description: string;
  occurred_at: string;
  voids_activity_id: string | null;
  created_by: string;
  opportunity_id: string | null;
};

export type TimelineItem = ActivityRow & { voided: boolean; author: string; canVoid: boolean };

/**
 * Nombre del autor de una actividad. Un supervisor ve siempre el nombre. Un vendedor solo puede leer su propio
 * perfil (RLS), así que las actividades de un supervisor se muestran como «Supervisor» (puntos-no-disenados §2).
 * Se calcula en el servidor: el nombre del supervisor no llega al navegador del vendedor.
 */
export function authorName(createdBy: string, viewer: Pick<CurrentProfile, 'id' | 'role' | 'fullName'>, names: Map<string, string>): string {
  if (viewer.role === 'supervisor') return names.get(createdBy) ?? 'Usuario';
  return createdBy === viewer.id ? viewer.fullName : 'Supervisor';
}

/**
 * Línea de tiempo: las anulaciones no se muestran aparte; la actividad original sale tachada y marcada «Anulada».
 * «Anular» solo se ofrece en las propias (el supervisor puede anular cualquiera) y nunca en las ya anuladas.
 */
export function buildTimeline(rows: ActivityRow[], viewer: Pick<CurrentProfile, 'id' | 'role' | 'fullName'>, names: Map<string, string>): TimelineItem[] {
  const voidedIds = new Set(rows.map((row) => row.voids_activity_id).filter((id): id is string => id !== null));
  return rows
    .filter((row) => row.type !== 'anulacion')
    .map((row) => {
      const voided = voidedIds.has(row.id);
      return {
        ...row,
        voided,
        author: authorName(row.created_by, viewer, names),
        canVoid: !voided && (viewer.role === 'supervisor' || row.created_by === viewer.id),
      };
    });
}
