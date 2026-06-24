import React, { createContext, useContext, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { Audio } from 'expo-av';
import type { Song } from '@/services/api';
import { getSpotifyUserToken } from '@/services/api';
import { openInSpotify } from '@/services/spotify';

// react-native-spotify-remote is a native module — it won't exist in Expo Go.
// We import it lazily so the app still loads in development without a native build.
let SpotifyRemote: any = null;
try {
  const { NativeModules } = require('react-native');
  const mod = require('react-native-spotify-remote');
  // Try named export first, then default, then fall back to the raw native module
  const candidate = mod.SpotifyRemote ?? mod.default ?? mod;
  // If the JS wrapper doesn't expose connect(), use the native module directly
  SpotifyRemote = typeof candidate?.connect === 'function'
    ? candidate
    : NativeModules.RNSpotifyRemoteAppRemote ?? candidate;
} catch {
  // running in Expo Go or web — SDK not available
}

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
  // Track whether we're currently playing via the Spotify Remote SDK
  const usingSpotifySDK = useRef(false);

  const unloadCurrent = async () => {
    if (usingSpotifySDK.current) {
      try { await SpotifyRemote?.pause(); } catch { /* ignore */ }
      usingSpotifySDK.current = false;
    }
    if (soundRef.current) {
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setIsPlaying(false);
    setPosition(0);
    setDuration(0);
  };

  const playViaSpotifySDK = async (song: Song): Promise<boolean> => {
    if (!SpotifyRemote) { Alert.alert('SDK Debug', 'SpotifyRemote module is null'); return false; }
    Alert.alert('SDK Debug', `Remote keys: ${Object.keys(SpotifyRemote).join(', ')}`); // temp
    if (!song.spotify_track_id) { Alert.alert('SDK Debug', 'No spotify_track_id on song'); return false; }

    const { token, error: tokenError } = await getSpotifyUserToken();
    if (!token) { Alert.alert('SDK Debug', `Token fetch failed: ${tokenError ?? 'no token returned'}`); return false; }

    try {
      await SpotifyRemote.connect(token);
      await SpotifyRemote.playUri(`spotify:track:${song.spotify_track_id}`);
      usingSpotifySDK.current = true;
      setIsPlaying(true);

      const interval = setInterval(async () => {
        try {
          const state = await SpotifyRemote.getPlayerState();
          if (state) {
            setPosition(state.playbackPosition ?? 0);
            setIsPlaying(!state.isPaused);
            if (state.track?.duration) setDuration(state.track.duration);
          }
        } catch {
          clearInterval(interval);
        }
      }, 1000);

      return true;
    } catch (err: any) {
      Alert.alert('SDK Debug', `connect/play failed: ${err?.message ?? String(err)}`);
      usingSpotifySDK.current = false;
      return false;
    }
  };

  const play = async (song: Song) => {
    await unloadCurrent();
    setCurrentSong(song);

    // Prefer full-track playback via Spotify SDK if track is linked
    if (song.spotify_track_id && SpotifyRemote) {
      const sdkPlayed = await playViaSpotifySDK(song);
      if (sdkPlayed) return;
    }

    // Fall back to 30-second preview if available
    if (song.preview_url) {
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
        return;
      } catch {
        setCurrentSong(null);
        Alert.alert('Playback error', 'Could not play this track. Try again.');
        return;
      }
    }

    // No preview, no SDK — offer to open Spotify app
    if (song.spotify_track_id) {
      Alert.alert(
        'Open in Spotify',
        'Connect your Spotify account to play full tracks in-app, or open this track in the Spotify app.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Spotify', onPress: () => openInSpotify(song.spotify_track_id!) },
        ],
      );
    } else {
      Alert.alert('No preview', 'This song isn\'t linked to Spotify yet.');
    }
  };

  const pause = async () => {
    if (usingSpotifySDK.current) {
      await SpotifyRemote?.pause();
    } else {
      await soundRef.current?.pauseAsync();
    }
    setIsPlaying(false);
  };

  const resume = async () => {
    if (usingSpotifySDK.current) {
      await SpotifyRemote?.resume();
    } else {
      await soundRef.current?.playAsync();
    }
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
