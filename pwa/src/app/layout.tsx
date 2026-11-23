import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { connection } from 'next/server';
import { RegisterServiceWorker } from '@/components/shell/register-sw';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'CRM-123',
  description: 'Consulta rápida del equipo comercial',
  robots: { index: false, follow: false },
  manifest: '/manifest.webmanifest',
  icons: { icon: [{ url: '/icon-192.png', sizes: '192x192', type: 'image/png' }], apple: '/apple-touch-icon.png' },
  appleWebApp: { capable: true, title: 'CRM-123', statusBarStyle: 'default' },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#4A3426' };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // La política de seguridad (CSP) lleva un valor único por petición (src/proxy.ts): todas las páginas,
  // incluida la de "no encontrada", se pintan en cada petición para que Next pueda aplicarlo a sus scripts.
  await connection();
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans antialiased">
        {children}
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
