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

/** Instante ISO → `23/11/2026` (solo la fecha, en la zona de la aplicación). */
export function formatInstantDate(isoInstant: string, timeZone: string = APP_TIME_ZONE): string {
  const date = new Date(isoInstant);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('es-ES', { timeZone, day: '2-digit', month: '2-digit', year: 'numeric' }).formatToParts(date);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('day')}/${get('month')}/${get('year')}`;
}

/** Instante → `2026-11-23T09:12` en la zona de la aplicación (valor de un campo "fecha y hora"). */
export function toLocalInput(instant: Date, timeZone: string = APP_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(instant);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
}

/** `2026-11-23T09:12` (hora de Madrid) → instante ISO en UTC. Devuelve null si no es válido. */
export function localInputToIso(local: string, timeZone: string = APP_TIME_ZONE): string | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(local);
  if (!match) return null;
  const [y, mo, d, h, mi] = match.slice(1).map(Number);
  const asUtc = Date.UTC(y, mo - 1, d, h, mi);
  // La diferencia entre la hora de pared y UTC en ese instante da el desplazamiento de la zona (maneja horario de verano).
  let guess = asUtc;
  for (let i = 0; i < 2; i += 1) {
    const shown = toLocalInput(new Date(guess), timeZone);
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(shown);
    if (!m) return null;
    const wall = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
    guess += asUtc - wall;
  }
  const result = new Date(guess);
  if (toLocalInput(result, timeZone) !== local) return null; // hora que no existe (salto de horario de verano)
  return result.toISOString();
}

/** `2026-11-23` es una fecha de calendario válida (rechaza 2026-02-30). */
export function isValidIsoDate(iso: string): boolean {
  const parts = parseIsoDate(iso);
  if (!parts) return false;
  const date = new Date(Date.UTC(parts.y, parts.m - 1, parts.d));
  return date.getUTCFullYear() === parts.y && date.getUTCMonth() === parts.m - 1 && date.getUTCDate() === parts.d;
}

/** Hora del reloj en la zona de la aplicación, `08:44` (cabecera "Actualizado 08:44"). */
export function formatClock(instant: Date, timeZone: string = APP_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat('es-ES', { timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(instant);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('hour')}:${get('minute')}`;
}
