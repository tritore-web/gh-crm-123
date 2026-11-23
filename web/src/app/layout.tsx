import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { connection } from 'next/server';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });

export const metadata: Metadata = {
  title: 'CRM-123',
  description: 'CRM del equipo comercial',
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // La política de seguridad (CSP) lleva un valor único por petición (src/proxy.ts): todas las páginas,
  // incluida la de "no encontrada", se pintan en cada petición para que Next pueda aplicarlo a sus scripts.
  await connection();
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
