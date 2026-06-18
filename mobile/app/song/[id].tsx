import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import SpotifySearchModal from '@/components/SpotifySearchModal';
import { getSong, linkSpotifyTrack, type Song } from '@/services/api';
import type { SpotifyTrack } from '@/services/spotify';
import { openInSpotify } from '@/services/spotify';
import { usePlayer } from '@/contexts/PlayerContext';
import { useToast } from '@/contexts/ToastContext';

export default function SongDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { play, currentSong, isPlaying, pause, resume } = usePlayer();
  const toast = useToast();

  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [spotifyOpen, setSpotifyOpen] = useState(false);

  useEffect(() => {
    getSong(Number(id))
      .then((s) => {
        setSong(s);
        navigation.setOptions({ title: s.title });
      })
      .catch(() => toast.error('Song not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSpotifyLink = async (track: SpotifyTrack) => {
    if (!song) return;
    try {
      const updated = await linkSpotifyTrack(song.id, track.id, track.preview_url ?? undefined);
      setSong(updated);
      toast.success('This song is now linked to Spotify.');
    } catch {
      toast.error('Could not link to Spotify.');
    }
  };

  const isCurrentSong = currentSong?.id === song?.id;

  if (loading) return <ActivityIndicator color={Colors.primary} style={{ flex: 1 }} />;
  if (!song) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Album art */}
      {song.album_cover ? (
        <Image source={{ uri: song.album_cover }} style={styles.art} />
      ) : (
        <View style={[styles.art, styles.artPlaceholder]}>
          <Ionicons name="musical-note" size={64} color={Colors.textMuted} />
        </View>
      )}

      {/* Song info */}
      <Text style={styles.title}>{song.title}</Text>
      <Text style={styles.artist}>{song.artist}</Text>
      {song.album && <Text style={styles.album}>{song.album}</Text>}

      <View style={styles.metaRow}>
        <View style={styles.tag}>
          <Text style={styles.tagText}>{song.genre}</Text>
        </View>
        <Text style={styles.duration}>{song.formatted_duration}</Text>
        {song.release_date && (
          <Text style={styles.year}>{new Date(song.release_date).getFullYear()}</Text>
        )}
      </View>

      {/* Play controls */}
      <View style={styles.playControls}>
        {song.preview_url ? (
          <TouchableOpacity
            style={styles.playBtn}
            onPress={() => {
              if (isCurrentSong && isPlaying) { pause(); }
              else if (isCurrentSong) { resume(); }
              else { play(song); }
            }}
          >
            <Ionicons
              name={isCurrentSong && isPlaying ? 'pause' : 'play'}
              size={24}
              color="#000"
            />
            <Text style={styles.playBtnText}>
              {isCurrentSong && isPlaying ? 'Pause Preview' : 'Play Preview'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.noPreviewBadge}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.textMuted} />
            <Text style={styles.noPreviewText}>No preview available</Text>
          </View>
        )}

        {song.spotify_track_id && (
          <TouchableOpacity
            style={styles.spotifyBtn}
            onPress={() => openInSpotify(song.spotify_track_id!)}
          >
            <Ionicons name="open-outline" size={18} color={Colors.primary} />
            <Text style={styles.spotifyBtnText}>Open in Spotify</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Spotify link */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Spotify</Text>
        {song.spotify_track_id ? (
          <View style={styles.linkedRow}>
            <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
            <Text style={styles.linkedText}>Linked to Spotify track</Text>
            <TouchableOpacity onPress={() => setSpotifyOpen(true)}>
              <Text style={styles.relinkText}>Change</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.linkBtn} onPress={() => setSpotifyOpen(true)}>
            <Ionicons name="search" size={16} color={Colors.text} />
            <Text style={styles.linkBtnText}>Find & Link on Spotify</Text>
          </TouchableOpacity>
        )}
      </View>

      <SpotifySearchModal
        visible={spotifyOpen}
        onClose={() => setSpotifyOpen(false)}
        onSelect={handleSpotifyLink}
        title={`Link "${song.title}" to Spotify`}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 120 },
  art: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    marginBottom: 20,
    maxHeight: 300,
  },
  artPlaceholder: {
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { color: Colors.text, fontSize: 26, fontWeight: '800', marginBottom: 4 },
  artist: { color: Colors.textSecondary, fontSize: 18, marginBottom: 4 },
  album: { color: Colors.textMuted, fontSize: 14, marginBottom: 12 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  tag: { backgroundColor: Colors.border, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  tagText: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  duration: { color: Colors.textMuted, fontSize: 13 },
  year: { color: Colors.textMuted, fontSize: 13 },
  playControls: { gap: 10, marginBottom: 28 },
  playBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 20, justifyContent: 'center',
  },
  playBtnText: { color: '#000', fontWeight: '700', fontSize: 16 },
  noPreviewBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.surfaceAlt, borderRadius: 10,
    padding: 12, justifyContent: 'center',
  },
  noPreviewText: { color: Colors.textMuted, fontSize: 13 },
  spotifyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.surfaceAlt, borderRadius: 12,
    paddingVertical: 12, paddingHorizontal: 20,
    justifyContent: 'center', borderWidth: 1, borderColor: Colors.primary,
  },
  spotifyBtnText: { color: Colors.primary, fontWeight: '600', fontSize: 15 },
  section: { backgroundColor: Colors.card, borderRadius: 14, padding: 16 },
  sectionTitle: {
    color: Colors.textMuted, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12,
  },
  linkedRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  linkedText: { color: Colors.text, fontSize: 14, flex: 1 },
  relinkText: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  linkBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.surfaceAlt, borderRadius: 10,
    padding: 12, justifyContent: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  linkBtnText: { color: Colors.text, fontWeight: '600', fontSize: 14 },
});
