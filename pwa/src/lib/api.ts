// Respuestas de los endpoints de API: JSON, nunca en caché y sin detalles internos (TECHNICAL_SPEC §10.5, §15).
export function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
}

/** 401 genérico: no dice si faltaba la cabecera o si la clave era incorrecta. */
export const unauthorized = (): Response => json({ error: 'No autorizado.' }, 401);
export const badRequest = (): Response => json({ error: 'Solicitud no válida.' }, 400);
export const conflict = (message = 'La ejecución no está disponible.'): Response => json({ error: message }, 409);
export const serverError = (): Response => json({ error: 'Algo salió mal. Inténtalo de nuevo.' }, 500);
