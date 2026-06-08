import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Image, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePlayer } from '@/contexts/PlayerContext';
import { Colors } from '@/constants/colors';

export default function MusicPlayer() {
  const { currentSong, isPlaying, position, duration, play, pause, resume, stop, openOnSpotify } = usePlayer();

  if (!currentSong) return null;

  const progress = duration > 0 ? position / duration : 0;
  const hasPreview = !!currentSong.preview_url;

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <View style={styles.content}>
        {/* Album art */}
        {currentSong.album_cover ? (
          <Image source={{ uri: currentSong.album_cover }} style={styles.art} />
        ) : (
          <View style={[styles.art, styles.artPlaceholder]}>
            <Ionicons name="musical-note" size={20} color={Colors.textMuted} />
          </View>
        )}

        {/* Song info */}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{currentSong.title}</Text>
          <Text style={styles.artist} numberOfLines={1}>{currentSong.artist}</Text>
        </View>

        {/* Controls */}
        <View style={styles.controls}>
          {hasPreview ? (
            <TouchableOpacity onPress={isPlaying ? pause : resume} style={styles.playBtn}>
              <Ionicons
                name={isPlaying ? 'pause' : 'play'}
                size={28}
                color={Colors.text}
              />
            </TouchableOpacity>
          ) : null}

          {currentSong.spotify_track_id && (
            <TouchableOpacity onPress={openOnSpotify} style={styles.spotifyBtn}>
              <Ionicons name="open-outline" size={22} color={Colors.primary} />
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={stop} style={styles.closeBtn}>
            <Ionicons name="close" size={22} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {!hasPreview && (
        <Text style={styles.noPreview}>No preview — open in Spotify for full track</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 84 : 64,
    left: 8,
    right: 8,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  progressBar: {
    height: 2,
    backgroundColor: Colors.border,
  },
  progressFill: {
    height: 2,
    backgroundColor: Colors.primary,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 10,
  },
  art: {
    width: 44,
    height: 44,
    borderRadius: 6,
  },
  artPlaceholder: {
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  title: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  artist: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  playBtn: {
    padding: 4,
  },
  spotifyBtn: {
    padding: 4,
  },
  closeBtn: {
    padding: 4,
  },
  noPreview: {
    fontSize: 10,
    color: Colors.textMuted,
    textAlign: 'center',
    paddingBottom: 6,
  },
});
