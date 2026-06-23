import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, Animated,
  TouchableOpacity, Modal, TextInput, ScrollView, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import PlaylistCard from '@/components/PlaylistCard';
import SkeletonBox from '@/components/SkeletonBox';
import EmptyState from '@/components/EmptyState';
import SpotifySearchModal from '@/components/SpotifySearchModal';
import {
  getPlaylists, createPlaylist, getSpotifyPlaylists, importSpotifyPlaylist,
  spotifyStatus, type Playlist,
} from '@/services/api';
import { useSpotifyAuth } from '@/services/spotify';
import { spotifyExchangeToken } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';

export default function PlaylistsScreen() {
  const router = useRouter();
  const { authorize } = useSpotifyAuth();
  const toast = useToast();

  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'public' | 'mine'>('public');

  // Create modal
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newVisibility, setNewVisibility] = useState<'PUBLIC' | 'PRIVATE'>('PRIVATE');
  const [creating, setCreating] = useState(false);

  // Spotify import
  const [spotifyConnected, setSpotifyConnected] = useState(false);
  const [spotifyPlaylists, setSpotifyPlaylists] = useState<any[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [importing, setImporting] = useState<string | null>(null);

  const fetchPlaylists = useCallback(async (f = filter, reset = false) => {
    try {
      const data = await getPlaylists(f);
      setPlaylists(data.results);
    } catch {}
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchPlaylists(filter, true),
      spotifyStatus().then((s) => setSpotifyConnected(s.connected)),
    ]).finally(() => setLoading(false));
  }, [filter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPlaylists(filter, true);
    setRefreshing(false);
  };

  const handleCreate = async () => {
    if (!newName.trim()) { toast.error('Please enter a playlist name.'); return; }
    setCreating(true);
    try {
      await createPlaylist({ name: newName.trim(), description: newDesc, visibility: newVisibility });
      setCreateOpen(false);
      setNewName(''); setNewDesc('');
      fetchPlaylists(filter, true);
      toast.success(`Playlist "${newName.trim()}" created.`);
    } catch {
      toast.error('Could not create playlist.');
    } finally {
      setCreating(false);
    }
  };

  const handleConnectSpotify = async () => {
    const result = await authorize();
    if (!result) return;
    try {
      await spotifyExchangeToken(result.code, result.redirectUri);
      setSpotifyConnected(true);
      toast.success('Spotify is now connected.');
    } catch {
      toast.error('Could not connect Spotify. Make sure your Spotify Client ID is set.');
    }
  };

  const openImport = async () => {
    try {
      const data = await getSpotifyPlaylists();
      setSpotifyPlaylists(data?.items ?? []);
      setImportOpen(true);
    } catch {
      toast.error('Could not fetch Spotify playlists.');
    }
  };

  const handleImport = async (spotifyPlaylistId: string, name: string) => {
    setImporting(spotifyPlaylistId);
    try {
      const result = await importSpotifyPlaylist(spotifyPlaylistId, name);
      toast.success(`"${result.name}" created with ${result.imported_tracks} tracks.`);
      fetchPlaylists('mine', true);
      setFilter('mine');
    } catch {
      toast.error('Import failed.');
    } finally {
      setImporting(null);
    }
  };

  const numColumns = 2;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Playlists</Text>
        <View style={styles.headerActions}>
          {spotifyConnected && (
            <TouchableOpacity style={styles.importBtn} onPress={openImport}>
              <Ionicons name="cloud-download-outline" size={18} color={Colors.primary} />
            </TouchableOpacity>
          )}
          {!spotifyConnected && (
            <TouchableOpacity style={styles.spotifyBtn} onPress={handleConnectSpotify}>
              <Ionicons name="logo-apple" size={14} color={Colors.primary} />
              <Text style={styles.spotifyBtnText}>Connect Spotify</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.addBtn} onPress={() => setCreateOpen(true)}>
            <Ionicons name="add" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(['public', 'mine'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'public' ? 'Public' : 'Mine'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={[styles.grid, styles.skeletonGrid]}>
          {[1, 2, 3, 4, 5, 6].map((i) => <PlaylistCardSkeleton key={i} />)}
        </View>
      ) : (
        <FlatList
          data={playlists}
          keyExtractor={(item) => String(item.id)}
          numColumns={numColumns}
          contentContainerStyle={styles.grid}
          columnWrapperStyle={styles.row}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={
            <EmptyState
              icon={filter === 'mine' ? 'list-circle-outline' : 'earth-outline'}
              title={filter === 'mine' ? 'No playlists yet' : 'No public playlists'}
              subtitle={filter === 'mine'
                ? 'Create your first playlist to organise your music.'
                : 'Be the first to share a playlist with the community.'}
              action={filter === 'mine' ? (
                <TouchableOpacity style={styles.emptyBtn} onPress={() => setCreateOpen(true)}>
                  <Text style={styles.emptyBtnText}>New Playlist</Text>
                </TouchableOpacity>
              ) : undefined}
            />
          }
          renderItem={({ item }) => (
            <PlaylistCard playlist={item} onPress={(p) => router.push(`/playlist/${p.id}`)} />
          )}
        />
      )}

      {/* Create Playlist Modal */}
      <Modal visible={createOpen} animationType="slide" presentationStyle="formSheet" onRequestClose={() => setCreateOpen(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>New Playlist</Text>
            <TouchableOpacity onPress={() => setCreateOpen(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <Text style={styles.formLabel}>Name *</Text>
          <TextInput
            style={styles.formInput}
            value={newName}
            onChangeText={setNewName}
            placeholder="Playlist name"
            placeholderTextColor={Colors.textMuted}
          />

          <Text style={styles.formLabel}>Description</Text>
          <TextInput
            style={[styles.formInput, styles.textArea]}
            value={newDesc}
            onChangeText={setNewDesc}
            placeholder="Optional description"
            placeholderTextColor={Colors.textMuted}
            multiline
          />

          <Text style={styles.formLabel}>Visibility</Text>
          <View style={styles.visibilityRow}>
            {(['PUBLIC', 'PRIVATE'] as const).map((v) => (
              <TouchableOpacity
                key={v}
                style={[styles.visibilityOption, newVisibility === v && styles.visibilityActive]}
                onPress={() => setNewVisibility(v)}
              >
                <Ionicons
                  name={v === 'PUBLIC' ? 'earth' : 'lock-closed'}
                  size={16}
                  color={newVisibility === v ? '#000' : Colors.textMuted}
                />
                <Text style={[styles.visibilityText, newVisibility === v && styles.visibilityTextActive]}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.createBtn} onPress={handleCreate} disabled={creating}>
            <Text style={styles.createBtnText}>{creating ? 'Creating…' : 'Create Playlist'}</Text>
          </TouchableOpacity>
        </View>
      </Modal>

      {/* Spotify Import Modal */}
      <Modal visible={importOpen} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setImportOpen(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Import from Spotify</Text>
            <TouchableOpacity onPress={() => setImportOpen(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView>
            {spotifyPlaylists.map((pl: any) => (
              <TouchableOpacity
                key={pl.id}
                style={styles.spotifyPlRow}
                onPress={() => handleImport(pl.id, pl.name)}
                disabled={importing === pl.id}
              >
                <View style={styles.spotifyPlInfo}>
                  <Text style={styles.spotifyPlName}>{pl.name}</Text>
                  <Text style={styles.spotifyPlMeta}>{pl.tracks?.total} tracks</Text>
                </View>
                {importing === pl.id ? (
                  <SkeletonBox width={22} height={22} radius={11} />
                ) : (
                  <Ionicons name="cloud-download-outline" size={22} color={Colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { color: Colors.text, fontSize: 22, fontWeight: '800' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  importBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  spotifyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 16, borderWidth: 1, borderColor: Colors.primary,
  },
  spotifyBtnText: { color: Colors.primary, fontSize: 12, fontWeight: '600' },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: 16, marginBottom: 12, gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 20, backgroundColor: Colors.surfaceAlt,
  },
  filterTabActive: { backgroundColor: Colors.primary },
  filterText: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  filterTextActive: { color: '#000' },
  grid: { padding: 16, paddingTop: 4 },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  row: { justifyContent: 'space-between' },
  emptyBtn: {
    backgroundColor: Colors.primary, borderRadius: 8,
    paddingHorizontal: 20, paddingVertical: 10,
  },
  emptyBtnText: { color: '#000', fontWeight: '700', fontSize: 14 },

  // Modals
  modal: {
    flex: 1, backgroundColor: Colors.background,
    padding: 20, paddingTop: 40,
  },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', marginBottom: 24,
  },
  modalTitle: { color: Colors.text, fontSize: 20, fontWeight: '700' },
  formLabel: {
    color: Colors.textSecondary, fontSize: 12,
    fontWeight: '600', textTransform: 'uppercase',
    letterSpacing: 0.5, marginBottom: 8, marginTop: 16,
  },
  formInput: {
    backgroundColor: Colors.surfaceAlt, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    color: Colors.text, fontSize: 15,
    borderWidth: 1, borderColor: Colors.border,
  },
  textArea: { height: 80, textAlignVertical: 'top', paddingTop: 12 },
  visibilityRow: { flexDirection: 'row', gap: 12 },
  visibilityOption: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    gap: 6, padding: 12, borderRadius: 10,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1, borderColor: Colors.border,
    justifyContent: 'center',
  },
  visibilityActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  visibilityText: { color: Colors.textMuted, fontWeight: '600', fontSize: 14 },
  visibilityTextActive: { color: '#000' },
  createBtn: {
    backgroundColor: Colors.primary, borderRadius: 10,
    paddingVertical: 14, alignItems: 'center', marginTop: 24,
  },
  createBtnText: { color: '#000', fontWeight: '700', fontSize: 16 },

  // Spotify import list
  spotifyPlRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: Colors.border,
    justifyContent: 'space-between',
  },
  spotifyPlInfo: { flex: 1 },
  spotifyPlName: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  spotifyPlMeta: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
});

function PlaylistCardSkeleton() {
  const opacity = useRef(new Animated.Value(0.35)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 750, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 750, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[skStyles.card, { opacity }]}
    >
      <View style={skStyles.info}>
        <View style={skStyles.line1} />
        <View style={skStyles.line2} />
      </View>
    </Animated.View>
  );
}

const skStyles = StyleSheet.create({
  card: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: Colors.surfaceAlt,
    overflow: 'hidden',
  },
  info: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    gap: 6,
  },
  line1: {
    height: 14,
    width: '75%',
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 4,
  },
  line2: {
    height: 11,
    width: '55%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 4,
  },
});
