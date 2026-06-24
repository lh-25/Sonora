import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import SkeletonBox from '@/components/SkeletonBox';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { getPost, likePost, addComment, likeComment, editComment, deleteComment, type Post, type Comment } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { usePlayer } from '@/contexts/PlayerContext';
import { useToast } from '@/contexts/ToastContext';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { play } = usePlayer();
  const toast = useToast();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [replyTo, setReplyTo] = useState<{ id: number; username: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingComment, setEditingComment] = useState<{ id: number; content: string } | null>(null);

  useEffect(() => {
    getPost(Number(id))
      .then((p) => {
        setPost(p);
        navigation.setOptions({ title: p.post_title });
      })
      .catch(() => toast.error('Post not found.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleLike = async () => {
    if (!post) return;
    try {
      const r = await likePost(post.id);
      setPost((p) => p ? { ...p, is_liked: r.liked, total_likes: r.total_likes } : p);
    } catch {}
  };

  const handleSubmitComment = async () => {
    if (!comment.trim() || !post) return;
    setSubmitting(true);
    try {
      if (editingComment) {
        const updated = await editComment(editingComment.id, comment.trim());
        setPost((p) => {
          if (!p) return p;
          const updateContent = (comments: Comment[]): Comment[] =>
            comments.map((c) =>
              c.id === updated.id
                ? { ...c, content: updated.content }
                : { ...c, replies: updateContent(c.replies) },
            );
          return { ...p, comments: updateContent(p.comments ?? []) };
        });
        setEditingComment(null);
      } else {
        const newComment = await addComment(post.id, comment.trim(), replyTo?.id);
        setPost((p) => {
          if (!p) return p;
          if (replyTo) {
            const updated = (p.comments ?? []).map((c) =>
              c.id === replyTo.id ? { ...c, replies: [...c.replies, newComment] } : c,
            );
            return { ...p, comments: updated };
          }
          return { ...p, comments: [...(p.comments ?? []), newComment], comment_count: p.comment_count + 1 };
        });
        setReplyTo(null);
      }
      setComment('');
    } catch {
      toast.error('Could not post comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = (commentId: number) => {
    Alert.alert('Delete Comment', 'Delete this comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteComment(commentId);
            setPost((p) => {
              if (!p) return p;
              const remove = (comments: Comment[]): Comment[] =>
                comments.filter((c) => c.id !== commentId).map((c) => ({ ...c, replies: remove(c.replies) }));
              return { ...p, comments: remove(p.comments ?? []), comment_count: p.comment_count - 1 };
            });
          } catch {
            toast.error('Could not delete comment.');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: Colors.background }} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <SkeletonBox width="100%" height={200} radius={12} style={{ marginBottom: 16 }} />
        <SkeletonBox width="100%" height={64} radius={12} style={{ marginBottom: 16 }} />
        <SkeletonBox width="60%" height={26} style={{ marginBottom: 16 }} />
        <SkeletonBox width="100%" height={80} radius={12} style={{ marginBottom: 12 }} />
        <SkeletonBox width="100%" height={60} radius={8} style={{ marginBottom: 16 }} />
        <SkeletonBox width={120} height={14} />
      </ScrollView>
    );
  }

  if (!post) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Ionicons name="alert-circle-outline" size={48} color={Colors.textMuted} />
        <Text style={{ color: Colors.text, fontSize: 18, fontWeight: '700', marginTop: 16 }}>Post not found</Text>
        <Text style={{ color: Colors.textMuted, fontSize: 14, marginTop: 8, textAlign: 'center' }}>
          This post may have been deleted or doesn't exist.
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Post image */}
        {post.post_image && (
          <Image source={{ uri: post.post_image }} style={styles.postImage} />
        )}

        {/* Song row */}
        <TouchableOpacity style={styles.songRow} onPress={() => play(post.song)}>
          {post.song.album_cover && (
            <Image source={{ uri: post.song.album_cover }} style={styles.albumArt} />
          )}
          <View style={styles.songInfo}>
            <Text style={styles.songTitle}>{post.song.title}</Text>
            <Text style={styles.songArtist}>{post.song.artist}</Text>
          </View>
          <Ionicons name="play-circle-outline" size={28} color={Colors.primary} />
        </TouchableOpacity>

        {/* Post content */}
        <Text style={styles.postTitle}>{post.post_title}</Text>

        <View style={styles.infoBlock}>
          <Text style={styles.blockLabel}>Why this song?</Text>
          <Text style={styles.blockText}>{post.reason_for_pick}</Text>
        </View>

        {post.standout_lyric && (
          <View style={styles.lyricBlock}>
            <Text style={styles.lyricText}>"{post.standout_lyric}"</Text>
          </View>
        )}

        {/* Like row */}
        <View style={styles.likeRow}>
          <Text style={styles.postedBy}>by {post.user.username}</Text>
          <TouchableOpacity style={styles.likeBtn} onPress={handleLike}>
            <Ionicons
              name={post.is_liked ? 'heart' : 'heart-outline'}
              size={22}
              color={post.is_liked ? Colors.like : Colors.textMuted}
            />
            <Text style={styles.likeCount}>{post.total_likes}</Text>
          </TouchableOpacity>
        </View>

        {/* Comments */}
        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>Comments ({post.comment_count})</Text>
          {(post.comments ?? []).map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              currentUserId={user?.id}
              onReply={(id, username) => { setReplyTo({ id, username }); setEditingComment(null); }}
              onEdit={(id, content) => { setEditingComment({ id, content }); setComment(content); setReplyTo(null); }}
              onDelete={handleDeleteComment}
              onLike={async (id) => {
                const r = await likeComment(id);
                setPost((p) => {
                  if (!p) return p;
                  const updateLike = (comments: Comment[]): Comment[] =>
                    comments.map((c) =>
                      c.id === id
                        ? { ...c, is_liked: r.liked, total_likes: r.total_likes }
                        : { ...c, replies: updateLike(c.replies) },
                    );
                  return { ...p, comments: updateLike(p.comments ?? []) };
                });
              }}
            />
          ))}
        </View>
      </ScrollView>

      {/* Comment input */}
      <View style={styles.commentInput}>
        {(replyTo || editingComment) && (
          <View style={styles.replyBanner}>
            <Text style={styles.replyText}>
              {editingComment ? 'Editing comment' : `Replying to @${replyTo!.username}`}
            </Text>
            <TouchableOpacity onPress={() => { setReplyTo(null); setEditingComment(null); setComment(''); }}>
              <Ionicons name="close" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={comment}
            onChangeText={setComment}
            placeholder={replyTo ? `Reply to @${replyTo.username}…` : editingComment ? 'Edit comment…' : 'Add a comment…'}
            placeholderTextColor={Colors.textMuted}
            multiline
          />
          <TouchableOpacity onPress={handleSubmitComment} disabled={submitting || !comment.trim()}>
            {submitting ? (
              <ActivityIndicator color={Colors.primary} size="small" />
            ) : (
              <Ionicons
                name="send"
                size={22}
                color={comment.trim() ? Colors.primary : Colors.textMuted}
              />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

function CommentItem({
  comment, depth = 0, onReply, onLike, onEdit, onDelete, currentUserId,
}: {
  comment: Comment;
  depth?: number;
  onReply: (id: number, username: string) => void;
  onLike: (id: number) => void;
  onEdit: (id: number, content: string) => void;
  onDelete: (id: number) => void;
  currentUserId?: number;
}) {
  const isOwner = currentUserId === comment.user.id;
  return (
    <View style={[styles.comment, depth > 0 && styles.commentIndented]}>
      <View style={styles.commentHeader}>
        <Text style={styles.commentUser}>@{comment.user.username}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {isOwner && (
            <>
              <TouchableOpacity onPress={() => onEdit(comment.id, comment.content)}>
                <Ionicons name="pencil-outline" size={14} color={Colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete(comment.id)}>
                <Ionicons name="trash-outline" size={14} color={Colors.error} />
              </TouchableOpacity>
            </>
          )}
          <TouchableOpacity style={styles.commentLike} onPress={() => onLike(comment.id)}>
            <Ionicons
              name={comment.is_liked ? 'heart' : 'heart-outline'}
              size={14}
              color={comment.is_liked ? Colors.like : Colors.textMuted}
            />
            <Text style={styles.commentLikeCount}>{comment.total_likes}</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Text style={styles.commentContent}>{comment.content}</Text>
      <TouchableOpacity onPress={() => onReply(comment.id, comment.user.username)}>
        <Text style={styles.replyLink}>Reply</Text>
      </TouchableOpacity>
      {comment.replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          depth={depth + 1}
          onReply={onReply}
          onLike={onLike}
          onEdit={onEdit}
          onDelete={onDelete}
          currentUserId={currentUserId}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 100 },
  postImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 16 },
  songRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.card, borderRadius: 12, padding: 12, marginBottom: 16,
  },
  albumArt: { width: 48, height: 48, borderRadius: 8 },
  songInfo: { flex: 1 },
  songTitle: { color: Colors.text, fontSize: 14, fontWeight: '600' },
  songArtist: { color: Colors.textSecondary, fontSize: 12, marginTop: 2 },
  postTitle: { color: Colors.text, fontSize: 22, fontWeight: '800', marginBottom: 16 },
  infoBlock: { backgroundColor: Colors.card, borderRadius: 12, padding: 14, marginBottom: 12 },
  blockLabel: {
    color: Colors.textMuted, fontSize: 11, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
  },
  blockText: { color: Colors.textSecondary, fontSize: 14, lineHeight: 20 },
  lyricBlock: {
    borderLeftWidth: 3, borderLeftColor: Colors.magenta,
    paddingLeft: 14, marginBottom: 16,
  },
  lyricText: { color: Colors.textSecondary, fontStyle: 'italic', fontSize: 15, lineHeight: 22 },
  likeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 12, borderTopWidth: 1, borderTopColor: Colors.border, marginBottom: 8,
  },
  postedBy: { color: Colors.textMuted, fontSize: 13 },
  likeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  likeCount: { color: Colors.textMuted, fontSize: 14 },
  commentsSection: { gap: 2 },
  commentsTitle: {
    color: Colors.textMuted, fontSize: 12, fontWeight: '700',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12,
  },
  comment: {
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  commentIndented: { marginLeft: 20, borderLeftWidth: 2, borderLeftColor: Colors.border, paddingLeft: 12 },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  commentUser: { color: Colors.primary, fontSize: 13, fontWeight: '600' },
  commentContent: { color: Colors.text, fontSize: 14, lineHeight: 20 },
  commentLike: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  commentLikeCount: { color: Colors.textMuted, fontSize: 12 },
  replyLink: { color: Colors.textMuted, fontSize: 12, marginTop: 4, fontWeight: '600' },
  commentInput: {
    backgroundColor: Colors.surface, borderTopWidth: 1,
    borderTopColor: Colors.border, paddingBottom: Platform.OS === 'ios' ? 30 : 10,
  },
  replyBanner: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4,
  },
  replyText: { color: Colors.textMuted, fontSize: 12 },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: 8,
    paddingHorizontal: 16, paddingTop: 8,
  },
  input: {
    flex: 1, backgroundColor: Colors.surfaceAlt, borderRadius: 20,
    paddingHorizontal: 14, paddingVertical: 10, color: Colors.text,
    fontSize: 15, maxHeight: 100, borderWidth: 1, borderColor: Colors.border,
  },
});
