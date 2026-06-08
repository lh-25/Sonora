'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Button, Text, H1, H2, H3, StackLayout, FlexLayout,
  Card, Badge, Spinner, ToggleButton, ToggleButtonGroup,
} from '@salt-ds/core';
import { getPosts, likePost, type Post } from '@/services/api';
import { usePlayer } from '@/contexts/PlayerContext';
import styles from './feed.module.css';

export default function FeedPage() {
  const { play } = usePlayer();
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
    const result = await likePost(post.id);
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id ? { ...p, is_liked: result.liked, total_likes: result.total_likes } : p,
      ),
    );
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
          <ToggleButtonGroup
            value={filter}
            onChange={(val) => setFilter(val as 'all' | 'mine')}
          >
            <ToggleButton value="all">All Posts</ToggleButton>
            <ToggleButton value="mine">My Posts</ToggleButton>
          </ToggleButtonGroup>
        </FlexLayout>

        {loading ? (
          <FlexLayout justify="center" className={styles.spinnerWrapper}>
            <Spinner size="large" />
          </FlexLayout>
        ) : posts.length === 0 ? (
          <StackLayout align="center" className={styles.empty}>
            <Text styleAs="h2">♪</Text>
            <H3>No posts yet</H3>
            <Text styleAs="help">Be the first to share your Song of the Day!</Text>
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
          <Text styleAs="help" className={styles.songArtist}>{post.song.artist}</Text>
        </div>
        {(post.song.preview_url || post.song.spotify_track_id) && (
          <span className={styles.playIcon}>▶</span>
        )}
      </button>

      {/* Content */}
      <H3 className={styles.postTitle}>{post.post_title}</H3>

      {post.standout_lyric && (
        <blockquote className={styles.lyric}>
          <Text styleAs="body">"{post.standout_lyric}"</Text>
        </blockquote>
      )}

      {/* Footer */}
      <FlexLayout justify="space-between" align="center" className={styles.postFooter}>
        <Text styleAs="help" className={styles.postedBy}>by @{post.user.username}</Text>
        <FlexLayout gap={2} align="center">
          <Button
            variant={post.is_liked ? 'primary' : 'secondary'}
            onClick={() => onLike(post)}
            className={post.is_liked ? styles.likedBtn : ''}
          >
            ♥ {post.total_likes}
          </Button>
          <Text styleAs="help" className={styles.commentCount}>
            💬 {post.comment_count}
          </Text>
        </FlexLayout>
      </FlexLayout>
    </Card>
  );
}
