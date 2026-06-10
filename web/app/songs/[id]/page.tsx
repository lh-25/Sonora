'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button, Text, H1, FlexLayout, Spinner, StackLayout } from '@salt-ds/core';
import {
  getSong,
  getPlaylists,
  addSongToPlaylist,
  type Song,
  type Playlist,
} from '@/services/api';
import { usePlayer } from '@/contexts/PlayerContext';
import styles from './song.module.css';

export default function SongDetailPage() {
  const params = useParams();
  const songId = Number(params.id);
  const { play } = usePlayer();

  const [song, setSong] = useState<Song | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [addingToPlaylist, setAddingToPlaylist] = useState(false);
  const [addFeedback, setAddFeedback] = useState('');
  const [addFeedbackIsError, setAddFeedbackIsError] = useState(false);

  useEffect(() => {
    if (!songId) return;
    setLoading(true);
    Promise.all([getSong(songId), getPlaylists('mine')])
      .then(([songData, playlistsData]) => {
        setSong(songData);
        setPlaylists(playlistsData.results);
        if (playlistsData.results.length > 0) {
          setSelectedPlaylistId(String(playlistsData.results[0].id));
        }
      })
      .catch(() => setError('Could not load song.'))
      .finally(() => setLoading(false));
  }, [songId]);

  const handleAddToPlaylist = async () => {
    if (!selectedPlaylistId || !song) return;
    setAddingToPlaylist(true);
    setAddFeedback('');
    try {
      await addSongToPlaylist(Number(selectedPlaylistId), song.id);
      setAddFeedback('Song added to playlist!');
      setAddFeedbackIsError(false);
    } catch (err: any) {
      setAddFeedback(err.message || 'Failed to add song.');
      setAddFeedbackIsError(true);
    } finally {
      setAddingToPlaylist(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className="page-container">
          <FlexLayout justify="center" className={styles.spinner}>
            <Spinner size="large" />
          </FlexLayout>
        </div>
      </div>
    );
  }

  if (error || !song) {
    return (
      <div className={styles.page}>
        <div className="page-container">
          <Text className={styles.error}>{error || 'Song not found.'}</Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="page-container">
        <Link href="/songs" className={styles.backLink}>
          ← Back to Songs
        </Link>

        {/* Song Header */}
        <div className={styles.songHeader}>
          {song.album_cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={song.album_cover} alt={song.title} className={styles.albumCover} />
          ) : (
            <div className={styles.albumCoverPlaceholder}>♪</div>
          )}

          <div className={styles.songInfo}>
            <H1 className={styles.songTitle}>{song.title}</H1>
            <Text className={styles.artist}>{song.artist}</Text>

            <div className={styles.metaGrid}>
              {song.album && (
                <div className={styles.metaRow}>
                  <Text className={styles.metaLabel}>Album</Text>
                  <Text className={styles.metaValue}>{song.album}</Text>
                </div>
              )}
              {song.genre && (
                <div className={styles.metaRow}>
                  <Text className={styles.metaLabel}>Genre</Text>
                  <Text className={styles.metaValue}>{song.genre}</Text>
                </div>
              )}
              {song.formatted_duration && (
                <div className={styles.metaRow}>
                  <Text className={styles.metaLabel}>Duration</Text>
                  <Text className={styles.metaValue}>{song.formatted_duration}</Text>
                </div>
              )}
              {song.release_date && (
                <div className={styles.metaRow}>
                  <Text className={styles.metaLabel}>Released</Text>
                  <Text className={styles.metaValue}>
                    {new Date(song.release_date).toLocaleDateString()}
                  </Text>
                </div>
              )}
            </div>

            <StackLayout gap={1} style={{ marginTop: '12px' }}>
              {song.preview_url && (
                <Button
                  variant="primary"
                  className={styles.previewBtn}
                  onClick={() => play(song)}
                >
                  ▶ Play Preview
                </Button>
              )}

              <Link
                href={`/feed/new?song_id=${song.id}`}
                className={styles.postBtn}
              >
                ♪ Make Song of the Day Post
              </Link>
            </StackLayout>
          </div>
        </div>

        {/* Add to Playlist */}
        {playlists.length > 0 && (
          <div className={styles.card}>
            <Text className={styles.cardTitle}>Add to Playlist</Text>
            <select
              className={styles.select}
              value={selectedPlaylistId}
              onChange={(e) => setSelectedPlaylistId(e.target.value)}
            >
              {playlists.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.name} ({pl.song_count} songs)
                </option>
              ))}
            </select>
            <Button
              variant="primary"
              className={styles.addBtn}
              onClick={handleAddToPlaylist}
              loading={addingToPlaylist}
              disabled={!selectedPlaylistId}
            >
              Add to Playlist
            </Button>
            {addFeedback && (
              <Text
                className={`${styles.feedbackMsg} ${addFeedbackIsError ? styles.feedbackError : styles.feedbackSuccess}`}
              >
                {addFeedback}
              </Text>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
