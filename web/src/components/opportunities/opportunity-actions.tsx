'use client';

import { ArrowRightLeft, CalendarPlus, CheckCircle2, Pencil, RotateCcw, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { NextActionFields } from '@/components/activities/activity-dialog';
import { Banner } from '@/components/ui/banner';
import { Field, fieldAria } from '@/components/ui/field';
import { FormDialogButton } from '@/components/ui/form-dialog';
import { Input } from '@/components/ui/input';
import { Menu, menuItemClass } from '@/components/ui/menu';
import { Select } from '@/components/ui/select';
import { LOST_REASONS, LOST_REASON_LABEL, OPEN_STAGES, STAGE_LABEL, type OpenStage } from '@/lib/labels';
import { NETWORK_ERROR, useActionForm } from '@/lib/use-action-form';
import { formatEuros } from '@/lib/money';
import { changeStage, closeAsLost, closeAsWon, reopenOpportunity, setNextAction } from '@/app/(app)/oportunidades/actions';

const icon = (Icon: typeof Pencil) => <Icon className="i" size={16} aria-hidden="true" />;

/** «Cambiar etapa»: los pasos abiertos con un clic. */
export function StageMenu({ opportunityId, current }: { opportunityId: string; current: string }) {
  const router = useRouter();
  const { submit, pending, error, networkError } = useActionForm(changeStage);

  const choose = (stage: OpenStage, close: () => void) => {
    const formData = new FormData();
    formData.set('id', opportunityId);
    formData.set('stage', stage);
    submit(formData, (result) => {
      if (result.ok) {
        close();
        router.refresh();
      }
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <Menu label="Cambiar etapa" align="left" icon={icon(ArrowRightLeft)}>
        {(close) =>
          OPEN_STAGES.filter((stage) => stage !== current).map((stage) => (
            <li key={stage} role="none">
              <button type="button" role="menuitem" className={menuItemClass} disabled={pending} onClick={() => choose(stage, close)}>
                {STAGE_LABEL[stage]}
              </button>
            </li>
          ))
        }
      </Menu>
      {error || networkError ? (
        <span role="alert" className="text-xs text-danger">
          {networkError ? NETWORK_ERROR : error}
        </span>
      ) : null}
    </div>
  );
}

export function CloseWonDialog({ opportunityId, estimated, today }: { opportunityId: string; estimated: number; today: string }) {
  return (
    <FormDialogButton
      title="Cerrar como Ganada"
      trigger={{ label: 'Cerrar como Ganada', variant: 'primary', icon: icon(CheckCircle2) }}
      action={closeAsWon}
      hidden={{ id: opportunityId }}
      submitLabel="Confirmar"
    >
      {(errors) => (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Field id="final_amount" label="Monto final (€)" error={errors.final_amount}>
              <Input id="final_amount" name="final_amount" inputMode="decimal" defaultValue={formatEuros(estimated).replace(/\s?€$/, '')} autoComplete="off" {...fieldAria('final_amount', errors.final_amount)} />
            </Field>
            <Field id="closed_on_won" label="Fecha de cierre" error={errors.closed_on}>
              <Input id="closed_on_won" name="closed_on" type="date" defaultValue={today} {...fieldAria('closed_on_won', errors.closed_on)} />
            </Field>
          </div>
          <p className="m-0 text-xs text-ink-2">El monto final se propone igual al estimado.</p>
        </>
      )}
    </FormDialogButton>
  );
}

export function CloseLostDialog({ opportunityId, today }: { opportunityId: string; today: string }) {
  return (
    <FormDialogButton
      title="Cerrar como Perdida"
      trigger={{ label: 'Cerrar como Perdida', className: 'text-danger', icon: icon(XCircle) }}
      action={closeAsLost}
      hidden={{ id: opportunityId }}
      submitLabel="Confirmar"
    >
      {(errors) => (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Field id="lost_reason" label="Motivo de pérdida" error={errors.lost_reason}>
              <Select id="lost_reason" name="lost_reason" defaultValue="" {...fieldAria('lost_reason', errors.lost_reason)}>
                <option value="">Elige un motivo</option>
                {LOST_REASONS.map((value) => (
                  <option key={value} value={value}>
                    {LOST_REASON_LABEL[value]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field id="closed_on_lost" label="Fecha de cierre" error={errors.closed_on}>
              <Input id="closed_on_lost" name="closed_on" type="date" defaultValue={today} {...fieldAria('closed_on_lost', errors.closed_on)} />
            </Field>
          </div>
          <p className="m-0 text-xs text-ink-2">El motivo es obligatorio.</p>
        </>
      )}
    </FormDialogButton>
  );
}

export function ReopenDialog({ opportunityId }: { opportunityId: string }) {
  return (
    <FormDialogButton
      title="Reabrir oportunidad"
      trigger={{ label: 'Reabrir', icon: icon(RotateCcw) }}
      action={reopenOpportunity}
      hidden={{ id: opportunityId }}
      submitLabel="Reabrir"
      intro={<Banner tone="warning">Se quitarán el monto final, la fecha de cierre y el motivo.</Banner>}
    >
      {(errors) => (
        <Field id="reopen_stage" label="Etapa" error={errors.stage}>
          <Select id="reopen_stage" name="stage" defaultValue="nueva" {...fieldAria('reopen_stage', errors.stage)}>
            {OPEN_STAGES.map((value) => (
              <option key={value} value={value}>
                {STAGE_LABEL[value]}
              </option>
            ))}
          </Select>
        </Field>
      )}
    </FormDialogButton>
  );
}

/** Definir o editar la próxima acción de una oportunidad abierta. */
export function NextActionDialog({ opportunityId, date, text, hasAction }: { opportunityId: string; date?: string; text?: string; hasAction: boolean }) {
  return (
    <FormDialogButton
      title={hasAction ? 'Editar próxima acción' : 'Definir próxima acción'}
      trigger={{ label: hasAction ? 'Editar' : 'Definir', size: 'sm', icon: icon(hasAction ? Pencil : CalendarPlus) }}
      action={setNextAction}
      hidden={{ id: opportunityId }}
      submitLabel="Guardar acción"
    >
      {(errors) => <NextActionFields errors={errors} date={date} text={text} />}
    </FormDialogButton>
  );
}
