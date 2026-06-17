'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Button, Text, H1, H3, StackLayout, FlexLayout,
  Card, ToggleButton, ToggleButtonGroup,
} from '@salt-ds/core';
import { getPosts, likePost, type Post } from '@/services/api';
import { usePlayer } from '@/contexts/PlayerContext';
import { useToast } from '@/contexts/ToastContext';
import Skeleton from '@/components/Skeleton';
import styles from './feed.module.css';

export default function FeedPage() {
  const { play } = usePlayer();
  const toast = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filter, setFilter] = useState<'all' | 'mine'>('all');
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPosts = useCallback(async (p: number, f: 'all' | 'mine', reset: boolean) => {
    const data = await getPosts(f, p);
    setPosts((prev) => (reset ? data.results : [...prev, ...data.results]));
    setHasMore(!!data.next);
    setPage(p);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchPosts(1, filter, true).finally(() => setLoading(false));
  }, [filter, fetchPosts]);

  const handleLike = async (post: Post) => {
    try {
      const result = await likePost(post.id);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, is_liked: result.liked, total_likes: result.total_likes } : p,
        ),
      );
    } catch {
      toast.error('Could not update like — please try again.');
    }
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    await fetchPosts(page + 1, filter, false);
    setLoadingMore(false);
  };

  return (
    <div className={styles.page}>
      <div className="page-container">
        <FlexLayout justify="space-between" align="center" className={styles.header}>
          <H1 className={styles.title}>Song of the Day</H1>
          <FlexLayout gap={2} align="center">
            <ToggleButtonGroup
              value={filter}
              onChange={(e: React.SyntheticEvent<HTMLButtonElement>) => setFilter(e.currentTarget.value as 'all' | 'mine')}
            >
              <ToggleButton value="all">All Posts</ToggleButton>
              <ToggleButton value="mine">My Posts</ToggleButton>
            </ToggleButtonGroup>
            <Link href="/feed/new" className={styles.newPostBtn} style={{ textDecoration: 'none', padding: '6px 18px', borderRadius: '25px', fontWeight: 700, fontSize: '14px', background: 'linear-gradient(90deg, #00d4ff, #ff40ff)', color: '#fff', display: 'inline-flex', alignItems: 'center' }}>
              + New Post
            </Link>
          </FlexLayout>
        </FlexLayout>

        {loading ? (
          <StackLayout gap={3} className={styles.feed}>
            {Array.from({ length: 3 }).map((_, i) => (
              <PostCardSkeleton key={i} />
            ))}
          </StackLayout>
        ) : posts.length === 0 ? (
          <StackLayout align="center" className={styles.empty}>
            <Text styleAs="h2">♪</Text>
            <H3>No posts yet</H3>
            <Text styleAs="notation">Be the first to share your Song of the Day!</Text>
          </StackLayout>
        ) : (
          <StackLayout gap={3} className={styles.feed}>
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onLike={handleLike} onPlay={play} />
            ))}

            {hasMore && (
              <FlexLayout justify="center">
                <Button variant="secondary" onClick={handleLoadMore} loading={loadingMore}>
                  Load more
                </Button>
              </FlexLayout>
            )}
          </StackLayout>
        )}
      </div>
    </div>
  );
}

function PostCardSkeleton() {
  return (
    <Card className={styles.postCard}>
      <Skeleton width="100%" height={220} radius={0} />
      <div className={styles.songRow}>
        <Skeleton width={44} height={44} radius={6} />
        <div className={styles.songInfo}>
          <Skeleton width="50%" height={14} />
          <Skeleton width="30%" height={12} style={{ marginTop: 8 }} />
        </div>
      </div>
      <div style={{ padding: '16px' }}>
        <Skeleton width="70%" height={18} />
        <Skeleton width="90%" height={12} style={{ marginTop: 12 }} />
        <Skeleton width="60%" height={12} style={{ marginTop: 8 }} />
      </div>
      <FlexLayout justify="space-between" align="center" className={styles.postFooter}>
        <Skeleton width={90} height={12} />
        <Skeleton width={120} height={28} radius={20} />
      </FlexLayout>
    </Card>
  );
}

function PostCard({
  post,
  onLike,
  onPlay,
}: {
  post: Post;
  onLike: (post: Post) => void;
  onPlay: (song: any) => void;
}) {
  return (
    <Card className={styles.postCard}>
      {post.post_image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.post_image} alt={post.post_title} className={styles.postImage} />
      )}

      {/* Song row */}
      <button className={styles.songRow} onClick={() => onPlay(post.song)}>
        {post.song.album_cover && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.song.album_cover} alt={post.song.title} className={styles.albumArt} />
        )}
        <div className={styles.songInfo}>
          <Text styleAs="label" className={styles.songTitle}>{post.song.title}</Text>
          <Text styleAs="notation" className={styles.songArtist}>{post.song.artist}</Text>
        </div>
        {(post.song.preview_url || post.song.spotify_track_id) && (
          <span className={styles.playIcon}>▶</span>
        )}
      </button>

      {/* Content */}
      <H3 className={styles.postTitle}>{post.post_title}</H3>

      {post.standout_lyric && (
        <blockquote className={styles.lyric}>
          <Text >"{post.standout_lyric}"</Text>
        </blockquote>
      )}

      {/* Footer */}
      <FlexLayout justify="space-between" align="center" className={styles.postFooter}>
        <Text styleAs="notation" className={styles.postedBy}>by @{post.user.username}</Text>
        <FlexLayout gap={2} align="center">
          <Button
            variant={post.is_liked ? 'primary' : 'secondary'}
            onClick={() => onLike(post)}
            className={post.is_liked ? styles.likedBtn : ''}
          >
            ♥ {post.total_likes}
          </Button>
          <Link href={`/feed/${post.id}`} className={styles.viewBtn}>
            💬 {post.comment_count}
          </Link>
        </FlexLayout>
      </FlexLayout>
    </Card>
  );
}
