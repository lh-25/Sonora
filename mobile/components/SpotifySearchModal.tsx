import React, { useState, useCallback } from 'react';
import {
  Modal, View, Text, TextInput, FlatList, TouchableOpacity,
  StyleSheet, Image, ActivityIndicator, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { spotifySearch } from '@/services/api';
import type { SpotifyTrack } from '@/services/spotify';
import { formatDuration } from '@/services/spotify';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSelect: (track: SpotifyTrack) => void;
  title?: string;
};

export default function SpotifySearchModal({ visible, onClose, onSelect, title = 'Search Spotify' }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SpotifyTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const data = await spotifySearch(query.trim());
      setResults(data?.tracks?.items ?? []);
    } catch (e) {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const reset = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={() => { reset(); onClose(); }} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={Colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Search songs, artists..."
            placeholderTextColor={Colors.textMuted}
            returnKeyType="search"
            onSubmitEditing={search}
            autoFocus
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity style={styles.searchBtn} onPress={search}>
          <Text style={styles.searchBtnText}>Search</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator color={Colors.primary} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              searched ? (
                <Text style={styles.emptyText}>No results found</Text>
              ) : (
                <Text style={styles.emptyText}>Search for a track above</Text>
              )
            }
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.trackRow} onPress={() => { onSelect(item); reset(); onClose(); }}>
                <Image
                  source={{ uri: item.album.images[0]?.url }}
                  style={styles.trackArt}
                />
                <View style={styles.trackInfo}>
                  <Text style={styles.trackTitle} numberOfLines={1}>{item.name}</Text>
                  <Text style={styles.trackArtist} numberOfLines={1}>
                    {item.artists.map((a) => a.name).join(', ')}
                  </Text>
                  <Text style={styles.trackAlbum} numberOfLines={1}>{item.album.name}</Text>
                </View>
                <View style={styles.trackMeta}>
                  <Text style={styles.trackDuration}>{formatDuration(item.duration_ms)}</Text>
                  {item.preview_url && (
                    <View style={styles.previewBadge}>
                      <Text style={styles.previewText}>PREVIEW</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === 'ios' ? 20 : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
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
  },
  searchIcon: {
    marginRight: 2,
  },
  input: {
    flex: 1,
    color: Colors.text,
    fontSize: 16,
  },
  searchBtn: {
    margin: 16,
    marginTop: 10,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  searchBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 15,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  emptyText: {
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 40,
    fontSize: 15,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  trackArt: {
    width: 48,
    height: 48,
    borderRadius: 6,
  },
  trackInfo: {
    flex: 1,
  },
  trackTitle: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  trackArtist: {
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  trackAlbum: {
    color: Colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  trackMeta: {
    alignItems: 'flex-end',
    gap: 4,
  },
  trackDuration: {
    color: Colors.textMuted,
    fontSize: 11,
  },
  previewBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  previewText: {
    color: '#000',
    fontSize: 8,
    fontWeight: '700',
  },
});
