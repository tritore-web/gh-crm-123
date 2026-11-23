/**
 * Destino tras ingresar. Solo se admiten rutas internas (empiezan por una sola "/"),
 * para que nadie use el ingreso como puerta a otro sitio.
 */
export function safeNextPath(value: unknown): string {
  if (typeof value !== 'string') return '/';
  if (!value.startsWith('/') || value.startsWith('//') || value.startsWith('/\\')) return '/';
  if (value.startsWith('/ingresar') || value.startsWith('/cambiar-contrasena')) return '/';
  return value;
}
