'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Spinner, Text, StackLayout } from '@salt-ds/core';
import { spotifyExchangeToken } from '@/services/api';

export default function SpotifyCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error || !code) {
      setStatus('error');
      setTimeout(() => router.push('/profile'), 2000);
      return;
    }

    const redirectUri = `${window.location.origin}/spotify-callback`;
    spotifyExchangeToken(code, redirectUri)
      .then(() => {
        setStatus('success');
        setTimeout(() => router.push('/profile'), 1500);
      })
      .catch(() => {
        setStatus('error');
        setTimeout(() => router.push('/profile'), 2000);
      });
  }, []);

  return (
    <StackLayout align="center" style={{ height: '100vh', gap: 16, justifyContent: 'center' }}>
      {status === 'loading' && (
        <>
          <Spinner size="large" />
          <Text>Connecting Spotify…</Text>
        </>
      )}
      {status === 'success' && (
        <Text style={{ color: '#1db954', fontSize: 20 }}>✓ Spotify connected! Redirecting…</Text>
      )}
      {status === 'error' && (
        <Text style={{ color: '#e74c3c' }}>Connection failed. Redirecting…</Text>
      )}
    </StackLayout>
  );
}
