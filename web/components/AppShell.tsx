'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from './Navigation';
import MusicPlayer from './MusicPlayer';

const PUBLIC_PATHS = ['/login', '/signup'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    const isPublic = PUBLIC_PATHS.includes(pathname);
    if (!isAuthenticated && !isPublic) {
      router.push('/login');
    } else if (isAuthenticated && isPublic) {
      router.push('/feed');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <span style={{ color: '#1db954', fontSize: 32 }}>♪</span>
      </div>
    );
  }

  const isPublic = PUBLIC_PATHS.includes(pathname);

  return (
    <>
      {!isPublic && <Navigation />}
      <main style={{ paddingBottom: isAuthenticated ? 80 : 0 }}>
        {children}
      </main>
      {isAuthenticated && <MusicPlayer />}
    </>
  );
}
