import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import type { Database } from '@/types/database';
import { supabasePublicEnv } from '@/lib/env';
import { fetchProfile } from '@/lib/profile';

// En Next 16 el antiguo "middleware" se llama "proxy". Corre antes de pintar cada página:
// renueva la sesión, aplica la política de seguridad de contenido (CSP) y protege las rutas.
// No es la única barrera: cada página y acción vuelve a comprobar el rol con getCurrentProfile().

const PUBLIC_PATHS = new Set(['/ingresar']);
const OFFLINE_PATH = '/offline'; // sin datos ni sesión: el service worker la sirve cuando no hay conexión
const CHANGE_PASSWORD_PATH = '/cambiar-contrasena';

function buildCsp(nonce: string, supabaseOrigin: string): string {
  const dev = process.env.NODE_ENV === 'development';
  return [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ''}`,
    `style-src 'self' 'nonce-${nonce}'`,
    `img-src 'self' blob: data:`,
    `font-src 'self'`,
    `worker-src 'self'`,
    `manifest-src 'self'`,
    `connect-src 'self' ${supabaseOrigin}`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
    ...(dev ? [] : [`upgrade-insecure-requests`]),
  ].join('; ');
}

export async function proxy(request: NextRequest) {
  const { url: supabaseUrl, anonKey } = supabasePublicEnv();
  const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
  const csp = buildCsp(nonce, new URL(supabaseUrl).origin);

  const forward = () => {
    const headers = new Headers(request.headers);
    headers.set('x-nonce', nonce);
    headers.set('Content-Security-Policy', csp);
    return NextResponse.next({ request: { headers } });
  };

  let response = forward();

  const supabase = createServerClient<Database>(supabaseUrl, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, cacheHeaders) {
        for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
        response = forward();
        for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        for (const [key, value] of Object.entries(cacheHeaders)) response.headers.set(key, value);
      },
    },
  });

  const finish = (res: NextResponse) => {
    res.headers.set('Content-Security-Policy', csp);
    res.headers.set('Cache-Control', 'private, no-store');
    return res;
  };

  const redirectTo = (pathname: string, params: Record<string, string> = {}) => {
    const target = request.nextUrl.clone();
    target.pathname = pathname;
    target.search = '';
    for (const [key, value] of Object.entries(params)) target.searchParams.set(key, value);
    const redirect = NextResponse.redirect(target);
    for (const cookie of response.cookies.getAll()) redirect.cookies.set(cookie);
    return finish(redirect);
  };

  const { pathname, search } = request.nextUrl;
  if (pathname === OFFLINE_PATH) return finish(response);
  const isPublic = PUBLIC_PATHS.has(pathname);

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    if (isPublic) return finish(response);
    const hadSession = request.cookies.getAll().some((cookie) => cookie.name.startsWith('sb-'));
    return redirectTo('/ingresar', {
      siguiente: `${pathname}${search}`,
      ...(hadSession ? { motivo: 'caducada' } : {}),
    });
  }

  // El rol y el estado salen SIEMPRE de la tabla profiles.
  const profile = await fetchProfile(supabase, data.user.id);
  if (!profile || !profile.isActive) {
    await supabase.auth.signOut();
    return redirectTo('/ingresar', { motivo: profile ? 'desactivado' : 'sin-acceso' });
  }

  // Solo los supervisores usan la PWA (TECHNICAL_SPEC §6.1.7).
  if (profile.role !== 'supervisor') {
    await supabase.auth.signOut();
    return redirectTo('/ingresar', { motivo: 'solo-supervisores' });
  }

  if (profile.mustChangePassword) {
    return pathname === CHANGE_PASSWORD_PATH ? finish(response) : redirectTo(CHANGE_PASSWORD_PATH);
  }
  if (pathname === CHANGE_PASSWORD_PATH || isPublic) return redirectTo('/');

  return finish(response);
}

export const config = {
  matcher: [
    // /api/* queda fuera: cada endpoint valida por su cuenta (n8n con Bearer; el envío manual con sesión) y responde 401/403, no redirige.
    '/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|webmanifest|js)$).*)',
  ],
};
