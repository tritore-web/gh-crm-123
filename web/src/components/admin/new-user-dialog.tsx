'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Field, fieldAria } from '@/components/ui/field';
import { FormDialog } from '@/components/ui/form-dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { ROLE_LABEL, type Role } from '@/lib/profile';
import { LIMIT_MESSAGE, roleIsFull, type ActiveCounts } from '@/lib/user-rules';
import { createUser } from '@/app/(app)/admin/usuarios/actions';
import { TempPasswordDialog } from './temp-password-dialog';

function RoleField({ counts, error }: { counts: ActiveCounts; error?: string }) {
  const [role, setRole] = useState<Role | ''>('vendedor');
  const full = role !== '' && roleIsFull(role, counts);
  return (
    <>
      <Field id="user_role" label="Rol" error={error}>
        <Select id="user_role" name="role" value={role} onChange={(event) => setRole(event.target.value as Role | '')} {...fieldAria('user_role', error)}>
          <option value="">Elige el rol</option>
          {(['vendedor', 'supervisor'] as const).map((value) => (
            <option key={value} value={value}>
              {ROLE_LABEL[value]}
            </option>
          ))}
        </Select>
      </Field>
      {full && role ? <Banner tone="warning">{LIMIT_MESSAGE[role]}</Banner> : null}
    </>
  );
}

/** «+ Nuevo usuario»: al crear, la contraseña temporal se muestra una sola vez. */
export function NewUserDialog({ counts }: { counts: ActiveCounts }) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState<string | null>(null);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        <Plus className="i" size={16} aria-hidden="true" />
        Nuevo usuario
      </Button>
      <FormDialog
        open={open}
        onClose={() => setOpen(false)}
        title="Nuevo usuario"
        action={createUser}
        submitLabel="Crear"
        onSuccess={(result) => {
          setOpen(false);
          if ('tempPassword' in result && typeof result.tempPassword === 'string') setPassword(result.tempPassword);
        }}
      >
        {(errors) => (
          <>
            <Field id="user_name" label="Nombre completo" error={errors.full_name}>
              <Input id="user_name" name="full_name" maxLength={120} autoComplete="off" {...fieldAria('user_name', errors.full_name)} />
            </Field>
            <Field id="user_email" label="Correo" error={errors.email}>
              <Input id="user_email" name="email" type="email" maxLength={200} autoComplete="off" {...fieldAria('user_email', errors.email)} />
            </Field>
            <RoleField counts={counts} error={errors.role} />
          </>
        )}
      </FormDialog>
      <TempPasswordDialog password={password} onClose={() => setPassword(null)} />
    </>
  );
}
