import React, { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import PostCard from '@/components/PostCard';
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
        <ActivityIndicator color={Colors.primary} style={{ flex: 1 }} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
          onEndReached={onLoadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="musical-note" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No posts yet</Text>
              <Text style={styles.emptySubText}>Be the first to share your Song of the Day!</Text>
            </View>
          }
          ListFooterComponent={hasMore ? <ActivityIndicator color={Colors.primary} style={{ padding: 16 }} /> : null}
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
  empty: {
    alignItems: 'center',
    paddingTop: 80,
    gap: 8,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 18,
    fontWeight: '600',
  },
  emptySubText: {
    color: Colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
});
