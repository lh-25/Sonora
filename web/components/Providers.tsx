'use client';

import { SaltProvider } from '@salt-ds/core';
import { AuthProvider } from '@/contexts/AuthContext';
import { PlayerProvider } from '@/contexts/PlayerContext';
import { ThemeProvider, useTheme } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/contexts/ToastContext';
import AppShell from './AppShell';
import ErrorBoundary from './ErrorBoundary';

function SaltWrapper({ children }: { children: React.ReactNode }) {
  const { mode } = useTheme();
  return <SaltProvider mode={mode}>{children}</SaltProvider>;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SaltWrapper>
        <ToastProvider>
          <AuthProvider>
            <PlayerProvider>
              <ErrorBoundary>
                <AppShell>{children}</AppShell>
              </ErrorBoundary>
            </PlayerProvider>
          </AuthProvider>
        </ToastProvider>
      </SaltWrapper>
    </ThemeProvider>
  );
}
