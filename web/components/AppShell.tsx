'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Navigation from './Navigation';
import MusicPlayer from './MusicPlayer';

// Paths viewable without authentication.
const PUBLIC_PATHS = ['/', '/login', '/signup', '/about'];
// Auth entry pages — logged-in users get redirected away from these to /feed.
// NOTE: /about is intentionally excluded so authenticated users can view it.
const AUTH_PAGES = ['/', '/login', '/signup'];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    const isPublic = PUBLIC_PATHS.includes(pathname);
    if (!isAuthenticated && !isPublic) {
      router.push('/login');
    } else if (isAuthenticated && AUTH_PAGES.includes(pathname)) {
      router.push('/feed');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
        <span style={{ color: 'var(--sonora-cyan)', fontSize: 32 }}>♪</span>
      </div>
    );
  }

  // Show the global nav whenever the user is authenticated (including on /about).
  return (
    <>
      {isAuthenticated && <Navigation />}
      <main style={{ paddingBottom: isAuthenticated ? 100 : 0 }}>
        {children}
      </main>
      {isAuthenticated && <MusicPlayer />}
    </>
  );
}
