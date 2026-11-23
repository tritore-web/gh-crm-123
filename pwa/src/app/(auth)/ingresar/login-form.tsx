'use client';

import { useActionState } from 'react';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '../password-input';
import { signIn, type FormState } from '../actions';
import { LOGIN_MESSAGES } from '../login-messages';

const initialState: FormState = {};

export function LoginForm({ notice, next }: { notice?: { text: string; locked?: boolean; error?: boolean }; next: string }) {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  return (
    <form action={formAction} className="flex flex-col gap-4">
      {state.error ? (
        <Banner tone="error" locked={state.error === LOGIN_MESSAGES.disabled || state.error === LOGIN_MESSAGES.noAccess}>
          {state.error}
        </Banner>
      ) : notice ? (
        <Banner tone={notice.locked || notice.error ? 'error' : 'info'} locked={notice.locked}>
          {notice.text}
        </Banner>
      ) : null}
      <input type="hidden" name="siguiente" value={next} />
      <div className="flex min-w-0 flex-col gap-1">
        <Label htmlFor="email">Correo</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          defaultValue={state.email ?? ''}
          placeholder="nombre@dominio.es"
          required
          maxLength={200}
        />
      </div>
      <PasswordInput id="password" name="password" label="Contraseña" autoComplete="current-password" />
      <Button type="submit" block size="lg" disabled={pending} aria-busy={pending}>
        {pending ? (
          <>
            <span className="spin" aria-hidden="true" />
            Ingresando…
          </>
        ) : (
          'Ingresar'
        )}
      </Button>
    </form>
  );
}
