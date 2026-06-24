'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Button, Text, H1, H3, StackLayout, FlexLayout, Spinner, Input,
} from '@salt-ds/core';
import {
  getPlaylist, spotifySearch, addSpotifyTrackToPlaylist,
  removeSongFromPlaylist, deletePlaylist, type Playlist, type Song,
} from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayer } from '@/contexts/PlayerContext';
import ConfirmDialog from '@/components/ConfirmDialog';
import styles from './playlist.module.css';

type SpotifyTrack = {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
  duration_ms: number;
  preview_url: string | null;
};

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

  // Add song via Spotify
  const [addOpen, setAddOpen] = useState(false);
  const [trackQuery, setTrackQuery] = useState('');
  const [trackResults, setTrackResults] = useState<SpotifyTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

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

  const handleSearch = async () => {
    if (!trackQuery.trim()) return;
    setSearching(true);
    try {
      const data = await spotifySearch(trackQuery.trim(), 'track', 10);
      setTrackResults(data?.tracks?.items ?? []);
    } catch {
      setTrackResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleAddTrack = async (track: SpotifyTrack) => {
    if (!playlist) return;
    setAdding(track.id);
    try {
      const result = await addSpotifyTrackToPlaylist(Number(id), {
        id: track.id,
        name: track.name,
        artists: track.artists.map((a) => a.name).join(', '),
        album: track.album.name,
        album_cover: track.album.images?.[0]?.url ?? null,
        preview_url: track.preview_url,
        duration_ms: track.duration_ms,
      });
      setPlaylist((p) => p ? {
        ...p,
        songs: [...p.songs, {
          id: result.song_id,
          title: track.name,
          artist: track.artists.map((a) => a.name).join(', '),
          album: track.album.name,
          album_cover: track.album.images?.[0]?.url ?? null,
          preview_url: track.preview_url,
          spotify_track_id: track.id,
          genre: '',
          release_date: null,
          duration: '',
          formatted_duration: '',
        } as unknown as Song],
      } : p);
      setTrackResults((prev) => prev); // keep results open so more can be added
    } catch {
      // song likely already in playlist — show feedback via border flash (handled by alreadyAdded check)
    } finally {
      setAdding(null);
    }
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
                <FlexLayout gap={1} style={{ marginTop: 12 }}>
                  <Button variant="primary" onClick={() => setAddOpen((v) => !v)} className={styles.addBtn}>
                    {addOpen ? '− Close search' : '+ Add Song'}
                  </Button>
                  <Button variant="secondary" onClick={() => setDeleteOpen(true)} className={styles.deleteBtn}>
                    Delete Playlist
                  </Button>
                </FlexLayout>
              )}
            </div>
          </div>

          {/* Add Song via Spotify */}
          {isOwner && addOpen && (
            <div className={styles.addPanel}>
              <Text styleAs="label" className={styles.addPanelLabel}>Search Spotify to add songs</Text>
              <FlexLayout gap={1} align="center" className={styles.addSearchRow}>
                <Input
                  className={styles.addSearchInput}
                  value={trackQuery}
                  onChange={(e) => setTrackQuery((e.target as HTMLInputElement).value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Song name or artist…"
                />
                <Button variant="primary" onClick={handleSearch} loading={searching}>
                  Search
                </Button>
              </FlexLayout>
              {trackResults.length > 0 && (
                <div className={styles.addResults}>
                  {trackResults.map((track) => {
                    const art = track.album.images?.[0]?.url;
                    const isAdding = adding === track.id;
                    const alreadyAdded = playlist.songs.some((s) => s.spotify_track_id === track.id);
                    return (
                      <div key={track.id} className={`${styles.addTrackRow} ${alreadyAdded ? styles.addTrackAdded : ''}`}>
                        {art ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={art} alt={track.name} className={styles.addTrackArt} />
                        ) : (
                          <div className={`${styles.addTrackArt} ${styles.addTrackArtPlaceholder}`}>♪</div>
                        )}
                        <div className={styles.addTrackInfo}>
                          <Text styleAs="label" className={styles.addTrackName}>{track.name}</Text>
                          <Text styleAs="notation" className={styles.addTrackArtist}>
                            {track.artists.map((a) => a.name).join(', ')}
                          </Text>
                        </div>
                        <Button
                          variant={alreadyAdded ? 'secondary' : 'primary'}
                          onClick={() => !alreadyAdded && handleAddTrack(track)}
                          loading={isAdding}
                          disabled={alreadyAdded}
                          className={styles.addTrackBtn}
                        >
                          {alreadyAdded ? '✓ Added' : '+ Add'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Songs */}
          <H3 className={styles.songsLabel}>Songs</H3>
          {playlist.songs.length === 0 ? (
            <StackLayout align="center" className={styles.empty}>
              <Text>No songs in this playlist yet.</Text>
              {isOwner && (
                <Button variant="primary" onClick={() => setAddOpen(true)} className={styles.addBtn}>
                  + Add Song
                </Button>
              )}
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
