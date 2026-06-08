'use client';

import React, { createContext, useContext, useRef, useState } from 'react';
import type { Song } from '@/services/api';

type PlayerState = {
  currentSong: Song | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  play: (song: Song) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  openOnSpotify: () => void;
};

const PlayerContext = createContext<PlayerState | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current = null;
    }
    setIsPlaying(false);
    setPosition(0);
    setDuration(0);
    setCurrentSong(null);
  };

  const play = (song: Song) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setCurrentSong(song);
    setPosition(0);

    if (!song.preview_url) return;

    const audio = new Audio(song.preview_url);
    audioRef.current = audio;
    audio.play().then(() => setIsPlaying(true)).catch(() => {});

    audio.addEventListener('timeupdate', () => {
      setPosition(audio.currentTime * 1000);
      setDuration(audio.duration * 1000);
    });
    audio.addEventListener('ended', () => setIsPlaying(false));
    audio.addEventListener('loadedmetadata', () => setDuration(audio.duration * 1000));
  };

  const pause = () => {
    audioRef.current?.pause();
    setIsPlaying(false);
  };

  const resume = () => {
    audioRef.current?.play().then(() => setIsPlaying(true)).catch(() => {});
  };

  const openOnSpotify = () => {
    if (!currentSong?.spotify_track_id) return;
    window.open(`https://open.spotify.com/track/${currentSong.spotify_track_id}`, '_blank');
  };

  return (
    <PlayerContext.Provider value={{ currentSong, isPlaying, position, duration, play, pause, resume, stop, openOnSpotify }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}
