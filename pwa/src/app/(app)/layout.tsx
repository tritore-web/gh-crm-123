import { redirect } from 'next/navigation';
import { BottomNav } from '@/components/shell/bottom-nav';
import { requireProfile } from '@/lib/current-profile';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  // Segunda barrera: solo supervisores. El proxy cierra la sesión del vendedor en la siguiente petición.
  if (profile.role !== 'supervisor') redirect('/ingresar?motivo=solo-supervisores');
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex flex-1 flex-col">{children}</div>
      <BottomNav />
    </div>
  );
}
