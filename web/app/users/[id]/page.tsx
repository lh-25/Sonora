'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button, Text, H2, H3, FlexLayout, Spinner, StackLayout } from '@salt-ds/core';
import {
  getUserProfile,
  getUserPlaylists,
  getUserPosts,
  followUnfollow,
  type Profile,
  type Playlist,
  type Post,
} from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import styles from './user.module.css';

export default function UserProfilePage() {
  const params = useParams();
  const userId = Number(params.id);
  const { user: me } = useAuth();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    Promise.all([
      getUserProfile(userId),
      getUserPlaylists(userId),
      getUserPosts(userId),
    ])
      .then(([profileData, playlistsData, postsData]) => {
        setProfile(profileData);
        setPlaylists(playlistsData.results);
        setPosts(postsData.results);
      })
      .catch(() => setError('Could not load user profile.'))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleFollow = async () => {
    if (!profile) return;
    setFollowLoading(true);
    try {
      const result = await followUnfollow(userId);
      setProfile((prev) =>
        prev
          ? { ...prev, is_following: result.following, total_followers: result.total_followers }
          : prev,
      );
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <div className="page-container">
          <FlexLayout justify="center" className={styles.spinner}>
            <Spinner size="large" />
          </FlexLayout>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className={styles.page}>
        <div className="page-container">
          <Text className={styles.error}>{error || 'User not found.'}</Text>
        </div>
      </div>
    );
  }

  const isOwnProfile = me?.id === userId;

  return (
    <div className={styles.page}>
      <div className="page-container">
        <Link href="/users" className={styles.backLink}>
          ← Back to Users
        </Link>

        {/* Profile Card */}
        <div className={styles.profileCard}>
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

          <div className={styles.profileInfo}>
            <H2 className={styles.username}>@{profile.user.username}</H2>

            {profile.bio && (
              <Text className={styles.bio}>{profile.bio}</Text>
            )}

            <FlexLayout gap={3} className={styles.statsRow}>
              <div className={styles.stat}>
                <Text className={styles.statValue}>{profile.total_followers}</Text>
                <Text className={styles.statLabel}>Followers</Text>
              </div>
              <div className={styles.stat}>
                <Text className={styles.statValue}>{profile.total_following}</Text>
                <Text className={styles.statLabel}>Following</Text>
              </div>
            </FlexLayout>

            {!isOwnProfile && (
              <Button
                variant={profile.is_following ? 'secondary' : 'primary'}
                onClick={handleFollow}
                loading={followLoading}
                className={profile.is_following ? styles.unfollowBtn : styles.followBtn}
              >
                {profile.is_following ? 'Unfollow' : 'Follow'}
              </Button>
            )}
          </div>
        </div>

        {/* Playlists Section */}
        <div className={styles.section}>
          <Text className={styles.sectionTitle}>
            Playlists ({playlists.length})
          </Text>
          {playlists.length === 0 ? (
            <Text className={styles.emptyText}>No public playlists yet.</Text>
          ) : (
            <div className={styles.playlistsGrid}>
              {playlists.map((pl) => (
                <Link key={pl.id} href={`/playlists/${pl.id}`} className={styles.plCard}>
                  {pl.playlist_cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={pl.playlist_cover} alt={pl.name} className={styles.plCover} />
                  ) : (
                    <div className={styles.plCoverPlaceholder}>♪</div>
                  )}
                  <div className={styles.plInfo}>
                    <Text className={styles.plName}>{pl.name}</Text>
                    <Text className={styles.plMeta}>{pl.song_count} songs</Text>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Posts Section */}
        <div className={styles.section}>
          <Text className={styles.sectionTitle}>
            Posts ({posts.length})
          </Text>
          {posts.length === 0 ? (
            <Text className={styles.emptyText}>No posts yet.</Text>
          ) : (
            <div className={styles.postsGrid}>
              {posts.map((post) => (
                <div key={post.id} className={styles.postCard}>
                  {post.post_image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={post.post_image} alt={post.post_title} className={styles.postImage} />
                  )}
                  <div className={styles.postContent}>
                    <H3 className={styles.postTitle}>{post.post_title}</H3>
                    <Text className={styles.postSong}>
                      {post.song.title} — {post.song.artist}
                    </Text>
                    <FlexLayout justify="space-between" align="center" style={{ marginTop: '8px' }}>
                      <Text className={styles.postDate}>
                        {new Date(post.date_posted).toLocaleDateString()}
                      </Text>
                      <Link href={`/feed/${post.id}`} className={styles.viewPostLink}>
                        View post →
                      </Link>
                    </FlexLayout>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
