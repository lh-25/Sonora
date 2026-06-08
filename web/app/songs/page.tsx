'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Button, Input, Text, H1, H3, StackLayout, FlexLayout,
  Spinner, Pill,
} from '@salt-ds/core';
import { getSongs, spotifySearch, linkSpotifyTrack, type Song } from '@/services/api';
import { usePlayer } from '@/contexts/PlayerContext';
import styles from './songs.module.css';

const GENRES = ['', 'POP', 'ROCK', 'RAP', 'JAZZ', 'CLASSICAL', 'RNB', 'COUNTRY', 'ELECTRONIC', 'OTHER'];

export default function SongsPage() {
  const { play } = usePlayer();
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
    if (!spotifyQuery.trim()) return;
    setSpotifyLoading(true);
    try {
      const data = await spotifySearch(spotifyQuery);
      setSpotifyResults(data?.tracks?.items ?? []);
    } catch {
      setSpotifyResults([]);
    } finally {
      setSpotifyLoading(false);
    }
  };

  const handleLinkTrack = async (song: Song, spotifyTrack: any) => {
    try {
      const updated = await linkSpotifyTrack(song.id, spotifyTrack.id, spotifyTrack.preview_url);
      setSongs((prev) => prev.map((s) => s.id === updated.id ? updated : s));
      alert(`"${song.title}" linked to Spotify!`);
    } catch {
      alert('Could not link — try again.');
    }
  };

  return (
    <div className={styles.page}>
      <div className="page-container">
        <H1 className={styles.title}>Songs</H1>

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
                    <Button
                      variant="secondary"
                      onClick={() => {
                        const target = prompt('Enter song ID to link (from the library below):');
                        if (!target) return;
                        const song = songs.find((s) => s.id === Number(target));
                        if (song) handleLinkTrack(song, track);
                        else alert('Song not found — check the ID.');
                      }}
                    >
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
