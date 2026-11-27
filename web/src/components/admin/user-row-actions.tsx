'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { KeyRound, Power, PowerOff } from 'lucide-react';
import { ActionButton } from '@/components/ui/action-button';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { NETWORK_ERROR, useActionForm } from '@/lib/use-action-form';
import type { Role } from '@/lib/profile';
import { LAST_SUPERVISOR_MESSAGE, LIMIT_MESSAGE, isLastActiveSupervisor, roleIsFull, type ActiveCounts } from '@/lib/user-rules';
import { resetTempPassword, setUserActive } from '@/app/(app)/admin/usuarios/actions';
import { TempPasswordDialog } from './temp-password-dialog';

type Props = {
  user: { id: string; name: string; role: Role; isActive: boolean };
  counts: ActiveCounts;
  isSelf: boolean;
};

/** Mensaje de una sola vez que explica por qué no se puede hacer algo (último supervisor, cupo lleno). */
function InfoDialog({ open, title, text, onClose }: { open: boolean; title: string; text: string; onClose: () => void }) {
  return (
    <Dialog open={open} onClose={onClose} title={title}>
      <Banner tone="error">{text}</Banner>
      <div className="flex justify-end">
        <Button type="button" onClick={onClose}>
          Entendido
        </Button>
      </div>
    </Dialog>
  );
}

export function UserRowActions({ user, counts, isSelf }: Props) {
  const router = useRouter();
  const [info, setInfo] = useState<{ title: string; text: string } | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const reset = useActionForm(resetTempPassword);

  const lastSupervisor = isLastActiveSupervisor({ role: user.role, isActive: user.isActive }, counts);

  const requestReset = () => {
    const formData = new FormData();
    formData.set('id', user.id);
    reset.submit(formData, (result) => {
      if (result.ok && 'tempPassword' in result && typeof result.tempPassword === 'string') {
        setPassword(result.tempPassword);
        router.refresh();
      }
    });
  };

  return (
    <span className="flex flex-wrap items-center gap-2">
      {user.isActive ? (
        isSelf ? null : lastSupervisor ? (
          <Button type="button" size="sm" variant="secondary" onClick={() => setInfo({ title: 'No se puede desactivar', text: LAST_SUPERVISOR_MESSAGE })}>
            <PowerOff className="i" size={14} aria-hidden="true" />
            Desactivar
          </Button>
        ) : (
          <ActionButton
            action={setUserActive}
            fields={{ id: user.id, active: 'false' }}
            label="Desactivar"
            size="sm"
            icon={<PowerOff className="i" size={14} aria-hidden="true" />}
            confirm={{
              title: `¿Desactivar a ${user.name}?`,
              text: 'No podrá ingresar. Sus clientes seguirán asignados hasta que los reasignes.',
              confirmLabel: 'Desactivar',
            }}
          />
        )
      ) : roleIsFull(user.role, counts) ? (
        <Button type="button" size="sm" variant="secondary" onClick={() => setInfo({ title: 'No se puede reactivar', text: LIMIT_MESSAGE[user.role] })}>
          <Power className="i" size={14} aria-hidden="true" />
          Reactivar
        </Button>
      ) : (
        <ActionButton action={setUserActive} fields={{ id: user.id, active: 'true' }} label="Reactivar" size="sm" icon={<Power className="i" size={14} aria-hidden="true" />} />
      )}

      <Button type="button" size="sm" variant="secondary" disabled={reset.pending} aria-busy={reset.pending} onClick={requestReset}>
        <KeyRound className="i" size={14} aria-hidden="true" />
        Contraseña temporal
      </Button>
      {reset.error || reset.networkError ? (
        <span role="alert" className="text-xs text-danger">
          {reset.networkError ? NETWORK_ERROR : reset.error}
        </span>
      ) : null}

      <InfoDialog open={info !== null} title={info?.title ?? ''} text={info?.text ?? ''} onClose={() => setInfo(null)} />
      <TempPasswordDialog password={password} onClose={() => setPassword(null)} />
    </span>
  );
}
