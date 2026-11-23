'use client';

import { useActionState, useState } from 'react';
import { Check, Circle, LogOut } from 'lucide-react';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { checkPassword, isStrongPassword } from '@/lib/password';
import { cn } from '@/lib/utils';
import { PasswordInput } from '../password-input';
import { changePassword, signOut, type FormState } from '../actions';

const initialState: FormState = {};

function Requirement({ met, children }: { met: boolean; children: string }) {
  const Icon = met ? Check : Circle;
  return (
    <li className="flex items-center gap-2">
      <Icon className="i" size={16} aria-hidden="true" />
      <span className={cn(met ? 'text-success' : 'text-ink-2')}>{children}</span>
      <span className="sr-only">{met ? '(cumple)' : '(pendiente)'}</span>
    </li>
  );
}

export function PasswordForm() {
  const [state, formAction, pending] = useActionState(changePassword, initialState);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const checks = checkPassword(password);
  const touched = password.length > 0;
  const weak = touched && !isStrongPassword(password);
  const mismatch = confirm.length > 0 && confirm !== password;
  const canSubmit = isStrongPassword(password) && password === confirm && !pending;

  return (
    <>
      <h1 className="m-0 text-[20px] leading-7 font-semibold text-brown">Elige una contraseña nueva</h1>
      <p className="m-0 text-ink-2">Por seguridad, elige una contraseña nueva</p>
      <form action={formAction} className="flex flex-col gap-4">
        {state.error ? <Banner tone="error">{state.error}</Banner> : null}
        <div className="flex flex-col gap-1">
          <PasswordInput
            id="password"
            name="password"
            label="Contraseña nueva"
            autoComplete="new-password"
            value={password}
            onChange={setPassword}
            invalid={weak}
            describedBy="password-requisitos"
          />
          {weak ? (
            <p role="alert" className="m-0 flex gap-1 text-[13px] leading-[18px] text-danger">
              Usa al menos 10 caracteres, con letras y números.
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-1">
          <PasswordInput
            id="confirm"
            name="confirm"
            label="Repetirla"
            autoComplete="new-password"
            value={confirm}
            onChange={setConfirm}
            invalid={mismatch}
          />
          {mismatch ? (
            <p role="alert" className="m-0 text-[13px] leading-[18px] text-danger">
              Las contraseñas no coinciden.
            </p>
          ) : null}
        </div>
        <ul id="password-requisitos" className="m-0 flex list-none flex-col gap-2 p-0">
          <Requirement met={checks.length}>10 caracteres como mínimo</Requirement>
          <Requirement met={checks.lettersAndNumbers}>Con letras y números</Requirement>
        </ul>
        <Button type="submit" block size="lg" disabled={!canSubmit} aria-busy={pending}>
          {pending ? (
            <>
              <span className="spin" aria-hidden="true" />
              Guardando…
            </>
          ) : (
            'Guardar y continuar'
          )}
        </Button>
      </form>
      <form action={signOut}>
        <button type="submit" className="flex min-h-11 items-center gap-2 text-ink-2 hover:text-ink">
          <LogOut className="i" size={16} aria-hidden="true" />
          Cerrar sesión
        </button>
      </form>
    </>
  );
}
