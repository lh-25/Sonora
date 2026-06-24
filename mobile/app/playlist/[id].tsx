import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, Alert, Modal, TextInput, ScrollView,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import SongCard from '@/components/SongCard';
import {
  getPlaylist, spotifySearch, addSpotifyTrackToPlaylist,
  removeSongFromPlaylist, deletePlaylist, type Playlist, type Song,
} from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { useToast } from '@/contexts/ToastContext';
import { useRouter } from 'expo-router';

type SpotifyTrack = {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { name: string; images: { url: string }[] };
  duration_ms: number;
  preview_url: string | null;
};

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const router = useRouter();
  const { user } = useAuth();
  const { play } = usePlayer();
  const toast = useToast();

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);

  // Add song via Spotify
  const [addOpen, setAddOpen] = useState(false);
  const [songQuery, setSongQuery] = useState('');
  const [trackResults, setTrackResults] = useState<SpotifyTrack[]>([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);

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

  const handleSearch = async () => {
    if (!songQuery.trim()) return;
    setSearching(true);
    try {
      const data = await spotifySearch(songQuery.trim(), 'track', 10);
      setTrackResults(data?.tracks?.items ?? []);
    } catch {
      toast.error('Could not search — make sure Spotify is connected in your profile.');
    } finally {
      setSearching(false);
    }
  };

  const handleAddTrack = async (track: SpotifyTrack) => {
    if (!playlist) return;
    setAdding(track.id);
    try {
      const result = await addSpotifyTrackToPlaylist(playlist.id, {
        id: track.id,
        name: track.name,
        artists: track.artists.map((a) => a.name).join(', '),
        album: track.album.name,
        album_cover: track.album.images?.[0]?.url ?? null,
        preview_url: track.preview_url,
        duration_ms: track.duration_ms,
      });
      // Optimistically append a stub so the count updates; full refresh on close
      setPlaylist((p) => p ? {
        ...p,
        songs: [...p.songs, {
          id: result.song_id,
          title: track.name,
          artist: track.artists.map((a) => a.name).join(', '),
          album: track.album.name,
          album_cover: track.album.images?.[0]?.url ?? null,
          preview_url: track.preview_url,
          spotify_track_id: track.id,
          genre: '',
          release_date: null,
          duration: '',
          formatted_duration: '',
        } as Song],
      } : p);
      toast.success(`"${track.name}" added to playlist.`);
      setSongQuery('');
      setTrackResults([]);
      setAddOpen(false);
    } catch {
      toast.error('Could not add song — it may already be in this playlist.');
    } finally {
      setAdding(null);
    }
  };

  if (loading) return <ActivityIndicator color={Colors.primary} style={{ flex: 1 }} />;
  if (!playlist) return null;

  const isOwner = user?.id === playlist.user.id;

  return (
    <>
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
              <View style={styles.ownerActions}>
                {isOwner && (
                  <TouchableOpacity style={styles.addBtn} onPress={() => setAddOpen(true)}>
                    <Ionicons name="add-circle-outline" size={16} color="#000" />
                    <Text style={styles.addBtnText}>Add Song</Text>
                  </TouchableOpacity>
                )}
                {isOwner && (
                  <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                    <Ionicons name="trash-outline" size={16} color={Colors.error} />
                    <Text style={styles.deleteBtnText}>Delete Playlist</Text>
                  </TouchableOpacity>
                )}
              </View>
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
            {isOwner && (
              <TouchableOpacity style={[styles.addBtn, { marginTop: 12 }]} onPress={() => setAddOpen(true)}>
                <Ionicons name="add-circle-outline" size={16} color="#000" />
                <Text style={styles.addBtnText}>Add Song</Text>
              </TouchableOpacity>
            )}
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

      {/* Add Song Modal */}
      <Modal visible={addOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => { setAddOpen(false); setSongQuery(''); setTrackResults([]); }}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Song</Text>
            <TouchableOpacity onPress={() => { setAddOpen(false); setSongQuery(''); setTrackResults([]); }}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalHint}>Search Spotify to find and add songs to this playlist.</Text>

          <View style={styles.searchRow}>
            <TextInput
              style={styles.searchInput}
              value={songQuery}
              onChangeText={setSongQuery}
              placeholder="Song name or artist…"
              placeholderTextColor={Colors.textMuted}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoFocus
            />
            <TouchableOpacity onPress={handleSearch} disabled={searching} style={styles.searchBtn}>
              {searching
                ? <ActivityIndicator color="#000" size="small" />
                : <Text style={styles.searchBtnText}>Search</Text>
              }
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.results} keyboardShouldPersistTaps="handled">
            {trackResults.map((track) => {
              const art = track.album.images?.[0]?.url;
              const isAdding = adding === track.id;
              const alreadyAdded = playlist.songs.some((s) => s.spotify_track_id === track.id);
              return (
                <TouchableOpacity
                  key={track.id}
                  style={[styles.trackRow, (isAdding || alreadyAdded) && styles.trackRowDim]}
                  onPress={() => !alreadyAdded && handleAddTrack(track)}
                  disabled={isAdding || alreadyAdded}
                >
                  {art ? (
                    <Image source={{ uri: art }} style={styles.trackArt} />
                  ) : (
                    <View style={[styles.trackArt, styles.trackArtPlaceholder]}>
                      <Ionicons name="musical-note" size={18} color="#555" />
                    </View>
                  )}
                  <View style={styles.trackInfo}>
                    <Text style={styles.trackName} numberOfLines={1}>{track.name}</Text>
                    <Text style={styles.trackArtist} numberOfLines={1}>
                      {track.artists.map((a) => a.name).join(', ')}
                    </Text>
                  </View>
                  {alreadyAdded ? (
                    <Ionicons name="checkmark-circle" size={22} color={Colors.primary} />
                  ) : isAdding ? (
                    <ActivityIndicator color={Colors.primary} size="small" />
                  ) : (
                    <Ionicons name="add-circle-outline" size={22} color={Colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </>
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
  ownerActions: { flexDirection: 'row', gap: 12, marginTop: 4, flexWrap: 'wrap' },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: { color: '#000', fontWeight: '700', fontSize: 13 },
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

  // Modal
  modal: {
    flex: 1, backgroundColor: Colors.background,
    padding: 20, paddingTop: 40,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 8,
  },
  modalTitle: { color: Colors.text, fontSize: 20, fontWeight: '700' },
  modalHint: { color: Colors.textMuted, fontSize: 13, marginBottom: 16 },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  searchInput: {
    flex: 1, backgroundColor: Colors.surfaceAlt, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 11,
    color: Colors.text, fontSize: 15,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchBtn: {
    backgroundColor: Colors.primary, borderRadius: 10,
    paddingHorizontal: 16, justifyContent: 'center', minWidth: 72,
    alignItems: 'center',
  },
  searchBtnText: { color: '#000', fontWeight: '700', fontSize: 14 },
  results: { flex: 1 },
  trackRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  trackRowDim: { opacity: 0.5 },
  trackArt: { width: 44, height: 44, borderRadius: 6 },
  trackArtPlaceholder: {
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  trackInfo: { flex: 1, minWidth: 0 },
  trackName: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  trackArtist: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
});
