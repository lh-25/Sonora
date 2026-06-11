'use client';

import { SaltProviderNext } from '@salt-ds/core';
import { AuthProvider } from '@/contexts/AuthContext';
import { PlayerProvider } from '@/contexts/PlayerContext';
import AppShell from './AppShell';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SaltProviderNext mode="dark">
      <AuthProvider>
        <PlayerProvider>
          <AppShell>{children}</AppShell>
        </PlayerProvider>
      </AuthProvider>
    </SaltProviderNext>
  );
}
