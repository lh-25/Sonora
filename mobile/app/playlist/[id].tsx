import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import SongCard from '@/components/SongCard';
import { getPlaylist, removeSongFromPlaylist, deletePlaylist, type Playlist } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'expo-router';

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const router = useRouter();
  const { user } = useAuth();
  const { play } = usePlayer();
  const toast = useToast();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPlaylist(Number(id))
      .then((p) => {
        setPlaylist(p);
        navigation.setOptions({ title: p.name });
      })
      .catch(() => toast.error('Playlist not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleRemoveSong = (songId: number) => {
    Alert.alert('Remove Song', 'Remove this song from the playlist?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeSongFromPlaylist(Number(id), songId);
            setPlaylist((p) => p ? { ...p, songs: p.songs.filter((s) => s.id !== songId) } : p);
            toast.success('Song removed from playlist.');
          } catch {
            toast.error('Could not remove song.');
          }
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert('Delete Playlist', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePlaylist(Number(id));
            toast.success('Playlist deleted.');
            router.back();
          } catch {
            toast.error('Could not delete playlist.');
          }
        },
      },
    ]);
  };

  if (loading) return <ActivityIndicator color={Colors.primary} style={{ flex: 1 }} />;
  if (!playlist) return null;

  const isOwner = user?.id === playlist.user.id;

  return (
    <FlatList
      style={styles.container}
      ListHeaderComponent={
        <View>
          {/* Cover */}
          {playlist.playlist_cover ? (
            <Image source={{ uri: playlist.playlist_cover }} style={styles.cover} />
          ) : (
            <View style={[styles.cover, styles.coverPlaceholder]}>
              <Ionicons name="list-circle" size={72} color={Colors.textMuted} />
            </View>
          )}
          {/* Info */}
          <View style={styles.info}>
            <Text style={styles.name}>{playlist.name}</Text>
            <View style={styles.metaRow}>
              <Ionicons
                name={playlist.visibility === 'PUBLIC' ? 'earth' : 'lock-closed'}
                size={13}
                color={Colors.textMuted}
              />
              <Text style={styles.meta}>{playlist.visibility} · {playlist.user.username} · {playlist.songs.length} songs</Text>
            </View>
            {playlist.description ? (
              <Text style={styles.desc}>{playlist.description}</Text>
            ) : null}
            {isOwner && (
              <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                <Ionicons name="trash-outline" size={16} color={Colors.error} />
                <Text style={styles.deleteBtnText}>Delete Playlist</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.songsLabel}>Songs</Text>
        </View>
      }
      data={playlist.songs}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={styles.list}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons name="musical-notes-outline" size={36} color={Colors.textMuted} />
          <Text style={styles.emptyText}>No songs in this playlist</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.songRow}>
          <View style={styles.songCardWrapper}>
            <SongCard song={item} onPlay={play} />
          </View>
          {isOwner && (
            <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveSong(item.id)}>
              <Ionicons name="close-circle" size={22} color={Colors.error} />
            </TouchableOpacity>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  cover: { width: '100%', height: 240 },
  coverPlaceholder: {
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  info: { padding: 20 },
  name: { color: Colors.text, fontSize: 24, fontWeight: '800', marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  meta: { color: Colors.textMuted, fontSize: 13 },
  desc: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20, marginBottom: 12 },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 8,
  },
  deleteBtnText: { color: Colors.error, fontSize: 14, fontWeight: '500' },
  songsLabel: {
    color: Colors.textMuted, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.8,
    paddingHorizontal: 20, marginBottom: 8,
  },
  list: { paddingHorizontal: 16, paddingBottom: 120 },
  songRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  songCardWrapper: { flex: 1 },
  removeBtn: { padding: 8 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyText: { color: Colors.textMuted, fontSize: 14 },
});
