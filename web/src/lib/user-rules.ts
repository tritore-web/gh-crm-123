import type { Role } from './profile';

// Reglas de usuarios (SCRIPTS-SQL §4.2): 10 vendedores y 2 supervisores activos, y siempre al menos un supervisor.
export const ROLE_LIMIT: Record<Role, number> = { vendedor: 10, supervisor: 2 };
export type ActiveCounts = Record<Role, number>;

export const LIMIT_MESSAGE: Record<Role, string> = {
  vendedor: 'Ya hay 10 vendedores activos.',
  supervisor: 'Ya hay 2 supervisores activos.',
};
export const LAST_SUPERVISOR_MESSAGE = 'Siempre debe quedar al menos un supervisor activo.';
export const SELF_DEACTIVATE_MESSAGE = 'No puedes desactivarte a ti mismo.';

export const roleIsFull = (role: Role, counts: ActiveCounts): boolean => counts[role] >= ROLE_LIMIT[role];

/** ¿Desactivar a este usuario dejaría el sistema sin supervisor activo? */
export const isLastActiveSupervisor = (user: { role: Role; isActive: boolean }, counts: ActiveCounts): boolean =>
  user.role === 'supervisor' && user.isActive && counts.supervisor <= 1;

/**
 * Mensajes de negocio de la base (triggers de profiles) → texto del brief.
 * Devuelve null si el mensaje no es de estas reglas.
 */
export function userRuleMessage(dbMessage: string | null | undefined): string | null {
  const message = dbMessage ?? '';
  if (/máximo 10 vendedores/i.test(message)) return LIMIT_MESSAGE.vendedor;
  if (/máximo 2 supervisores/i.test(message)) return LIMIT_MESSAGE.supervisor;
  if (/al menos un supervisor activo/i.test(message)) return LAST_SUPERVISOR_MESSAGE;
  return null;
}
