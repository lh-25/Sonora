import React, { createContext, useContext, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { Audio } from 'expo-av';
import type { Song } from '@/services/api';
import { openInSpotify } from '@/services/spotify';

type PlayerState = {
  currentSong: Song | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  play: (song: Song) => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  stop: () => Promise<void>;
  openOnSpotify: () => void;
};

const PlayerContext = createContext<PlayerState | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const soundRef = useRef<Audio.Sound | null>(null);

  const unloadCurrent = async () => {
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setIsPlaying(false);
    setPosition(0);
    setDuration(0);
  };

  const play = async (song: Song) => {
    await unloadCurrent();
    setCurrentSong(song);

    if (!song.preview_url) {
      if (song.spotify_track_id) {
        Alert.alert(
          'No preview available',
          'This track doesn\'t have a 30-second preview. Open it in Spotify to listen?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Spotify', onPress: () => openInSpotify(song.spotify_track_id!) },
          ],
        );
      } else {
        Alert.alert('No preview', 'This song isn\'t linked to Spotify yet. Link it to enable playback.');
      }
      return;
    }

    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

      const { sound } = await Audio.Sound.createAsync(
        { uri: song.preview_url },
        { shouldPlay: true },
      );
      soundRef.current = sound;
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate((s) => {
        if (s.isLoaded) {
          setPosition(s.positionMillis ?? 0);
          setDuration(s.durationMillis ?? 0);
          setIsPlaying(s.isPlaying);
          if (s.didJustFinish) setIsPlaying(false);
        }
      });
    } catch (err) {
      setCurrentSong(null);
      Alert.alert('Playback error', 'Could not play this track. Try again.');
    }
  };

  const pause = async () => {
    await soundRef.current?.pauseAsync();
    setIsPlaying(false);
  };

  const resume = async () => {
    await soundRef.current?.playAsync();
    setIsPlaying(true);
  };

  const stop = async () => {
    await unloadCurrent();
    setCurrentSong(null);
  };

  const openOnSpotify = () => {
    if (currentSong?.spotify_track_id) {
      openInSpotify(currentSong.spotify_track_id);
    }
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
