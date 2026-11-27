'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';

/** Hoja inferior de confirmación (diálogo nativo anclado abajo): el navegador gestiona el foco y la tecla Esc. */
export function Sheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const closedByCode = useRef(false);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) {
      closedByCode.current = true;
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={() => {
        if (closedByCode.current) {
          closedByCode.current = false;
          return;
        }
        onClose();
      }}
      className="sheet fixed inset-x-0 top-auto bottom-0 m-0 w-full max-w-none rounded-t-xl border-0 bg-surface p-0 text-ink shadow-sheet"
    >
      {open ? (
        <div className="flex flex-col gap-3.5 px-4 pt-3 pb-6">
          <div className="mx-auto h-1 w-10 rounded-sm bg-line-strong" aria-hidden="true" />
          <h2 id={titleId} className="m-0 text-lg leading-[26px] font-semibold text-brown">
            {title}
          </h2>
          {children}
        </div>
      ) : null}
    </dialog>
  );
}
