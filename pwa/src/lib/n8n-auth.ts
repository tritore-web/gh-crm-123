import { safeEqual } from '@/lib/safe-equal';

/**
 * Los endpoints /api/n8n/* solo aceptan `Authorization: Bearer <N8N_API_SECRET>`, comparado con safeEqual
 * (timingSafeEqual). Sin cookies ni sesión de usuario. Si el secreto no está configurado, nadie entra.
 */
export function isN8nAuthorized(request: Request): boolean {
  const header = request.headers.get('authorization');
  const token = header ? /^Bearer (.+)$/.exec(header)?.[1] : undefined;
  return safeEqual(token, process.env.N8N_API_SECRET);
}
