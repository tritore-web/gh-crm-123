import { Sidebar } from '@/components/shell/sidebar';
import { Topbar } from '@/components/shell/topbar';
import { requireProfile } from '@/lib/current-profile';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  return (
    <div className="flex min-h-screen">
      <Sidebar profile={profile} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex flex-col gap-4 p-6">
          <div className="flex max-w-[1280px] flex-col gap-4">{children}</div>
        </main>
      </div>
    </div>
  );
}
