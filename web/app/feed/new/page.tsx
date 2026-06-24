'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button, Text, H1, FlexLayout, Spinner } from '@salt-ds/core';
import { getSong, getSongs, createPostMultipart, spotifySearch, type Song } from '@/services/api';
import styles from './new-post.module.css';

type SpotifyTrack = {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
  duration_ms: number;
  preview_url: string | null;
};

export default function NewPostPage() {
  return (
    <Suspense fallback={<FlexLayout justify="center" style={{ padding: '80px 0' }}><Spinner size="large" /></FlexLayout>}>
      <NewPostForm />
    </Suspense>
  );
}

function NewPostForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSongId = searchParams.get('song_id');

  // DB song selection
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [songSearch, setSongSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [searching, setSearching] = useState(false);

  // Spotify track selection
  const [searchMode, setSearchMode] = useState<'local' | 'spotify'>('local');
  const [selectedSpotifyTrack, setSelectedSpotifyTrack] = useState<SpotifyTrack | null>(null);
  const [spotifyResults, setSpotifyResults] = useState<SpotifyTrack[]>([]);
  const [spotifySearching, setSpotifySearching] = useState(false);

  const [postTitle, setPostTitle] = useState('');
  const [reasonForPick, setReasonForPick] = useState('');
  const [standoutLyric, setStandoutLyric] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Pre-select song if song_id is in query params
  useEffect(() => {
    if (preSongId) {
      getSong(Number(preSongId))
        .then(setSelectedSong)
        .catch(() => {});
    }
  }, [preSongId]);

  const handleSongSearch = useCallback(async (q: string) => {
    setSongSearch(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const data = await getSongs({ search: q });
      setSearchResults(data.results.slice(0, 8));
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSelectSong = (song: Song) => {
    setSelectedSong(song);
    setSongSearch('');
    setSearchResults([]);
  };

  const handleSpotifySearch = async () => {
    if (!songSearch.trim()) return;
    setSpotifySearching(true);
    try {
      const data = await spotifySearch(songSearch.trim(), 'track', 10);
      setSpotifyResults(data?.tracks?.items ?? []);
    } catch {
      setSpotifyResults([]);
    } finally {
      setSpotifySearching(false);
    }
  };

  const handleSelectSpotifyTrack = (track: SpotifyTrack) => {
    setSelectedSpotifyTrack(track);
    setSongSearch('');
    setSpotifyResults([]);
  };

  const handleClearSong = () => {
    setSelectedSong(null);
    setSelectedSpotifyTrack(null);
    setSongSearch('');
    setSearchResults([]);
    setSpotifyResults([]);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSong && !selectedSpotifyTrack) {
      setError('Please select a song.');
      return;
    }
    if (!postTitle.trim()) {
      setError('Please enter a post title.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();

      if (selectedSpotifyTrack) {
        formData.append('spotify_track_id', selectedSpotifyTrack.id);
        formData.append('song_title', selectedSpotifyTrack.name);
        formData.append('song_artist', selectedSpotifyTrack.artists.map((a) => a.name).join(', '));
        formData.append('song_album', selectedSpotifyTrack.album.name);
        const artUrl = selectedSpotifyTrack.album.images?.[0]?.url;
        if (artUrl) formData.append('album_cover', artUrl);
        if (selectedSpotifyTrack.preview_url) formData.append('preview_url', selectedSpotifyTrack.preview_url);
        formData.append('duration_ms', String(selectedSpotifyTrack.duration_ms));
      } else if (selectedSong) {
        formData.append('song_id', String(selectedSong.id));
      }

      formData.append('post_title', postTitle.trim());
      formData.append('reason_for_pick', reasonForPick.trim());
      formData.append('standout_lyric', standoutLyric.trim());
      if (imageFile) {
        formData.append('post_image', imageFile);
      }

      const post = await createPostMultipart(formData);
      router.push(`/feed/${post.id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create post.');
    } finally {
      setSubmitting(false);
    }
  };

  const hasSongSelected = selectedSong !== null || selectedSpotifyTrack !== null;

  const selectedArt = selectedSpotifyTrack
    ? selectedSpotifyTrack.album.images?.[0]?.url
    : selectedSong?.album_cover;
  const selectedTitle = selectedSpotifyTrack ? selectedSpotifyTrack.name : selectedSong?.title;
  const selectedArtist = selectedSpotifyTrack
    ? selectedSpotifyTrack.artists.map((a) => a.name).join(', ')
    : selectedSong?.artist;

  return (
    <div className={styles.page}>
      <div className="page-container">
        <Link href="/feed" className={styles.backLink}>
          ← Back to Feed
        </Link>

        <H1 className={styles.title}>New Song of the Day Post</H1>

        <form className={styles.formCard} onSubmit={handleSubmit}>
          {/* Song Selector */}
          <div className={styles.fieldGroup}>
            <Text className={styles.label}>Song *</Text>

            {hasSongSelected ? (
              <div className={styles.selectedSong}>
                {selectedArt && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={selectedArt} alt={selectedTitle} className={styles.songArt} />
                )}
                <div>
                  <Text className={styles.songName}>{selectedTitle}</Text>
                  <Text className={styles.songArtist}>{selectedArtist}</Text>
                  {selectedSpotifyTrack && (
                    <Text className={styles.spotifyBadge}>via Spotify</Text>
                  )}
                </div>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sonora-text-muted)', fontSize: '12px' }}
                  onClick={handleClearSong}
                >
                  Change
                </button>
              </div>
            ) : (
              <>
                {/* Search mode toggle */}
                <div className={styles.searchModeRow}>
                  <button
                    type="button"
                    className={`${styles.modeBtn} ${searchMode === 'local' ? styles.modeBtnActive : ''}`}
                    onClick={() => { setSearchMode('local'); setSongSearch(''); setSpotifyResults([]); }}
                  >
                    Sonora Library
                  </button>
                  <button
                    type="button"
                    className={`${styles.modeBtn} ${searchMode === 'spotify' ? styles.modeBtnActive : ''}`}
                    onClick={() => { setSearchMode('spotify'); setSongSearch(''); setSearchResults([]); }}
                  >
                    ♫ Search Spotify
                  </button>
                </div>

                {searchMode === 'local' ? (
                  <>
                    <input
                      type="text"
                      className={styles.input}
                      placeholder="Search for a song..."
                      value={songSearch}
                      onChange={(e) => handleSongSearch(e.target.value)}
                    />
                    {searching && <Text className={styles.searchHint}>Searching…</Text>}
                    {searchResults.length > 0 && (
                      <div className={styles.searchResults}>
                        {searchResults.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            className={styles.searchResultItem}
                            onClick={() => handleSelectSong(s)}
                          >
                            {s.album_cover && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={s.album_cover} alt={s.title} className={styles.searchArt} />
                            )}
                            <div>
                              <Text className={styles.searchTitle}>{s.title}</Text>
                              <Text className={styles.searchArtist}>{s.artist}</Text>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className={styles.spotifySearchRow}>
                      <input
                        type="text"
                        className={styles.input}
                        placeholder="Song name or artist…"
                        value={songSearch}
                        onChange={(e) => setSongSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSpotifySearch())}
                        style={{ flex: 1 }}
                      />
                      <Button
                        type="button"
                        variant="primary"
                        onClick={handleSpotifySearch}
                        loading={spotifySearching}
                        className={styles.spotifySearchBtn}
                      >
                        Search
                      </Button>
                    </div>
                    {spotifyResults.length > 0 && (
                      <div className={styles.searchResults}>
                        {spotifyResults.map((track) => {
                          const art = track.album.images?.[0]?.url;
                          return (
                            <button
                              key={track.id}
                              type="button"
                              className={styles.searchResultItem}
                              onClick={() => handleSelectSpotifyTrack(track)}
                            >
                              {art && (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={art} alt={track.name} className={styles.searchArt} />
                              )}
                              <div>
                                <Text className={styles.searchTitle}>{track.name}</Text>
                                <Text className={styles.searchArtist}>
                                  {track.artists.map((a) => a.name).join(', ')}
                                </Text>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>

          {/* Post Title */}
          <div className={styles.fieldGroup}>
            <Text className={styles.label}>Post Title *</Text>
            <input
              type="text"
              className={styles.input}
              placeholder="Give your post a title..."
              value={postTitle}
              onChange={(e) => setPostTitle(e.target.value)}
              maxLength={200}
              required
            />
          </div>

          {/* Reason for Pick */}
          <div className={styles.fieldGroup}>
            <Text className={styles.label}>Reason for Pick</Text>
            <textarea
              className={styles.textarea}
              placeholder="Why did you pick this song today?"
              value={reasonForPick}
              onChange={(e) => setReasonForPick(e.target.value)}
              rows={3}
            />
          </div>

          {/* Standout Lyric */}
          <div className={styles.fieldGroup}>
            <Text className={styles.label}>Standout Lyric</Text>
            <textarea
              className={styles.textarea}
              placeholder="Share a lyric that stands out..."
              value={standoutLyric}
              onChange={(e) => setStandoutLyric(e.target.value)}
              rows={2}
            />
          </div>

          {/* Post Image */}
          <div className={styles.fieldGroup}>
            <Text className={styles.label}>Post Image</Text>
            <input
              type="file"
              accept="image/*"
              className={styles.fileInput}
              onChange={handleImageChange}
            />
            <Text className={styles.fileHint}>Optional: Add a cover image for your post</Text>
            {imagePreview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imagePreview} alt="Preview" className={styles.imagePreview} />
            )}
          </div>

          {error && <Text className={styles.error}>{error}</Text>}

          <FlexLayout gap={2} align="center" className={styles.actions}>
            <Button
              type="submit"
              variant="primary"
              className={styles.submitBtn}
              loading={submitting}
              disabled={!hasSongSelected || !postTitle.trim()}
            >
              Post Song of the Day
            </Button>
            <Button
              type="button"
              variant="secondary"
              className={styles.cancelBtn}
              onClick={() => router.push('/feed')}
            >
              Cancel
            </Button>
          </FlexLayout>
        </form>
      </div>
    </div>
  );
}
