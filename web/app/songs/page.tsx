'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Button, Input, Text, H1, H3, StackLayout, FlexLayout,
  Spinner, Pill, FormField, FormFieldLabel, Dialog, DialogHeader,
  DialogContent, DialogActions, MultilineInput,
} from '@salt-ds/core';
import { getSongs, spotifySearch, linkSpotifyTrack, createSong, uploadImage, type Song } from '@/services/api';
import { usePlayer } from '@/contexts/PlayerContext';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'next/navigation';
import styles from './songs.module.css';

const GENRES = ['', 'POP', 'ROCK', 'RAP', 'JAZZ', 'CLASSICAL', 'RNB', 'COUNTRY', 'ELECTRONIC', 'OTHER'];

export default function SongsPage() {
  const { play } = usePlayer();
  const { isAuthenticated } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Spotify search
  const [spotifyQuery, setSpotifyQuery] = useState('');
  const [spotifyResults, setSpotifyResults] = useState<any[]>([]);
  const [spotifyLoading, setSpotifyLoading] = useState(false);
  const [spotifyError, setSpotifyError] = useState('');

  // Link-to-song dialog
  const [linkTrack, setLinkTrack] = useState<any | null>(null);
  const [linkSongId, setLinkSongId] = useState('');
  const [linking, setLinking] = useState(false);

  // Add song dialog
  const [addOpen, setAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newAlbum, setNewAlbum] = useState('');
  const [newGenre, setNewGenre] = useState('POP');
  const [newCoverUrl, setNewCoverUrl] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [addingSong, setAddingSong] = useState(false);
  const coverRef = useRef<HTMLInputElement>(null);

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSongs = useCallback(async (p: number, s: string, g: string, reset: boolean) => {
    const data = await getSongs({ search: s, genre: g, page: p });
    setSongs((prev) => (reset ? data.results : [...prev, ...data.results]));
    setHasMore(!!data.next);
    setPage(p);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchSongs(1, search, genre, true).finally(() => setLoading(false));
  }, [genre, fetchSongs]);

  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => fetchSongs(1, search, genre, true), 400);
    return () => { if (debounce.current) clearTimeout(debounce.current); };
  }, [search]);

  const handleSpotifySearch = async () => {
    if (!isAuthenticated) { router.push('/login'); return; }
    if (!spotifyQuery.trim()) return;
    setSpotifyLoading(true);
    setSpotifyError('');
    try {
      const data = await spotifySearch(spotifyQuery);
      const items = data?.tracks?.items ?? [];
      setSpotifyResults(items);
      if (items.length === 0) setSpotifyError('No results found.');
    } catch (err: any) {
      setSpotifyResults([]);
      // The backend returns a JSON body like {"error": "..."}; surface it.
      let msg = 'Spotify search failed. Please try again.';
      try {
        const parsed = JSON.parse(err.message);
        if (parsed?.error) msg = parsed.error;
      } catch {
        if (err.message?.includes('Spotify not configured')) {
          msg = 'Spotify search is not configured on the server. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET.';
        }
      }
      setSpotifyError(msg);
    } finally {
      setSpotifyLoading(false);
    }
  };

  const openLink = (track: any) => {
    if (!isAuthenticated) { router.push('/login'); return; }
    setLinkTrack(track);
    setLinkSongId('');
  };

  const confirmLink = async () => {
    const song = songs.find((s) => s.id === Number(linkSongId));
    if (!song || !linkTrack) return;
    setLinking(true);
    try {
      const updated = await linkSpotifyTrack(song.id, linkTrack.id, linkTrack.preview_url);
      setSongs((prev) => prev.map((s) => s.id === updated.id ? updated : s));
      toast.success(`"${linkTrack.name}" linked to ${song.title}`);
      setLinkTrack(null);
      setLinkSongId('');
    } catch {
      toast.error('Could not link track — please try again.');
    } finally {
      setLinking(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const { url } = await uploadImage(file, 'album_covers');
      setNewCoverUrl(url);
    } catch {
      toast.error('Could not upload cover image.');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleAddSong = async () => {
    if (!newTitle.trim() || !newArtist.trim()) return;
    setAddingSong(true);
    try {
      const song = await createSong({
        title: newTitle.trim(),
        artist: newArtist.trim(),
        album: newAlbum.trim() || undefined,
        genre: newGenre,
        album_cover: newCoverUrl || undefined,
      });
      setSongs((prev) => [song, ...prev]);
      toast.success(`"${newTitle.trim()}" added to your library`);
      setAddOpen(false);
      setNewTitle(''); setNewArtist(''); setNewAlbum(''); setNewGenre('POP'); setNewCoverUrl('');
    } catch {
      toast.error('Could not add song — please try again.');
    } finally {
      setAddingSong(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className="page-container">
        <FlexLayout justify="space-between" align="center" className={styles.header}>
          <H1 className={styles.title}>Songs</H1>
          <Button variant="primary" onClick={() => setAddOpen(true)} className={styles.addBtn}>+ Add Song</Button>
        </FlexLayout>

        {/* Search + Genre filter */}
        <div className={styles.filters}>
          <Input
            value={search}
            onChange={(e) => setSearch((e.target as HTMLInputElement).value)}
            placeholder="Search songs, artists, albums…"
            className={styles.searchInput}
          />
          <FlexLayout gap={1} wrap className={styles.genres}>
            {GENRES.map((g) => (
              <Pill
                key={g || 'all'}
                onClick={() => setGenre(g)}
                className={`${styles.pill} ${genre === g ? styles.pillActive : ''}`}
              >{g || 'All'}</Pill>
            ))}
          </FlexLayout>
        </div>

        {/* Spotify search panel */}
        <div className={styles.spotifyPanel}>
          <Text styleAs="label" className={styles.spotifyLabel}>Search Spotify Catalog</Text>
          <FlexLayout gap={1} align="center">
            <Input
              value={spotifyQuery}
              onChange={(e) => setSpotifyQuery((e.target as HTMLInputElement).value)}
              placeholder="Find a track on Spotify…"
              onKeyDown={(e) => e.key === 'Enter' && handleSpotifySearch()}
              className={styles.spotifyInput}
            />
            <Button variant="secondary" onClick={handleSpotifySearch} loading={spotifyLoading}>
              Search Spotify
            </Button>
          </FlexLayout>

          {spotifyError && (
            <Text styleAs="notation" style={{ color: '#ff4040', marginTop: 8 }}>{spotifyError}</Text>
          )}

          {spotifyResults.length > 0 && (
            <div className={styles.spotifyResults}>
              {spotifyResults.map((track) => (
                <div key={track.id} className={styles.spotifyTrack}>
                  {track.album?.images?.[0]?.url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={track.album.images[0].url} alt={track.name} className={styles.spotifyArt} />
                  )}
                  <div className={styles.spotifyInfo}>
                    <Text styleAs="label" className={styles.spotifyName}>{track.name}</Text>
                    <Text styleAs="notation" className={styles.spotifyArtist}>
                      {track.artists?.map((a: any) => a.name).join(', ')}
                    </Text>
                  </div>
                  <FlexLayout gap={1} align="center">
                    {track.preview_url && (
                      <Button variant="secondary" onClick={() => play({
                        id: -1, title: track.name,
                        artist: track.artists?.map((a: any) => a.name).join(', '),
                        album: track.album?.name ?? null, genre: 'OTHER',
                        release_date: null, duration: '', formatted_duration: '',
                        album_cover: track.album?.images?.[0]?.url ?? null,
                        spotify_track_id: track.id, preview_url: track.preview_url,
                      })}>
                        Preview
                      </Button>
                    )}
                    <Button variant="secondary" onClick={() => openLink(track)}>
                      Link
                    </Button>
                  </FlexLayout>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Song library */}
        {loading ? (
          <FlexLayout justify="center" className={styles.spinner}>
            <Spinner size="large" />
          </FlexLayout>
        ) : songs.length === 0 ? (
          <StackLayout align="center" className={styles.empty}>
            <H3>No songs found</H3>
          </StackLayout>
        ) : (
          <>
            <div className={styles.songGrid}>
              {songs.map((song) => (
                <SongCard key={song.id} song={song} onPlay={play} />
              ))}
            </div>
            {hasMore && (
              <FlexLayout justify="center" className={styles.loadMore}>
                <Button variant="secondary" onClick={() => fetchSongs(page + 1, search, genre, false)}>
                  Load more
                </Button>
              </FlexLayout>
            )}
          </>
        )}
      </div>

      {/* Add Song Dialog */}
      <Dialog open={addOpen} onOpenChange={(open) => setAddOpen(open)}>
        <DialogHeader header="Add a New Song" />
        <DialogContent>
          <StackLayout gap={2}>
            <FormField>
              <FormFieldLabel>Title *</FormFieldLabel>
              <Input value={newTitle} onChange={(e) => setNewTitle((e.target as HTMLInputElement).value)} placeholder="Song title" />
            </FormField>
            <FormField>
              <FormFieldLabel>Artist *</FormFieldLabel>
              <Input value={newArtist} onChange={(e) => setNewArtist((e.target as HTMLInputElement).value)} placeholder="Artist name" />
            </FormField>
            <FormField>
              <FormFieldLabel>Album</FormFieldLabel>
              <Input value={newAlbum} onChange={(e) => setNewAlbum((e.target as HTMLInputElement).value)} placeholder="Album (optional)" />
            </FormField>
            <FormField>
              <FormFieldLabel>Genre</FormFieldLabel>
              <select
                value={newGenre}
                onChange={(e) => setNewGenre(e.target.value)}
                className={styles.genreSelect}
              >
                {GENRES.filter(Boolean).map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </FormField>
            <FormField>
              <FormFieldLabel>Album Cover</FormFieldLabel>
              <FlexLayout gap={1} align="center">
                {newCoverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={newCoverUrl} alt="cover" className={styles.coverPreview} />
                )}
                <Button variant="secondary" onClick={() => coverRef.current?.click()} loading={uploadingCover}>
                  {newCoverUrl ? 'Change Image' : 'Upload Image'}
                </Button>
                <input ref={coverRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverUpload} />
              </FlexLayout>
            </FormField>
          </StackLayout>
        </DialogContent>
        <DialogActions>
          <Button variant="secondary" onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={handleAddSong} loading={addingSong} disabled={!newTitle.trim() || !newArtist.trim()}>
            Add Song
          </Button>
        </DialogActions>
      </Dialog>

      {/* Link-to-song Dialog */}
      <Dialog open={!!linkTrack} onOpenChange={(open) => { if (!open) setLinkTrack(null); }}>
        <DialogHeader header="Link to a Song" />
        <DialogContent>
          {linkTrack && (
            <StackLayout gap={2}>
              <div className={styles.linkPreview}>
                {linkTrack.album?.images?.[0]?.url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={linkTrack.album.images[0].url} alt={linkTrack.name} className={styles.linkArt} />
                )}
                <div className={styles.linkInfo}>
                  <Text styleAs="label" className={styles.linkName}>{linkTrack.name}</Text>
                  <Text styleAs="notation" className={styles.linkArtist}>
                    {linkTrack.artists?.map((a: any) => a.name).join(', ')}
                  </Text>
                </div>
              </div>
              <FormField>
                <FormFieldLabel>Choose one of your songs to link this track to</FormFieldLabel>
                <select
                  value={linkSongId}
                  onChange={(e) => setLinkSongId(e.target.value)}
                  className={styles.genreSelect}
                >
                  <option value="">Select a song…</option>
                  {songs.filter((s) => s.id > 0).map((s) => (
                    <option key={s.id} value={s.id}>{s.title} — {s.artist}</option>
                  ))}
                </select>
              </FormField>
            </StackLayout>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="secondary" onClick={() => setLinkTrack(null)}>Cancel</Button>
          <Button variant="primary" onClick={confirmLink} loading={linking} disabled={!linkSongId}>
            Link
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

function SongCard({ song, onPlay }: { song: Song; onPlay: (s: Song) => void }) {
  return (
    <div className={styles.songCard}>
      {song.album_cover ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={song.album_cover} alt={song.album ?? song.title} className={styles.songArt} />
      ) : (
        <div className={styles.songArtPlaceholder}>♪</div>
      )}
      <div className={styles.songInfo}>
        <Text styleAs="label" className={styles.songTitle}>{song.title}</Text>
        <Text styleAs="notation" className={styles.songArtist}>{song.artist}</Text>
        <FlexLayout gap={1} align="center" className={styles.songMeta}>
          <span className="sonora-tag">{song.genre}</span>
          <Text styleAs="notation" className={styles.duration}>{song.formatted_duration}</Text>
          {song.id > 0 && <Text styleAs="notation" className={styles.songId}>ID: {song.id}</Text>}
        </FlexLayout>
      </div>
      <FlexLayout gap={1} align="center" className={styles.songActions}>
        {song.spotify_track_id && (
          <div className={styles.spotifyDot} title="Linked to Spotify">●</div>
        )}
        <Button variant="primary" onClick={() => onPlay(song)} className={styles.playBtn}>
          {song.preview_url ? '▶' : '♫'}
        </Button>
      </FlexLayout>
    </div>
  );
}
