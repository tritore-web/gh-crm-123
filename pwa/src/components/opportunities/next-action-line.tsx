import { AlertTriangle, CalendarClock } from 'lucide-react';
import { daysBetween, formatDate, overdueLabel } from '@/lib/dates';

/** Próxima acción de una oportunidad: «27/11/2026 · Enviar menú». En rojo si está atrasada, en ámbar si es hoy. */
export function NextActionLine({ date, text, today }: { date: string | null; text: string | null; today: string }) {
  if (!date || !text) return null;
  const late = date < today;
  const isToday = date === today;
  const Icon = late ? AlertTriangle : CalendarClock;
  return (
    <div className={`next${late ? ' late' : isToday ? ' today' : ''}`}>
      <Icon className="i" size={14} aria-hidden="true" />
      <span>
        {late ? <span className="sr-only">{overdueLabel(daysBetween(date, today))}. </span> : isToday ? <span className="sr-only">Hoy. </span> : null}
        {formatDate(date)} · {text}
      </span>
    </div>
  );
}
