'use client';

import { usePlayer } from '@/contexts/PlayerContext';
import styles from './MusicPlayer.module.css';

export default function MusicPlayer() {
  const { currentSong, stop } = usePlayer();

  if (!currentSong) return null;

  // Prefer the official Spotify embed — it plays full tracks for logged-in
  // Spotify users (and a preview otherwise), entirely inside the app.
  const hasSpotify = !!currentSong.spotify_track_id;

  return (
    <div className={styles.player}>
      <div className={styles.bar}>
        {hasSpotify ? (
          <iframe
            title={`Spotify player: ${currentSong.title}`}
            className={styles.embed}
            src={`https://open.spotify.com/embed/track/${currentSong.spotify_track_id}?utm_source=sonora&theme=0`}
            width="100%"
            height="80"
            frameBorder="0"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            loading="lazy"
          />
        ) : (
          <div className={styles.fallback}>
            {currentSong.album_cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentSong.album_cover} alt="Album art" className={styles.art} />
            ) : (
              <div className={styles.artPlaceholder}>♪</div>
            )}
            <div className={styles.info}>
              <span className={styles.title}>{currentSong.title}</span>
              <span className={styles.artist}>{currentSong.artist}</span>
            </div>
            <span className={styles.noPreview}>
              Not on Spotify — no playback available
            </span>
          </div>
        )}

        <button onClick={stop} className={styles.closeBtn} aria-label="Close player">
          ✕
        </button>
      </div>
    </div>
  );
}
