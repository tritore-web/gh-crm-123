import { MessageSquare, Phone, StickyNote, Users } from 'lucide-react';
import { ActionButton } from '@/components/ui/action-button';
import type { TimelineItem } from '@/lib/activities';
import { formatDateTime } from '@/lib/dates';
import { voidActivity } from '@/app/(app)/actividades/actions';

const ICONS = { llamada: Phone, mensaje: MessageSquare, reunion: Users, nota: StickyNote } as const;
const LABELS = { llamada: 'Llamada', mensaje: 'Mensaje', reunion: 'Reunión o visita', nota: 'Nota' } as const;

/** Historial de actividades. Solo se añaden: un error se corrige con una nota nueva o anulando (queda tachada). */
export function ActivityTimeline({ items }: { items: TimelineItem[] }) {
  return (
    <ul className="tl">
      {items.map((item) => {
        const key = item.type as keyof typeof ICONS;
        const Icon = ICONS[key] ?? StickyNote;
        return (
          <li key={item.id} className={item.voided ? 'void' : undefined}>
            <span className="ic">
              <Icon className="i" size={14} aria-hidden="true" />
            </span>
            <div>
              <div className="d">
                <span className="sr-only">{LABELS[key] ?? 'Actividad'}: </span>
                {item.description}
                {item.voided ? (
                  <>
                    {' '}
                    <span className="tag">Anulada</span>
                  </>
                ) : null}
              </div>
              <div className="m">
                {item.author} · {formatDateTime(item.occurred_at)}
              </div>
            </div>
            <div>
              {item.canVoid ? (
                <ActionButton
                  action={voidActivity}
                  fields={{ id: item.id }}
                  label="Anular"
                  variant="ghost"
                  size="sm"
                  confirm={{ title: 'Anular actividad', text: 'Se marcará como anulada y seguirá visible en el historial.', confirmLabel: 'Anular' }}
                />
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
