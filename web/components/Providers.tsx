'use client';

import { SaltProviderNext } from '@salt-ds/core';
import { AuthProvider } from '@/contexts/AuthContext';
import { PlayerProvider } from '@/contexts/PlayerContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import AppShell from './AppShell';

function SaltWrapper({ children }: { children: React.ReactNode }) {
  const { mode } = useTheme();
  return <SaltProviderNext mode={mode}>{children}</SaltProviderNext>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SaltWrapper>
        <AuthProvider>
          <PlayerProvider>
            <AppShell>{children}</AppShell>
          </PlayerProvider>
        </AuthProvider>
      </SaltWrapper>
    </ThemeProvider>
  );
}
