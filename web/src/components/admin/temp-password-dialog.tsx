'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';

/**
 * Contraseña temporal: se muestra UNA sola vez. Al cerrar el diálogo el padre descarta el valor
 * y no hay forma de recuperarlo (hay que generar otra).
 */
export function TempPasswordDialog({ password, onClose }: { password: string | null; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!password) return;
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
    } catch {
      setCopied(false); // sin permiso del portapapeles: la persona puede seleccionar y copiar a mano
    }
  };

  return (
    <Dialog
      open={password !== null}
      title="Contraseña temporal"
      onClose={() => {
        setCopied(false);
        onClose();
      }}
    >
      <div className="flex items-center justify-between gap-2 rounded-sm bg-neutral-tint px-3 py-2.5">
        <span className="font-mono text-base font-semibold tracking-wider select-all" data-testid="temp-password">
          {password}
        </span>
        <Button type="button" size="sm" variant="secondary" onClick={copy}>
          {copied ? <Check className="i" size={14} aria-hidden="true" /> : <Copy className="i" size={14} aria-hidden="true" />}
          {copied ? 'Copiada' : 'Copiar'}
        </Button>
      </div>
      <Banner tone="warning">Anótala ahora: no volverá a mostrarse. La persona deberá cambiarla al ingresar.</Banner>
      <div className="flex justify-end">
        <Button
          type="button"
          onClick={() => {
            setCopied(false);
            onClose();
          }}
        >
          Listo
        </Button>
      </div>
    </Dialog>
  );
}
