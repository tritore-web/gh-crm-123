import Link from 'next/link';
import { StageTag, TypeTag } from '@/components/ui/tags';
import { formatEuros } from '@/lib/money';
import { NextActionLine } from './next-action-line';

export type OpportunityCardData = {
  id: string;
  title: string;
  type: string;
  stage: string;
  estimated_amount: number;
  next_action_date: string | null;
  next_action_text: string | null;
};

/** Tarjeta compacta de oportunidad (ficha del cliente). */
export function OpportunityCard({ opportunity, today }: { opportunity: OpportunityCardData; today: string }) {
  return (
    <div className="opp-card">
      <div className="flex items-center gap-2">
        <Link href={`/oportunidades/${opportunity.id}`} className="font-semibold text-brown hover:underline">
          {opportunity.title}
        </Link>
        <span className="ml-auto">
          <StageTag stage={opportunity.stage} />
        </span>
      </div>
      <div className="flex items-center gap-2">
        <TypeTag type={opportunity.type} />
        <span className="ml-auto font-semibold">{formatEuros(opportunity.estimated_amount)}</span>
      </div>
      <NextActionLine date={opportunity.next_action_date} text={opportunity.next_action_text} today={today} />
    </div>
  );
}
