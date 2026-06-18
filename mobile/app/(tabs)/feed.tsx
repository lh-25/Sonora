import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ScrollView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import PostCard from '@/components/PostCard';
import SkeletonBox from '@/components/SkeletonBox';
import EmptyState from '@/components/EmptyState';
import { getPosts, likePost, type Post } from '@/services/api';
import { usePlayer } from '@/contexts/PlayerContext';

export default function FeedScreen() {
  const router = useRouter();
  const { play } = usePlayer();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<'all' | 'mine'>('all');

  const fetchPosts = useCallback(async (p = 1, f = filter, reset = false) => {
    try {
      const data = await getPosts(f, p);
      if (reset || p === 1) {
        setPosts(data.results);
      } else {
        setPosts((prev) => [...prev, ...data.results]);
      }
      setHasMore(!!data.next);
      setPage(p);
    } catch {}
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    fetchPosts(1, filter, true).finally(() => setLoading(false));
  }, [filter]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts(1, filter, true);
    setRefreshing(false);
  };

  const onLoadMore = () => {
    if (hasMore && !loading) fetchPosts(page + 1);
  };

  const handleLike = async (post: Post) => {
    try {
      const result = await likePost(post.id);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, is_liked: result.liked, total_likes: result.total_likes } : p,
        ),
      );
    } catch {}
  };

  const handlePlaySong = (post: Post) => {
    play(post.song);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Song of the Day</Text>
        <TouchableOpacity onPress={() => router.push('/post/new')} style={styles.addBtn}>
          <Ionicons name="add" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(['all', 'mine'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'All Posts' : 'My Posts'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ScrollView contentContainerStyle={styles.list} pointerEvents="none">
          <PostCardSkeleton />
          <PostCardSkeleton />
          <PostCardSkeleton />
        </ScrollView>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <EmptyState
              icon={filter === 'mine' ? 'document-outline' : 'musical-note-outline'}
              title={filter === 'mine' ? 'No posts yet' : 'Nothing here yet'}
              subtitle={filter === 'mine'
                ? 'Share what you\'ve been listening to.'
                : 'Be the first to share your Song of the Day!'}
              action={filter === 'mine' ? (
                <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/post/new')}>
                  <Text style={styles.emptyBtnText}>New Post</Text>
                </TouchableOpacity>
              ) : undefined}
            />
          }
          ListFooterComponent={hasMore ? <SkeletonBox height={4} radius={2} style={{ marginHorizontal: 16, marginVertical: 8 }} /> : null}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onPress={(p) => router.push(`/post/${p.id}`)}
              onLike={handleLike}
              onPlaySong={handlePlaySong}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

function PostCardSkeleton() {
  return (
    <View style={skStyles.wrapper}>
      <View style={skStyles.card}>
        <View style={skStyles.body}>
          <View style={skStyles.songRow}>
            <SkeletonBox width={40} height={40} radius={6} />
            <View style={skStyles.songInfo}>
              <SkeletonBox height={13} width="70%" />
              <SkeletonBox height={11} width="50%" style={{ marginTop: 6 }} />
            </View>
          </View>
          <SkeletonBox height={16} width="85%" />
          <View style={skStyles.lyricBlock}>
            <SkeletonBox height={13} width="90%" />
          </View>
          <View style={skStyles.footer}>
            <SkeletonBox width={80} height={12} radius={4} />
            <SkeletonBox width={56} height={12} radius={4} />
          </View>
        </View>
      </View>
    </View>
  );
}

const skStyles = StyleSheet.create({
  wrapper: { marginBottom: 12 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  body: { padding: 14, gap: 10 },
  songRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 10,
  },
  songInfo: { flex: 1 },
  lyricBlock: {
    borderLeftWidth: 3,
    borderLeftColor: Colors.border,
    paddingLeft: 10,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    color: Colors.primary,
    fontSize: 22,
    fontWeight: '800',
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 4,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceAlt,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#000',
  },
  list: {
    padding: 16,
    paddingTop: 8,
  },
  emptyBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  emptyBtnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 14,
  },
});
