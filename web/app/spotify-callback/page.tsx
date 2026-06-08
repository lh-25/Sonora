'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Spinner, Text, StackLayout } from '@salt-ds/core';

export default function SpotifyCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    const spotify = searchParams.get('spotify');

    if (spotify === 'connected') {
      setStatus('success');
      setTimeout(() => router.push('/profile'), 1500);
      return;
    }

    if (spotify === 'error') {
      setStatus('error');
      setTimeout(() => router.push('/profile'), 2000);
      return;
    }

    // Legacy: direct code exchange (fallback)
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error || !code) {
      setStatus('error');
      setTimeout(() => router.push('/profile'), 2000);
      return;
    }

    // If we somehow land here with a code, just redirect to profile
    // (the backend web-callback handler should have handled it already)
    setStatus('error');
    setTimeout(() => router.push('/profile'), 2000);
  }, []);

  return (
    <StackLayout align="center" style={{ height: '100vh', gap: 16, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
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
