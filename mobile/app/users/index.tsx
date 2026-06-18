import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Image, TextInput, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import SkeletonBox from '@/components/SkeletonBox';
import EmptyState from '@/components/EmptyState';
import { getProfiles, type Profile } from '@/services/api';

export default function UsersScreen() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    setLoading(true);
    getProfiles(1)
      .then((data) => {
        setProfiles(data.results);
        setHasMore(!!data.next);
        setPage(1);
      })
      .finally(() => setLoading(false));
  }, []);

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    const data = await getProfiles(page + 1);
    setProfiles((prev) => [...prev, ...data.results]);
    setHasMore(!!data.next);
    setPage((p) => p + 1);
    setLoadingMore(false);
  };

  const filtered = search.trim()
    ? profiles.filter((p) =>
        p.user.username.toLowerCase().includes(search.toLowerCase()),
      )
    : profiles;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>People</Text>
      </View>

      <View style={styles.searchRow}>
        <Ionicons name="search" size={16} color={Colors.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search users…"
          placeholderTextColor={Colors.textMuted}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ScrollView contentContainerStyle={styles.list} pointerEvents="none">
          {[1, 2, 3, 4, 5].map((i) => <UserCardSkeleton key={i} />)}
        </ScrollView>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <EmptyState
              icon={search ? 'search-outline' : 'people-outline'}
              title={search ? 'No users found' : 'No users yet'}
              subtitle={search
                ? 'Try a different name or clear the search.'
                : 'Be the first to join Sonora!'}
              action={search ? (
                <TouchableOpacity style={styles.clearBtn} onPress={() => setSearch('')}>
                  <Text style={styles.clearBtnText}>Clear search</Text>
                </TouchableOpacity>
              ) : undefined}
            />
          }
          ListFooterComponent={loadingMore ? (
            <View style={{ padding: 16 }}>
              <SkeletonBox height={72} radius={12} />
            </View>
          ) : null}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/users/${item.user.id}`)}
            >
              {item.profile_picture ? (
                <Image source={{ uri: item.profile_picture }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Text style={styles.avatarInitial}>
                    {item.user.username[0].toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.info}>
                <Text style={styles.username}>@{item.user.username}</Text>
                {item.bio && (
                  <Text style={styles.bio} numberOfLines={1}>{item.bio}</Text>
                )}
              </View>
              <View style={styles.stats}>
                <Text style={styles.statNum}>{item.total_followers}</Text>
                <Text style={styles.statLbl}>followers</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

function UserCardSkeleton() {
  return (
    <View style={styles.card}>
      <SkeletonBox width={50} height={50} radius={25} style={{ marginRight: 14 }} />
      <View style={{ flex: 1, gap: 8 }}>
        <SkeletonBox height={15} width="55%" />
        <SkeletonBox height={12} width="40%" />
      </View>
      <View style={{ alignItems: 'center', gap: 4 }}>
        <SkeletonBox width={32} height={16} radius={4} />
        <SkeletonBox width={48} height={10} radius={4} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  title: { color: Colors.primary, fontSize: 26, fontWeight: '800' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: 10,
    marginHorizontal: 16, marginBottom: 12, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: Colors.border,
  },
  searchInput: { flex: 1, color: Colors.text, fontSize: 15 },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.card, borderRadius: 12, padding: 14,
    marginBottom: 10, borderWidth: 1, borderColor: Colors.border,
  },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 14 },
  avatarPlaceholder: {
    backgroundColor: Colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: { color: Colors.primary, fontSize: 20, fontWeight: '700' },
  info: { flex: 1 },
  username: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  bio: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  stats: { alignItems: 'center' },
  statNum: { color: Colors.primary, fontSize: 16, fontWeight: '800' },
  statLbl: { color: Colors.textMuted, fontSize: 10 },
  clearBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  clearBtnText: { color: '#000', fontWeight: '700', fontSize: 14 },
});
