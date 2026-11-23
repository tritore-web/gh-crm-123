// Traducción de errores de la base de datos a mensajes en español (TECHNICAL_SPEC §5.1–5.2).
// Nunca devuelve trazas ni detalles internos.
export type DbErrorLike = { code?: string | null; message?: string | null };

export const MESSAGES = {
  duplicatePhone:
    'Ese teléfono ya está registrado. Si no lo ves en tu lista, pertenece a otro vendedor: consulta con el supervisor.',
  alreadyVoided: 'Esa actividad ya fue anulada.',
  checkFallback: 'Revisa los datos e inténtalo de nuevo.',
  forbidden: 'No tienes permiso para hacer esto.',
  related: 'No se puede completar: hay datos relacionados.',
  generic: 'Algo salió mal. Inténtalo de nuevo.',
} as const;

export function translateDbError(error: DbErrorLike | null | undefined): string {
  const code = error?.code ?? '';
  const message = error?.message ?? '';

  switch (code) {
    case '23505':
      if (message.includes('customers_phone_key')) return MESSAGES.duplicatePhone;
      if (message.includes('activities_void_once_key')) return MESSAGES.alreadyVoided;
      return MESSAGES.checkFallback;
    case '23514':
      // Las reglas de negocio de la base (límite de usuarios, último supervisor…) traen un mensaje propio en español.
      // Una restricción CHECK normal trae el texto técnico de Postgres: ese no se muestra.
      return message && !message.includes('violates check constraint') ? message : MESSAGES.checkFallback;
    case '42501':
      return MESSAGES.forbidden;
    case '23503':
    case '23001':
      return MESSAGES.related;
    default:
      return MESSAGES.generic;
  }
}

/** Registro en el servidor solo con el código: nunca teléfonos, correos ni notas. */
export function logDbError(context: string, error: DbErrorLike | null | undefined): void {
  console.error(`[${context}] error de base de datos`, { code: error?.code ?? 'desconocido' });
}
