'use client';

import { Button, Text, FlexLayout, LinearProgress } from '@salt-ds/core';
import { usePlayer } from '@/contexts/PlayerContext';
import styles from './MusicPlayer.module.css';

export default function MusicPlayer() {
  const { currentSong, isPlaying, position, duration, pause, resume, stop, openOnSpotify } = usePlayer();

  if (!currentSong) return null;

  const progress = duration > 0 ? (position / duration) * 100 : 0;

  return (
    <div className={styles.player}>
      <LinearProgress value={progress} className={styles.progress} />
      <div className={styles.content}>
        {currentSong.album_cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={currentSong.album_cover} alt="Album art" className={styles.art} />
        ) : (
          <div className={styles.artPlaceholder}>♪</div>
        )}

        <div className={styles.info}>
          <Text styleAs="label" className={styles.title}>{currentSong.title}</Text>
          <Text styleAs="help" className={styles.artist}>{currentSong.artist}</Text>
        </div>

        <FlexLayout gap={1} align="center">
          {currentSong.preview_url && (
            <Button
              variant="primary"
              onClick={isPlaying ? pause : resume}
              className={styles.playBtn}
            >
              {isPlaying ? '⏸' : '▶'}
            </Button>
          )}

          {currentSong.spotify_track_id && (
            <Button variant="secondary" onClick={openOnSpotify} className={styles.spotifyBtn}>
              Open Spotify ↗
            </Button>
          )}

          <Button variant="secondary" onClick={stop} className={styles.closeBtn}>
            ✕
          </Button>
        </FlexLayout>
      </div>

      {!currentSong.preview_url && (
        <Text styleAs="help" className={styles.noPreview}>
          No preview — open in Spotify for full playback
        </Text>
      )}
    </div>
  );
}
