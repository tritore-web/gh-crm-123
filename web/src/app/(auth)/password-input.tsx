'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Props = {
  id: string;
  name: string;
  label: string;
  autoComplete: 'current-password' | 'new-password';
  value?: string;
  onChange?: (value: string) => void;
  invalid?: boolean;
  describedBy?: string;
};

/** Campo de contraseña con mostrar/ocultar. */
export function PasswordInput({ id, name, label, autoComplete, value, onChange, invalid, describedBy }: Props) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          required
          maxLength={200}
          value={value}
          onChange={onChange ? (event) => onChange(event.target.value) : undefined}
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className="pr-9"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-9 items-center justify-center text-ink-2 hover:text-ink"
        >
          {visible ? <EyeOff className="i" size={16} aria-hidden="true" /> : <Eye className="i" size={16} aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
}
