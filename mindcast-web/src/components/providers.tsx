'use client';

import { SessionProvider } from 'next-auth/react';
import { ShortcutsProvider } from './shortcuts-provider';
import { PWAProvider } from './pwa-provider';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <PWAProvider>
        <ShortcutsProvider>{children}</ShortcutsProvider>
      </PWAProvider>
    </SessionProvider>
  );
}
