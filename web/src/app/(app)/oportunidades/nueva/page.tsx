import type { Metadata } from 'next';
import { ComingSoon } from '@/components/shell/coming-soon';

export const metadata: Metadata = { title: 'Nueva oportunidad · CRM-123' };

export default function Page() {
  return <ComingSoon />;
}
