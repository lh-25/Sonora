'use client';

import { useEffect, useState } from 'react';
import {
  Button, Text, H1, H2, H3, StackLayout, FlexLayout, Spinner, Card,
} from '@salt-ds/core';
import { useAuth } from '@/contexts/AuthContext';
import { spotifyStatus, spotifyDisconnect } from '@/services/api';
import { useRouter } from 'next/navigation';
import styles from './profile.module.css';

export default function ProfilePage() {
  const { user, profile, logout } = useAuth();
  const router = useRouter();
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [loadingSpotify, setLoadingSpotify] = useState(true);

  useEffect(() => {
    spotifyStatus()
      .then((s) => setSpotifyConnected(s.connected))
      .finally(() => setLoadingSpotify(false));
  }, []);

  const handleSpotifyConnect = () => {
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID;
    if (!clientId) {
      alert('Spotify Client ID not configured. Set NEXT_PUBLIC_SPOTIFY_CLIENT_ID in .env.local');
      return;
    }
    const redirectUri = `${window.location.origin}/spotify-callback`;
    const scopes = [
      'user-read-private', 'user-read-email',
      'playlist-read-private', 'playlist-read-collaborative',
    ].join(' ');
    const url = new URL('https://accounts.spotify.com/authorize');
    url.searchParams.set('client_id', clientId);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('redirect_uri', redirectUri);
    url.searchParams.set('scope', scopes);
    window.location.href = url.toString();
  };

  const handleDisconnect = async () => {
    if (!confirm('Remove Spotify connection?')) return;
    await spotifyDisconnect();
    setSpotifyConnected(false);
  };

  const handleLogout = () => {
    if (!confirm('Log out?')) return;
    logout();
    router.push('/login');
  };

  if (!user || !profile) {
    return <FlexLayout justify="center" className={styles.spinner}><Spinner size="large" /></FlexLayout>;
  }

  return (
    <div className={styles.page}>
      <div className="page-container">
        <H1 className={styles.title}>Profile</H1>

        {/* Profile header */}
        <div className={styles.profileCard}>
          {profile.profile_picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.profile_picture} alt={user.username} className={styles.avatar} />
          ) : (
            <div className={styles.avatarPlaceholder}>
              <Text className={styles.avatarInitial}>{user.username[0].toUpperCase()}</Text>
            </div>
          )}

          <div className={styles.profileInfo}>
            <H2 className={styles.username}>@{user.username}</H2>
            {user.email && <Text styleAs="help" className={styles.email}>{user.email}</Text>}
            {profile.bio && <Text className={styles.bio}>{profile.bio}</Text>}
          </div>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <Text className={styles.statValue}>{profile.total_followers}</Text>
            <Text styleAs="help" className={styles.statLabel}>Followers</Text>
          </div>
          <div className={styles.statCard}>
            <Text className={styles.statValue}>{profile.total_following}</Text>
            <Text styleAs="help" className={styles.statLabel}>Following</Text>
          </div>
        </div>

        {/* Spotify */}
        <div className={styles.section}>
          <H3 className={styles.sectionTitle}>Spotify Integration</H3>
          {loadingSpotify ? (
            <Spinner size="small" />
          ) : spotifyConnected ? (
            <StackLayout gap={2}>
              <FlexLayout gap={1} align="center">
                <Text className={styles.connectedText}>✓ Spotify connected</Text>
              </FlexLayout>
              <Text styleAs="help" className={styles.hint}>
                You can now import Spotify playlists and link songs to Spotify tracks.
              </Text>
              <Button variant="secondary" onClick={handleDisconnect} className={styles.disconnectBtn}>
                Disconnect Spotify
              </Button>
            </StackLayout>
          ) : (
            <StackLayout gap={2}>
              <Text styleAs="help" className={styles.hint}>
                Connect Spotify to import playlists, link songs, and play 30-second previews.
              </Text>
              <Button variant="primary" onClick={handleSpotifyConnect} className={styles.spotifyBtn}>
                Connect Spotify
              </Button>
            </StackLayout>
          )}
        </div>

        {/* Account */}
        <div className={styles.section}>
          <H3 className={styles.sectionTitle}>Account</H3>
          <Button variant="secondary" onClick={handleLogout} className={styles.logoutBtn}>
            Log Out
          </Button>
        </div>
      </div>
    </div>
  );
}
