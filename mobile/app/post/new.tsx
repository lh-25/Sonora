import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Image, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { spotifySearch, createPostMultipart, type Song } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';

export default function NewPostScreen() {
  const router = useRouter();
  const toast = useToast();
  const [songQuery, setSongQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Song[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [postTitle, setPostTitle] = useState('');
  const [reason, setReason] = useState('');
  const [lyric, setLyric] = useState('');
  const [image, setImage] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSearch = async () => {
    if (!songQuery.trim()) return;
    setSearching(true);
    try {
      const data = await spotifySearch(songQuery.trim(), 'track', 10);
      const tracks = data?.tracks?.items ?? [];
      const mapped: Song[] = tracks.map((t: any) => ({
        id: 0,
        title: t.name,
        artist: t.artists?.map((a: any) => a.name).join(', ') ?? '',
        album: t.album?.name ?? null,
        genre: '',
        release_date: null,
        duration: '',
        formatted_duration: '',
        album_cover: t.album?.images?.[0]?.url ?? null,
        spotify_track_id: t.id,
        preview_url: t.preview_url ?? null,
        _raw: t,
      }));
      setSearchResults(mapped);
    } catch {
      toast.error('Could not search songs. Make sure Spotify is connected in your profile.');
    } finally {
      setSearching(false);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      toast.info('Allow photo library access to add an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const name = asset.uri.split('/').pop() ?? 'photo.jpg';
      const type = asset.mimeType ?? 'image/jpeg';
      setImage({ uri: asset.uri, name, type });
    }
  };

  const handleSubmit = async () => {
    if (!selectedSong) { toast.error('Please select a song.'); return; }
    if (!postTitle.trim()) { toast.error('Please add a title.'); return; }
    if (!reason.trim()) { toast.error('Please add your reason for picking this song.'); return; }

    setSubmitting(true);
    try {
      const formData = new FormData();
      if (selectedSong.id) {
        formData.append('song_id', String(selectedSong.id));
      } else if (selectedSong.spotify_track_id) {
        formData.append('spotify_track_id', selectedSong.spotify_track_id);
        formData.append('song_title', selectedSong.title);
        formData.append('song_artist', selectedSong.artist);
        if (selectedSong.album_cover) formData.append('album_cover', selectedSong.album_cover);
        if (selectedSong.preview_url) formData.append('preview_url', selectedSong.preview_url);
      }
      formData.append('post_title', postTitle.trim());
      formData.append('reason_for_pick', reason.trim());
      formData.append('standout_lyric', lyric.trim());
      if (image) {
        formData.append('post_image', {
          uri: image.uri,
          name: image.name,
          type: image.type,
        } as any);
      }

      const post = await createPostMultipart(formData);
      toast.success('Your post is live!');
      router.replace(`/post/${post.id}`);
    } catch (err: any) {
      toast.error('Could not create post. ' + (err.message ?? ''));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={22} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.title}>New Post</Text>
          </View>

          {/* Song search */}
          {!selectedSong ? (
            <View style={styles.section}>
              <Text style={styles.label}>Search for a Song *</Text>
              <View style={styles.searchRow}>
                <TextInput
                  style={styles.searchInput}
                  value={songQuery}
                  onChangeText={setSongQuery}
                  placeholder="Song name or artist…"
                  placeholderTextColor={Colors.textMuted}
                  onSubmitEditing={handleSearch}
                  returnKeyType="search"
                />
                <TouchableOpacity onPress={handleSearch} disabled={searching} style={styles.searchBtn}>
                  {searching ? (
                    <ActivityIndicator color="#000" size="small" />
                  ) : (
                    <Text style={styles.searchBtnText}>Search</Text>
                  )}
                </TouchableOpacity>
              </View>
              {searchResults.map((song, i) => (
                <TouchableOpacity
                  key={song.spotify_track_id ?? i}
                  style={styles.resultRow}
                  onPress={() => { setSelectedSong(song); setSearchResults([]); }}
                >
                  {song.album_cover && (
                    <Image source={{ uri: song.album_cover }} style={styles.resultArt} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultTitle}>{song.title}</Text>
                    <Text style={styles.resultArtist}>{song.artist}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.selectedSong}>
              {selectedSong.album_cover && (
                <Image source={{ uri: selectedSong.album_cover }} style={styles.selectedArt} />
              )}
              <View style={{ flex: 1 }}>
                <Text style={styles.selectedTitle}>{selectedSong.title}</Text>
                <Text style={styles.selectedArtist}>{selectedSong.artist}</Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedSong(null)}>
                <Ionicons name="close-circle" size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
          )}

          {/* Fields */}
          <View style={styles.section}>
            <Text style={styles.label}>Post Title *</Text>
            <TextInput
              style={styles.input}
              value={postTitle}
              onChangeText={setPostTitle}
              placeholder="Give your post a title…"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Why this song? *</Text>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={reason}
              onChangeText={setReason}
              placeholder="Tell us why you picked it…"
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.label}>Standout Lyric</Text>
            <TextInput
              style={styles.input}
              value={lyric}
              onChangeText={setLyric}
              placeholder="Your favourite lyric (optional)"
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          {/* Image */}
          <View style={styles.section}>
            <Text style={styles.label}>Post Image</Text>
            <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
              {image ? (
                <Image source={{ uri: image.uri }} style={styles.imagePreview} />
              ) : (
                <>
                  <Ionicons name="image-outline" size={28} color={Colors.textMuted} />
                  <Text style={styles.imagePickerText}>Tap to add an image</Text>
                </>
              )}
            </TouchableOpacity>
            {image && (
              <TouchableOpacity onPress={() => setImage(null)} style={styles.removeImage}>
                <Text style={styles.removeImageText}>Remove image</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, (submitting || !selectedSong || !postTitle.trim() || !reason.trim()) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting || !selectedSong || !postTitle.trim() || !reason.trim()}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Post</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 12 },
  backBtn: { padding: 4 },
  title: { color: Colors.primary, fontSize: 24, fontWeight: '800' },
  section: { marginBottom: 20 },
  label: {
    color: Colors.textMuted, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8,
  },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchInput: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    color: Colors.text, fontSize: 15, borderWidth: 1, borderColor: Colors.border,
  },
  searchBtn: {
    backgroundColor: Colors.primary, borderRadius: 10,
    paddingHorizontal: 16, justifyContent: 'center',
  },
  searchBtnText: { color: '#000', fontWeight: '700', fontSize: 14 },
  resultRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.surface, borderRadius: 10, padding: 10, marginTop: 6,
    borderWidth: 1, borderColor: Colors.border,
  },
  resultArt: { width: 40, height: 40, borderRadius: 6 },
  resultTitle: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  resultArtist: { color: Colors.textMuted, fontSize: 12 },
  selectedSong: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.card, borderRadius: 12, padding: 14,
    marginBottom: 20, borderWidth: 1, borderColor: Colors.primary,
  },
  selectedArt: { width: 50, height: 50, borderRadius: 8 },
  selectedTitle: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  selectedArtist: { color: Colors.textMuted, fontSize: 13 },
  input: {
    backgroundColor: Colors.surface, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    color: Colors.text, fontSize: 15, borderWidth: 1, borderColor: Colors.border,
  },
  textarea: { minHeight: 100, textAlignVertical: 'top' },
  imagePicker: {
    backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1,
    borderColor: Colors.border, height: 120, alignItems: 'center', justifyContent: 'center',
    borderStyle: 'dashed',
  },
  imagePickerText: { color: Colors.textMuted, marginTop: 8, fontSize: 13 },
  imagePreview: { width: '100%', height: '100%', borderRadius: 10 },
  removeImage: { marginTop: 8, alignSelf: 'flex-end' },
  removeImageText: { color: Colors.error, fontSize: 13 },
  submitBtn: {
    backgroundColor: Colors.primary, borderRadius: 25,
    paddingVertical: 14, alignItems: 'center', marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#000', fontWeight: '800', fontSize: 16 },
});
