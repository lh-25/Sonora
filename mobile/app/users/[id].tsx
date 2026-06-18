import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  ScrollView, ActivityIndicator, FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import {
  getProfile, followUnfollow, getUserPosts,
  type Profile, type Post,
} from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

export default function UserProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: me } = useAuth();
  const router = useRouter();
  const toast = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    Promise.all([
      getProfile(Number(id)),
      getUserPosts(Number(id)),
    ])
      .then(([p, postsData]) => {
        setProfile(p);
        setPosts(postsData.results);
      })
      .catch(() => toast.error('Could not load profile.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleFollow = async () => {
    if (!profile) return;
    setFollowLoading(true);
    try {
      const result = await followUnfollow(profile.user.id);
      setProfile((p) =>
        p ? { ...p, is_following: result.following, total_followers: result.total_followers } : p,
      );
    } catch {
      toast.error('Could not update follow.');
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator color={Colors.primary} style={{ flex: 1, backgroundColor: Colors.background }} />;
  }

  if (!profile) return null;

  const isMe = me?.id === profile.user.id;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.profileHeader}>
          {profile.profile_picture ? (
            <Image source={{ uri: profile.profile_picture }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarInitial}>
                {profile.user.username[0].toUpperCase()}
              </Text>
            </View>
          )}
          <Text style={styles.username}>@{profile.user.username}</Text>
          {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

          {!isMe && (
            <TouchableOpacity
              style={[styles.followBtn, profile.is_following && styles.followingBtn]}
              onPress={handleFollow}
              disabled={followLoading}
            >
              {followLoading ? (
                <ActivityIndicator color={profile.is_following ? Colors.textMuted : '#000'} size="small" />
              ) : (
                <Text style={[styles.followBtnText, profile.is_following && styles.followingBtnText]}>
                  {profile.is_following ? 'Following' : 'Follow'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.total_followers}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.total_following}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{posts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
        </View>

        {/* Posts */}
        <Text style={styles.sectionTitle}>Song of the Day Posts</Text>
        {posts.length === 0 ? (
          <Text style={styles.empty}>No posts yet.</Text>
        ) : (
          posts.map((post) => (
            <TouchableOpacity
              key={post.id}
              style={styles.postCard}
              onPress={() => router.push(`/post/${post.id}`)}
            >
              {post.post_image && (
                <Image source={{ uri: post.post_image }} style={styles.postImage} />
              )}
              <View style={styles.postSongRow}>
                {post.song.album_cover && (
                  <Image source={{ uri: post.song.album_cover }} style={styles.albumArt} />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={styles.songTitle}>{post.song.title}</Text>
                  <Text style={styles.songArtist}>{post.song.artist}</Text>
                </View>
              </View>
              <Text style={styles.postTitle}>{post.post_title}</Text>
              <View style={styles.postFooter}>
                <Ionicons name="heart" size={14} color={Colors.like} />
                <Text style={styles.postLikes}>{post.total_likes}</Text>
                <Ionicons name="chatbubble-outline" size={14} color={Colors.textMuted} style={{ marginLeft: 12 }} />
                <Text style={styles.postComments}>{post.comment_count}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  profileHeader: { alignItems: 'center', marginBottom: 24 },
  avatar: { width: 90, height: 90, borderRadius: 45, marginBottom: 12 },
  avatarPlaceholder: {
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { color: Colors.primary, fontSize: 36, fontWeight: '800' },
  username: { color: Colors.text, fontSize: 22, fontWeight: '800' },
  bio: { color: Colors.textSecondary, fontSize: 14, marginTop: 8, textAlign: 'center', lineHeight: 20 },
  followBtn: {
    marginTop: 16, backgroundColor: Colors.primary,
    paddingHorizontal: 28, paddingVertical: 10, borderRadius: 25,
  },
  followingBtn: {
    backgroundColor: 'transparent', borderWidth: 1, borderColor: Colors.border,
  },
  followBtnText: { color: '#000', fontWeight: '700', fontSize: 15 },
  followingBtnText: { color: Colors.textMuted },
  statsRow: {
    flexDirection: 'row', backgroundColor: Colors.card,
    borderRadius: 14, padding: 20, marginBottom: 24,
    justifyContent: 'center',
  },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { color: Colors.primary, fontSize: 22, fontWeight: '800' },
  statLabel: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.border, marginHorizontal: 8 },
  sectionTitle: {
    color: Colors.textMuted, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 14,
  },
  empty: { color: Colors.textMuted, textAlign: 'center', padding: 20 },
  postCard: {
    backgroundColor: Colors.card, borderRadius: 12, padding: 14,
    marginBottom: 12, borderWidth: 1, borderColor: Colors.border,
  },
  postImage: { width: '100%', height: 140, borderRadius: 8, marginBottom: 10 },
  postSongRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  albumArt: { width: 40, height: 40, borderRadius: 6 },
  songTitle: { color: Colors.text, fontSize: 13, fontWeight: '600' },
  songArtist: { color: Colors.textMuted, fontSize: 12 },
  postTitle: { color: Colors.text, fontSize: 16, fontWeight: '700', marginBottom: 8 },
  postFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  postLikes: { color: Colors.textMuted, fontSize: 13 },
  postComments: { color: Colors.textMuted, fontSize: 13 },
});
