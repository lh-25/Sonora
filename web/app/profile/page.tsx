'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Button, Text, H1, H2, H3, StackLayout, FlexLayout, Spinner, MultilineInput, FormField, FormFieldLabel,
} from '@salt-ds/core';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { spotifyStatus, spotifyDisconnect, uploadImage, updateProfile } from '@/services/api';
import { useRouter } from 'next/navigation';
import ConfirmDialog from '@/components/ConfirmDialog';
import styles from './profile.module.css';

export default function ProfilePage() {
  const { user, profile, logout, refreshProfile } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [loadingSpotify, setLoadingSpotify] = useState(true);
  const [editing, setEditing] = useState(false);
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    spotifyStatus()
      .then((s) => setSpotifyConnected(s.connected))
      .finally(() => setLoadingSpotify(false));
  }, []);

  useEffect(() => {
    if (profile) setBio(profile.bio ?? '');
  }, [profile]);

  const handleSpotifyConnect = async () => {
    if (!user) { router.push('/login'); return; }
    try {
      const { request } = await import('@/services/api');
      const data = await request<{ url: string }>('/spotify/web-auth-url/');
      window.location.href = data.url;
    } catch {
      toast.error('Could not start Spotify connection. Make sure the backend is running.');
    }
  };

  const handleDisconnect = async () => {
    setConfirmDisconnect(false);
    try {
      await spotifyDisconnect();
      setSpotifyConnected(false);
      toast.success('Spotify disconnected');
    } catch {
      toast.error('Could not disconnect Spotify — please try again.');
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await updateProfile(user!.id, { bio });
      await refreshProfile();
      setEditing(false);
      toast.success('Profile saved');
    } catch {
      toast.error('Could not save profile — please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handlePicChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPic(true);
    try {
      const { url } = await uploadImage(file, 'profile_pictures');
      await updateProfile(user!.id, { profile_picture: url });
      await refreshProfile();
      toast.success('Profile photo updated');
    } catch {
      toast.error('Could not upload photo — please try again.');
    } finally {
      setUploadingPic(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const doLogout = () => {
    setConfirmLogout(false);
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
          <div className={styles.avatarWrapper}>
            {profile.profile_picture ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.profile_picture} alt={user.username} className={styles.avatar} />
            ) : (
              <div className={styles.avatarPlaceholder}>
                <Text className={styles.avatarInitial}>{user.username[0].toUpperCase()}</Text>
              </div>
            )}
            <button className={styles.avatarUploadBtn} onClick={() => fileRef.current?.click()} disabled={uploadingPic}>
              {uploadingPic ? '…' : '📷'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePicChange} />
          </div>

          <div className={styles.profileInfo}>
            <H2 className={styles.username}>@{user.username}</H2>
            {user.email && <Text styleAs="notation" className={styles.email}>{user.email}</Text>}
            {!editing && <Text className={styles.bio}>{profile.bio || <span className={styles.noBio}>No bio yet</span>}</Text>}
            {!editing && (
              <button className={styles.editLink} onClick={() => setEditing(true)}>Edit profile</button>
            )}
          </div>
        </div>

        {/* Edit form */}
        {editing && (
          <div className={styles.editCard}>
            <H3 className={styles.sectionTitle}>Edit Profile</H3>
            <StackLayout gap={2}>
              <FormField>
                <FormFieldLabel>Bio</FormFieldLabel>
                <MultilineInput
                  value={bio}
                  onChange={(e) => setBio((e.target as HTMLTextAreaElement).value)}
                  placeholder="Tell people about yourself…"
                  rows={3}
                />
              </FormField>
              <FlexLayout gap={1}>
                <Button variant="primary" onClick={handleSaveProfile} loading={saving}>Save</Button>
                <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
              </FlexLayout>
            </StackLayout>
          </div>
        )}

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <Text className={styles.statValue}>{profile.total_followers}</Text>
            <Text styleAs="notation" className={styles.statLabel}>Followers</Text>
          </div>
          <div className={styles.statCard}>
            <Text className={styles.statValue}>{profile.total_following}</Text>
            <Text styleAs="notation" className={styles.statLabel}>Following</Text>
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
              <Text styleAs="notation" className={styles.hint}>
                You can now import Spotify playlists and link songs to Spotify tracks.
              </Text>
              <Button variant="secondary" onClick={() => setConfirmDisconnect(true)} className={styles.disconnectBtn}>
                Disconnect Spotify
              </Button>
            </StackLayout>
          ) : (
            <StackLayout gap={2}>
              <Text styleAs="notation" className={styles.hint}>
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
          <Button variant="secondary" onClick={() => setConfirmLogout(true)} className={styles.logoutBtn}>
            Log Out
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDisconnect}
        title="Disconnect Spotify"
        message="This will remove your Spotify connection. You can reconnect anytime."
        confirmLabel="Disconnect"
        danger
        onConfirm={handleDisconnect}
        onClose={() => setConfirmDisconnect(false)}
      />

      <ConfirmDialog
        open={confirmLogout}
        title="Log Out"
        message="Are you sure you want to log out of Sonora?"
        confirmLabel="Log Out"
        onConfirm={doLogout}
        onClose={() => setConfirmLogout(false)}
      />
    </div>
  );
}
