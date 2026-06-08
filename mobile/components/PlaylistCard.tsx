import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import type { Playlist } from '@/services/api';

type Props = {
  playlist: Playlist;
  onPress?: (playlist: Playlist) => void;
};

export default function PlaylistCard({ playlist, onPress }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={() => onPress?.(playlist)} activeOpacity={0.8}>
      {playlist.playlist_cover ? (
        <Image source={{ uri: playlist.playlist_cover }} style={styles.cover} />
      ) : (
        <View style={[styles.cover, styles.coverPlaceholder]}>
          <Ionicons name="list-circle" size={40} color={Colors.textMuted} />
        </View>
      )}
      <View style={styles.overlay} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{playlist.name}</Text>
        <Text style={styles.meta}>
          {playlist.song_count} song{playlist.song_count !== 1 ? 's' : ''} · {playlist.user.username}
        </Text>
        <View style={styles.badge}>
          <Ionicons
            name={playlist.visibility === 'PUBLIC' ? 'earth' : 'lock-closed'}
            size={10}
            color={Colors.textMuted}
          />
          <Text style={styles.badgeText}>{playlist.visibility}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.card,
    marginBottom: 12,
    position: 'relative',
  },
  cover: {
    ...StyleSheet.absoluteFillObject,
  },
  coverPlaceholder: {
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  info: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
  },
  name: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  meta: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  badgeText: {
    color: Colors.textMuted,
    fontSize: 9,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
