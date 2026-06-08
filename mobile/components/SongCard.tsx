import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import type { Song } from '@/services/api';

type Props = {
  song: Song;
  onPlay?: (song: Song) => void;
  onPress?: (song: Song) => void;
  showSpotifyBadge?: boolean;
};

export default function SongCard({ song, onPlay, onPress, showSpotifyBadge = true }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress?.(song)} activeOpacity={0.8}>
      <View style={styles.artWrapper}>
        {song.album_cover ? (
          <Image source={{ uri: song.album_cover }} style={styles.art} />
        ) : (
          <View style={[styles.art, styles.artPlaceholder]}>
            <Ionicons name="musical-note" size={28} color={Colors.textMuted} />
          </View>
        )}
        {showSpotifyBadge && song.spotify_track_id && (
          <View style={styles.spotifyBadge}>
            <Ionicons name="logo-apple" size={8} color={Colors.primary} />
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{song.title}</Text>
        <Text style={styles.artist} numberOfLines={1}>{song.artist}</Text>
        {song.album && (
          <Text style={styles.album} numberOfLines={1}>{song.album}</Text>
        )}
        <View style={styles.meta}>
          <View style={styles.genreTag}>
            <Text style={styles.genreText}>{song.genre}</Text>
          </View>
          <Text style={styles.duration}>{song.formatted_duration}</Text>
        </View>
      </View>

      {onPlay && (
        <TouchableOpacity onPress={() => onPlay(song)} style={styles.playBtn}>
          <Ionicons
            name={song.preview_url ? 'play-circle' : 'open-outline'}
            size={36}
            color={Colors.primary}
          />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  artWrapper: {
    position: 'relative',
  },
  art: {
    width: 56,
    height: 56,
    borderRadius: 8,
  },
  artPlaceholder: {
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotifyBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
  },
  title: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  artist: {
    color: Colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  album: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  genreTag: {
    backgroundColor: Colors.border,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  genreText: {
    color: Colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  duration: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  playBtn: {
    padding: 4,
  },
});
