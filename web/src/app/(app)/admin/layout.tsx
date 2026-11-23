import { NoPermission } from '@/components/shell/no-permission';
import { requireProfile } from '@/lib/current-profile';

// Todo /admin/* es solo del supervisor. La comprobación es del servidor y lee el rol de profiles.
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  if (profile.role !== 'supervisor') return <NoPermission />;
  return children;
}
