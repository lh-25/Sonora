import type { Metadata } from 'next';
import { SaltProvider } from '@salt-ds/core';
import { AuthProvider } from '@/contexts/AuthContext';
import { PlayerProvider } from '@/contexts/PlayerContext';
import AppShell from '@/components/AppShell';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'Sonora',
  description: 'Discover, share, and connect through music.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SaltProvider mode="dark">
          <AuthProvider>
            <PlayerProvider>
              <AppShell>
                {children}
              </AppShell>
            </PlayerProvider>
          </AuthProvider>
        </SaltProvider>
      </body>
    </html>
  );
}
