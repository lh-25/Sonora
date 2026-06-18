'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Text, H1 } from '@salt-ds/core';
import { getUsers, type Profile } from '@/services/api';
import Skeleton from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';
import styles from './users.module.css';

export default function UsersPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setLoading(true);
    getUsers(1)
      .then((data) => {
        setUsers(data.results);
        setHasMore(!!data.next);
        setPage(1);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleLoadMore = async () => {
    setLoadingMore(true);
    try {
      const data = await getUsers(page + 1);
      setUsers((prev) => [...prev, ...data.results]);
      setHasMore(!!data.next);
      setPage((p) => p + 1);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className={styles.page}>
      <div className="page-container">
        <div className={styles.header}>
          <H1 className={styles.title}>Users</H1>
        </div>

        {loading ? (
          <div className={styles.grid}>
            {Array.from({ length: 8 }).map((_, i) => (
              <UserCardSkeleton key={i} />
            ))}
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            variant="users"
            title="No users found"
            description="There’s no one here yet — check back soon."
          />
        ) : (
          <>
            <div className={styles.grid}>
              {users.map((profile) => (
                <UserCard key={profile.id} profile={profile} />
              ))}
            </div>

            {hasMore && (
              <div className={styles.loadMore}>
                <Button variant="secondary" onClick={handleLoadMore} loading={loadingMore}>
                  Load more
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function UserCardSkeleton() {
  return (
    <div className={styles.userCard}>
      <Skeleton width={72} height={72} radius="50%" />
      <Skeleton width="60%" height={16} />
      <Skeleton width="80%" height={12} />
      <Skeleton width="40%" height={12} />
      <Skeleton width="100%" height={34} radius={25} style={{ marginTop: 4 }} />
    </div>
  );
}

function UserCard({ profile }: { profile: Profile }) {
  return (
    <div className={styles.userCard}>
      {profile.profile_picture ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.profile_picture}
          alt={profile.user.username}
          className={styles.avatar}
        />
      ) : (
        <div className={styles.avatarPlaceholder}>
          {profile.user.username[0].toUpperCase()}
        </div>
      )}

      <Text className={styles.username}>@{profile.user.username}</Text>

      {profile.bio && (
        <Text className={styles.bio}>{profile.bio}</Text>
      )}

      <Text className={styles.followersText}>
        {profile.total_followers} followers
      </Text>

      <Link href={`/users/${profile.user.id}`} className={styles.viewBtn}>
        View Profile
      </Link>
    </div>
  );
}
