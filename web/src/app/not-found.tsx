import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="m-0 text-[15px] font-medium">No encontramos esa página.</p>
      <Button asChild variant="secondary">
        <Link href="/">Volver al inicio</Link>
      </Button>
    </main>
  );
}
