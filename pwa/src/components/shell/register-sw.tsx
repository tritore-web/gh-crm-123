'use client';

import { useEffect } from 'react';

/** Registra el service worker mínimo (solo en producción): pantalla "Sin conexión" e instalación. */
export function RegisterServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Sin service worker la aplicación funciona igual; solo se pierde la pantalla "Sin conexión".
    });
  }, []);
  return null;
}
