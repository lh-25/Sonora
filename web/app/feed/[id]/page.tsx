'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button, Text, H2, H3, FlexLayout, Spinner, StackLayout } from '@salt-ds/core';
import {
  getPostDetail,
  likePost,
  addComment,
  likeComment,
  deleteComment,
  editComment,
  type Post,
  type Comment,
} from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayer } from '@/contexts/PlayerContext';
import styles from './post.module.css';

export default function PostDetailPage() {
  const params = useParams();
  const postId = Number(params.id);
  const { user: me } = useAuth();
  const { play } = usePlayer();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    if (!postId) return;
    setLoading(true);
    getPostDetail(postId)
      .then(setPost)
      .catch(() => setError('Could not load post.'))
      .finally(() => setLoading(false));
  }, [postId]);

  const handleLikePost = async () => {
    if (!post) return;
    const result = await likePost(post.id);
    setPost((prev) =>
      prev ? { ...prev, is_liked: result.liked, total_likes: result.total_likes } : prev,
    );
  };

  const handleAddComment = async () => {
    if (!commentText.trim() || !post) return;
    setSubmittingComment(true);
    try {
      const newComment = await addComment(post.id, commentText.trim());
      setPost((prev) =>
        prev
          ? {
              ...prev,
              comments: [...(prev.comments ?? []), newComment],
              comment_count: prev.comment_count + 1,
            }
          : prev,
      );
      setCommentText('');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleCommentLike = async (commentId: number) => {
    const result = await likeComment(commentId);
    setPost((prev) => {
      if (!prev) return prev;
      const updateComments = (comments: Comment[]): Comment[] =>
        comments.map((c) => {
          if (c.id === commentId) {
            return { ...c, is_liked: result.liked, total_likes: result.total_likes };
          }
          if (c.replies?.length) {
            return { ...c, replies: updateComments(c.replies) };
          }
          return c;
        });
      return { ...prev, comments: updateComments(prev.comments ?? []) };
    });
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Delete this comment?')) return;
    await deleteComment(commentId);
    setPost((prev) => {
      if (!prev) return prev;
      const removeComment = (comments: Comment[]): Comment[] =>
        comments
          .filter((c) => c.id !== commentId)
          .map((c) => ({ ...c, replies: removeComment(c.replies ?? []) }));
      return {
        ...prev,
        comments: removeComment(prev.comments ?? []),
        comment_count: prev.comment_count - 1,
      };
    });
  };

  const handleAddReply = async (parentId: number, content: string) => {
    if (!post) return;
    const newReply = await addComment(post.id, content, parentId);
    setPost((prev) => {
      if (!prev) return prev;
      const addReply = (comments: Comment[]): Comment[] =>
        comments.map((c) => {
          if (c.id === parentId) {
            return { ...c, replies: [...(c.replies ?? []), newReply] };
          }
          if (c.replies?.length) {
            return { ...c, replies: addReply(c.replies) };
          }
          return c;
        });
      return {
        ...prev,
        comments: addReply(prev.comments ?? []),
        comment_count: prev.comment_count + 1,
      };
    });
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

  if (error || !post) {
    return (
      <div className={styles.page}>
        <div className="page-container">
          <Text className={styles.error}>{error || 'Post not found.'}</Text>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className="page-container">
        <Link href="/feed" className={styles.backLink}>
          ← Back to Feed
        </Link>

        {/* Post Card */}
        <div className={styles.postCard}>
          {post.post_image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.post_image} alt={post.post_title} className={styles.postImage} />
          )}

          <div className={styles.postBody}>
            {/* Song row */}
            <button className={styles.songRow} onClick={() => play(post.song)}>
              {post.song.album_cover && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.song.album_cover}
                  alt={post.song.title}
                  className={styles.albumArt}
                />
              )}
              <div className={styles.songInfo}>
                <Text className={styles.songTitle}>{post.song.title}</Text>
                <Text className={styles.songArtist}>{post.song.artist}</Text>
              </div>
              {(post.song.preview_url || post.song.spotify_track_id) && (
                <span className={styles.playIcon}>▶</span>
              )}
            </button>

            <H2 className={styles.postTitle}>{post.post_title}</H2>

            {post.reason_for_pick && (
              <div className={styles.reasonSection}>
                <Text className={styles.reasonLabel}>Reason for Pick</Text>
                <Text className={styles.reasonText}>{post.reason_for_pick}</Text>
              </div>
            )}

            {post.standout_lyric && (
              <blockquote className={styles.lyric}>
                "{post.standout_lyric}"
              </blockquote>
            )}

            <FlexLayout justify="space-between" align="center" className={styles.postMeta}>
              <Text className={styles.postedBy}>
                by{' '}
                <Link href={`/users/${post.user.id}`} className={styles.postedByLink}>
                  @{post.user.username}
                </Link>
                {' · '}
                <span className={styles.postDate}>
                  {new Date(post.date_posted).toLocaleDateString()}
                </span>
              </Text>

              <button
                className={`${styles.likeBtn} ${post.is_liked ? styles.likeBtnActive : ''}`}
                onClick={handleLikePost}
              >
                ♥ {post.total_likes}
              </button>
            </FlexLayout>
          </div>
        </div>

        {/* Comments Section */}
        <div className={styles.commentsSection}>
          <H3 className={styles.commentsTitle}>
            Comments ({post.comment_count})
          </H3>

          {/* Add comment form */}
          <div className={styles.addCommentForm}>
            <textarea
              className={styles.commentTextarea}
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
            />
            <Button
              variant="primary"
              className={styles.submitCommentBtn}
              onClick={handleAddComment}
              loading={submittingComment}
              disabled={!commentText.trim()}
            >
              Post Comment
            </Button>
          </div>

          {/* Comments list */}
          <StackLayout gap={2} className={styles.commentsList}>
            {(post.comments ?? []).map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                currentUserId={me?.id}
                onLike={handleCommentLike}
                onDelete={handleDeleteComment}
                onReply={handleAddReply}
              />
            ))}
          </StackLayout>
        </div>
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  currentUserId,
  onLike,
  onDelete,
  onReply,
  isReply = false,
}: {
  comment: Comment;
  currentUserId?: number;
  onLike: (id: number) => void;
  onDelete: (id: number) => void;
  onReply: (parentId: number, content: string) => Promise<void>;
  isReply?: boolean;
}) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [currentContent, setCurrentContent] = useState(comment.content);

  const handleSubmitReply = async () => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      await onReply(comment.id, replyText.trim());
      setReplyText('');
      setShowReplyForm(false);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editText.trim()) return;
    await editComment(comment.id, editText.trim());
    setCurrentContent(editText.trim());
    setEditing(false);
  };

  const isOwn = currentUserId === comment.user.id;

  return (
    <div className={`${styles.commentCard} ${isReply ? styles.replyCard : ''}`}>
      <FlexLayout justify="space-between" align="center" className={styles.commentHeader}>
        <FlexLayout gap={2} align="center">
          <Link href={`/users/${comment.user.id}`} className={styles.commentAuthor} style={{ textDecoration: 'none' }}>
            @{comment.user.username}
          </Link>
          <Text className={styles.commentDate}>
            {new Date(comment.date_posted).toLocaleDateString()}
          </Text>
        </FlexLayout>
      </FlexLayout>

      {editing ? (
        <div className={styles.replyForm}>
          <textarea
            className={styles.replyTextarea}
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
          />
          <FlexLayout gap={1} className={styles.replyActions}>
            <Button variant="primary" className={styles.submitReplyBtn} onClick={handleSaveEdit}>
              Save
            </Button>
            <Button variant="secondary" className={styles.cancelReplyBtn} onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </FlexLayout>
        </div>
      ) : (
        <Text className={styles.commentContent}>{currentContent}</Text>
      )}

      <FlexLayout gap={1} align="center" className={styles.commentActions}>
        <button
          className={`${styles.commentActionBtn} ${styles.commentLikeBtn} ${comment.is_liked ? styles.commentLikeBtnActive : ''}`}
          onClick={() => onLike(comment.id)}
        >
          ♥ {comment.total_likes}
        </button>

        {!isReply && (
          <button
            className={styles.commentActionBtn}
            onClick={() => setShowReplyForm((v) => !v)}
          >
            Reply
          </button>
        )}

        {isOwn && (
          <>
            <button
              className={styles.commentActionBtn}
              onClick={() => { setEditing(true); setEditText(currentContent); }}
            >
              Edit
            </button>
            <button
              className={`${styles.commentActionBtn} ${styles.deleteCommentBtn}`}
              onClick={() => onDelete(comment.id)}
            >
              Delete
            </button>
          </>
        )}
      </FlexLayout>

      {showReplyForm && (
        <div className={styles.replyForm}>
          <textarea
            className={styles.replyTextarea}
            placeholder="Write a reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <FlexLayout gap={1} className={styles.replyActions}>
            <Button
              variant="primary"
              className={styles.submitReplyBtn}
              onClick={handleSubmitReply}
              loading={submittingReply}
              disabled={!replyText.trim()}
            >
              Post Reply
            </Button>
            <Button
              variant="secondary"
              className={styles.cancelReplyBtn}
              onClick={() => { setShowReplyForm(false); setReplyText(''); }}
            >
              Cancel
            </Button>
          </FlexLayout>
        </div>
      )}

      {/* Nested replies */}
      {(comment.replies ?? []).length > 0 && (
        <div className={styles.replies}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onLike={onLike}
              onDelete={onDelete}
              onReply={onReply}
              isReply
            />
          ))}
        </div>
      )}
    </div>
  );
}
