'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Button, Text, H1, H2, H3, StackLayout, FlexLayout, Spinner,
} from '@salt-ds/core';
import { getPlaylist, removeSongFromPlaylist, deletePlaylist, type Playlist } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayer } from '@/contexts/PlayerContext';
import ConfirmDialog from '@/components/ConfirmDialog';
import styles from './playlist.module.css';

export default function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { play } = usePlayer();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [removeSongId, setRemoveSongId] = useState<number | null>(null);
  const [removing, setRemoving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getPlaylist(Number(id))
      .then(setPlaylist)
      .catch(() => router.push('/playlists'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleRemove = async () => {
    if (removeSongId == null) return;
    setRemoving(true);
    await removeSongFromPlaylist(Number(id), removeSongId);
    setPlaylist((p) => p ? { ...p, songs: p.songs.filter((s) => s.id !== removeSongId) } : p);
    setRemoveSongId(null);
    setRemoving(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    await deletePlaylist(Number(id));
    setDeleting(false);
    setDeleteOpen(false);
    router.push('/playlists');
  };

  if (loading) return <FlexLayout justify="center" className={styles.spinner}><Spinner size="large" /></FlexLayout>;
  if (!playlist) return null;

  const isOwner = user?.id === playlist.user.id;

  return (
    <>
    <div className={styles.page}>
      <div className="page-container">
        {/* Header */}
        <div className={styles.header}>
          {playlist.playlist_cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={playlist.playlist_cover} alt={playlist.name} className={styles.cover} />
          ) : (
            <div className={styles.coverPlaceholder}>♬</div>
          )}
          <div className={styles.headerInfo}>
            <H1 className={styles.name}>{playlist.name}</H1>
            <Text styleAs="notation" className={styles.meta}>
              {playlist.visibility} · by {playlist.user.username} · {playlist.songs.length} songs
            </Text>
            {playlist.description && (
              <Text className={styles.desc}>{playlist.description}</Text>
            )}
            {isOwner && (
              <Button variant="secondary" onClick={() => setDeleteOpen(true)} className={styles.deleteBtn}>
                Delete Playlist
              </Button>
            )}
          </div>
        </div>

        {/* Songs */}
        <H3 className={styles.songsLabel}>Songs</H3>
        {playlist.songs.length === 0 ? (
          <StackLayout align="center" className={styles.empty}>
            <Text>No songs in this playlist yet.</Text>
          </StackLayout>
        ) : (
          <StackLayout gap={1} className={styles.songList}>
            {playlist.songs.map((song, i) => (
              <div key={song.id} className={styles.songRow}>
                <Text styleAs="notation" className={styles.songIndex}>{i + 1}</Text>
                {song.album_cover ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={song.album_cover} alt={song.title} className={styles.songArt} />
                ) : (
                  <div className={styles.songArtPlaceholder}>♪</div>
                )}
                <div className={styles.songInfo}>
                  <Text styleAs="label" className={styles.songTitle}>{song.title}</Text>
                  <Text styleAs="notation" className={styles.songArtist}>{song.artist}</Text>
                </div>
                <Text styleAs="notation" className={styles.songDuration}>{song.formatted_duration}</Text>
                <FlexLayout gap={1} align="center">
                  <Button variant="primary" onClick={() => play(song)} className={styles.playBtn}>
                    {song.preview_url ? '▶' : '♫'}
                  </Button>
                  {isOwner && (
                    <Button variant="secondary" onClick={() => setRemoveSongId(song.id)} className={styles.removeBtn}>
                      ✕
                    </Button>
                  )}
                </FlexLayout>
              </div>
            ))}
          </StackLayout>
        )}
      </div>
    </div>

    <ConfirmDialog

      open={removeSongId != null}
      title="Remove Song"
      message="Remove this song from the playlist?"
      confirmLabel="Remove"
      danger
      loading={removing}
      onConfirm={handleRemove}
      onClose={() => setRemoveSongId(null)}
    />

    <ConfirmDialog
      open={deleteOpen}
      title="Delete Playlist"
      message="Delete this playlist? This cannot be undone."
      confirmLabel="Delete"
      danger
      loading={deleting}
      onConfirm={handleDelete}
      onClose={() => setDeleteOpen(false)}
    />
    </>
  );
}
