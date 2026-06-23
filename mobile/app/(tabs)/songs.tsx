import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, TextInput, ScrollView, RefreshControl, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import SongCard from '@/components/SongCard';
import SkeletonBox from '@/components/SkeletonBox';
import EmptyState from '@/components/EmptyState';
import SpotifySearchModal from '@/components/SpotifySearchModal';
import { getSongs, linkSpotifyTrack, type Song } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import type { SpotifyTrack } from '@/services/spotify';
import { usePlayer } from '@/contexts/PlayerContext';
import { useToast } from '@/contexts/ToastContext';

const GENRES = ['', 'POP', 'ROCK', 'RAP', 'JAZZ', 'CLASSICAL', 'RNB', 'COUNTRY', 'ELECTRONIC', 'OTHER'];

export default function SongsScreen() {
  const router = useRouter();
  const { play } = usePlayer();
  const { user } = useAuth();
  const toast = useToast();
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [genre, setGenre] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [spotifyOpen, setSpotifyOpen] = useState(false);
  const [pendingLinkSong, setPendingLinkSong] = useState<Song | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSongs = useCallback(async (p = 1, s = search, g = genre, reset = false) => {
    try {
      const data = await getSongs({ search: s, genre: g, page: p });
      if (reset || p === 1) {
        setSongs(data.results);
      } else {
        setSongs((prev) => [...prev, ...data.results]);
      }
      setHasMore(!!data.next);
      setPage(p);
    } catch {}
  }, [search, genre]);

  useEffect(() => {
    setLoading(true);
    fetchSongs(1, search, genre, true).finally(() => setLoading(false));
  }, [genre]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSongs(1, search, genre, true);
    }, 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchSongs(1, search, genre, true);
    setRefreshing(false);
  };

  const clearFilters = () => { setSearch(''); setGenre(''); };

  const handleSpotifySelect = async (track: SpotifyTrack) => {
    if (!pendingLinkSong) return;
    try {
      const updated = await linkSpotifyTrack(pendingLinkSong.id, track.id, track.preview_url ?? undefined);
      setSongs((prev) => prev.map((s) => s.id === updated.id ? updated : s));
      toast.success(`"${pendingLinkSong.title}" is now linked to Spotify.`);
    } catch {
      toast.error('Could not link to Spotify. Try again.');
    }
    setPendingLinkSong(null);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Songs</Text>
        <TouchableOpacity
          style={styles.spotifySearchBtn}
          onPress={() => {
            if (!user) {
              Alert.alert('Sign in required', 'Please log in to search Spotify.', [
                { text: 'Log In', onPress: () => router.push('/login') },
                { text: 'Cancel', style: 'cancel' },
              ]);
              return;
            }
            setPendingLinkSong(null);
            setSpotifyOpen(true);
          }}
        >
          <Ionicons name="search" size={16} color={Colors.primary} />
          <Text style={styles.spotifySearchText}>Spotify</Text>
        </TouchableOpacity>
      </View>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={16} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search songs, artists, albums..."
          placeholderTextColor={Colors.textMuted}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Genre filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.genreScroll} contentContainerStyle={styles.genreList}>
        {GENRES.map((g) => (
          <TouchableOpacity
            key={g || 'all'}
            style={[styles.genreChip, genre === g && styles.genreChipActive]}
            onPress={() => setGenre(g)}
          >
            <Text style={[styles.genreChipText, genre === g && styles.genreChipTextActive]}>
              {g || 'All'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <ScrollView contentContainerStyle={styles.list} pointerEvents="none">
          {[1, 2, 3, 4, 5, 6].map((i) => <SongCardSkeleton key={i} />)}
        </ScrollView>
      ) : (
        <FlatList
          data={songs}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          onEndReached={() => { if (hasMore) fetchSongs(page + 1); }}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <EmptyState
              icon={search || genre ? 'search-outline' : 'musical-notes-outline'}
              title={search || genre ? 'No songs match your search' : 'No songs yet'}
              subtitle={search || genre
                ? 'Try different keywords or clear your filters.'
                : "Songs will appear here once they're added."}
              action={search || genre ? (
                <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
                  <Text style={styles.clearBtnText}>Clear filters</Text>
                </TouchableOpacity>
              ) : undefined}
            />
          }
          ListFooterComponent={hasMore ? <SkeletonBox height={4} radius={2} style={{ marginHorizontal: 16, marginVertical: 8 }} /> : null}
          renderItem={({ item }) => (
            <SongCard
              song={item}
              onPlay={play}
              onPress={(s) => router.push(`/song/${s.id}`)}
            />
          )}
        />
      )}

      <SpotifySearchModal
        visible={spotifyOpen}
        onClose={() => { setSpotifyOpen(false); setPendingLinkSong(null); }}
        onSelect={pendingLinkSong ? handleSpotifySelect : (track) => {
          // Just play the preview if opened without a pending link
          const mockSong: Song = {
            id: -1,
            title: track.name,
            artist: track.artists.map((a) => a.name).join(', '),
            album: track.album.name,
            genre: 'OTHER',
            release_date: track.album.release_date,
            duration: '',
            formatted_duration: '',
            album_cover: track.album.images[0]?.url ?? null,
            spotify_track_id: track.id,
            preview_url: track.preview_url,
          };
          play(mockSong);
        }}
        title={pendingLinkSong ? `Link "${pendingLinkSong.title}" to Spotify` : 'Search Spotify'}
      />
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
  headerTitle: {
    color: Colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  spotifySearchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  spotifySearchText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    color: Colors.text,
    fontSize: 15,
  },
  genreScroll: {
    marginTop: 10,
  },
  genreList: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 4,
  },
  genreChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  genreChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  genreChipText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  genreChipTextActive: {
    color: '#000',
    fontWeight: '700',
  },
  list: {
    padding: 16,
    paddingTop: 10,
  },
  clearBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  clearBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
});

function SongCardSkeleton() {
  return (
    <View style={skStyles.wrapper}>
      <View style={skStyles.card}>
        <SkeletonBox width={56} height={56} radius={8} />
        <View style={skStyles.info}>
          <SkeletonBox height={15} width="70%" />
          <SkeletonBox height={13} width="55%" style={{ marginTop: 6 }} />
          <SkeletonBox height={11} width="45%" style={{ marginTop: 4 }} />
          <View style={skStyles.meta}>
            <SkeletonBox width={48} height={18} radius={4} />
            <SkeletonBox width={32} height={18} radius={4} />
          </View>
        </View>
        <SkeletonBox width={36} height={36} radius={18} />
      </View>
    </View>
  );
}

const skStyles = StyleSheet.create({
  wrapper: { marginBottom: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  info: { flex: 1 },
  meta: { flexDirection: 'row', gap: 8, marginTop: 6 },
});
