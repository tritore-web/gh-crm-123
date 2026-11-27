import { CheckCircle2, XCircle } from 'lucide-react';
import { isStage, stageLabel, typeLabel } from '@/lib/labels';

/** Etapa: tonos neutros cálidos; solo Ganada (verde) y Perdida (rojo) usan color, siempre con icono y texto. */
export function StageTag({ stage }: { stage: string }) {
  if (stage === 'ganada')
    return (
      <span className="tag won">
        <CheckCircle2 className="i" size={12} aria-hidden="true" />
        Ganada
      </span>
    );
  if (stage === 'perdida')
    return (
      <span className="tag lost">
        <XCircle className="i" size={12} aria-hidden="true" />
        Perdida
      </span>
    );
  return <span className={`tag ${isStage(stage) ? `s-${stage}` : ''}`}>{stageLabel(stage)}</span>;
}

export function TypeTag({ type }: { type: string }) {
  return <span className="tag type">{typeLabel(type)}</span>;
}
