import { CheckCircle2, XCircle } from 'lucide-react';
import { OPEN_STAGES, STAGE_LABEL } from '@/lib/labels';

/** Indicador de etapa: Nueva → Contactada → Propuesta enviada → Negociación, más el resultado si está cerrada. */
export function StageSteps({ stage }: { stage: string }) {
  const closed = stage === 'ganada' || stage === 'perdida';
  const currentIndex = OPEN_STAGES.findIndex((s) => s === stage);
  return (
    <ol className={`steps m-0 list-none p-0${closed ? ' closed' : ''}`} aria-label="Etapa de la oportunidad">
      {OPEN_STAGES.map((value, index) => {
        const state = closed || index < currentIndex ? 'done' : index === currentIndex ? 'cur' : '';
        return (
          <li key={value} className={`step ${state}`} aria-current={state === 'cur' ? 'step' : undefined}>
            {STAGE_LABEL[value]}
          </li>
        );
      })}
      {closed ? (
        <li className="step" aria-current="step">
          {stage === 'ganada' ? <CheckCircle2 className="i mr-1 inline text-success" size={14} aria-hidden="true" /> : <XCircle className="i mr-1 inline text-danger" size={14} aria-hidden="true" />}
          {stage === 'ganada' ? 'Ganada' : 'Perdida'}
        </li>
      ) : null}
    </ol>
  );
}
