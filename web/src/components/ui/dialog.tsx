'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';

/**
 * Diálogo modal con el elemento nativo <dialog>: el navegador gestiona el foco, atrapa el tabulador y cierra con Esc.
 * El contenido solo existe mientras está abierto, así que cada apertura empieza con el formulario limpio.
 */
export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const closedByCode = useRef(false);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) {
      closedByCode.current = true; // el evento "close" de este cierre no debe avisar al padre
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={() => {
        // Solo avisa cuando el cierre lo provoca la persona (tecla Esc); no cuando lo hace el propio código.
        if (closedByCode.current) {
          closedByCode.current = false;
          return;
        }
        onClose();
      }}
      className="m-auto w-[460px] max-w-[calc(100vw-32px)] rounded-md border border-line bg-surface p-5 text-ink shadow-dialog"
    >
      {open ? (
        <div className="flex flex-col gap-3.5">
          <h2 id={titleId} className="m-0 text-base leading-6 font-semibold text-brown">
            {title}
          </h2>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}
