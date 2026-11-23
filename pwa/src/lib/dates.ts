// Fechas: dd/mm/aaaa y zona de settings (Europe/Madrid). "Hoy" lo da la base (app_today()), nunca el navegador.
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
export const APP_TIME_ZONE = 'Europe/Madrid';

function parseIsoDate(iso: string): { y: number; m: number; d: number } | null {
  const match = ISO_DATE.exec(iso);
  return match ? { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) } : null;
}

/** `2026-11-23` → `23/11/2026` (sin pasar por zonas horarias). */
export function formatDate(iso: string): string {
  const parts = parseIsoDate(iso);
  if (!parts) return '';
  return `${String(parts.d).padStart(2, '0')}/${String(parts.m).padStart(2, '0')}/${parts.y}`;
}

/** Instante ISO (timestamptz) → `23/11/2026 08:30` en la zona de la aplicación. */
export function formatDateTime(isoInstant: string, timeZone: string = APP_TIME_ZONE): string {
  const date = new Date(isoInstant);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('es-ES', {
    timeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('day')}/${get('month')}/${get('year')} ${get('hour')}:${get('minute')}`;
}

/** `2026-11-23` → `lunes`. */
export function weekdayName(iso: string): string {
  const parts = parseIsoDate(iso);
  if (!parts) return '';
  const noonUtc = new Date(Date.UTC(parts.y, parts.m - 1, parts.d, 12));
  return new Intl.DateTimeFormat('es-ES', { weekday: 'long', timeZone: 'UTC' }).format(noonUtc);
}

/** Días naturales entre dos fechas `aaaa-mm-dd` (to − from). */
export function daysBetween(fromIso: string, toIso: string): number {
  const from = parseIsoDate(fromIso);
  const to = parseIsoDate(toIso);
  if (!from || !to) return 0;
  const ms = Date.UTC(to.y, to.m - 1, to.d) - Date.UTC(from.y, from.m - 1, from.d);
  return Math.round(ms / 86_400_000);
}

/** `Atrasada · 3 días` (días de atraso respecto a "hoy"). */
export function overdueLabel(days: number): string {
  return `Atrasada · ${days} ${days === 1 ? 'día' : 'días'}`;
}

/** Hora del reloj en la zona de la aplicación, `08:44` (cabecera "Actualizado 08:44"). */
export function formatClock(instant: Date, timeZone: string = APP_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat('es-ES', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(instant);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('hour')}:${get('minute')}`;
}
