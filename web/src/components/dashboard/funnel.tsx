import { OPEN_STAGES, STAGE_LABEL } from '@/lib/labels';
import { formatEuros } from '@/lib/money';

export type FunnelRow = { stage: string; count: number; total: number };

/** Embudo: una fila por etapa abierta, con cantidad, monto y una barra simple (SVG: sin estilos en línea). */
export function Funnel({ rows }: { rows: FunnelRow[] }) {
  const byStage = new Map(rows.map((row) => [row.stage, row]));
  const max = Math.max(1, ...OPEN_STAGES.map((stage) => byStage.get(stage)?.count ?? 0));
  return (
    <div className="flex flex-col gap-2.5">
      {OPEN_STAGES.map((stage) => {
        const row = byStage.get(stage) ?? { stage, count: 0, total: 0 };
        const width = Math.round((row.count / max) * 100);
        return (
          <div key={stage} className="grid grid-cols-[150px_1fr_190px] items-center gap-3 text-[13px]">
            <span>{STAGE_LABEL[stage]}</span>
            <svg className="h-3 w-full" aria-hidden="true" focusable="false">
              <rect width="100%" height="12" rx="6" fill="#efe7da" />
              {width > 0 ? <rect width={`${width}%`} height="12" rx="6" fill="#8a7967" /> : null}
            </svg>
            <span>
              <b>{row.count}</b> · {formatEuros(row.total)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
