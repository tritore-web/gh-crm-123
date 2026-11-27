import type { Metadata } from 'next';
import Link from 'next/link';
import { KeyRound, LogOut } from 'lucide-react';
import { signOut } from '@/app/(auth)/actions';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { MobileHeader } from '@/components/shell/mobile-header';
import { requireProfile } from '@/lib/current-profile';
import { readFailure } from '@/lib/data';
import { ROLE_LABEL } from '@/lib/profile';
import { firstParam, type SearchParams } from '@/lib/params';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Cuenta · CRM-123' };

export default async function CuentaPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const profile = await requireProfile();
  const saved = firstParam((await searchParams).cambio) === 'ok';
  const supabase = await createClient();
  const { data, error } = await supabase.from('profiles').select('email').eq('id', profile.id).maybeSingle();
  if (error) return readFailure('cuenta', error);

  return (
    <>
      <MobileHeader title="Cuenta" showUpdated={false} />
      <main className="flex flex-1 flex-col gap-3 p-4">
        {saved ? <Banner tone="success">Guardado.</Banner> : null}
        <div className="m-card">
          <div className="font-semibold text-brown">{profile.fullName}</div>
          <div className="text-ink-2">{data?.email ?? ''}</div>
          <div>
            <span className="tag">{ROLE_LABEL[profile.role]}</span>
          </div>
        </div>
        <Button asChild variant="secondary" block>
          <Link href="/cuenta/contrasena">
            <KeyRound className="i" size={16} aria-hidden="true" />
            Cambiar contraseña
          </Link>
        </Button>
        <div className="m-card">
          <h2 className="m-sec m-0">Instalar en la pantalla de inicio</h2>
          <div className="text-ink-2">
            Abre el menú del navegador y elige «Añadir a la pantalla de inicio» para usar CRM-123 como una aplicación.
          </div>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="secondary" block className="text-danger">
            <LogOut className="i" size={16} aria-hidden="true" />
            Cerrar sesión
          </Button>
        </form>
      </main>
    </>
  );
}
