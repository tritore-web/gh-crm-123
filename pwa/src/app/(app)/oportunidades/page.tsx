import type { Metadata } from 'next';
import { ComingSoon } from '@/components/shell/coming-soon';
import { MobileHeader } from '@/components/shell/mobile-header';

export const metadata: Metadata = { title: 'Oportunidades · CRM-123' };

export default function Page() {
  return (
    <>
      <MobileHeader title="Oportunidades" showUpdated={false} />
      <main className="flex flex-1 flex-col gap-3 p-4">
        <ComingSoon />
      </main>
    </>
  );
}
